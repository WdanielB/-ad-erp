'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Check, Clock, Package, Truck, MapPin, Calendar, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/utils/supabase/client'
import { Database } from '@/types/database.types'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'

type Order = Database['public']['Tables']['orders']['Row'] & {
    clients: { full_name: string; phone?: string } | null
    order_items: Array<{
        quantity: number
        custom_item_name: string | null
        products: { name: string } | null
    }>
}

export function WorkshopOrderList() {
    const [activeOrders, setActiveOrders] = useState<Order[]>([])
    const [completedOrders, setCompletedOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

    async function fetchOrders() {
        setLoading(true)

        // Fetch Pending/Preparing
        const { data: active } = await supabase
            .from('orders')
            .select('*, clients(full_name, phone), order_items(quantity, custom_item_name, products(name))')
            .in('status', ['pending', 'preparing'])
            .order('delivery_date', { ascending: true })

        // Fetch Delivered (Last 20)
        const { data: completed } = await supabase
            .from('orders')
            .select('*, clients(full_name, phone), order_items(quantity, custom_item_name, products(name))')
            .eq('status', 'delivered')
            .order('delivery_date', { ascending: false })
            .limit(20)

        if (active) setActiveOrders(active as Order[])
        if (completed) setCompletedOrders(completed as Order[])
        setLoading(false)
    }

    async function markAsCompleted(order: Order) {
        // 1. If there is a pending balance, record it as a transaction
        // We need to fetch the balance first or calculate it. 
        // For simplicity in Workshop, we assume the POS handles the payment logic or we just mark as delivered.
        // However, to be consistent with POS, we should probably run the same logic.
        // But usually Workshop just marks "Ready". 
        // Let's stick to updating status to 'delivered' for now, assuming payment is handled or will be handled.
        // Actually, the user's previous request was "record remaining balance on completion".
        // So I should replicate that logic or share it.
        // For now, I'll just update status, but ideally this should be a shared function.
        // To be safe and simple: Just update status. The POS view handles the complex "Complete & Pay" logic.
        // But if I complete it here, the balance transaction won't be created?
        // That's a risk.
        // Let's copy the logic to be safe.

        try {
            // Fetch transactions to calc balance
            const { data: transactions } = await (supabase
                .from('transactions') as any)
                .select('amount')
                .eq('related_order_id', order.id)
                .eq('type', 'income')

            const advancePayment = transactions?.reduce((sum: number, t: any) => sum + t.amount, 0) || 0
            const balance = order.total_amount - advancePayment

            if (balance > 0) {
                await (supabase
                    .from('transactions') as any)
                    .insert({
                        description: `Saldo pedido #${order.ticket_number || order.id.slice(0, 8)} (Taller)`,
                        amount: balance,
                        type: 'income',
                        date: new Date().toISOString(),
                        related_order_id: order.id
                    })
            }

            const { error } = await (supabase
                .from('orders') as any)
                .update({ status: 'delivered' })
                .eq('id', order.id)

            if (error) throw error

            fetchOrders()
        } catch (error) {
            console.error('Error completing order:', error)
            alert('Error al completar el pedido')
        }
    }

    useEffect(() => {
        fetchOrders()
    }, [])

    const OrderCard = ({ order, isCompleted = false }: { order: Order, isCompleted?: boolean }) => (
        <Card className={`overflow-hidden ${isCompleted ? 'opacity-75' : ''}`}>
            <div className={`h-2 w-full ${order.label_color ? '' : 'bg-primary'}`} style={{ backgroundColor: order.label_color || undefined }} />
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <span className="font-mono text-base text-muted-foreground">#{order.ticket_number || order.id.slice(0, 6)}</span>
                    </CardTitle>
                    <Badge variant={isCompleted ? "secondary" : "default"}>
                        {order.delivery_type === 'delivery' ? 'Delivery' : 'Recojo'}
                    </Badge>
                </div>
                <div className="text-sm font-medium">{order.clients?.full_name || 'Cliente Eventual'}</div>
                {(order.client_phone || order.clients?.phone) && (
                    <a 
                        href={`tel:${order.client_phone || order.clients?.phone}`} 
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                        <Phone className="h-3 w-3" />
                        {order.client_phone || order.clients?.phone}
                    </a>
                )}
            </CardHeader>
            <CardContent className="pb-2 text-sm space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {format(new Date(order.delivery_date), 'dd/MM HH:mm', { locale: es })}
                </div>
                {order.delivery_type === 'delivery' && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 mt-0.5" />
                        <span className="line-clamp-2">{order.delivery_address || 'Sin dirección'}</span>
                    </div>
                )}

                <div className="bg-muted/50 p-2 rounded-md mt-2">
                    <div className="font-medium mb-1 flex items-center gap-1">
                        <Package className="h-3 w-3" /> Productos
                    </div>
                    <ul className="space-y-1">
                        {order.order_items.map((item, idx) => (
                            <li key={idx} className="flex justify-between text-xs">
                                <span>{item.quantity}x {item.custom_item_name || item.products?.name}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {order.dedication && (
                    <div className="text-xs italic text-muted-foreground border-l-2 pl-2">
                        "{order.dedication}"
                    </div>
                )}
            </CardContent>
            <CardFooter className="pt-2">
                {!isCompleted ? (
                    <Button className="w-full" onClick={() => markAsCompleted(order)}>
                        <Check className="mr-2 h-4 w-4" /> Completar
                    </Button>
                ) : (
                    <div className="w-full text-center text-sm text-green-600 font-medium flex items-center justify-center gap-1">
                        <Check className="h-4 w-4" /> Entregado
                    </div>
                )}
            </CardFooter>
        </Card>
    )

    if (loading) return <div>Cargando pedidos...</div>

    return (
        <div className="space-y-6">
            <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="active">Por Hacer ({activeOrders.length})</TabsTrigger>
                    <TabsTrigger value="completed">Completados</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="mt-4">
                    {activeOrders.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground border rounded-lg border-dashed">
                            No hay pedidos pendientes. ¡Buen trabajo!
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeOrders.map(order => (
                                <OrderCard key={order.id} order={order} />
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="completed" className="mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {completedOrders.map(order => (
                            <OrderCard key={order.id} order={order} isCompleted={true} />
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
