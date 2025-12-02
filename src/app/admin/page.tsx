'use client'

import { useState, useEffect } from 'react'
import { Save, Settings as SettingsIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { supabase } from '@/utils/supabase/client'

type Setting = {
    id: string
    key: string
    value: string | null
    description: string | null
    category: string | null
    updated_at: string
}

export default function AdminPage() {
    const [settings, setSettings] = useState<Setting[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchSettings()
    }, [])

    async function fetchSettings() {
        setLoading(true)
        const { data } = await supabase
            .from('settings')
            .select('*')
            .order('category', { ascending: true })

        if (data) setSettings(data as Setting[])
        setLoading(false)
    }

    async function handleSave() {
        setSaving(true)
        try {
            for (const setting of settings) {
                await (supabase
                    .from('settings') as any)
                    .update({
                        value: setting.value,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', setting.id)
            }
            alert('Configuraciones guardadas exitosamente')
        } catch (error) {
            console.error('Error saving settings:', error)
            alert('Error al guardar configuraciones')
        } finally {
            setSaving(false)
        }
    }

    function updateSetting(id: string, value: string) {
        setSettings(prev => prev.map(s =>
            s.id === id ? { ...s, value } : s
        ))
    }

    function getSettingsByCategory(category: string) {
        return settings.filter(s => s.category === category)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-lg">Cargando configuraciones...</div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <SettingsIcon className="h-8 w-8" />
                        Panel de Administración
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Configura tu sistema sin código
                    </p>
                </div>
                <Button onClick={handleSave} disabled={saving}>
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
            </div>

            <Tabs defaultValue="general" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="pricing">Precios</TabsTrigger>
                    <TabsTrigger value="schedule">Horarios</TabsTrigger>
                    <TabsTrigger value="delivery">Delivery</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Información del Negocio</CardTitle>
                            <CardDescription>
                                Configura los datos básicos de tu negocio
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {getSettingsByCategory('general').map(setting => (
                                <div key={setting.id} className="space-y-2">
                                    <Label>{setting.description}</Label>
                                    <Input
                                        value={setting.value || ''}
                                        onChange={(e) => updateSetting(setting.id, e.target.value)}
                                        placeholder={setting.description || ''}
                                    />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="pricing" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuración de Precios</CardTitle>
                            <CardDescription>
                                Ajusta los precios y tarifas del sistema
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {getSettingsByCategory('pricing').map(setting => (
                                <div key={setting.id} className="space-y-2">
                                    <Label>{setting.description}</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={setting.value || ''}
                                        onChange={(e) => updateSetting(setting.id, e.target.value)}
                                        placeholder={setting.description || ''}
                                    />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="schedule" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Horarios de Atención</CardTitle>
                            <CardDescription>
                                Define los horarios de operación
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {getSettingsByCategory('schedule').map(setting => (
                                <div key={setting.id} className="space-y-2">
                                    <Label>{setting.description}</Label>
                                    <Input
                                        type="time"
                                        value={setting.value || ''}
                                        onChange={(e) => updateSetting(setting.id, e.target.value)}
                                    />
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="delivery" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuración de Delivery</CardTitle>
                            <CardDescription>
                                Ajusta los parámetros de entrega
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {getSettingsByCategory('delivery').map(setting => (
                                <div key={setting.id} className="space-y-2">
                                    <Label>{setting.description}</Label>
                                    <Input
                                        value={setting.value || ''}
                                        onChange={(e) => updateSetting(setting.id, e.target.value)}
                                        placeholder={setting.description || ''}
                                    />
                                    {setting.key === 'delivery_time_range' && (
                                        <p className="text-xs text-muted-foreground">
                                            Formato: min-max (ejemplo: 30-50)
                                        </p>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Card className="bg-muted/50">
                <CardHeader>
                    <CardTitle className="text-sm">Información</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Los cambios se aplicarán inmediatamente en todo el sistema después de guardar.
                        Asegúrate de verificar que los valores sean correctos antes de guardar.
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
