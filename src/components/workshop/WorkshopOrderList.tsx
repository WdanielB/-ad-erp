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

interface FlowerCountItem {
    productId: string | null
    productName: string
    colorId: string | null
    colorName: string | null
    colorHex: string | null
    totalQuantity: number
}

export function WorkshopOrderList() {
    const [activeOrders, setActiveOrders] = useState<Order[]>([])
    const [completedOrders, setCompletedOrders] = useState<Order[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [flowerCounts, setFlowerCounts] = useState<FlowerCountItem[]>([])

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

        if (active) {
            setActiveOrders(active as Order[])
            const activeIds = (active as Order[]).map(order => order.id)
            await fetchFlowerCounts(activeIds)
        } else {
            setFlowerCounts([])
        }
        if (completed) setCompletedOrders(completed as Order[])
        setLoading(false)
    }

    async function fetchFlowerCounts(orderIds: string[]) {
        if (!orderIds || orderIds.length === 0) {
            setFlowerCounts([])
            return
        }

        const { data: orderItems } = await (supabase
            .from('order_items') as any)
            .select('id, order_id, quantity, is_custom, product_id')
            .in('order_id', orderIds)

        const items = orderItems || []
        if (items.length === 0) {
            setFlowerCounts([])
            return
        }

        const orderItemMap = new Map<string, { quantity: number; isCustom: boolean }>()
        items.forEach((item: any) => {
            orderItemMap.set(item.id, { quantity: item.quantity || 1, isCustom: !!item.is_custom })
        })

        const customItemIds = items.filter((i: any) => i.is_custom).map((i: any) => i.id)
        const standardItemIds = items.filter((i: any) => !i.is_custom).map((i: any) => i.id)

        const { data: customFlowers } = customItemIds.length > 0
            ? await (supabase
                .from('custom_item_flowers') as any)
                .select('order_item_id, product_id, color_id, quantity, products(name), flower_colors(name, hex)')
                .in('order_item_id', customItemIds)
            : { data: [] as any[] }

        const { data: orderItemRecipes } = standardItemIds.length > 0
            ? await (supabase
                .from('order_item_recipes') as any)
                .select('id, order_item_id, product_id, quantity, products(name)')
                .in('order_item_id', standardItemIds)
            : { data: [] as any[] }

        const recipeOrderItemIds = new Set((orderItemRecipes || []).map((row: any) => row.order_item_id))
        const missingRecipeItems = items
            .filter((item: any) => !item.is_custom && !recipeOrderItemIds.has(item.id) && item.product_id)

        const fallbackParentIds = Array.from(new Set(missingRecipeItems.map((item: any) => item.product_id)))
        const { data: fallbackRecipes } = fallbackParentIds.length > 0
            ? await (supabase
                .from('product_recipes') as any)
                .select('id, parent_product_id, child_product_id, quantity')
                .in('parent_product_id', fallbackParentIds)
            : { data: [] as any[] }

        const fallbackRecipeIds = (fallbackRecipes || []).map((r: any) => r.id)
        const { data: fallbackRecipeColors } = fallbackRecipeIds.length > 0
            ? await (supabase
                .from('product_recipe_flower_colors') as any)
                .select('recipe_id, color_id, quantity, flower_colors(name, hex)')
                .in('recipe_id', fallbackRecipeIds)
            : { data: [] as any[] }

        const fallbackChildIds = Array.from(new Set((fallbackRecipes || [])
            .map((row: any) => row.child_product_id)
            .filter((id: string | null) => !!id)))

        const { data: fallbackProducts } = fallbackChildIds.length > 0
            ? await (supabase
                .from('products') as any)
                .select('id, name')
                .in('id', fallbackChildIds)
            : { data: [] as any[] }

        const fallbackProductNameById: Record<string, string> = {}
        ;(fallbackProducts || []).forEach((row: any) => {
            if (row.id) fallbackProductNameById[row.id] = row.name
        })

        const recipeIds = (orderItemRecipes || []).map((r: any) => r.id)
        const { data: recipeColors } = recipeIds.length > 0
            ? await (supabase
                .from('order_item_recipe_flower_colors') as any)
                .select('order_item_recipe_id, color_id, quantity, flower_colors(name, hex)')
                .in('order_item_recipe_id', recipeIds)
            : { data: [] as any[] }

        const colorByRecipeId: Record<string, any[]> = {}
        ;(recipeColors || []).forEach((row: any) => {
            if (!row.order_item_recipe_id) return
            colorByRecipeId[row.order_item_recipe_id] = colorByRecipeId[row.order_item_recipe_id] || []
            colorByRecipeId[row.order_item_recipe_id].push(row)
        })

        const fallbackColorsByRecipeId: Record<string, any[]> = {}
        ;(fallbackRecipeColors || []).forEach((row: any) => {
            if (!row.recipe_id) return
            fallbackColorsByRecipeId[row.recipe_id] = fallbackColorsByRecipeId[row.recipe_id] || []
            fallbackColorsByRecipeId[row.recipe_id].push(row)
        })

        const counts = new Map<string, FlowerCountItem>()

        ;(customFlowers || []).forEach((row: any) => {
            const orderItem = orderItemMap.get(row.order_item_id)
            if (!orderItem) return
            const total = (row.quantity || 0) * orderItem.quantity
            const key = `${row.product_id || 'unknown'}:${row.color_id || 'none'}`
            const existing = counts.get(key)
            const productName = row.products?.name || 'Producto'
            const colorName = row.flower_colors?.name || null
            const colorHex = row.flower_colors?.hex || null

            if (existing) {
                existing.totalQuantity += total
            } else {
                counts.set(key, {
                    productId: row.product_id || null,
                    productName,
                    colorId: row.color_id || null,
                    colorName,
                    colorHex,
                    totalQuantity: total
                })
            }
        })

        ;(orderItemRecipes || []).forEach((row: any) => {
            const orderItem = orderItemMap.get(row.order_item_id)
            if (!orderItem) return
            const colorRows = colorByRecipeId[row.id] || []

            if (colorRows.length > 0) {
                colorRows.forEach((colorRow: any) => {
                    const total = (colorRow.quantity || 0) * orderItem.quantity
                    const key = `${row.product_id || 'unknown'}:${colorRow.color_id || 'none'}`
                    const existing = counts.get(key)
                    const productName = row.products?.name || 'Producto'
                    const colorName = colorRow.flower_colors?.name || null
                    const colorHex = colorRow.flower_colors?.hex || null

                    if (existing) {
                        existing.totalQuantity += total
                    } else {
                        counts.set(key, {
                            productId: row.product_id || null,
                            productName,
                            colorId: colorRow.color_id || null,
                            colorName,
                            colorHex,
                            totalQuantity: total
                        })
                    }
                })
            } else {
                const total = (row.quantity || 0) * orderItem.quantity
                const key = `${row.product_id || 'unknown'}:none`
                const existing = counts.get(key)
                const productName = row.products?.name || 'Producto'

                if (existing) {
                    existing.totalQuantity += total
                } else {
                    counts.set(key, {
                        productId: row.product_id || null,
                        productName,
                        colorId: null,
                        colorName: null,
                        colorHex: null,
                        totalQuantity: total
                    })
                }
            }
        })

        const fallbackByParent: Record<string, any[]> = {}
        ;(fallbackRecipes || []).forEach((row: any) => {
            if (!row.parent_product_id) return
            fallbackByParent[row.parent_product_id] = fallbackByParent[row.parent_product_id] || []
            fallbackByParent[row.parent_product_id].push(row)
        })

        missingRecipeItems.forEach((item: any) => {
            const orderItem = orderItemMap.get(item.id)
            if (!orderItem || !item.product_id) return
            const recipeRows = fallbackByParent[item.product_id] || []

            recipeRows.forEach((row: any) => {
                const colorRows = fallbackColorsByRecipeId[row.id] || []
                if (colorRows.length > 0) {
                    colorRows.forEach((colorRow: any) => {
                        const total = (colorRow.quantity || 0) * orderItem.quantity
                        const key = `${row.child_product_id || 'unknown'}:${colorRow.color_id || 'none'}`
                        const existing = counts.get(key)
                        const productName = fallbackProductNameById[row.child_product_id] || 'Producto'
                        const colorName = colorRow.flower_colors?.name || null
                        const colorHex = colorRow.flower_colors?.hex || null

                        if (existing) {
                            existing.totalQuantity += total
                        } else {
                            counts.set(key, {
                                productId: row.child_product_id || null,
                                productName,
                                colorId: colorRow.color_id || null,
                                colorName,
                                colorHex,
                                totalQuantity: total
                            })
                        }
                    })
                } else {
                    const total = (row.quantity || 0) * orderItem.quantity
                    const key = `${row.child_product_id || 'unknown'}:none`
                    const existing = counts.get(key)
                    const productName = fallbackProductNameById[row.child_product_id] || 'Producto'

                    if (existing) {
                        existing.totalQuantity += total
                    } else {
                        counts.set(key, {
                            productId: row.child_product_id || null,
                            productName,
                            colorId: null,
                            colorName: null,
                            colorHex: null,
                            totalQuantity: total
                        })
                    }
                }
            })
        })

        const result = Array.from(counts.values())
            .filter(item => item.totalQuantity > 0)
            .sort((a, b) => a.productName.localeCompare(b.productName))

        setFlowerCounts(result)
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
            <div className="rounded-lg border bg-muted/20 p-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Conteo de Flores Pendientes</h3>
                    <span className="text-xs text-muted-foreground">Total por color</span>
                </div>
                {flowerCounts.length === 0 ? (
                    <p className="text-sm text-muted-foreground mt-2">Sin recetas registradas.</p>
                ) : (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {flowerCounts.map(item => (
                            <div key={`${item.productId}-${item.colorId}`} className="flex items-center justify-between rounded-md border bg-background px-3 py-2 text-sm">
                                <div className="flex items-center gap-2 min-w-0">
                                    {item.colorHex && (
                                        <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: item.colorHex }} />
                                    )}
                                    <span className="truncate">
                                        {item.productName}{item.colorName ? ` - ${item.colorName}` : ''}
                                    </span>
                                </div>
                                <span className="font-semibold">{item.totalQuantity} tallos</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
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
