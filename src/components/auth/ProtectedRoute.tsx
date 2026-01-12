'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth, UserRole } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
    children: React.ReactNode
    allowedRoles?: UserRole[]
}

// Definir qué roles pueden acceder a cada ruta
export const routePermissions: Record<string, UserRole[]> = {
    '/': ['superadmin', 'admin', 'vendedor', 'florista', 'repartidor'], // Dashboard - todos
    '/pos': ['superadmin', 'admin', 'vendedor'], // POS - solo ventas
    '/clients': ['superadmin', 'admin', 'vendedor'], // Clientes
    '/inventory': ['superadmin', 'admin', 'florista'], // Inventario
    '/workshop': ['superadmin', 'admin', 'florista'], // Taller
    '/calendar': ['superadmin', 'admin', 'vendedor', 'florista', 'repartidor'], // Calendario - todos
    '/finance': ['superadmin', 'admin'], // Finanzas - solo admin
    '/personal': ['superadmin', 'admin'], // Personal - solo admin
    '/admin': ['superadmin'], // Admin - solo superadmin
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, profile, loading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        if (!loading) {
            // Si no hay usuario, redirigir a login
            if (!user) {
                router.push('/login')
                return
            }

            // Si hay usuario pero no tiene perfil activo
            if (profile && !profile.is_active) {
                router.push('/login')
                return
            }

            // Verificar permisos de ruta
            if (profile && allowedRoles && !allowedRoles.includes(profile.role)) {
                router.push('/no-access')
            }
        }
    }, [user, profile, loading, router, allowedRoles])

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-muted-foreground">Cargando...</p>
                </div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    if (profile && allowedRoles && !allowedRoles.includes(profile.role)) {
        return null
    }

    return <>{children}</>
}
