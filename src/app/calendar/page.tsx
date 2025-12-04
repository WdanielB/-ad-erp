'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, addMonths, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { supabase } from '@/utils/supabase/client'
import { Database } from '@/types/database.types'

type Order = Database['public']['Tables']['orders']['Row'] & {
    clients: Database['public']['Tables']['clients']['Row'] | null
}

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [orders, setOrders] = useState<Order[]>([])
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
    const [loading, setLoading] = useState(true)

    const [events, setEvents] = useState<any[]>([])
    const [isEventDialogOpen, setIsEventDialogOpen] = useState(false)
    const [newEvent, setNewEvent] = useState({ title: '', description: '', type: 'campaign', date: '' })

    useEffect(() => {
        fetchOrders()
        fetchEvents()
    }, [currentDate])

    async function fetchEvents() {
        const start = startOfMonth(currentDate).toISOString()
        const end = endOfMonth(currentDate).toISOString()

        const { data } = await supabase
            .from('calendar_events')
            .select('*')
            .gte('event_date', start)
            .lte('event_date', end)

        if (data) setEvents(data)
    }

    async function handleCreateEvent() {
        if (!newEvent.title || !newEvent.date) return

        const { error } = await (supabase
            .from('calendar_events') as any)
            .insert({
                title: newEvent.title,
                description: newEvent.description,
                type: newEvent.type,
                event_date: new Date(newEvent.date).toISOString()
            })

        if (error) {
            console.error('Error creating event:', error)
            alert('Error al crear evento')
        } else {
            setIsEventDialogOpen(false)
            setNewEvent({ title: '', description: '', type: 'campaign', date: '' })
            fetchEvents()
        }
    }

    const getEventsForDay = (date: Date) => {
        return events.filter(event => isSameDay(parseISO(event.event_date), date))
    }

    const getTimeRemaining = (dateString: string) => {
        const now = new Date()
        const target = new Date(dateString)
        const diff = target.getTime() - now.getTime()

        if (diff < 0) return 'Vencido'

        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

        if (days > 0) return `${days}d ${hours}h`
        return `${hours}h`
    }

    async function fetchOrders() {
        setLoading(true)
        const start = startOfMonth(currentDate).toISOString()
        const end = endOfMonth(currentDate).toISOString()

        const { data } = await supabase
            .from('orders')
            .select('*, clients(*)')
            .gte('delivery_date', start)
            .lte('delivery_date', end)
            .neq('status', 'cancelled')
            .order('delivery_date', { ascending: true })
            .returns<Order[]>()

        if (data) setOrders(data)
        setLoading(false)
    }

    const days = eachDayOfInterval({
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate)
    })

    const getOrdersForDay = (date: Date) => {
        return orders.filter(order => isSameDay(parseISO(order.delivery_date), date))
    }

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1))
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1))

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Calendario de Pedidos</h1>
                <div className="flex items-center gap-4">
                    <Button onClick={() => setIsEventDialogOpen(true)}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        Nuevo Evento
                    </Button>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={prevMonth}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <div className="font-semibold min-w-[150px] text-center capitalize">
                            {format(currentDate, 'MMMM yyyy', { locale: es })}
                        </div>
                        <Button variant="outline" size="icon" onClick={nextMonth}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-4">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                    <div key={day} className="text-center font-medium text-muted-foreground py-2">
                        {day}
                    </div>
                ))}
                {days.map((day, i) => {
                    const dayOrders = getOrdersForDay(day)
                    return (
                        <Card
                            key={day.toISOString()}
                            className={`min-h-[120px] cursor-pointer hover:bg-muted/50 transition-colors ${!isSameMonth(day, currentDate) ? 'opacity-50' : ''}`}
                            onClick={() => setSelectedDate(day)}
                        >
                            <CardHeader className="p-2">
                                <div className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${isSameDay(day, new Date()) ? 'bg-primary text-primary-foreground' : ''}`}>
                                    {format(day, 'd')}
                                </div>
                            </CardHeader>
                            <CardContent className="p-2 space-y-1">
                                {dayOrders.map(order => (
                                    <div
                                        key={order.id}
                                        className="text-xs p-1 rounded truncate cursor-pointer"
                                        style={{
                                            backgroundColor: order.label_color ? `${order.label_color}20` : '#dbeafe',
                                            borderLeft: `3px solid ${order.label_color || '#3b82f6'}`,
                                            color: '#1e293b'
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setSelectedOrder(order)
                                        }}
                                    >
                                        {format(parseISO(order.delivery_date), 'HH:mm')} - {order.clients?.full_name || 'Cliente'}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Detalle del Pedido</DialogTitle>
                    </DialogHeader>
                    {selectedOrder && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="text-sm text-muted-foreground">Cliente</div>
                                    <div className="font-medium">{selectedOrder.clients?.full_name || 'Sin nombre'}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground">Estado</div>
                                    <Badge variant={selectedOrder.status === 'delivered' ? 'default' : 'secondary'}>
                                        {selectedOrder.status === 'pending' ? 'Pendiente' :
                                            selectedOrder.status === 'paid' ? 'Pagado' :
                                                selectedOrder.status === 'preparing' ? 'En Preparación' :
                                                    selectedOrder.status === 'delivered' ? 'Entregado' : 'Cancelado'}
                                    </Badge>
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                    <CalendarIcon className="h-3 w-3" /> Fecha y Hora
                                </div>
                                <div className="font-medium capitalize">
                                    {format(parseISO(selectedOrder.delivery_date), 'PPP p', { locale: es })}
                                </div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                    <MapPin className="h-3 w-3" /> Dirección de Entrega
                                </div>
                                <div className="font-medium">{selectedOrder.delivery_address}</div>
                            </div>
                            <div>
                                <div className="text-sm text-muted-foreground">Monto Total</div>
                                <div className="font-bold text-lg">S/ {selectedOrder.total_amount.toFixed(2)}</div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
