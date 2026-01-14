'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export type UserRole = 'superadmin' | 'admin' | 'vendedor' | 'florista' | 'repartidor'

export interface UserProfile {
    id: string
    email: string
    full_name: string | null
    role: UserRole
    employee_id: string | null
    is_active: boolean
}

interface AuthContextType {
    user: User | null
    profile: UserProfile | null
    session: Session | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<{ error: string | null }>
    signOut: () => Promise<void>
    hasAccess: (allowedRoles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        let isMounted = true

        // Obtener sesión inicial
        const initializeAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                
                if (!isMounted) return
                
                if (session?.user) {
                    setSession(session)
                    setUser(session.user)
                    // Cargar perfil en background, no bloquear
                    fetchProfile(session.user.id)
                }
            } catch (err) {
                console.error('Auth init error:', err)
            } finally {
                if (isMounted) {
                    setLoading(false)
                }
            }
        }

        initializeAuth()

        // Escuchar cambios de autenticación
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!isMounted) return
                
                console.log('Auth event:', event)
                
                if (event === 'SIGNED_OUT') {
                    setProfile(null)
                    setUser(null)
                    setSession(null)
                    return
                }
                
                if (session?.user) {
                    setSession(session)
                    setUser(session.user)
                    // Cargar perfil en background
                    fetchProfile(session.user.id)
                } else {
                    setSession(null)
                    setUser(null)
                    setProfile(null)
                }
            }
        )

        return () => {
            isMounted = false
            subscription.unsubscribe()
        }
    }, [])

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', userId)
                .single()
            
            if (data && !error) {
                setProfile(data as UserProfile)
            } else {
                console.warn('Error fetching profile:', error?.message)
                setProfile(null)
            }
        } catch (err) {
            console.error('Error in fetchProfile:', err)
            setProfile(null)
        }
    }

    const signIn = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            return { error: error.message }
        }

        if (data.user) {
            await fetchProfile(data.user.id)
        }

        return { error: null }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        setSession(null)
        router.push('/login')
    }

    const hasAccess = (allowedRoles: UserRole[]) => {
        if (!profile) return false
        return allowedRoles.includes(profile.role)
    }

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            session,
            loading,
            signIn,
            signOut,
            hasAccess
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
