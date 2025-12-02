'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Package, ShoppingBag, AlertTriangle, Loader2 } from "lucide-react"
import { supabase } from '@/utils/supabase/client'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    monthlySales: 0,
    todayDeliveries: 0,
    pendingDeliveries: 0,
    bucketAlerts: 0,
    lowStock: 0
  })
  const [recentDeliveries, setRecentDeliveries] = useState<any[]>([])

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true)
      try {
        const today = new Date()
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()
        const todayStr = today.toISOString().split('T')[0]

        // 1. Monthly Sales (Sum of income transactions in current month)
        const { data: salesData, error: salesError } = await (supabase
          .from('transactions') as any)
          .select('amount')
          .eq('type', 'income')
          .gte('date', firstDayOfMonth)

        const monthlySales = salesData?.reduce((sum: number, t: any) => sum + t.amount, 0) || 0

        // 2. Today's Deliveries
        const { data: todayOrders, error: ordersError } = await (supabase
          .from('orders') as any)
          .select('status')
          .gte('delivery_date', `${todayStr}T00:00:00`)
          .lt('delivery_date', `${todayStr}T23:59:59`)
          .neq('status', 'cancelled')

        const todayDeliveries = todayOrders?.length || 0
        const pendingDeliveries = todayOrders?.filter((o: any) => o.status === 'pending' || o.status === 'preparing').length || 0

        // 3. Bucket Alerts (Batches that need water change or stem cut - simplified logic for now)
        // Assuming 'active' batches might need attention. 
        // Ideally we'd check last_water_change date vs today.
        const { count: bucketAlerts } = await (supabase
          .from('inventory_batches') as any)
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')
        // Logic for "needs attention" would go here. For now, just counting active batches as a placeholder or 0 if no specific logic

        // 4. Low Stock Products (Stock < 10 for example)
        const { count: lowStock } = await (supabase
          .from('products') as any)
          .select('*', { count: 'exact', head: true })
          .lt('stock', 10)
          .eq('type', 'standard') // Only standard products usually have direct stock

        // 5. Recent Deliveries (Last 5 completed orders)
        const { data: recentOrders } = await (supabase
          .from('orders') as any)
          .select('*, clients(full_name), order_items(products(name), custom_item_name)')
          .eq('status', 'delivered')
          .order('delivery_date', { ascending: false })
          .limit(5)

        setStats({
          monthlySales,
          todayDeliveries,
          pendingDeliveries,
          bucketAlerts: 0, // Placeholder until specific logic is defined
          lowStock: lowStock || 0
        })
        setRecentDeliveries(recentOrders || [])

      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ventas del Mes
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/ {stats.monthlySales.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Ingresos registrados este mes
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Entregas para HOY
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayDeliveries}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingDeliveries} pendientes de envío
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Alertas de Baldes
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.bucketAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Requieren atención inmediata
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Inventario Bajo
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.lowStock}</div>
            <p className="text-xs text-muted-foreground">
              Productos con stock crítico
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Resumen de Ventas</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              Gráfico de ventas (Próximamente)
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Entregas Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {recentDeliveries.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay entregas recientes
                </p>
              ) : (
                recentDeliveries.map((order) => (
                  <div key={order.id} className="flex items-center">
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {order.clients?.full_name || 'Cliente Casual'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.order_items?.[0]?.custom_item_name || order.order_items?.[0]?.products?.name || 'Varios productos'}
                        {order.order_items?.length > 1 && ` +${order.order_items.length - 1} más`}
                      </p>
                    </div>
                    <div className="ml-auto font-medium">S/ {order.total_amount.toFixed(2)}</div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
