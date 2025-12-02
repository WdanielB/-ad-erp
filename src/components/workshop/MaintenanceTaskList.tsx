'use client'

import { useState, useEffect } from 'react'
import { Check, Droplets, Scissors, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/utils/supabase/client'
import { Database } from '@/types/database.types'
import { differenceInDays, parseISO } from 'date-fns'

type BatchWithProduct = Database['public']['Tables']['inventory_batches']['Row'] & {
    products: Database['public']['Tables']['products']['Row'] | null
}

export function MaintenanceTaskList() {
    const [tasks, setTasks] = useState<{
        water: BatchWithProduct[]
        cut: BatchWithProduct[]
    }>({ water: [], cut: [] })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchTasks()
    }, [])

    async function fetchTasks() {
        const { data } = await supabase
            .from('inventory_batches')
            .select('*, products(*)')
            .eq('status', 'active')
            .returns<BatchWithProduct[]>()

        if (data) {
            const waterTasks: BatchWithProduct[] = []
            const cutTasks: BatchWithProduct[] = []
            const now = new Date()

            data.forEach(batch => {
                if (!batch.products || batch.products.type !== 'flower') return

                const waterDays = batch.products.care_days_water || 2
                const cutDays = batch.products.care_days_cut || 3

                const lastWater = batch.last_water_change ? parseISO(batch.last_water_change) : parseISO(batch.entry_date || now.toISOString())
                const lastCut = batch.last_stem_cut ? parseISO(batch.last_stem_cut) : parseISO(batch.entry_date || now.toISOString())

                if (differenceInDays(now, lastWater) >= waterDays) {
                    waterTasks.push(batch)
                }

                if (differenceInDays(now, lastCut) >= cutDays) {
                    cutTasks.push(batch)
                }
            })

            setTasks({ water: waterTasks, cut: cutTasks })
        }
        setLoading(false)
    }

    async function completeTask(batchId: string, type: 'water' | 'cut') {
        const updates: any = {}
        const now = new Date().toISOString()

        if (type === 'water') updates.last_water_change = now
        if (type === 'cut') updates.last_stem_cut = now

        await (supabase.from('inventory_batches') as any)
            .update(updates)
            .eq('id', batchId)

        fetchTasks()
    }

    if (loading) return <div>Cargando tareas...</div>

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Droplets className="h-5 w-5 text-blue-500" />
                        Cambio de Agua
                        <Badge variant="secondary" className="ml-auto">
                            {tasks.water.length}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {tasks.water.length === 0 && (
                        <div className="text-center text-muted-foreground py-4">
                            Todo al día.
                        </div>
                    )}
                    {tasks.water.map(batch => (
                        <div key={batch.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-muted rounded-md overflow-hidden flex items-center justify-center">
                                    {batch.products?.image_url ? (
                                        <img src={batch.products.image_url} alt={batch.products.name} className="object-cover w-full h-full" />
                                    ) : (
                                        <span className="text-lg">🌸</span>
                                    )}
                                </div>
                                <div>
                                    <div className="font-medium">{batch.products?.name}</div>
                                    <div className="text-sm text-muted-foreground">Lote: {batch.bucket_code}</div>
                                </div>
                            </div>
                            <Button size="sm" onClick={() => completeTask(batch.id, 'water')}>
                                <Check className="h-4 w-4 mr-1" /> Listo
                            </Button>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Scissors className="h-5 w-5 text-orange-500" />
                        Corte de Tallo
                        <Badge variant="secondary" className="ml-auto">
                            {tasks.cut.length}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {tasks.cut.length === 0 && (
                        <div className="text-center text-muted-foreground py-4">
                            Todo al día.
                        </div>
                    )}
                    {tasks.cut.map(batch => (
                        <div key={batch.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-muted rounded-md overflow-hidden flex items-center justify-center">
                                    {batch.products?.image_url ? (
                                        <img src={batch.products.image_url} alt={batch.products.name} className="object-cover w-full h-full" />
                                    ) : (
                                        <span className="text-lg">🌸</span>
                                    )}
                                </div>
                                <div>
                                    <div className="font-medium">{batch.products?.name}</div>
                                    <div className="text-sm text-muted-foreground">Lote: {batch.bucket_code}</div>
                                </div>
                            </div>
                            <Button size="sm" onClick={() => completeTask(batch.id, 'cut')}>
                                <Check className="h-4 w-4 mr-1" /> Listo
                            </Button>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    )
}
