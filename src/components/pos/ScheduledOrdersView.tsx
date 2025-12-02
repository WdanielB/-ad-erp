'use client'

import { useState, useEffect } from 'react'
import { Calendar, Check, X, Ticket, Loader2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/utils/supabase/client'
import { Database } from '@/types/database.types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

type Order = Database['public']['Tables']['orders']['Row'] & {
    clients: { full_name: string } | null
}

type OrderWithItems = Order & {
    order_items: Array<{
        quantity: number
        unit_price: number
        custom_item_name: string | null
        products: { name: string } | null
    }>
}

type OrderWithPayment = Order & {
    advance_payment: number
    balance: number
}

export function ScheduledOrdersView() {
    const [orders, setOrders] = useState<OrderWithPayment[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [orderToComplete, setOrderToComplete] = useState<string | null>(null)
    const [orderToDelete, setOrderToDelete] = useState<string | null>(null)

    async function fetchScheduledOrders() {
        setLoading(true)
        const { data } = await supabase
            .from('orders')
            .select('*, clients(full_name)')
            .eq('status', 'pending')
            .order('delivery_date', { ascending: true })

        if (data) {
            // Fetch advance payments for each order
            const ordersWithPayments = await Promise.all(
                (data as Order[]).map(async (order) => {
                    const { data: transactions, error: txError } = await (supabase
                        .from('transactions') as any)
                        .select('amount')
                        .eq('related_order_id', order.id)
                        .eq('type', 'income')

                    if (txError) {
                        console.error('Error fetching transactions for order', order.id, txError)
                    }

                    console.log(`Order ${order.id.slice(0, 8)} transactions:`, transactions)

                    const advancePayment = transactions?.reduce((sum: number, t: any) => sum + t.amount, 0) || 0
                    const balance = order.total_amount - advancePayment

                    return {
                        ...order,
                        advance_payment: advancePayment,
                        balance: balance
                    }
                })
            )

            setOrders(ordersWithPayments)
        }
        setLoading(false)
    }

    async function fetchOrderDetails(orderId: string) {
        const { data } = await supabase
            .from('orders')
            .select('*, clients(full_name), order_items(quantity, unit_price, custom_item_name, products(name))')
            .eq('id', orderId)
            .single()

        if (data) setSelectedOrder(data as OrderWithItems)
    }

    async function handleCompleteOrder() {
        if (!orderToComplete) return

        const orderId = orderToComplete
        setProcessingId(orderId)
        setOrderToComplete(null) // Close dialog immediately

        try {
            // Find the order to get its balance
            const order = orders.find(o => o.id === orderId)
            if (!order) throw new Error('Order not found')

            // 1. If there is a pending balance, record it as a transaction
            if (order.balance > 0) {
                const { error: txError } = await (supabase
                    .from('transactions') as any)
                    .insert({
                        description: `Saldo pedido #${order.ticket_number || order.id.slice(0, 8)}`,
                        amount: order.balance,
                        type: 'income',
                        date: new Date().toISOString(),
                        related_order_id: order.id
                    })

                if (txError) throw txError
            }

            // 2. Update order status
            const { error } = await (supabase
                .from('orders') as any)
                .update({ status: 'delivered' })
                .eq('id', orderId)

            if (error) throw error

            alert('Pedido completado y registrado en ventas diarias')
            await fetchScheduledOrders()
        } catch (error) {
            console.error('Error completing order:', error)
            alert('Error al completar el pedido')
        } finally {
            setProcessingId(null)
        }
    }

    async function handleCancelOrder() {
        if (!orderToDelete) return

        const orderId = orderToDelete
        setProcessingId(orderId)
        setOrderToDelete(null) // Close dialog immediately

        try {
            // 1. Delete order items
            const { error: itemsError } = await (supabase
                .from('order_items') as any)
                .delete()
                .eq('order_id', orderId)

            if (itemsError) throw itemsError

            // 2. Delete related transactions
            const { error: txError } = await (supabase
                .from('transactions') as any)
                .delete()
                .eq('related_order_id', orderId)

            if (txError) throw txError

            // 3. Delete the order
            const { error } = await (supabase
                .from('orders') as any)
                .delete()
                .eq('id', orderId)

            if (error) throw error

            alert('Pedido eliminado')
            await fetchScheduledOrders()
        } catch (error: any) {
            console.error('Error deleting order:', error)
            alert(`Error al eliminar el pedido: ${error.message || 'Error desconocido'}`)
        } finally {
            setProcessingId(null)
        }
    }

    useEffect(() => {
        fetchScheduledOrders()
    }, [])

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Pedidos Agendados</h2>
                <Button onClick={fetchScheduledOrders} variant="outline" size="sm">
                    Actualizar
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ticket</TableHead>
                            <TableHead>Fecha/Hora</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead>Adelanto</TableHead>
                            <TableHead>Saldo</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead>Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {orders.map((order) => (
                            <TableRow
                                key={order.id}
                                style={{
                                    borderLeft: order.label_color ? `4px solid ${order.label_color}` : undefined
                                }}
                            >
                                <TableCell>
                                    <div className="flex items-center gap-1 font-mono text-sm">
                                        <Ticket className="h-4 w-4" />
                                        {order.ticket_number || '-'}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {format(new Date(order.delivery_date), 'dd/MM/yyyy HH:mm', { locale: es })}
                                </TableCell>
                                <TableCell>{order.clients?.full_name || 'Sin cliente'}</TableCell>
                                <TableCell>
                                    <Badge variant="outline">
                                        {order.delivery_type === 'delivery' ? 'Entrega' : 'Recojo'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="font-semibold">S/ {order.total_amount.toFixed(2)}</TableCell>
                                <TableCell>
                                    {order.advance_payment > 0 ? (
                                        <span className="text-green-600 font-medium">S/ {order.advance_payment.toFixed(2)}</span>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {order.balance > 0 ? (
                                        <span className="text-orange-600 font-semibold">S/ {order.balance.toFixed(2)}</span>
                                    ) : (
                                        <span className="text-green-600 font-semibold">Pagado</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge>{order.status}</Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => fetchOrderDetails(order.id)}
                                        >
                                            Ver
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() => setOrderToComplete(order.id)}
                                            disabled={!!processingId}
                                            title="Completar Pedido"
                                        >
                                            {processingId === order.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Check className="h-4 w-4" />
                                            )}
                                        </Button>

                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => setOrderToDelete(order.id)}
                                            disabled={!!processingId}
                                            title="Cancelar Pedido"
                                        >
                                            {processingId === order.id ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <X className="h-4 w-4" />
                                            )}
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {orders.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                    No hay pedidos agendados pendientes
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {selectedOrder && (
                <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Ticket className="h-5 w-5" />
                                {selectedOrder.ticket_number || 'Detalles del Pedido'}
                            </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Cliente</p>
                                    <p className="font-medium">{selectedOrder.clients?.full_name || 'Sin cliente'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Teléfono</p>
                                    <p className="font-medium">{selectedOrder.client_phone || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Fecha/Hora</p>
                                    <p className="font-medium">
                                        {format(new Date(selectedOrder.delivery_date), 'dd/MM/yyyy HH:mm', { locale: es })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Tipo</p>
                                    <p className="font-medium">
                                        {selectedOrder.delivery_type === 'delivery' ? 'Entrega a Domicilio' : 'Recojo en Tienda'}
                                    </p>
                                </div>
                            </div>

                            {selectedOrder.delivery_type === 'delivery' && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Dirección</p>
                                    <p className="font-medium">{selectedOrder.delivery_address || '-'}</p>
                                    {selectedOrder.delivery_latitude && selectedOrder.delivery_longitude && (
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${selectedOrder.delivery_latitude},${selectedOrder.delivery_longitude}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1"
                                        >
                                            <MapPin className="h-3 w-3" /> Ver ubicación en Google Maps
                                        </a>
                                    )}
                                </div>
                            )}

                            {selectedOrder.dedication && (
                                <div className="bg-muted p-3 rounded-md">
                                    <p className="text-sm text-muted-foreground mb-1">Dedicatoria</p>
                                    <p className="font-medium italic">{selectedOrder.dedication}</p>
                                </div>
                            )}

                            <Separator />

                            <div>
                                <p className="text-sm text-muted-foreground mb-2">Productos</p>
                                <div className="space-y-1">
                                    {selectedOrder.order_items?.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span>{item.quantity}x {item.custom_item_name || item.products?.name}</span>
                                            <span>S/ {(item.unit_price * item.quantity).toFixed(2)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>S/ {(selectedOrder.total_amount - (selectedOrder.delivery_fee || 0)).toFixed(2)}</span>
                                </div>
                                {selectedOrder.delivery_fee && selectedOrder.delivery_fee > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Delivery</span>
                                        <span>S/ {selectedOrder.delivery_fee.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span>S/ {selectedOrder.total_amount.toFixed(2)}</span>
                                </div>
                            </div>

                            {selectedOrder.notes && (
                                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                                    <p className="text-sm text-muted-foreground mb-1">Notas</p>
                                    <p className="text-sm">{selectedOrder.notes}</p>
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}

            <AlertDialog open={!!orderToComplete} onOpenChange={(open) => !open && setOrderToComplete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Completar Pedido?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esto marcará el pedido como entregado y lo registrará en las ventas del día.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCompleteOrder}>Completar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={!!orderToDelete} onOpenChange={(open) => !open && setOrderToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar Pedido?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará el pedido y todos sus registros asociados.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancelOrder} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
