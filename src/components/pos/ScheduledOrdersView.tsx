'use client'

import { useState, useEffect, useMemo } from 'react'
import { Check, X, Ticket, Loader2, MapPin, Search, Edit, Phone, Timer, StickyNote, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
    DialogFooter,
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
import { formatLimaDateTime, getLimaDateParts, toLimaISO, getCountdown } from '@/lib/utils'

type Order = Database['public']['Tables']['orders']['Row'] & {
    clients: { full_name: string } | null
}

type Product = Database['public']['Tables']['products']['Row']
type FlowerColor = Database['public']['Tables']['flower_colors']['Row']

type OrderWithItems = Order & {
    order_items: Array<{
        id: string
        quantity: number
        unit_price: number
        custom_item_name: string | null
        products: { name: string; type: Product['type'] } | null
        is_custom: boolean | null
        product_id: string | null
    }>
}

type OrderWithPayment = Order & {
    advance_payment: number
    balance: number
}

interface RecipeColorItem {
    colorId: string
    quantity: number
}

interface RecipeLine {
    productId: string
    quantity: number
    colorItems: RecipeColorItem[]
}

type GroupMode = 'none' | 'day' | 'urgency'

export function ScheduledOrdersView() {
    const [orders, setOrders] = useState<OrderWithPayment[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null)
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [orderToComplete, setOrderToComplete] = useState<string | null>(null)
    const [orderToDelete, setOrderToDelete] = useState<string | null>(null)
    const [searchPhone, setSearchPhone] = useState('')
    const [groupMode, setGroupMode] = useState<GroupMode>('none')
    const [tick, setTick] = useState(0)

    // Edit state - ALL fields
    const [editingOrder, setEditingOrder] = useState<OrderWithPayment | null>(null)
    const [editDeliveryDate, setEditDeliveryDate] = useState('')
    const [editDeliveryTime, setEditDeliveryTime] = useState('')
    const [editDeliveryType, setEditDeliveryType] = useState<'delivery' | 'pickup'>('pickup')
    const [editDeliveryAddress, setEditDeliveryAddress] = useState('')
    const [editClientPhone, setEditClientPhone] = useState('')
    const [editDedication, setEditDedication] = useState('')
    const [editNotes, setEditNotes] = useState('')
    const [editLabelColor, setEditLabelColor] = useState('#3b82f6')
    const [editDeliveryFee, setEditDeliveryFee] = useState('0')
    const [editAdvancePayment, setEditAdvancePayment] = useState('0')
    const [savingEdit, setSavingEdit] = useState(false)

    const [recipeEditorOpen, setRecipeEditorOpen] = useState(false)
    const [recipeEditorItem, setRecipeEditorItem] = useState<OrderWithItems['order_items'][number] | null>(null)
    const [recipeLines, setRecipeLines] = useState<RecipeLine[]>([])
    const [recipeLoading, setRecipeLoading] = useState(false)
    const [allProducts, setAllProducts] = useState<Product[]>([])
    const [availableColors, setAvailableColors] = useState<FlowerColor[]>([])
    const [defaultColorIdsByProduct, setDefaultColorIdsByProduct] = useState<Record<string, string[]>>({})
    const [newRecipeProductId, setNewRecipeProductId] = useState('')
    const [newRecipeQuantity, setNewRecipeQuantity] = useState(1)

    // Refresh countdown every minute
    useEffect(() => {
        const interval = setInterval(() => setTick(t => t + 1), 60000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (editDeliveryType === 'pickup') {
            setEditDeliveryAddress('')
            setEditDeliveryFee('0')
        }
    }, [editDeliveryType])

    async function fetchScheduledOrders() {
        setLoading(true)
        const { data } = await supabase
            .from('orders')
            .select('*, clients(full_name)')
            .eq('status', 'pending')
            .order('delivery_date', { ascending: true })

        if (data) {
            const ordersWithPayments = await Promise.all(
                (data as Order[]).map(async (order) => {
                    const { data: transactions } = await (supabase
                        .from('transactions') as any)
                        .select('amount')
                        .eq('related_order_id', order.id)
                        .eq('type', 'income')

                    const advancePayment = transactions?.reduce((sum: number, t: any) => sum + t.amount, 0) || 0
                    const balance = order.total_amount - advancePayment

                    return { ...order, advance_payment: advancePayment, balance }
                })
            )
            setOrders(ordersWithPayments)
        }
        setLoading(false)
    }

    async function fetchOrderDetails(orderId: string) {
        const { data } = await supabase
            .from('orders')
            .select('*, clients(full_name), order_items(id, quantity, unit_price, custom_item_name, is_custom, product_id, products(name, type))')
            .eq('id', orderId)
            .single()
        if (data) setSelectedOrder(data as OrderWithItems)
    }

    async function loadRecipeCatalog() {
        const { data: productData } = await supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .order('name')

        const { data: colorData } = await supabase
            .from('flower_colors')
            .select('*')
            .order('name')

        const { data: defaultData } = await supabase
            .from('product_flower_colors')
            .select('product_id, color_id')

        const defaults: Record<string, string[]> = {}
        ;(defaultData ?? []).forEach((row: any) => {
            if (!row.product_id || !row.color_id) return
            defaults[row.product_id] = defaults[row.product_id] || []
            defaults[row.product_id].push(row.color_id)
        })

        setAllProducts((productData ?? []) as Product[])
        setAvailableColors((colorData ?? []) as FlowerColor[])
        setDefaultColorIdsByProduct(defaults)
    }

    async function loadRecipeForItem(item: OrderWithItems['order_items'][number]) {
        setRecipeLoading(true)
        setRecipeLines([])

        if (item.is_custom) {
            const { data: customRows } = await (supabase
                .from('custom_item_flowers') as any)
                .select('product_id, color_id, quantity')
                .eq('order_item_id', item.id)

            const grouped: Record<string, RecipeLine> = {}
            ;(customRows || []).forEach((row: any) => {
                if (!row.product_id) return
                if (!grouped[row.product_id]) {
                    grouped[row.product_id] = {
                        productId: row.product_id,
                        quantity: 1,
                        colorItems: []
                    }
                }
                if (row.color_id) {
                    grouped[row.product_id].colorItems.push({
                        colorId: row.color_id,
                        quantity: row.quantity || 1
                    })
                }
            })
            setRecipeLines(Object.values(grouped))
            setRecipeLoading(false)
            return
        }

        const { data: orderItemRecipes } = await (supabase
            .from('order_item_recipes') as any)
            .select('id, product_id, quantity')
            .eq('order_item_id', item.id)

        if (orderItemRecipes && orderItemRecipes.length > 0) {
            const recipeIds = orderItemRecipes.map((r: any) => r.id)
            const { data: recipeColors } = await (supabase
                .from('order_item_recipe_flower_colors') as any)
                .select('order_item_recipe_id, color_id, quantity')
                .in('order_item_recipe_id', recipeIds)

            const colorByRecipeId: Record<string, RecipeColorItem[]> = {}
            ;(recipeColors || []).forEach((row: any) => {
                if (!row.order_item_recipe_id || !row.color_id) return
                colorByRecipeId[row.order_item_recipe_id] = colorByRecipeId[row.order_item_recipe_id] || []
                colorByRecipeId[row.order_item_recipe_id].push({
                    colorId: row.color_id,
                    quantity: row.quantity || 1
                })
            })

            const lines: RecipeLine[] = orderItemRecipes.map((row: any) => ({
                productId: row.product_id,
                quantity: row.quantity || 1,
                colorItems: colorByRecipeId[row.id] || []
            }))

            setRecipeLines(lines.filter(line => !!line.productId))
            setRecipeLoading(false)
            return
        }

        if (item.product_id) {
            const { data: productRecipes } = await (supabase
                .from('product_recipes') as any)
                .select('id, child_product_id, quantity')
                .eq('parent_product_id', item.product_id)

            const recipeIds = (productRecipes || []).map((r: any) => r.id)
            const { data: recipeColors } = recipeIds.length > 0
                ? await (supabase
                    .from('product_recipe_flower_colors') as any)
                    .select('recipe_id, color_id, quantity')
                    .in('recipe_id', recipeIds)
                : { data: [] as any[] }

            const colorByRecipeId: Record<string, RecipeColorItem[]> = {}
            ;(recipeColors || []).forEach((row: any) => {
                if (!row.recipe_id || !row.color_id) return
                colorByRecipeId[row.recipe_id] = colorByRecipeId[row.recipe_id] || []
                colorByRecipeId[row.recipe_id].push({
                    colorId: row.color_id,
                    quantity: row.quantity || 1
                })
            })

            const lines: RecipeLine[] = (productRecipes || []).map((row: any) => ({
                productId: row.child_product_id,
                quantity: row.quantity || 1,
                colorItems: colorByRecipeId[row.id] || []
            }))

            setRecipeLines(lines.filter(line => !!line.productId))
        }

        setRecipeLoading(false)
    }

    async function openRecipeEditor(item: OrderWithItems['order_items'][number]) {
        setRecipeEditorItem(item)
        setRecipeEditorOpen(true)
        setNewRecipeProductId('')
        setNewRecipeQuantity(1)
        await loadRecipeCatalog()
        await loadRecipeForItem(item)
    }

    function addRecipeLine() {
        if (!newRecipeProductId) return
        const product = allProducts.find(p => p.id === newRecipeProductId)
        if (!product) return

        if (recipeLines.find(line => line.productId === newRecipeProductId)) {
            setRecipeLines(prev => prev.map(line =>
                line.productId === newRecipeProductId
                    ? { ...line, quantity: line.quantity + newRecipeQuantity }
                    : line
            ))
        } else {
            const defaultColors = defaultColorIdsByProduct[newRecipeProductId] || []
            const initialColorItems = product.type === 'flower' && defaultColors.length > 0
                ? [{ colorId: defaultColors[0], quantity: newRecipeQuantity }]
                : []

            setRecipeLines(prev => [...prev, {
                productId: newRecipeProductId,
                quantity: newRecipeQuantity,
                colorItems: initialColorItems
            }])
        }

        setNewRecipeProductId('')
        setNewRecipeQuantity(1)
    }

    function removeRecipeLine(productId: string) {
        setRecipeLines(prev => prev.filter(line => line.productId !== productId))
    }

    function addRecipeColor(productId: string) {
        const line = recipeLines.find(l => l.productId === productId)
        if (!line) return
        const usedIds = new Set((line.colorItems || []).map(ci => ci.colorId))
        const defaultIds = defaultColorIdsByProduct[productId] || []
        const nextDefault = defaultIds.find(id => !usedIds.has(id))
        const nextAny = availableColors.find(c => !usedIds.has(c.id))?.id
        const nextColorId = nextDefault || nextAny
        if (!nextColorId) return

        setRecipeLines(prev => prev.map(l =>
            l.productId === productId
                ? { ...l, colorItems: [...l.colorItems, { colorId: nextColorId, quantity: 1 }] }
                : l
        ))
    }

    function updateRecipeColor(productId: string, index: number, patch: Partial<RecipeColorItem>) {
        setRecipeLines(prev => prev.map(line => {
            if (line.productId !== productId) return line
            const nextColors = [...line.colorItems]
            if (!nextColors[index]) return line
            nextColors[index] = { ...nextColors[index], ...patch }
            return { ...line, colorItems: nextColors }
        }))
    }

    function removeRecipeColor(productId: string, index: number) {
        setRecipeLines(prev => prev.map(line => {
            if (line.productId !== productId) return line
            const nextColors = [...line.colorItems]
            nextColors.splice(index, 1)
            return { ...line, colorItems: nextColors }
        }))
    }

    async function saveRecipeChanges() {
        if (!recipeEditorItem) return
        if (recipeLines.length === 0) {
            alert('Agrega al menos un ingrediente')
            return
        }

        setRecipeLoading(true)
        try {
            if (recipeEditorItem.is_custom) {
                await (supabase.from('custom_item_flowers') as any)
                    .delete()
                    .eq('order_item_id', recipeEditorItem.id)

                const rows = recipeLines.flatMap(line =>
                    line.colorItems
                        .filter(ci => ci.quantity > 0)
                        .map(ci => ({
                            order_item_id: recipeEditorItem.id,
                            product_id: line.productId,
                            color_id: ci.colorId,
                            quantity: ci.quantity
                        }))
                )

                if (rows.length > 0) {
                    await (supabase.from('custom_item_flowers') as any)
                        .insert(rows)
                }
            } else {
                await (supabase.from('order_item_recipes') as any)
                    .delete()
                    .eq('order_item_id', recipeEditorItem.id)

                const recipeRows = recipeLines.map(line => ({
                    order_item_id: recipeEditorItem.id,
                    product_id: line.productId,
                    quantity: line.quantity
                }))

                const { data: createdRecipes } = await (supabase
                    .from('order_item_recipes') as any)
                    .insert(recipeRows)
                    .select('id, product_id')

                const recipeIdByProduct: Record<string, string> = {}
                ;(createdRecipes || []).forEach((row: any) => {
                    if (row.product_id) recipeIdByProduct[row.product_id] = row.id
                })

                const colorRows = recipeLines.flatMap(line => {
                    const recipeId = recipeIdByProduct[line.productId]
                    if (!recipeId) return []
                    return (line.colorItems || [])
                        .filter(ci => ci.quantity > 0)
                        .map(ci => ({
                            order_item_recipe_id: recipeId,
                            color_id: ci.colorId,
                            quantity: ci.quantity
                        }))
                })

                if (colorRows.length > 0) {
                    await (supabase.from('order_item_recipe_flower_colors') as any)
                        .insert(colorRows)
                }
            }

            if (selectedOrder) {
                await fetchOrderDetails(selectedOrder.id)
            }

            setRecipeEditorOpen(false)
        } catch (error) {
            console.error('Error updating recipe:', error)
            alert('Error al guardar la receta')
        } finally {
            setRecipeLoading(false)
        }
    }

    async function handleCompleteOrder() {
        if (!orderToComplete) return
        const orderId = orderToComplete
        setProcessingId(orderId)
        setOrderToComplete(null)
        try {
            const order = orders.find(o => o.id === orderId)
            if (!order) throw new Error('Order not found')
            if (order.balance > 0) {
                await (supabase.from('transactions') as any).insert({
                    description: `Saldo pedido #${order.ticket_number || order.id.slice(0, 8)}`,
                    amount: order.balance, type: 'income',
                    date: new Date().toISOString(), related_order_id: order.id
                })
            }
            const { error } = await (supabase.from('orders') as any)
                .update({ status: 'delivered' }).eq('id', orderId)
            if (error) throw error
            alert('Pedido completado y registrado en ventas diarias')
            await fetchScheduledOrders()
        } catch (error) {
            console.error('Error completing order:', error)
            alert('Error al completar el pedido')
        } finally { setProcessingId(null) }
    }

    async function handleCancelOrder() {
        if (!orderToDelete) return
        const orderId = orderToDelete
        setProcessingId(orderId)
        setOrderToDelete(null)
        try {
            await (supabase.from('order_items') as any).delete().eq('order_id', orderId)
            await (supabase.from('transactions') as any).delete().eq('related_order_id', orderId)
            const { error } = await (supabase.from('orders') as any).delete().eq('id', orderId)
            if (error) throw error
            alert('Pedido eliminado')
            await fetchScheduledOrders()
        } catch (error: any) {
            console.error('Error deleting order:', error)
            alert(`Error al eliminar el pedido: ${error.message || 'Error desconocido'}`)
        } finally { setProcessingId(null) }
    }

    useEffect(() => { fetchScheduledOrders() }, [])

    // Filter by phone
    const filteredOrders = orders.filter(order => {
        if (!searchPhone) return true
        return (order.client_phone || '').includes(searchPhone)
    })

    // Group orders
    const groupedOrders = useMemo(() => {
        if (groupMode === 'none') return { 'Todos': filteredOrders }

        if (groupMode === 'day') {
            const groups: Record<string, OrderWithPayment[]> = {}
            filteredOrders.forEach(order => {
                const dateKey = new Date(order.delivery_date).toLocaleDateString('es-PE', {
                    timeZone: 'America/Lima', weekday: 'long', day: 'numeric', month: 'long'
                })
                if (!groups[dateKey]) groups[dateKey] = []
                groups[dateKey].push(order)
            })
            return groups
        }

        if (groupMode === 'urgency') {
            const groups: Record<string, OrderWithPayment[]> = {
                '🔴 Vencidos': [], '🟠 Hoy': [], '🟡 Mañana': [],
                '🟢 Esta semana': [], '🔵 Más adelante': [],
            }
            filteredOrders.forEach(order => {
                const cd = getCountdown(order.delivery_date)
                if (cd.isPast) groups['🔴 Vencidos'].push(order)
                else if (cd.days === 0) groups['🟠 Hoy'].push(order)
                else if (cd.days <= 1) groups['🟡 Mañana'].push(order)
                else if (cd.days <= 7) groups['🟢 Esta semana'].push(order)
                else groups['🔵 Más adelante'].push(order)
            })
            Object.keys(groups).forEach(key => { if (groups[key].length === 0) delete groups[key] })
            return groups
        }

        return { 'Todos': filteredOrders }
    }, [filteredOrders, groupMode, tick])

    // Open edit modal with ALL fields
    function openEditModal(order: OrderWithPayment) {
        const parts = getLimaDateParts(order.delivery_date)
        setEditDeliveryDate(parts.date)
        setEditDeliveryTime(parts.time)
        setEditDeliveryType(order.delivery_type as 'delivery' | 'pickup' || 'pickup')
        setEditDeliveryAddress(order.delivery_address || '')
        setEditClientPhone(order.client_phone || '')
        setEditDedication(order.dedication || '')
        setEditNotes(order.notes || '')
        setEditLabelColor(order.label_color || '#3b82f6')
        setEditDeliveryFee(String(order.delivery_fee || 0))
        setEditAdvancePayment(String(order.advance_payment || 0))
        setEditingOrder(order)
    }

    // Save ALL edited fields
    async function saveOrderEdit() {
        if (!editingOrder) return
        if (!editDeliveryDate || !editDeliveryTime) {
            alert('Fecha y hora son obligatorias')
            return
        }
        if (editDeliveryType === 'delivery' && !editDeliveryAddress) {
            alert('La dirección es obligatoria para entrega')
            return
        }
        setSavingEdit(true)
        try {
            const newDeliveryDate = toLimaISO(editDeliveryDate, editDeliveryTime)
            const parsedDeliveryFee = Number.isFinite(Number(editDeliveryFee)) ? Number(editDeliveryFee) : 0
            const newDeliveryFee = editDeliveryType === 'delivery' ? parsedDeliveryFee : 0
            const originalSubtotal = editingOrder.total_amount - (editingOrder.delivery_fee || 0)
            const newTotal = originalSubtotal + newDeliveryFee

            const { error } = await (supabase.from('orders') as any)
                .update({
                    delivery_date: newDeliveryDate,
                    delivery_type: editDeliveryType,
                    delivery_address: editDeliveryType === 'delivery' ? editDeliveryAddress : 'Tienda',
                    delivery_latitude: editDeliveryType === 'delivery' ? editingOrder.delivery_latitude : null,
                    delivery_longitude: editDeliveryType === 'delivery' ? editingOrder.delivery_longitude : null,
                    client_phone: editClientPhone || null,
                    dedication: editDedication || null,
                    notes: editNotes || null,
                    label_color: editLabelColor,
                    delivery_fee: newDeliveryFee,
                    total_amount: newTotal,
                })
                .eq('id', editingOrder.id)
            if (error) throw error

            // Handle advance payment changes
            const currentAdvance = editingOrder.advance_payment
            const newAdvance = parseFloat(editAdvancePayment || '0')
            if (newAdvance !== currentAdvance) {
                await (supabase.from('transactions') as any)
                    .delete().eq('related_order_id', editingOrder.id).eq('type', 'income')
                if (newAdvance > 0) {
                    await (supabase.from('transactions') as any).insert({
                        description: `Adelanto pedido #${editingOrder.ticket_number || editingOrder.id.slice(0, 8)}`,
                        amount: newAdvance, type: 'income',
                        date: new Date().toISOString(), related_order_id: editingOrder.id
                    })
                }
            }

            alert('Pedido actualizado correctamente')
            setEditingOrder(null)
            await fetchScheduledOrders()
        } catch (error: any) {
            console.error('Error updating order:', error)
            alert(`Error al actualizar el pedido: ${error?.message || 'Error desconocido'}`)
        } finally { setSavingEdit(false) }
    }

    // Countdown badge
    function CountdownBadge({ deliveryDate }: { deliveryDate: string }) {
        const cd = getCountdown(deliveryDate)
        let variant: 'destructive' | 'default' | 'secondary' | 'outline' = 'outline'
        let className = ''
        if (cd.isPast) { variant = 'destructive' }
        else if (cd.days === 0) { className = 'bg-orange-100 text-orange-800 border-orange-300' }
        else if (cd.days <= 1) { className = 'bg-yellow-100 text-yellow-800 border-yellow-300' }
        else if (cd.days <= 3) { className = 'bg-blue-100 text-blue-800 border-blue-300' }

        return (
            <Badge variant={variant} className={`flex items-center gap-1 text-xs ${className}`}>
                <Timer className="h-3 w-3" />
                {cd.label}
            </Badge>
        )
    }

    function renderOrderRow(order: OrderWithPayment) {
        return (
            <TableRow key={order.id} style={{ borderLeft: order.label_color ? `4px solid ${order.label_color}` : undefined }}>
                <TableCell>
                    <div className="flex items-center gap-1 font-mono text-sm">
                        <Ticket className="h-4 w-4" />
                        {order.ticket_number || '-'}
                    </div>
                </TableCell>
                <TableCell>
                    <div className="flex flex-col gap-1">
                        <span className="text-sm">{formatLimaDateTime(order.delivery_date)}</span>
                        <CountdownBadge deliveryDate={order.delivery_date} />
                    </div>
                </TableCell>
                <TableCell>{order.clients?.full_name || 'Sin cliente'}</TableCell>
                <TableCell>
                    {order.client_phone ? (
                        <a href={`tel:${order.client_phone}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                            <Phone className="h-3 w-3" />{order.client_phone}
                        </a>
                    ) : '-'}
                </TableCell>
                <TableCell>
                    <Badge variant="outline">{order.delivery_type === 'delivery' ? 'Entrega' : 'Recojo'}</Badge>
                </TableCell>
                <TableCell className="font-semibold">S/ {order.total_amount.toFixed(2)}</TableCell>
                <TableCell>
                    {order.advance_payment > 0 ? (
                        <span className="text-green-600 font-medium">S/ {order.advance_payment.toFixed(2)}</span>
                    ) : <span className="text-muted-foreground">-</span>}
                </TableCell>
                <TableCell>
                    {order.balance > 0 ? (
                        <span className="text-orange-600 font-semibold">S/ {order.balance.toFixed(2)}</span>
                    ) : <span className="text-green-600 font-semibold">Pagado</span>}
                </TableCell>
                <TableCell>
                    {order.notes && (
                        <span title={order.notes} className="text-muted-foreground cursor-help">
                            <StickyNote className="h-4 w-4" />
                        </span>
                    )}
                </TableCell>
                <TableCell>
                    <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => fetchOrderDetails(order.id)} title="Ver detalles">Ver</Button>
                        <Button size="sm" variant="outline" onClick={() => openEditModal(order)} title="Editar pedido">
                            <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" onClick={() => setOrderToComplete(order.id)} disabled={!!processingId} title="Completar">
                            {processingId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => setOrderToDelete(order.id)} disabled={!!processingId} title="Eliminar">
                            {processingId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                        </Button>
                    </div>
                </TableCell>
            </TableRow>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-2xl font-bold">Pedidos Agendados</h2>
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Buscar por teléfono..." value={searchPhone}
                            onChange={(e) => setSearchPhone(e.target.value)} className="pl-8 w-48" />
                    </div>
                    <Select value={groupMode} onValueChange={(v) => setGroupMode(v as GroupMode)}>
                        <SelectTrigger className="w-40"><SelectValue placeholder="Agrupar" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Sin agrupar</SelectItem>
                            <SelectItem value="day">Por día</SelectItem>
                            <SelectItem value="urgency">Por urgencia</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={fetchScheduledOrders} variant="outline" size="sm">Actualizar</Button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : (
                Object.entries(groupedOrders).map(([groupName, groupOrders]) => (
                    <div key={groupName} className="space-y-2">
                        {groupMode !== 'none' && (
                            <h3 className="text-lg font-semibold text-muted-foreground border-b pb-1">
                                {groupName} ({groupOrders.length})
                            </h3>
                        )}
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Ticket</TableHead>
                                        <TableHead>Fecha / Cuenta regresiva</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Teléfono</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Adelanto</TableHead>
                                        <TableHead>Saldo</TableHead>
                                        <TableHead>Nota</TableHead>
                                        <TableHead>Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {groupOrders.map(renderOrderRow)}
                                    {groupOrders.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                                                {searchPhone ? 'No se encontraron pedidos con ese teléfono' : 'No hay pedidos agendados pendientes'}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                ))
            )}

            {/* Detail Dialog */}
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
                                    <p className="text-sm text-muted-foreground">Fecha/Hora (Lima)</p>
                                    <p className="font-medium">{formatLimaDateTime(selectedOrder.delivery_date)}</p>
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
                                        <a href={`https://www.google.com/maps/search/?api=1&query=${selectedOrder.delivery_latitude},${selectedOrder.delivery_longitude}`}
                                            target="_blank" rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1">
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
                                        <div key={idx} className="flex items-center justify-between text-sm gap-2">
                                            <span className="min-w-0 truncate">
                                                {item.quantity}x {item.custom_item_name || item.products?.name}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span>S/ {(item.unit_price * item.quantity).toFixed(2)}</span>
                                                {(item.is_custom || item.products?.type === 'composite') && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => openRecipeEditor(item)}
                                                    >
                                                        Receta
                                                    </Button>
                                                )}
                                            </div>
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

            {/* Complete Alert */}
            <AlertDialog open={!!orderToComplete} onOpenChange={(open) => !open && setOrderToComplete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Completar Pedido?</AlertDialogTitle>
                        <AlertDialogDescription>Esto marcará el pedido como entregado y lo registrará en las ventas del día.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCompleteOrder}>Completar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Alert */}
            <AlertDialog open={!!orderToDelete} onOpenChange={(open) => !open && setOrderToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar Pedido?</AlertDialogTitle>
                        <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará el pedido y todos sus registros asociados.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleCancelOrder} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* FULL EDIT Modal */}
            <Dialog open={!!editingOrder} onOpenChange={(open) => !open && setEditingOrder(null)}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Edit className="h-5 w-5" />
                            Editar Pedido #{editingOrder?.ticket_number || ''}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Fecha de Entrega</Label>
                                <Input type="date" value={editDeliveryDate} onChange={(e) => setEditDeliveryDate(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Hora de Entrega</Label>
                                <Input type="time" value={editDeliveryTime} onChange={(e) => setEditDeliveryTime(e.target.value)} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Tipo de Entrega</Label>
                            <div className="flex gap-2">
                                <Button type="button" variant={editDeliveryType === 'delivery' ? 'default' : 'outline'}
                                    onClick={() => setEditDeliveryType('delivery')} className="flex-1">Entrega</Button>
                                <Button type="button" variant={editDeliveryType === 'pickup' ? 'default' : 'outline'}
                                    onClick={() => setEditDeliveryType('pickup')} className="flex-1">Recojo</Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Número de Celular</Label>
                            <Input value={editClientPhone} onChange={(e) => setEditClientPhone(e.target.value)} placeholder="999999999" />
                        </div>

                        {editDeliveryType === 'delivery' && (
                            <div className="space-y-2">
                                <Label>Dirección de Entrega</Label>
                                <Input value={editDeliveryAddress} onChange={(e) => setEditDeliveryAddress(e.target.value)} placeholder="Dirección completa" />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Dedicatoria</Label>
                            <textarea className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                value={editDedication} onChange={(e) => setEditDedication(e.target.value)} placeholder="Mensaje para la tarjeta..." rows={3} />
                        </div>

                        <div className="space-y-2">
                            <Label>Nota Interna</Label>
                            <textarea className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Notas internas..." rows={2} />
                        </div>

                        <div className="space-y-2">
                            <Label>Color de Etiqueta</Label>
                            <div className="flex gap-2 items-center">
                                <input type="color" value={editLabelColor} onChange={(e) => setEditLabelColor(e.target.value)} className="h-10 w-20 rounded border cursor-pointer" />
                                <span className="text-sm text-muted-foreground">Para identificar en el calendario</span>
                            </div>
                        </div>

                        {editDeliveryType === 'delivery' && (
                            <div className="space-y-2">
                                <Label>Precio de Delivery (S/)</Label>
                                <Input type="number" step="0.01" value={editDeliveryFee} onChange={(e) => setEditDeliveryFee(e.target.value)} placeholder="10.00" />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label>Adelanto (S/)</Label>
                            <Input type="number" value={editAdvancePayment} onChange={(e) => setEditAdvancePayment(e.target.value)} placeholder="0.00" />
                            {parseFloat(editAdvancePayment || '0') > 0 && editingOrder && (
                                <p className="text-xs text-muted-foreground">
                                    Saldo pendiente: S/ {(
                                        (editingOrder.total_amount - (editingOrder.delivery_fee || 0)) +
                                        (editDeliveryType === 'delivery' ? parseFloat(editDeliveryFee || '0') : 0) -
                                        parseFloat(editAdvancePayment || '0')
                                    ).toFixed(2)}
                                </p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingOrder(null)}>Cancelar</Button>
                        <Button onClick={saveOrderEdit} disabled={savingEdit}>
                            {savingEdit ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Guardar Cambios
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Recipe Editor */}
            <Dialog open={recipeEditorOpen} onOpenChange={(open) => !open && setRecipeEditorOpen(false)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Editar receta - {recipeEditorItem?.custom_item_name || recipeEditorItem?.products?.name || ''}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        {recipeLoading ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" /> Cargando receta...
                            </div>
                        ) : (
                            <>
                                <div className="space-y-3">
                                    {recipeLines.map(line => {
                                        const product = allProducts.find(p => p.id === line.productId)
                                        const isFlower = product?.type === 'flower'
                                        const usedColorIds = new Set((line.colorItems || []).map(ci => ci.colorId))
                                        const defaultIds = new Set(defaultColorIdsByProduct[line.productId] || [])

                                        return (
                                            <div key={line.productId} className="rounded-md border bg-muted/20 p-3 space-y-2">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="min-w-0">
                                                        <div className="font-medium text-sm truncate">{product?.name || 'Producto'}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {recipeEditorItem?.is_custom ? 'Cantidad por color' : 'Cantidad por ramo'}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {!recipeEditorItem?.is_custom && (
                                                            <>
                                                                <Input
                                                                    type="number"
                                                                    min="1"
                                                                    value={line.quantity}
                                                                    onChange={(e) => setRecipeLines(prev => prev.map(l =>
                                                                        l.productId === line.productId
                                                                            ? { ...l, quantity: parseInt(e.target.value) || 1 }
                                                                            : l
                                                                    ))}
                                                                    className="w-20 h-8"
                                                                />
                                                                <span className="text-xs text-muted-foreground">uds</span>
                                                            </>
                                                        )}
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive"
                                                            onClick={() => removeRecipeLine(line.productId)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                {isFlower && (
                                                    <div className="space-y-2">
                                                        <div className="text-xs text-muted-foreground">Colores</div>
                                                        {(line.colorItems || []).map((colorItem, index) => {
                                                            const options = availableColors
                                                                .filter(color => color.id === colorItem.colorId || !usedColorIds.has(color.id))
                                                                .sort((a, b) => {
                                                                    const aDefault = defaultIds.has(a.id)
                                                                    const bDefault = defaultIds.has(b.id)
                                                                    if (aDefault !== bDefault) return aDefault ? -1 : 1
                                                                    return a.name.localeCompare(b.name)
                                                                })

                                                            return (
                                                                <div key={`${colorItem.colorId}-${index}`} className="flex items-center gap-2">
                                                                    <Select
                                                                        value={colorItem.colorId}
                                                                        onValueChange={(value) => updateRecipeColor(line.productId, index, { colorId: value })}
                                                                    >
                                                                        <SelectTrigger className="h-8">
                                                                            <SelectValue placeholder="Color" />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            {options.map(color => (
                                                                                <SelectItem key={color.id} value={color.id}>
                                                                                    <span className="flex items-center gap-2">
                                                                                        <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: color.hex }} />
                                                                                        {color.name}
                                                                                    </span>
                                                                                </SelectItem>
                                                                            ))}
                                                                        </SelectContent>
                                                                    </Select>
                                                                    <Input
                                                                        type="number"
                                                                        min="1"
                                                                        value={colorItem.quantity}
                                                                        onChange={(e) => updateRecipeColor(line.productId, index, { quantity: parseInt(e.target.value) || 1 })}
                                                                        className="w-20 h-8"
                                                                    />
                                                                    <span className="text-xs text-muted-foreground">uds</span>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-destructive"
                                                                        onClick={() => removeRecipeColor(line.productId, index)}
                                                                    >
                                                                        <Trash2 className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            )
                                                        })}
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => addRecipeColor(line.productId)}
                                                            disabled={availableColors.length === 0}
                                                        >
                                                            Agregar color
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}

                                    {recipeLines.length === 0 && (
                                        <p className="text-sm text-muted-foreground">No hay ingredientes agregados.</p>
                                    )}
                                </div>

                                <div className="rounded-md border p-3 space-y-2">
                                    <div className="text-sm font-medium">Agregar ingrediente</div>
                                    <div className="flex gap-2 items-end">
                                        <div className="flex-1">
                                            <Select value={newRecipeProductId} onValueChange={setNewRecipeProductId}>
                                                <SelectTrigger className="h-9">
                                                    <SelectValue placeholder="Selecciona producto" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {allProducts
                                                        .filter(p => !recipeLines.find(line => line.productId === p.id))
                                                        .map(product => (
                                                            <SelectItem key={product.id} value={product.id}>
                                                                {product.name}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={newRecipeQuantity}
                                            onChange={(e) => setNewRecipeQuantity(parseInt(e.target.value) || 1)}
                                            className="w-20 h-9"
                                        />
                                        <Button type="button" variant="outline" size="sm" onClick={addRecipeLine} disabled={!newRecipeProductId}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRecipeEditorOpen(false)}>Cancelar</Button>
                        <Button onClick={saveRecipeChanges} disabled={recipeLoading}>
                            {recipeLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Guardar Receta
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
