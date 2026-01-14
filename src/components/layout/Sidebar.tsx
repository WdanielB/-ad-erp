'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingCart, Package, Wrench, Users, DollarSign, Calendar, Settings, UserCog, LogOut, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth, UserRole } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'

type NavItem = {
    name: string
    href: string
    icon: React.ElementType
    roles: UserRole[]
}

const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['superadmin', 'admin'] },
    { name: 'Mi Panel', href: '/mi-panel', icon: Clock, roles: ['vendedor', 'florista', 'repartidor'] },
    { name: 'POS (Ventas)', href: '/pos', icon: ShoppingCart, roles: ['superadmin', 'admin', 'vendedor'] },
    { name: 'Clientes', href: '/clients', icon: Users, roles: ['superadmin', 'admin', 'vendedor'] },
    { name: 'Inventario', href: '/inventory', icon: Package, roles: ['superadmin', 'admin', 'florista'] },
    { name: 'Taller', href: '/workshop', icon: Wrench, roles: ['superadmin', 'admin', 'florista', 'vendedor'] },
    { name: 'Calendario', href: '/calendar', icon: Calendar, roles: ['superadmin', 'admin', 'vendedor', 'florista', 'repartidor'] },
    { name: 'Finanzas', href: '/finance', icon: DollarSign, roles: ['superadmin', 'admin'] },
    { name: 'Personal', href: '/personal', icon: UserCog, roles: ['superadmin', 'admin'] },
    { name: 'Configuración', href: '/admin/configuracion', icon: Settings, roles: ['superadmin', 'admin'] },
]

const roleLabels: Record<UserRole, string> = {
    superadmin: 'Super Admin',
    admin: 'Administrador',
    vendedor: 'Vendedor',
    florista: 'Florista',
    repartidor: 'Repartidor'
}

export function Sidebar() {
    const pathname = usePathname()
    const { profile, signOut } = useAuth()

    // Filtrar navegación según el rol del usuario
    const filteredNavigation = navigation.filter(item => 
        profile ? item.roles.includes(profile.role) : false
    )

    return (
        <div className="flex h-full w-64 flex-col bg-card border-r">
            <div className="flex h-16 items-center justify-center px-4 border-b overflow-hidden">
                <img 
                    src="https://cdn.shopify.com/s/files/1/0649/4083/4883/files/ICONOS_y_LOGOS.png?v=1768371235" 
                    alt="Vitora" 
                    className="w-40 object-cover object-center"
                    style={{ height: '60px', objectFit: 'cover' }}
                />
            </div>
            <nav className="flex-1 space-y-1 px-2 py-4">
                {filteredNavigation.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'group flex items-center px-4 py-3 text-sm font-medium rounded-md transition-colors',
                                isActive
                                    ? 'bg-primary/10 text-primary'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                        >
                            <item.icon
                                className={cn(
                                    'mr-3 h-5 w-5 flex-shrink-0',
                                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                                )}
                            />
                            {item.name}
                        </Link>
                    )
                })}
            </nav>
            <div className="p-4 border-t space-y-3">
                <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {profile?.full_name?.[0]?.toUpperCase() || profile?.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                            {profile?.full_name || profile?.email || 'Usuario'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {profile ? roleLabels[profile.role] : 'Cargando...'}
                        </p>
                    </div>
                </div>
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full" 
                    onClick={signOut}
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                </Button>
            </div>
        </div>
    )
}
