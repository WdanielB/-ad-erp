'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO, addMonths, subMonths, differenceInDays, differenceInHours } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Clock, List, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
        if (!newEvent.title || !newEvent.date) {
            alert('Por favor, ingresa un título y fecha')
            return
        }

        try {
            const insertData = {
                title: newEvent.title,
                description: newEvent.description || null,
                type: newEvent.type,
                event_date: new Date(newEvent.date).toISOString()
            }

            console.log('Inserting event:', insertData)

            const { data, error } = await (supabase
                .from('calendar_events') as any)
                .insert(insertData)
                .select()

            console.log('Insert result:', { data, error })

            if (error) {
                console.error('Supabase error:', error.message, error.details, error.hint)
                alert(`Error al crear evento: ${error.message || JSON.stringify(error)}`)
            } else {
                setIsEventDialogOpen(false)
                setNewEvent({ title: '', description: '', type: 'campaign', date: '' })
                fetchEvents()
            }
        } catch (e: any) {
            console.error('Exception:', e)
            alert(`Error inesperado: ${e.message}`)
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

            <Tabs defaultValue="calendar" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                    <TabsTrigger value="calendar">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        Calendario
                    </TabsTrigger>
                    <TabsTrigger value="list">
                        <List className="mr-2 h-4 w-4" />
                        Próximos
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="calendar" className="mt-4">
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
                                    <CardHeader className="p-2 flex flex-row justify-between items-start space-y-0">
                                        <div className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${isSameDay(day, new Date()) ? 'bg-primary text-primary-foreground' : ''}`}>
                                            {format(day, 'd')}
                                        </div>
                                        {getEventsForDay(day).length > 0 && (
                                            <div className="flex gap-1">
                                                {getEventsForDay(day).map(ev => (
                                                    <div key={ev.id} className="w-2 h-2 rounded-full bg-purple-500" title={ev.title} />
                                                ))}
                                            </div>
                                        )}
                                    </CardHeader>
                                    <CardContent className="p-2 space-y-1">
                                        {getEventsForDay(day).map(event => (
                                            <div key={event.id} className="text-xs p-1 rounded bg-purple-100 text-purple-800 font-medium truncate mb-1">
                                                ★ {event.title}
                                            </div>
                                        ))}
                                        {dayOrders.map(order => (
                                            <div
                                                key={order.id}
                                                className="text-xs p-1 rounded truncate cursor-pointer group relative"
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
                                                <div className="flex justify-between items-center">
                                                    <span>{format(parseISO(order.delivery_date), 'HH:mm')} - {order.clients?.full_name?.split(' ')[0] || 'Cliente'}</span>
                                                </div>
                                                <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                                    ⏳ {getTimeRemaining(order.delivery_date)}
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>
                </TabsContent>

                <TabsContent value="list" className="mt-4">
                    <UpcomingList orders={orders} events={events} onOrderClick={setSelectedOrder} />
                </TabsContent>
            </Tabs>

            <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nuevo Evento</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Título</label>
                            <Input
                                value={newEvent.title}
                                onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                placeholder="Ej: Día de la Madre"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Fecha</label>
                            <Input
                                type="date"
                                value={newEvent.date}
                                onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tipo</label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={newEvent.type}
                                onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}
                            >
                                <option value="campaign">Campaña</option>
                                <option value="milestone">Hito</option>
                                <option value="other">Otro</option>
                            </select>
                        </div>
                        <Button onClick={handleCreateEvent} className="w-full">Crear Evento</Button>
                    </div>
                </DialogContent>
            </Dialog>

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

// Upcoming List Component
function UpcomingList({ orders, events, onOrderClick }: { orders: any[], events: any[], onOrderClick: (order: any) => void }) {
    const now = new Date()

    // Combine orders and events, filter only future ones
    const upcomingItems = [
        ...orders
            .filter(o => new Date(o.delivery_date) >= now && o.status !== 'delivered' && o.status !== 'cancelled')
            .map(o => ({ ...o, itemType: 'order' as const })),
        ...events
            .filter(e => new Date(e.event_date) >= now)
            .map(e => ({ ...e, itemType: 'event' as const, delivery_date: e.event_date }))
    ].sort((a, b) => new Date(a.delivery_date || a.event_date).getTime() - new Date(b.delivery_date || b.event_date).getTime())

    const getUrgencyColor = (dateString: string) => {
        const target = new Date(dateString)
        const daysLeft = differenceInDays(target, now)
        const hoursLeft = differenceInHours(target, now)

        if (daysLeft === 0 || hoursLeft < 24) {
            return { bg: 'bg-red-100', border: 'border-red-500', text: 'text-red-700', label: '¡HOY!' }
        } else if (daysLeft <= 7) {
            return { bg: 'bg-yellow-100', border: 'border-yellow-500', text: 'text-yellow-700', label: 'Esta semana' }
        } else {
            return { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-700', label: '+1 semana' }
        }
    }

    const getCountdown = (dateString: string) => {
        const target = new Date(dateString)
        const daysLeft = differenceInDays(target, now)
        const hoursLeft = differenceInHours(target, now) % 24

        if (daysLeft > 0) {
            return `${daysLeft} día${daysLeft > 1 ? 's' : ''} ${hoursLeft}h`
        } else {
            const totalHours = differenceInHours(target, now)
            if (totalHours > 0) {
                return `${totalHours} hora${totalHours > 1 ? 's' : ''}`
            }
            return 'Ahora'
        }
    }

    if (upcomingItems.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground border rounded-lg border-dashed">
                No hay pedidos o eventos próximos
            </div>
        )
    }

    const isUrgent = (dateString: string) => {
        const hoursLeft = differenceInHours(new Date(dateString), now)
        return hoursLeft < 24 && hoursLeft >= 0
    }

    return (
        <div className="space-y-3">
            {upcomingItems.map((item, idx) => {
                const urgency = getUrgencyColor(item.delivery_date || item.event_date)
                const isOrder = item.itemType === 'order'
                const showFlipClock = isUrgent(item.delivery_date || item.event_date)

                return (
                    <Card
                        key={`${item.itemType}-${item.id}`}
                        className={`${urgency.bg} border-l-4 ${urgency.border} cursor-pointer hover:shadow-md transition-shadow`}
                        onClick={() => isOrder && onOrderClick(item)}
                    >
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Badge variant="outline" className={urgency.text}>
                                            {urgency.label}
                                        </Badge>
                                        {isOrder ? (
                                            <Badge variant="secondary">Pedido</Badge>
                                        ) : (
                                            <Badge className="bg-purple-500">Evento</Badge>
                                        )}
                                    </div>
                                    <h3 className="font-semibold text-lg">
                                        {isOrder
                                            ? `${item.clients?.full_name || 'Cliente'} - #${item.ticket_number || item.id.slice(0, 6)}`
                                            : item.title
                                        }
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {format(parseISO(item.delivery_date || item.event_date), 'EEEE d MMMM, HH:mm', { locale: es })}
                                    </p>
                                    {isOrder && item.delivery_address && (
                                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                            <MapPin className="h-3 w-3" />
                                            {item.delivery_address}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right">
                                    {showFlipClock ? (
                                        <FlipCountdown targetDate={item.delivery_date || item.event_date} />
                                    ) : (
                                        <>
                                            <div className={`text-2xl font-bold ${urgency.text}`}>
                                                {getCountdown(item.delivery_date || item.event_date)}
                                            </div>
                                            <div className="text-xs text-muted-foreground">restante</div>
                                        </>
                                    )}
                                    {isOrder && (
                                        <div className="text-sm font-medium mt-1">
                                            S/ {item.total_amount?.toFixed(2)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}

// Retro Dark Flip Clock - Binder Style Countdown Component
function FlipCountdown({ targetDate }: { targetDate: string }) {
    const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 })
    const [prevTime, setPrevTime] = useState({ hours: 0, minutes: 0, seconds: 0 })
    const [flipping, setFlipping] = useState({ hours: false, minutes: false, seconds: false })

    useEffect(() => {
        const calculateTime = () => {
            const now = new Date()
            const target = new Date(targetDate)
            const diff = target.getTime() - now.getTime()

            if (diff <= 0) {
                setTimeLeft({ hours: 0, minutes: 0, seconds: 0 })
                return
            }

            const hours = Math.floor(diff / (1000 * 60 * 60))
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
            const seconds = Math.floor((diff % (1000 * 60)) / 1000)

            // Detect changes for flip animation
            setFlipping({
                hours: hours !== timeLeft.hours,
                minutes: minutes !== timeLeft.minutes,
                seconds: seconds !== timeLeft.seconds
            })

            setPrevTime(timeLeft)
            setTimeLeft({ hours, minutes, seconds })

            // Reset flip state after animation
            setTimeout(() => {
                setFlipping({ hours: false, minutes: false, seconds: false })
            }, 500)
        }

        calculateTime()
        const interval = setInterval(calculateTime, 1000)
        return () => clearInterval(interval)
    }, [targetDate, timeLeft.hours, timeLeft.minutes, timeLeft.seconds])

    // Binder hole component
    const BinderHole = ({ position }: { position: 'top' | 'bottom' }) => (
        <>
            <div className={`absolute ${position === 'top' ? 'bottom-[3px]' : 'top-[3px]'} left-2 w-1.5 h-1.5 bg-[#1a1a1a] rounded-full shadow-inner z-30`} />
            <div className={`absolute ${position === 'top' ? 'bottom-[3px]' : 'top-[3px]'} right-2 w-1.5 h-1.5 bg-[#1a1a1a] rounded-full shadow-inner z-30`} />
        </>
    )

    // Metallic binder ring
    const BinderRing = ({ side }: { side: 'left' | 'right' }) => (
        <div className={`absolute top-1/2 ${side === 'left' ? 'left-1.5' : 'right-1.5'} w-1.5 h-5 -translate-y-1/2 z-40`}>
            <div className="w-full h-full bg-gradient-to-r from-[#555] via-[#ccc] to-[#555] rounded-full shadow-md" />
        </div>
    )

    // Single flip digit with split card design
    const FlipDigit = ({ value, prevValue, isFlipping, label }: {
        value: number,
        prevValue: number,
        isFlipping: boolean,
        label: string
    }) => {
        const displayValue = value.toString().padStart(2, '0')
        const displayPrevValue = prevValue.toString().padStart(2, '0')

        return (
            <div className="flex flex-col items-center">
                <div className="relative w-12 h-16 perspective-1000">
                    {/* Static bottom half (current value) */}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden rounded-b-md">
                        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] to-[#252525] noise-texture">
                            <BinderHole position="bottom" />
                        </div>
                        <div className="absolute inset-0 flex items-start justify-center">
                            <span className="text-white text-2xl font-bold tracking-wider" style={{ fontFamily: 'Oswald, sans-serif', transform: 'translateY(-50%)' }}>
                                {displayValue}
                            </span>
                        </div>
                        {isFlipping && <div className="absolute inset-0 animate-highlight rounded-b-md" />}
                    </div>

                    {/* Static top half (current value) */}
                    <div className="absolute inset-x-0 top-0 h-1/2 overflow-hidden rounded-t-md">
                        <div className="absolute inset-0 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] noise-texture">
                            <BinderHole position="top" />
                        </div>
                        <div className="absolute inset-0 flex items-end justify-center">
                            <span className="text-white text-2xl font-bold tracking-wider" style={{ fontFamily: 'Oswald, sans-serif', transform: 'translateY(50%)' }}>
                                {displayValue}
                            </span>
                        </div>
                    </div>

                    {/* Flipping top card (old value flipping down) */}
                    {isFlipping && (
                        <div className="absolute inset-x-0 top-0 h-1/2 overflow-hidden rounded-t-md preserve-3d animate-flip-top z-20">
                            <div className="absolute inset-0 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] backface-hidden noise-texture">
                                <BinderHole position="top" />
                            </div>
                            <div className="absolute inset-0 flex items-end justify-center backface-hidden">
                                <span className="text-white text-2xl font-bold tracking-wider" style={{ fontFamily: 'Oswald, sans-serif', transform: 'translateY(50%)' }}>
                                    {displayPrevValue}
                                </span>
                            </div>
                            <div className="absolute inset-0 animate-shading rounded-t-md" />
                        </div>
                    )}

                    {/* Flipping bottom card (new value appearing) */}
                    {isFlipping && (
                        <div className="absolute inset-x-0 bottom-0 h-1/2 overflow-hidden rounded-b-md preserve-3d animate-flip-bottom z-20" style={{ transform: 'rotateX(180deg)' }}>
                            <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] to-[#252525] backface-hidden noise-texture" style={{ transform: 'rotateX(180deg)' }}>
                                <BinderHole position="bottom" />
                            </div>
                            <div className="absolute inset-0 flex items-start justify-center backface-hidden" style={{ transform: 'rotateX(180deg)' }}>
                                <span className="text-white text-2xl font-bold tracking-wider" style={{ fontFamily: 'Oswald, sans-serif', transform: 'translateY(-50%)' }}>
                                    {displayValue}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Center divider line */}
                    <div className="absolute inset-x-0 top-1/2 h-[2px] bg-black/60 z-30 -translate-y-1/2" />

                    {/* Metallic binder rings */}
                    <BinderRing side="left" />
                    <BinderRing side="right" />

                    {/* Card shadow */}
                    <div className="absolute -bottom-1 inset-x-0.5 h-2 bg-black/30 rounded-b-md blur-sm -z-10" />
                </div>
                <span className="text-[9px] text-gray-500 mt-1 font-medium uppercase tracking-widest">{label}</span>
            </div>
        )
    }

    // Separator dots
    const Separator = () => (
        <div className="flex flex-col justify-center items-center h-16 px-1">
            <div className="w-1.5 h-1.5 bg-[#333] rounded-full mb-2 shadow-inner" />
            <div className="w-1.5 h-1.5 bg-[#333] rounded-full shadow-inner" />
        </div>
    )

    return (
        <div className="flex items-start gap-0.5 bg-gradient-to-b from-[#3a3a3a] to-[#2a2a2a] p-2 rounded-lg shadow-lg border border-[#444]">
            <FlipDigit value={timeLeft.hours} prevValue={prevTime.hours} isFlipping={flipping.hours} label="Hrs" />
            <Separator />
            <FlipDigit value={timeLeft.minutes} prevValue={prevTime.minutes} isFlipping={flipping.minutes} label="Min" />
            <Separator />
            <FlipDigit value={timeLeft.seconds} prevValue={prevTime.seconds} isFlipping={flipping.seconds} label="Seg" />
        </div>
    )
}
