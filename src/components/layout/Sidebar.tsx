'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ShoppingCart, Package, Wrench, Users, DollarSign, Flower2, Calendar, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'POS (Ventas)', href: '/pos', icon: ShoppingCart },
    { name: 'Clientes', href: '/clients', icon: Users },
    { name: 'Inventario', href: '/inventory', icon: Package },
    { name: 'Taller', href: '/workshop', icon: Wrench },
    { name: 'Calendario', href: '/calendar', icon: Calendar },
    { name: 'Finanzas', href: '/finance', icon: DollarSign },
    { name: 'Admin', href: '/admin', icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <div className="flex h-full w-64 flex-col bg-card border-r">
            <div className="flex h-16 items-center px-6 border-b">
                <Flower2 className="h-6 w-6 text-primary mr-2" />
                <span className="text-xl font-bold">Vitora ERP</span>
            </div>
            <nav className="flex-1 space-y-1 px-2 py-4">
                {navigation.map((item) => {
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
            <div className="p-4 border-t">
                <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        A
                    </div>
                    <div className="ml-3">
                        <p className="text-sm font-medium">Admin</p>
                        <p className="text-xs text-muted-foreground">Florería Vitora</p>
                    </div>
                </div>
            </div>
        </div>
    )
}
