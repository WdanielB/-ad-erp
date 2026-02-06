'use client'

import { useState, useEffect } from 'react'
import { Trash2, CreditCard, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ClientSearch } from './ClientSearch'
import { Database } from '@/types/database.types'
import { supabase } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getLimaDateParts, toLimaISO } from '@/lib/utils'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { AddCustomItemDialog } from './AddCustomItemDialog'
import { LocationPicker } from './LocationPicker'

type Product = Database['public']['Tables']['products']['Row']
type Client = Database['public']['Tables']['clients']['Row']

export interface OrderItem {
    product?: Product
    customName?: string
    customPrice?: number
    quantity: number
    isCustom: boolean
    flowerIds?: string[]
}

interface OrderSummaryProps {
    items: OrderItem[]
    onUpdateQuantity: (productId: string, delta: number) => void
    onRemoveItem: (productId: string) => void
    onClearOrder: () => void
    onAddCustomItem: (name: string, price: number, flowerIds: string[]) => void
    onOrderScheduled?: () => void
}

export function OrderSummary({ items, onUpdateQuantity, onRemoveItem, onClearOrder, onAddCustomItem, onOrderScheduled }: OrderSummaryProps) {
    const router = useRouter()
    const { profile } = useAuth()
    const [client, setClient] = useState<Client | null>(null)
    const [loading, setLoading] = useState(false)
    const limaParts = getLimaDateParts()
    const [deliveryDate, setDeliveryDate] = useState(limaParts.date)

    const [scheduleOpen, setScheduleOpen] = useState(false)
    const [scheduleTime, setScheduleTime] = useState('09:00')
    const [deliveryAddress, setDeliveryAddress] = useState('')
    const [deliveryLocation, setDeliveryLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [advancePayment, setAdvancePayment] = useState('')
    const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery')
    const [clientPhone, setClientPhone] = useState('')
    const [clientName, setClientName] = useState('')
    const [dedication, setDedication] = useState('')
    const [labelColor, setLabelColor] = useState('#3b82f6')
    const [deliveryFee, setDeliveryFee] = useState('10')
    const [orderNotes, setOrderNotes] = useState('')
    const [showConfirmation, setShowConfirmation] = useState(false)
    const [confirmationMessage, setConfirmationMessage] = useState('')

    // Load default delivery fee from settings
    useEffect(() => {
        async function loadDefaultDeliveryFee() {
            const { data } = await supabase
                .from('business_settings')
                .select('value')
                .eq('key', 'delivery_fee_default')
                .maybeSingle()
                .returns<{ value: string | null }>()
            if (data?.value) {
                setDeliveryFee(data.value)
            }
        }
        loadDefaultDeliveryFee()
    }, [])

    const subtotal = items.reduce((sum, item) => {
        const price = item.isCustom ? (item.customPrice || 0) : (item.product?.price || 0)
        return sum + (price * item.quantity)
    }, 0)
    const deliveryFeeAmount = deliveryType === 'delivery' ? parseFloat(deliveryFee || '0') : 0
    const total = subtotal + deliveryFeeAmount
    const advanceAmount = parseFloat(advancePayment || '0')
    const balance = total - advanceAmount

    // Update address when client changes
    useEffect(() => {
        if (client && !deliveryAddress) {
            setDeliveryAddress(client.address || '')
        }
    }, [client, deliveryAddress])

    async function handleCreateOrder(isScheduled: boolean = false) {
        if (items.length === 0) return
        setLoading(true)

        try {
            const finalDeliveryDate = isScheduled
                ? toLimaISO(deliveryDate, scheduleTime)
                : new Date().toISOString()

            const finalAddress = isScheduled ? deliveryAddress : (client?.address || 'Tienda')

            // Create client if name is provided but no client selected
            let finalClientId = client?.id || null
            if (isScheduled && clientName && !client) {
                const { data: newClient, error: clientError } = await (supabase
                    .from('clients') as any)
                    .insert({
                        full_name: clientName,
                        phone: clientPhone || null,
                        address: deliveryType === 'delivery' ? deliveryAddress : null
                    })
                    .select()
                    .single()

                if (!clientError && newClient) {
                    finalClientId = newClient.id
                }
            }

            // Generate ticket number for scheduled orders
            let ticketNumber = null
            if (isScheduled) {
                // Get count of orders today
                const today = new Date().toISOString().split('T')[0]
                const { count } = await supabase
                    .from('orders')
                    .select('*', { count: 'exact', head: true })
                    .gte('created_at', `${today}T00:00:00`)

                const orderNumber = (count || 0) + 1
                const shortDate = deliveryDate.replace(/-/g, '').slice(4) // MMDD format
                ticketNumber = `T${String(orderNumber).padStart(3, '0')}-${shortDate}`
            }

            // 1. Create Order
            const { data: order, error: orderError } = await (supabase
                .from('orders') as any)
                .insert({
                    client_id: finalClientId,
                    total_amount: total,
                    status: 'pending',
                    delivery_date: finalDeliveryDate,
                    delivery_address: finalAddress,
                    delivery_type: isScheduled ? deliveryType : null,
                    client_phone: isScheduled ? clientPhone : (client?.phone || null),
                    dedication: isScheduled ? dedication : null,
                    label_color: isScheduled ? labelColor : null,
                    delivery_fee: isScheduled && deliveryType === 'delivery' ? deliveryFeeAmount : 0,
                    ticket_number: ticketNumber,
                    delivery_latitude: deliveryLocation?.lat || null,
                    delivery_longitude: deliveryLocation?.lng || null,
                    notes: isScheduled && orderNotes ? orderNotes : null,
                    created_by: profile?.id || null,
                    created_by_name: profile?.full_name || profile?.email || null
                })
                .select()
                .single()

            if (orderError) {
                console.error('Order creation error:', orderError)
                throw new Error(`Error al crear orden: ${orderError.message || JSON.stringify(orderError)}`)
            }

            // 2. Create Order Items
            const orderItemsData = items.map(item => ({
                order_id: order.id,
                product_id: item.isCustom ? null : item.product?.id,
                custom_item_name: item.isCustom ? item.customName : null,
                quantity: item.quantity,
                unit_price: item.isCustom ? (item.customPrice || 0) : (item.product?.price || 0),
                is_custom: item.isCustom
            }))

            const { data: createdItems, error: itemsError } = await (supabase
                .from('order_items') as any)
                .insert(orderItemsData)
                .select()

            if (itemsError) throw itemsError

            // 2.5. Save flower composition for custom items
            for (let i = 0; i < items.length; i++) {
                const item = items[i]
                if (item.isCustom && item.flowerIds && item.flowerIds.length > 0 && createdItems[i]) {
                    const flowerCompositions = item.flowerIds.map(flowerId => ({
                        order_item_id: createdItems[i].id,
                        product_id: flowerId
                    }))

                    await (supabase
                        .from('custom_item_flowers') as any)
                        .insert(flowerCompositions)
                }
            }

            // 3. Update Inventory (Only for non-custom items)
            for (const item of items) {
                if (!item.isCustom && item.product && item.product.stock !== null) {
                    await (supabase
                        .from('products') as any)
                        .update({ stock: item.product.stock - item.quantity })
                        .eq('id', item.product.id)
                }
            }

            // 4. Record Advance Payment if applicable
            if (isScheduled && advancePayment && parseFloat(advancePayment) > 0) {
                console.log('Recording advance payment:', {
                    amount: parseFloat(advancePayment),
                    orderId: order.id
                })

                const { data: transactionData, error: transactionError } = await (supabase
                    .from('transactions') as any)
                    .insert({
                        description: `Adelanto pedido #${order.id.slice(0, 8)}`,
                        amount: parseFloat(advancePayment),
                        type: 'income',
                        date: new Date().toISOString(),
                        related_order_id: order.id
                    })
                    .select()

                if (transactionError) {
                    console.error('Error recording advance payment:', transactionError)
                } else {
                    console.log('Advance payment recorded successfully:', transactionData)
                }
            }

            // 5. Generate confirmation message for scheduled orders
            if (isScheduled) {
                const itemsList = items.map(item => {
                    const name = item.isCustom ? item.customName : item.product?.name
                    return `${item.quantity}x ${name}`
                }).join('\n')

                const googleMapsLink = deliveryLocation
                    ? `https://www.google.com/maps/search/?api=1&query=${deliveryLocation.lat},${deliveryLocation.lng}`
                    : ''

                const message = `✅ PEDIDO AGENDADO

TICKET: ${ticketNumber}

FECHA: ${new Date(finalDeliveryDate).toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
HORA DE ENVÍO: ${scheduleTime}
(Rango 30-50 minutos de entrega)

RAMO:
${itemsList}

${dedication ? `DEDICATORIA: ${dedication}\n` : ''}${orderNotes ? `NOTA: ${orderNotes}\n` : ''}TOTAL: S/ ${total.toFixed(2)}
${deliveryType === 'delivery' ? `DELIVERY: S/ ${deliveryFeeAmount.toFixed(2)}\n` : ''}${advanceAmount > 0 ? `ADELANTO: S/ ${advanceAmount.toFixed(2)}\nSALDO: S/ ${balance.toFixed(2)}\n` : ''}
${deliveryType === 'delivery' ? `DIRECCIÓN: ${deliveryAddress}` : 'RECOJO EN TIENDA'}
${googleMapsLink ? `UBICACIÓN: ${googleMapsLink}` : ''}
${clientPhone ? `\nCONTACTO: ${clientPhone}` : ''}`

                setConfirmationMessage(message)
                setShowConfirmation(true)
            }

            // Clear form but don't close schedule dialog yet if showing confirmation
            if (!isScheduled) {
                alert('Pedido creado exitosamente')
                onClearOrder()
                setClient(null)
                setDeliveryAddress('')
                router.push('/')
            } else {
                // For scheduled orders, keep dialog open to show confirmation
                onClearOrder()
                setClient(null)
                setDeliveryAddress('')
                setDeliveryLocation(null)
                setAdvancePayment('')
                setClientPhone('')
                setClientName('')
                setDedication('')
                setOrderNotes('')
                // Don't close scheduleOpen yet - let confirmation dialog handle it
            }
        } catch (error) {
            console.error('Error creating order:', error)
            console.error('Error details:', JSON.stringify(error, null, 2))
            alert(`Error al crear el pedido: ${error instanceof Error ? error.message : 'Error desconocido'}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-col h-full bg-muted/20 rounded-lg border">
            <div className="p-4 border-b space-y-4">
                <h2 className="font-semibold text-lg">Resumen de Pedido</h2>
                <ClientSearch
                    selectedClient={client}
                    onClientSelect={(c) => {
                        setClient(c)
                        if (c?.address) setDeliveryAddress(c.address)
                    }}
                />
                <AddCustomItemDialog onAddCustomItem={onAddCustomItem} />
            </div>

            <ScrollArea className="flex-1 p-4">
                {items.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        El carrito está vacío.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {items.map((item, index) => {
                            const itemId = item.isCustom ? `custom-${index}` : item.product?.id || `item-${index}`
                            const itemName = item.isCustom ? item.customName : item.product?.name
                            const itemPrice = item.isCustom ? item.customPrice : item.product?.price

                            return (
                                <div key={itemId} className="flex justify-between items-center bg-background p-3 rounded-md border shadow-sm">
                                    <div className="flex-1 min-w-0 mr-2">
                                        <div className="font-medium truncate">
                                            {itemName}
                                            {item.isCustom && <span className="ml-2 text-xs text-muted-foreground">(Temporal)</span>}
                                        </div>
                                        <div className="text-sm text-muted-foreground">S/ {itemPrice?.toFixed(2)}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => onUpdateQuantity(itemId, -1)}
                                        >
                                            -
                                        </Button>
                                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => onUpdateQuantity(itemId, 1)}
                                        >
                                            +
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 text-destructive ml-1"
                                            onClick={() => onRemoveItem(itemId)}
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </ScrollArea>

            <div className="p-4 border-t bg-background rounded-b-lg space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>S/ {subtotal.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>S/ {total.toFixed(2)}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" onClick={onClearOrder} disabled={items.length === 0 || loading}>
                        Cancelar
                    </Button>
                    <div className="flex gap-2">
                        <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
                            <DialogTrigger asChild>
                                <Button variant="secondary" className="flex-1" disabled={items.length === 0 || loading}>
                                    Agendar
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Agendar Pedido</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Fecha Entrega</Label>
                                            <Input
                                                type="date"
                                                value={deliveryDate}
                                                onChange={(e) => setDeliveryDate(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Hora Entrega</Label>
                                            <Input
                                                type="time"
                                                value={scheduleTime}
                                                onChange={(e) => setScheduleTime(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Tipo de Servicio</Label>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant={deliveryType === 'delivery' ? 'default' : 'outline'}
                                                onClick={() => setDeliveryType('delivery')}
                                                className="flex-1"
                                            >
                                                Entrega
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={deliveryType === 'pickup' ? 'default' : 'outline'}
                                                onClick={() => setDeliveryType('pickup')}
                                                className="flex-1"
                                            >
                                                Recojo
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Nombre del Cliente</Label>
                                        <Input
                                            value={clientName}
                                            onChange={(e) => setClientName(e.target.value)}
                                            placeholder="Nombre completo del cliente"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Si el cliente no existe, se creará automáticamente
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Número de Celular</Label>
                                        <Input
                                            value={clientPhone}
                                            onChange={(e) => setClientPhone(e.target.value)}
                                            placeholder="999999999"
                                        />
                                    </div>
                                    {deliveryType === 'delivery' && (
                                        <div className="space-y-4 border rounded-md p-4 bg-muted/10">
                                            <div className="space-y-2">
                                                <Label>Dirección de Entrega</Label>
                                                <Input
                                                    value={deliveryAddress}
                                                    onChange={(e) => setDeliveryAddress(e.target.value)}
                                                    placeholder="Dirección completa"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Ubicación en Mapa (Opcional)</Label>
                                                <LocationPicker
                                                    onLocationSelect={setDeliveryLocation}
                                                    initialLocation={deliveryLocation}
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Haz clic en el mapa para marcar la ubicación exacta.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <Label>Dedicatoria</Label>
                                        <textarea
                                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            value={dedication}
                                            onChange={(e) => setDedication(e.target.value)}
                                            placeholder="Mensaje para la tarjeta..."
                                            rows={3}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Nota Interna</Label>
                                        <textarea
                                            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            value={orderNotes}
                                            onChange={(e) => setOrderNotes(e.target.value)}
                                            placeholder="Notas internas del pedido..."
                                            rows={2}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Color de Etiqueta</Label>
                                        <div className="flex gap-2 items-center">
                                            <input
                                                type="color"
                                                value={labelColor}
                                                onChange={(e) => setLabelColor(e.target.value)}
                                                className="h-10 w-20 rounded border cursor-pointer"
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                Para identificar en el calendario
                                            </span>
                                        </div>
                                    </div>
                                    {deliveryType === 'delivery' && (
                                        <div className="space-y-2">
                                            <Label>Precio de Delivery (S/)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={deliveryFee}
                                                onChange={(e) => setDeliveryFee(e.target.value)}
                                                placeholder="10.00"
                                            />
                                        </div>
                                    )}
                                    <div className="space-y-2">
                                        <Label>Adelanto (S/)</Label>
                                        <Input
                                            type="number"
                                            value={advancePayment}
                                            onChange={(e) => setAdvancePayment(e.target.value)}
                                            placeholder="0.00"
                                        />
                                        {advanceAmount > 0 && (
                                            <p className="text-xs text-muted-foreground">
                                                Saldo pendiente: S/ {balance.toFixed(2)}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        onClick={() => handleCreateOrder(true)}
                                        disabled={loading}
                                        className="w-full"
                                    >
                                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {loading ? 'Agendando...' : 'Confirmar Agenda'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        <Button className="flex-1" onClick={() => handleCreateOrder(false)} disabled={items.length === 0 || loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CreditCard className="mr-2 h-4 w-4" />}
                            Cobrar
                        </Button>
                    </div>
                </div>
            </div>

            {/* Confirmation Message Dialog */}
            <Dialog open={showConfirmation} onOpenChange={(open) => {
                setShowConfirmation(open)
                if (!open) {
                    // When dialog is closed, close schedule dialog and redirect if callback provided
                    setScheduleOpen(false)
                    if (onOrderScheduled) {
                        onOrderScheduled()
                    }
                }
            }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Mensaje de Confirmación</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="bg-muted p-4 rounded-md">
                            <pre className="text-sm whitespace-pre-wrap font-mono">{confirmationMessage}</pre>
                        </div>
                        <Button
                            className="w-full"
                            onClick={() => {
                                navigator.clipboard.writeText(confirmationMessage)
                                alert('Mensaje copiado al portapapeles')
                            }}
                        >
                            Copiar Mensaje
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
