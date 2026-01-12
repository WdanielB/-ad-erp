'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { supabase } from '@/utils/supabase/client'
import { 
    LogIn, LogOut, Coffee, Clock, Loader2, Play,
    User, Timer, MapPin, AlertTriangle, CheckCircle2
} from 'lucide-react'

type Employee = {
    id: string
    employee_code: string | null
    first_name: string
    last_name: string
    status: 'active' | 'inactive' | 'on_leave' | 'terminated'
}

type TimeRecord = {
    id: string
    employee_id: string
    record_date: string
    clock_in: string | null
    clock_out: string | null
    break_start: string | null
    break_end: string | null
    total_hours: number | null
    total_break_minutes: number | null
    status: string
}

type LocationStatus = 'checking' | 'allowed' | 'denied' | 'unavailable' | 'error'

interface TimeClockCardProps {
    employees: Employee[]
    timeRecords: TimeRecord[]
    onRefresh: () => void
}

// Calcular distancia entre dos puntos (fórmula Haversine)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3 // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lon2 - lon1) * Math.PI / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c // Distancia en metros
}

export function TimeClockCard({ employees, timeRecords, onRefresh }: TimeClockCardProps) {
    const [selectedEmployee, setSelectedEmployee] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [currentTime, setCurrentTime] = useState(new Date())
    
    // Estado de ubicación
    const [locationStatus, setLocationStatus] = useState<LocationStatus>('checking')
    const [currentLocation, setCurrentLocation] = useState<{ lat: number, lng: number } | null>(null)
    const [businessLocation, setBusinessLocation] = useState<{ lat: number, lng: number, radius: number } | null>(null)
    const [distanceToWork, setDistanceToWork] = useState<number | null>(null)
    const [requireLocation, setRequireLocation] = useState(true)

    // Cargar configuración del negocio
    useEffect(() => {
        async function loadBusinessSettings() {
            const { data } = await supabase
                .from('business_settings')
                .select('key, value')
                .in('key', ['business_latitude', 'business_longitude', 'allowed_radius_meters', 'require_location_for_clock'])

            if (data) {
                const settings: Record<string, string> = {}
                data.forEach((s: any) => { settings[s.key] = s.value })
                
                const lat = parseFloat(settings.business_latitude || '0')
                const lng = parseFloat(settings.business_longitude || '0')
                const radius = parseFloat(settings.allowed_radius_meters || '100')
                const reqLoc = settings.require_location_for_clock !== 'false'
                
                setBusinessLocation({ lat, lng, radius })
                setRequireLocation(reqLoc)
                
                // Si no hay ubicación configurada (0,0), no requerir
                if (lat === 0 && lng === 0) {
                    setLocationStatus('allowed')
                    setRequireLocation(false)
                }
            }
        }
        loadBusinessSettings()
    }, [])

    // Obtener ubicación actual
    useEffect(() => {
        if (!requireLocation || !businessLocation || (businessLocation.lat === 0 && businessLocation.lng === 0)) {
            setLocationStatus('allowed')
            return
        }

        if (!navigator.geolocation) {
            setLocationStatus('unavailable')
            return
        }

        setLocationStatus('checking')
        
        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords
                setCurrentLocation({ lat: latitude, lng: longitude })
                
                if (businessLocation) {
                    const distance = calculateDistance(
                        latitude, longitude,
                        businessLocation.lat, businessLocation.lng
                    )
                    setDistanceToWork(Math.round(distance))
                    setLocationStatus(distance <= businessLocation.radius ? 'allowed' : 'denied')
                }
            },
            (error) => {
                setLocationStatus('error')
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
        )

        return () => navigator.geolocation.clearWatch(watchId)
    }, [businessLocation, requireLocation])

    // Update time every second
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date())
        }, 1000)
        return () => clearInterval(interval)
    }, [])

    const selectedRecord = timeRecords.find(r => r.employee_id === selectedEmployee)
    const selectedEmp = employees.find(e => e.id === selectedEmployee)

    const getEmployeeStatus = () => {
        if (!selectedRecord) return 'not_started'
        if (selectedRecord.clock_out) return 'completed'
        if (selectedRecord.break_start && !selectedRecord.break_end) return 'on_break'
        if (selectedRecord.clock_in) return 'working'
        return 'not_started'
    }

    const status = getEmployeeStatus()
    const canClockIn = locationStatus === 'allowed' || !requireLocation

    const handleClockIn = async () => {
        if (!selectedEmployee || !canClockIn) return
        setLoading(true)
        
        try {
            const today = new Date().toISOString().split('T')[0]
            const now = new Date().toISOString()

            await (supabase.from('time_records') as any)
                .upsert({
                    employee_id: selectedEmployee,
                    record_date: today,
                    clock_in: now,
                    clock_in_latitude: currentLocation?.lat || null,
                    clock_in_longitude: currentLocation?.lng || null,
                    location_verified: locationStatus === 'allowed',
                    status: 'in_progress'
                }, {
                    onConflict: 'employee_id,record_date'
                })

            onRefresh()
        } catch (error) {
            // Error silencioso
        } finally {
            setLoading(false)
        }
    }

    const handleClockOut = async () => {
        if (!selectedRecord) return
        setLoading(true)
        
        try {
            const now = new Date().toISOString()

            // If on break, end the break first
            if (status === 'on_break') {
                await (supabase.from('time_records') as any)
                    .update({
                        break_end: now
                    })
                    .eq('id', selectedRecord.id)
            }

            await (supabase.from('time_records') as any)
                .update({
                    clock_out: now,
                    clock_out_latitude: currentLocation?.lat || null,
                    clock_out_longitude: currentLocation?.lng || null,
                    status: 'completed'
                })
                .eq('id', selectedRecord.id)

            onRefresh()
        } catch (error) {
            console.error('Error clocking out:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleStartBreak = async () => {
        if (!selectedRecord) return
        setLoading(true)
        
        try {
            const now = new Date().toISOString()

            await (supabase.from('time_records') as any)
                .update({
                    break_start: now
                })
                .eq('id', selectedRecord.id)

            onRefresh()
        } catch (error) {
            console.error('Error starting break:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleEndBreak = async () => {
        if (!selectedRecord) return
        setLoading(true)
        
        try {
            const now = new Date().toISOString()
            const breakStart = new Date(selectedRecord.break_start!)
            const breakEnd = new Date(now)
            const breakMinutes = Math.round((breakEnd.getTime() - breakStart.getTime()) / 60000)

            await (supabase.from('time_records') as any)
                .update({
                    break_end: now,
                    total_break_minutes: (selectedRecord.total_break_minutes || 0) + breakMinutes
                })
                .eq('id', selectedRecord.id)

            onRefresh()
        } catch (error) {
            console.error('Error ending break:', error)
        } finally {
            setLoading(false)
        }
    }

    const calculateElapsedTime = () => {
        if (!selectedRecord?.clock_in) return '00:00:00'
        const start = new Date(selectedRecord.clock_in)
        const now = new Date()
        const diff = now.getTime() - start.getTime()
        const hours = Math.floor(diff / 3600000)
        const minutes = Math.floor((diff % 3600000) / 60000)
        const seconds = Math.floor((diff % 60000) / 1000)
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }

    const getStatusBadge = () => {
        const badges: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string, icon: React.ReactNode }> = {
            not_started: { variant: 'secondary', label: 'Sin registrar', icon: <Clock className="h-3 w-3 mr-1" /> },
            working: { variant: 'default', label: 'Trabajando', icon: <Play className="h-3 w-3 mr-1" /> },
            on_break: { variant: 'outline', label: 'En descanso', icon: <Coffee className="h-3 w-3 mr-1" /> },
            completed: { variant: 'secondary', label: 'Jornada completada', icon: <LogOut className="h-3 w-3 mr-1" /> }
        }
        const config = badges[status]
        return (
            <Badge variant={config.variant} className="flex items-center">
                {config.icon}
                {config.label}
            </Badge>
        )
    }

    return (
        <div className="grid gap-6 md:grid-cols-2">
            {/* Selection Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <User className="mr-2 h-5 w-5" />
                        Seleccionar Empleado
                    </CardTitle>
                    <CardDescription>
                        Elige un empleado para registrar su tiempo
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar empleado..." />
                        </SelectTrigger>
                        <SelectContent>
                            {employees.map((emp) => {
                                const hasRecord = timeRecords.find(r => r.employee_id === emp.id)
                                const isWorking = hasRecord?.clock_in && !hasRecord?.clock_out
                                return (
                                    <SelectItem key={emp.id} value={emp.id}>
                                        <div className="flex items-center justify-between w-full">
                                            <span>{emp.first_name} {emp.last_name}</span>
                                            {isWorking && (
                                                <Badge variant="default" className="ml-2 text-xs">
                                                    Trabajando
                                                </Badge>
                                            )}
                                        </div>
                                    </SelectItem>
                                )
                            })}
                        </SelectContent>
                    </Select>

                    {selectedEmp && (
                        <div className="p-4 bg-muted rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="font-medium">
                                    {selectedEmp.first_name} {selectedEmp.last_name}
                                </span>
                                {getStatusBadge()}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Código: {selectedEmp.employee_code}
                            </p>
                        </div>
                    )}

                    {/* Quick employee buttons */}
                    <div className="flex flex-wrap gap-2">
                        {employees.slice(0, 6).map((emp) => (
                            <Button
                                key={emp.id}
                                variant={selectedEmployee === emp.id ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setSelectedEmployee(emp.id)}
                            >
                                {emp.first_name}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Time Clock Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Timer className="mr-2 h-5 w-5" />
                        Reloj de Tiempo
                    </CardTitle>
                    <CardDescription>
                        {currentTime.toLocaleDateString('es-ES', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Location Status */}
                    {requireLocation && (
                        <div className={`flex items-center justify-between p-3 rounded-lg ${
                            locationStatus === 'allowed' ? 'bg-green-500/10 border border-green-500/30' :
                            locationStatus === 'denied' ? 'bg-red-500/10 border border-red-500/30' :
                            locationStatus === 'checking' ? 'bg-blue-500/10 border border-blue-500/30' :
                            'bg-yellow-500/10 border border-yellow-500/30'
                        }`}>
                            <div className="flex items-center gap-2">
                                {locationStatus === 'allowed' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                                {locationStatus === 'denied' && <AlertTriangle className="h-5 w-5 text-red-600" />}
                                {locationStatus === 'checking' && <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />}
                                {(locationStatus === 'unavailable' || locationStatus === 'error') && <MapPin className="h-5 w-5 text-yellow-600" />}
                                <div>
                                    <p className={`text-sm font-medium ${
                                        locationStatus === 'allowed' ? 'text-green-700' :
                                        locationStatus === 'denied' ? 'text-red-700' :
                                        locationStatus === 'checking' ? 'text-blue-700' :
                                        'text-yellow-700'
                                    }`}>
                                        {locationStatus === 'allowed' && 'Ubicación verificada'}
                                        {locationStatus === 'denied' && 'Fuera del área permitida'}
                                        {locationStatus === 'checking' && 'Verificando ubicación...'}
                                        {locationStatus === 'unavailable' && 'GPS no disponible'}
                                        {locationStatus === 'error' && 'Error de ubicación'}
                                    </p>
                                    {distanceToWork !== null && locationStatus !== 'checking' && (
                                        <p className="text-xs text-muted-foreground">
                                            Distancia: {distanceToWork < 1000 ? `${distanceToWork}m` : `${(distanceToWork/1000).toFixed(1)}km`}
                                            {businessLocation && ` (máx: ${businessLocation.radius}m)`}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                        </div>
                    )}

                    {/* Current Time Display */}
                    <div className="text-center">
                        <div className="text-5xl font-mono font-bold">
                            {currentTime.toLocaleTimeString('es-ES')}
                        </div>
                    </div>

                    {/* Elapsed Time (if working) */}
                    {selectedEmployee && status === 'working' && (
                        <div className="text-center p-4 bg-green-500/10 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Tiempo trabajado</p>
                            <div className="text-3xl font-mono font-bold text-green-600">
                                {calculateElapsedTime()}
                            </div>
                        </div>
                    )}

                    {selectedEmployee && status === 'on_break' && (
                        <div className="text-center p-4 bg-yellow-500/10 rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">En descanso</p>
                            <Coffee className="h-8 w-8 mx-auto text-yellow-600 animate-pulse" />
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            size="lg"
                            className="h-16 text-lg"
                            disabled={!selectedEmployee || loading || status === 'working' || status === 'on_break' || status === 'completed' || !canClockIn}
                            onClick={handleClockIn}
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                                <LogIn className="mr-2 h-5 w-5" />
                            )}
                            Entrada
                        </Button>
                        
                        <Button
                            size="lg"
                            variant="destructive"
                            className="h-16 text-lg"
                            disabled={!selectedEmployee || loading || status === 'not_started' || status === 'completed'}
                            onClick={handleClockOut}
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                                <LogOut className="mr-2 h-5 w-5" />
                            )}
                            Salida
                        </Button>
                        
                        <Button
                            size="lg"
                            variant="outline"
                            className="h-16 text-lg col-span-2"
                            disabled={!selectedEmployee || loading || status !== 'working'}
                            onClick={handleStartBreak}
                        >
                            {loading ? (
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            ) : (
                                <Coffee className="mr-2 h-5 w-5" />
                            )}
                            Iniciar Descanso
                        </Button>

                        {status === 'on_break' && (
                            <Button
                                size="lg"
                                variant="secondary"
                                className="h-16 text-lg col-span-2"
                                disabled={loading}
                                onClick={handleEndBreak}
                            >
                                {loading ? (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                ) : (
                                    <Play className="mr-2 h-5 w-5" />
                                )}
                                Terminar Descanso
                            </Button>
                        )}
                    </div>

                    {/* Today's Summary */}
                    {selectedRecord && (
                        <div className="border-t pt-4 space-y-2">
                            <h4 className="font-medium text-sm text-muted-foreground">Resumen de Hoy</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Entrada:</span>
                                    <span className="font-medium">
                                        {selectedRecord.clock_in 
                                            ? new Date(selectedRecord.clock_in).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                                            : '--:--'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Salida:</span>
                                    <span className="font-medium">
                                        {selectedRecord.clock_out 
                                            ? new Date(selectedRecord.clock_out).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                                            : '--:--'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Descanso:</span>
                                    <span className="font-medium">{selectedRecord.total_break_minutes || 0} min</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Total:</span>
                                    <span className="font-medium">{selectedRecord.total_hours?.toFixed(2) || '0.00'} hrs</span>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
