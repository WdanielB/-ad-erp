'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'

const publicRoutes = ['/login', '/no-access', '/']

export function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const { user, loading } = useAuth()

    // Redirigir a login si no hay usuario y no es ruta pública
    useEffect(() => {
        if (!loading && !user && !publicRoutes.includes(pathname)) {
            router.replace('/login')
        }
    }, [loading, user, pathname, router])

    // Rutas públicas (sin sidebar, sin protección)
    if (publicRoutes.includes(pathname)) {
        return <>{children}</>
    }

    // Mostrar loading mientras verifica auth
    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-muted-foreground">Cargando...</p>
                </div>
            </div>
        )
    }

    // Si no hay usuario, mostrar loading mientras redirige
    if (!user) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-muted-foreground">Redirigiendo...</p>
                </div>
            </div>
        )
    }

    // Layout normal con sidebar
    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-8">
                {children}
            </main>
        </div>
    )
}
