'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import EmployeeTimeClock from '@/components/personal/EmployeeTimeClock'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/utils/supabase/client'
import { ShoppingBag, Users, Calendar, TrendingUp, Loader2 } from 'lucide-react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import Link from 'next/link'

interface Stats {
    ventasHoy: number
    ventasSemana: number
    clientesAtendidos: number
    pedidosPendientes: number
}

export default function MiPanelPage() {
    const { user, profile } = useAuth()
    const [employeeId, setEmployeeId] = useState<string | null>(null)
    const [employeeName, setEmployeeName] = useState('')
    const [stats, setStats] = useState<Stats>({
        ventasHoy: 0,
        ventasSemana: 0,
        clientesAtendidos: 0,
        pedidosPendientes: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadEmployeeData() {
            if (!profile?.id) return

            // Buscar empleado vinculado al usuario
            const { data: employee } = await (supabase
                .from('employees')
                .select('id, first_name, last_name')
                .eq('user_id', profile.id)
                .single() as any)

            if (employee) {
                setEmployeeId(employee.id)
                setEmployeeName(`${employee.first_name} ${employee.last_name}`)
            } else {
                // Si no tiene empleado vinculado, usar el nombre del perfil
                setEmployeeName(profile.full_name || user?.email || 'Usuario')
            }

            // Cargar estadísticas del vendedor
            await loadStats()
            setLoading(false)
        }

        async function loadStats() {
            if (!profile?.id) return
            
            const today = new Date().toISOString().split('T')[0]
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

            // Ventas de hoy
            const { data: ventasHoy } = await (supabase
                .from('orders')
                .select('total_amount')
                .eq('created_by', profile.id)
                .gte('created_at', `${today}T00:00:00`) as any)

            // Ventas de la semana
            const { data: ventasSemana } = await (supabase
                .from('orders')
                .select('total_amount')
                .eq('created_by', profile.id)
                .gte('created_at', `${weekAgo}T00:00:00`) as any)

            // Pedidos pendientes
            const { data: pendientes } = await (supabase
                .from('orders')
                .select('id')
                .eq('created_by', profile.id)
                .in('status', ['pending', 'confirmed', 'in_preparation']) as any)

            setStats({
                ventasHoy: ventasHoy?.reduce((sum: number, o: { total_amount: number }) => sum + (o.total_amount || 0), 0) || 0,
                ventasSemana: ventasSemana?.reduce((sum: number, o: { total_amount: number }) => sum + (o.total_amount || 0), 0) || 0,
                clientesAtendidos: ventasSemana?.length || 0,
                pedidosPendientes: pendientes?.length || 0
            })
        }

        loadEmployeeData()
    }, [profile, user])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="h-12 w-12 animate-spin text-pink-500" />
            </div>
        )
    }

    return (
        <ProtectedRoute allowedRoles={['vendedor', 'florista', 'repartidor', 'admin', 'superadmin']}>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        ¡Hola, {employeeName.split(' ')[0]}! 👋
                    </h1>
                    <p className="text-gray-500">Bienvenido a tu panel de trabajo</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Columna izquierda - Reloj de tiempo */}
                    <div className="lg:col-span-1">
                        {employeeId ? (
                            <EmployeeTimeClock 
                                employeeId={employeeId} 
                                employeeName={employeeName} 
                            />
                        ) : (
                            <Card className="border-orange-200 bg-orange-50">
                                <CardContent className="py-6 text-center">
                                    <p className="text-orange-700">
                                        Tu cuenta no está vinculada a un empleado.
                                        Contacta al administrador.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Columna derecha - Estadísticas */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-lg font-semibold text-gray-700">Tus estadísticas</h2>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                        <ShoppingBag className="h-4 w-4" />
                                        Ventas Hoy
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold text-green-600">
                                        ${stats.ventasHoy.toFixed(2)}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4" />
                                        Ventas Semana
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold text-blue-600">
                                        ${stats.ventasSemana.toFixed(2)}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        Clientes Atendidos
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold text-purple-600">
                                        {stats.clientesAtendidos}
                                    </p>
                                    <p className="text-xs text-gray-400">Esta semana</p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Pedidos Pendientes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-2xl font-bold text-orange-600">
                                        {stats.pedidosPendientes}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Accesos rápidos */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-medium text-gray-700">
                                    Accesos Rápidos
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <Link href="/pos" className="flex flex-col items-center p-4 bg-pink-50 rounded-lg hover:bg-pink-100 transition-colors">
                                        <ShoppingBag className="h-8 w-8 text-pink-500 mb-2" />
                                        <span className="text-sm font-medium text-gray-700">Nueva Venta</span>
                                    </Link>
                                    <Link href="/clients" className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                                        <Users className="h-8 w-8 text-blue-500 mb-2" />
                                        <span className="text-sm font-medium text-gray-700">Clientes</span>
                                    </Link>
                                    <Link href="/calendar" className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                                        <Calendar className="h-8 w-8 text-green-500 mb-2" />
                                        <span className="text-sm font-medium text-gray-700">Calendario</span>
                                    </Link>
                                    <Link href="/workshop" className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                                        <span className="text-3xl mb-1">💐</span>
                                        <span className="text-sm font-medium text-gray-700">Taller</span>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    )
}
