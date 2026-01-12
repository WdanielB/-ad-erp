'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

const publicRoutes = ['/login', '/no-access']

export function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const { user, loading } = useAuth()

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

    // Si no hay usuario y no es ruta pública, el ProtectedRoute redirigirá
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
