'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { supabase } from '@/utils/supabase/client'
import { Clock, LogIn, LogOut, Coffee, MapPin, CheckCircle, XCircle, Loader2, Play } from 'lucide-react'

interface TimeRecord {
    id: string
    clock_in: string | null
    clock_out: string | null
    break_start: string | null
    break_end: string | null
    total_hours: number
    total_break_minutes: number
    status: string
    location_verified: boolean
}

interface BusinessSettings {
    latitude: number
    longitude: number
    radius: number
    requireLocation: boolean
}

interface EmployeeTimeClockProps {
    employeeId: string
    employeeName: string
}

export default function EmployeeTimeClock({ employeeId, employeeName }: EmployeeTimeClockProps) {
    const [currentTime, setCurrentTime] = useState(new Date())
    const [todayRecord, setTodayRecord] = useState<TimeRecord | null>(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState(false)
    const [locationStatus, setLocationStatus] = useState<'checking' | 'verified' | 'denied' | 'out_of_range' | 'error'>('checking')
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
    const [businessSettings, setBusinessSettings] = useState<BusinessSettings | null>(null)

    // Actualizar reloj cada segundo
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    // Cargar configuración del negocio
    useEffect(() => {
        async function loadBusinessSettings() {
            const { data } = await (supabase
                .from('business_settings')
                .select('key, value') as any)
            
            if (data) {
                const settings: BusinessSettings = {
                    latitude: 0,
                    longitude: 0,
                    radius: 100,
                    requireLocation: true
                }
                data.forEach((row: { key: string; value: string }) => {
                    if (row.key === 'business_latitude') settings.latitude = parseFloat(row.value || '0')
                    if (row.key === 'business_longitude') settings.longitude = parseFloat(row.value || '0')
                    if (row.key === 'allowed_radius_meters') settings.radius = parseInt(row.value || '100')
                    if (row.key === 'require_location_for_clock') settings.requireLocation = row.value === 'true'
                })
                setBusinessSettings(settings)
            }
        }
        loadBusinessSettings()
    }, [])

    // Calcular distancia entre dos puntos (Haversine)
    const calculateDistance = useCallback((lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371000
        const dLat = (lat2 - lat1) * Math.PI / 180
        const dLon = (lon2 - lon1) * Math.PI / 180
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }, [])

    // Verificar ubicación
    const checkLocation = useCallback(() => {
        if (!businessSettings) return
        
        if (!businessSettings.requireLocation || (businessSettings.latitude === 0 && businessSettings.longitude === 0)) {
            setLocationStatus('verified')
            return
        }

        if (!navigator.geolocation) {
            setLocationStatus('error')
            return
        }

        setLocationStatus('checking')
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords
                setCurrentLocation({ lat: latitude, lng: longitude })
                
                const distance = calculateDistance(
                    latitude,
                    longitude,
                    businessSettings.latitude,
                    businessSettings.longitude
                )
                
                if (distance <= businessSettings.radius) {
                    setLocationStatus('verified')
                } else {
                    setLocationStatus('out_of_range')
                }
            },
            () => {
                setLocationStatus('denied')
            },
            { enableHighAccuracy: true, timeout: 10000 }
        )
    }, [businessSettings, calculateDistance])

    useEffect(() => {
        if (businessSettings) {
            checkLocation()
            const interval = setInterval(checkLocation, 30000)
            return () => clearInterval(interval)
        }
    }, [businessSettings, checkLocation])

    // Cargar registro de hoy
    const loadTodayRecord = useCallback(async () => {
        const today = new Date().toISOString().split('T')[0]
        console.log('Cargando registro de hoy para empleado:', employeeId, 'fecha:', today)
        const { data, error } = await (supabase
            .from('time_records')
            .select('*')
            .eq('employee_id', employeeId)
            .eq('record_date', today)
            .single() as any)
        
        console.log('Registro cargado:', data, 'Error:', error)
        setTodayRecord(data || null)
        setLoading(false)
    }, [employeeId])

    useEffect(() => {
        if (employeeId) {
            loadTodayRecord()
        }
    }, [employeeId, loadTodayRecord])

    // Enviar notificación a Telegram
    async function sendTelegramNotification(action: string) {
        const time = currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
        const date = currentTime.toLocaleDateString('es-ES')
        
        let emoji = ''
        let actionText = ''
        
        switch (action) {
            case 'clock_in':
                emoji = '✅'
                actionText = 'ENTRADA'
                break
            case 'clock_out':
                emoji = '🚪'
                actionText = 'SALIDA'
                break
            case 'break_start':
                emoji = '☕'
                actionText = 'INICIO DESCANSO'
                break
            case 'break_end':
                emoji = '💪'
                actionText = 'FIN DESCANSO'
                break
        }
        
        const locationText = currentLocation 
            ? `📍 Ubicación verificada`
            : `📍 Sin ubicación`
        
        const message = `
${emoji} <b>${actionText}</b>

👤 <b>Empleado:</b> ${employeeName}
🕐 <b>Hora:</b> ${time}
📅 <b>Fecha:</b> ${date}
${locationText}
        `.trim()
        
        try {
            await fetch('/api/telegram/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            })
        } catch {
            // Silently fail - no interrumpir el flujo principal
        }
    }

    // Marcar entrada
    async function handleClockIn() {
        if (locationStatus !== 'verified' && businessSettings?.requireLocation) {
            alert('Debes estar en el área de trabajo para marcar entrada')
            return
        }
        
        if (!employeeId) {
            alert('Error: No se encontró el ID del empleado')
            return
        }
        
        setActionLoading(true)
        const today = new Date().toISOString().split('T')[0]
        const now = new Date().toISOString()
        
        console.log('Marcando entrada para empleado:', employeeId)
        console.log('Fecha:', today, 'Hora:', now)
        
        try {
            const { data, error } = await (supabase
                .from('time_records') as any)
                .insert({
                    employee_id: employeeId,
                    record_date: today,
                    clock_in: now,
                    clock_in_latitude: currentLocation?.lat || null,
                    clock_in_longitude: currentLocation?.lng || null,
                    location_verified: locationStatus === 'verified',
                    status: 'in_progress'
                })
                .select()
                .single()
            
            console.log('Respuesta insert:', { data, error })
            
            if (error) {
                console.error('Error al insertar:', error)
                alert('Error al marcar entrada: ' + error.message)
                setActionLoading(false)
                return
            }
            
            if (data) {
                console.log('Datos insertados correctamente:', data)
                setTodayRecord(data)
                // Recargar para asegurar que el estado se actualice
                await loadTodayRecord()
                // Enviar notificación a Telegram
                sendTelegramNotification('clock_in')
                const timeStr = new Date(now).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
                alert('✅ Entrada registrada a las ' + timeStr)
            } else {
                alert('Error: No se recibieron datos de la inserción')
            }
        } catch (err) {
            console.error('Excepción:', err)
            alert('Error inesperado: ' + (err as Error).message)
        }
        setActionLoading(false)
    }

    // Marcar salida
    async function handleClockOut() {
        if (!todayRecord) {
            alert('Error: No hay registro de entrada para hoy')
            return
        }
        
        if (!todayRecord.id) {
            alert('Error: No se encontró el ID del registro')
            return
        }
        
        setActionLoading(true)
        const now = new Date().toISOString()
        
        console.log('Marcando salida para registro:', todayRecord.id)
        
        try {
            const { data, error } = await (supabase
                .from('time_records') as any)
                .update({
                    clock_out: now,
                    clock_out_latitude: currentLocation?.lat || null,
                    clock_out_longitude: currentLocation?.lng || null,
                    status: 'completed'
                })
                .eq('id', todayRecord.id)
                .select()
                .single()
            
            console.log('Respuesta update salida:', { data, error })
            
            if (error) {
                alert('Error al marcar salida: ' + error.message)
                setActionLoading(false)
                return
            }
            
            if (data) {
                setTodayRecord(data)
                sendTelegramNotification('clock_out')
                alert('🚪 Salida registrada a las ' + new Date(now).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }))
            } else {
                alert('Error: No se recibieron datos de la actualización')
            }
        } catch (err) {
            console.error('Excepción salida:', err)
            alert('Error inesperado: ' + (err as Error).message)
        }
        setActionLoading(false)
    }

    // Iniciar break
    async function handleBreakStart() {
        if (!todayRecord) return
        
        setActionLoading(true)
        const now = new Date().toISOString()
        
        const { data, error } = await (supabase
            .from('time_records') as any)
            .update({ break_start: now })
            .eq('id', todayRecord.id)
            .select()
            .single()
        
        if (error) {
            alert('Error al iniciar break: ' + error.message)
            setActionLoading(false)
            return
        }
        
        if (data) {
            setTodayRecord(data)
            sendTelegramNotification('break_start')
            alert('☕ Break iniciado a las ' + new Date(now).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }))
        }
        setActionLoading(false)
    }

    // Terminar break
    async function handleBreakEnd() {
        if (!todayRecord) return
        
        setActionLoading(true)
        const now = new Date().toISOString()
        
        const { data, error } = await (supabase
            .from('time_records') as any)
            .update({ break_end: now })
            .eq('id', todayRecord.id)
            .select()
            .single()
        
        if (error) {
            alert('Error al terminar break: ' + error.message)
            setActionLoading(false)
            return
        }
        
        if (data) {
            setTodayRecord(data)
            sendTelegramNotification('break_end')
            alert('💪 Break terminado a las ' + new Date(now).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }))
        }
        setActionLoading(false)
    }

    // Estado actual
    const getStatus = () => {
        if (!todayRecord) return 'not_started'
        if (todayRecord.clock_out) return 'completed'
        if (todayRecord.break_start && !todayRecord.break_end) return 'on_break'
        if (todayRecord.clock_in) return 'working'
        return 'not_started'
    }

    const status = getStatus()

    // Renderizar indicador de ubicación
    const renderLocationStatus = () => {
        switch (locationStatus) {
            case 'checking':
                return (
                    <div className="flex items-center gap-2 text-blue-600 text-sm">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Verificando ubicación...
                    </div>
                )
            case 'verified':
                return (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        Ubicación verificada
                    </div>
                )
            case 'out_of_range':
                return (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                        <XCircle className="h-4 w-4" />
                        Fuera del área de trabajo
                    </div>
                )
            case 'denied':
                return (
                    <div className="flex items-center gap-2 text-orange-600 text-sm">
                        <MapPin className="h-4 w-4" />
                        Permiso de ubicación denegado
                    </div>
                )
            case 'error':
                return (
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                        <MapPin className="h-4 w-4" />
                        GPS no disponible
                    </div>
                )
        }
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-pink-200">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5 text-pink-500" />
                    Control de Tiempo
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Reloj digital */}
                <div className="text-center">
                    <div className="text-4xl font-bold text-gray-800">
                        {currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </div>
                    <div className="text-sm text-gray-500">
                        {currentTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                </div>

                {/* Estado de ubicación */}
                <div className="flex justify-center">
                    {renderLocationStatus()}
                </div>

                {/* Estado actual */}
                <div className="text-center">
                    {status === 'not_started' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-sm">
                            Sin marcar entrada
                        </span>
                    )}
                    {status === 'working' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm">
                            ✅ Trabajando
                        </span>
                    )}
                    {status === 'on_break' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-sm">
                            ☕ En descanso
                        </span>
                    )}
                    {status === 'completed' && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm">
                            🏁 Jornada completada
                        </span>
                    )}
                </div>

                {/* Botones de acción */}
                <div className="grid grid-cols-2 gap-2">
                    {/* Botón Entrada */}
                    <Button
                        onClick={handleClockIn}
                        disabled={actionLoading || status !== 'not_started' || (locationStatus !== 'verified' && businessSettings?.requireLocation)}
                        className="bg-green-500 hover:bg-green-600"
                    >
                        {actionLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <LogIn className="h-4 w-4 mr-2" />
                        )}
                        Entrada
                    </Button>

                    {/* Botón Salida */}
                    <Button
                        onClick={handleClockOut}
                        disabled={actionLoading || status !== 'working'}
                        className="bg-red-500 hover:bg-red-600"
                    >
                        {actionLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <LogOut className="h-4 w-4 mr-2" />
                        )}
                        Salida
                    </Button>

                    {/* Botón Iniciar Break */}
                    <Button
                        onClick={handleBreakStart}
                        disabled={actionLoading || status !== 'working'}
                        variant="outline"
                        className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                    >
                        <Coffee className="h-4 w-4 mr-2" />
                        Iniciar Break
                    </Button>

                    {/* Botón Terminar Break */}
                    <Button
                        onClick={handleBreakEnd}
                        disabled={actionLoading || status !== 'on_break'}
                        variant="outline"
                        className="border-green-500 text-green-600 hover:bg-green-50"
                    >
                        <Play className="h-4 w-4 mr-2" />
                        Fin Break
                    </Button>
                </div>

                {/* Resumen del día */}
                {todayRecord && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg text-sm space-y-1">
                        {todayRecord.clock_in && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">Entrada:</span>
                                <span className="font-medium">
                                    {new Date(todayRecord.clock_in).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        )}
                        {todayRecord.clock_out && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">Salida:</span>
                                <span className="font-medium">
                                    {new Date(todayRecord.clock_out).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        )}
                        {(todayRecord.total_break_minutes || 0) > 0 && (
                            <div className="flex justify-between">
                                <span className="text-gray-600">Break:</span>
                                <span className="font-medium">{todayRecord.total_break_minutes} min</span>
                            </div>
                        )}
                        {(todayRecord.total_hours || 0) > 0 && (
                            <div className="flex justify-between border-t pt-1 mt-1">
                                <span className="text-gray-600 font-medium">Total trabajado:</span>
                                <span className="font-bold text-pink-600">{todayRecord.total_hours} hrs</span>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
