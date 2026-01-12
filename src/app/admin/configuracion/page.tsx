'use client'

import { useEffect, useState } from 'react'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from '@/utils/supabase/client'
import { 
    MapPin, Save, Loader2, Building2, Clock, 
    Navigation, Target, CheckCircle2, AlertCircle
} from 'lucide-react'
import { toast } from "sonner"

type BusinessSettings = {
    business_name: string
    business_latitude: string
    business_longitude: string
    allowed_radius_meters: string
    require_location_for_clock: string
}

export default function ConfiguracionPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [gettingLocation, setGettingLocation] = useState(false)
    const [settings, setSettings] = useState<BusinessSettings>({
        business_name: 'Florería Vitora',
        business_latitude: '',
        business_longitude: '',
        allowed_radius_meters: '100',
        require_location_for_clock: 'true'
    })

    useEffect(() => {
        loadSettings()
    }, [])

    async function loadSettings() {
        const { data } = await supabase
            .from('business_settings')
            .select('key, value')

        if (data) {
            const newSettings: BusinessSettings = { ...settings }
            data.forEach((s: { key: string, value: string }) => {
                if (s.key in newSettings) {
                    newSettings[s.key as keyof BusinessSettings] = s.value
                }
            })
            setSettings(newSettings)
        }
        setLoading(false)
    }

    async function saveSettings() {
        setSaving(true)
        try {
            const settingsToSave = Object.entries(settings).map(([key, value]) => ({
                key,
                value: String(value)
            }))

            for (const setting of settingsToSave) {
                await (supabase.from('business_settings') as any)
                    .upsert(setting, { onConflict: 'key' })
            }

            toast.success('Configuración guardada correctamente')
        } catch (error) {
            toast.error('Error al guardar la configuración')
        } finally {
            setSaving(false)
        }
    }

    function getCurrentLocation() {
        if (!navigator.geolocation) {
            toast.error('La geolocalización no está disponible en este navegador')
            return
        }

        setGettingLocation(true)
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setSettings(prev => ({
                    ...prev,
                    business_latitude: position.coords.latitude.toFixed(8),
                    business_longitude: position.coords.longitude.toFixed(8)
                }))
                setGettingLocation(false)
                toast.success('Ubicación obtenida correctamente')
            },
            (error) => {
                setGettingLocation(false)
                toast.error('No se pudo obtener la ubicación: ' + error.message)
            },
            { enableHighAccuracy: true, timeout: 10000 }
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <ProtectedRoute allowedRoles={['superadmin', 'admin']}>
            <div className="p-6 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Configuración del Sistema</h1>
                    <p className="text-muted-foreground">
                        Administra la configuración general del negocio
                    </p>
                </div>

                <Tabs defaultValue="ubicacion" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="ubicacion" className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Ubicación
                        </TabsTrigger>
                        <TabsTrigger value="negocio" className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Negocio
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="ubicacion">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="h-5 w-5" />
                                    Configuración de Ubicación para Control de Tiempo
                                </CardTitle>
                                <CardDescription>
                                    Define la ubicación de tu negocio para verificar que los empleados 
                                    registren su entrada desde el lugar de trabajo
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Enable/Disable */}
                                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                                    <div className="space-y-1">
                                        <Label className="text-base font-medium">
                                            Requerir ubicación para registro de tiempo
                                        </Label>
                                        <p className="text-sm text-muted-foreground">
                                            Los empleados solo podrán registrar entrada si están en el área permitida
                                        </p>
                                    </div>
                                    <Switch 
                                        checked={settings.require_location_for_clock === 'true'}
                                        onCheckedChange={(checked: boolean) => 
                                            setSettings(prev => ({ 
                                                ...prev, 
                                                require_location_for_clock: String(checked) 
                                            }))
                                        }
                                    />
                                </div>

                                {/* Location Coordinates */}
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="latitude">Latitud</Label>
                                        <Input
                                            id="latitude"
                                            type="number"
                                            step="0.00000001"
                                            value={settings.business_latitude}
                                            onChange={(e) => setSettings(prev => ({ 
                                                ...prev, 
                                                business_latitude: e.target.value 
                                            }))}
                                            placeholder="Ej: 19.43260770"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="longitude">Longitud</Label>
                                        <Input
                                            id="longitude"
                                            type="number"
                                            step="0.00000001"
                                            value={settings.business_longitude}
                                            onChange={(e) => setSettings(prev => ({ 
                                                ...prev, 
                                                business_longitude: e.target.value 
                                            }))}
                                            placeholder="Ej: -99.13320800"
                                        />
                                    </div>
                                </div>

                                <Button 
                                    variant="outline" 
                                    onClick={getCurrentLocation}
                                    disabled={gettingLocation}
                                    className="w-full"
                                >
                                    {gettingLocation ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Navigation className="mr-2 h-4 w-4" />
                                    )}
                                    Usar mi ubicación actual
                                </Button>

                                {/* Radius */}
                                <div className="space-y-2">
                                    <Label htmlFor="radius">Radio permitido (metros)</Label>
                                    <Input
                                        id="radius"
                                        type="number"
                                        min="10"
                                        max="1000"
                                        value={settings.allowed_radius_meters}
                                        onChange={(e) => setSettings(prev => ({ 
                                            ...prev, 
                                            allowed_radius_meters: e.target.value 
                                        }))}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Los empleados podrán registrar si están dentro de este radio de la ubicación del negocio.
                                        Se recomienda entre 50 y 200 metros para dar margen al GPS.
                                    </p>
                                </div>

                                {/* Status Preview */}
                                {settings.business_latitude && settings.business_longitude && (
                                    <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/30 flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-green-700">Ubicación configurada</p>
                                            <p className="text-sm text-muted-foreground">
                                                Lat: {settings.business_latitude}, Lng: {settings.business_longitude}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Radio: {settings.allowed_radius_meters} metros
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {(!settings.business_latitude || !settings.business_longitude) && settings.require_location_for_clock === 'true' && (
                                    <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/30 flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-yellow-700">Sin ubicación configurada</p>
                                            <p className="text-sm text-muted-foreground">
                                                La verificación de ubicación está activada pero no has configurado las coordenadas.
                                                Los empleados no podrán registrar su tiempo.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="negocio">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5" />
                                    Información del Negocio
                                </CardTitle>
                                <CardDescription>
                                    Datos generales de la empresa
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="business_name">Nombre del negocio</Label>
                                    <Input
                                        id="business_name"
                                        value={settings.business_name}
                                        onChange={(e) => setSettings(prev => ({ 
                                            ...prev, 
                                            business_name: e.target.value 
                                        }))}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Save Button */}
                <div className="flex justify-end">
                    <Button onClick={saveSettings} disabled={saving} size="lg">
                        {saving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        Guardar Configuración
                    </Button>
                </div>
            </div>
        </ProtectedRoute>
    )
}
