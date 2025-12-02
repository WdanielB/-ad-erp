'use client'

import { useState, useEffect } from 'react'
import { format, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/utils/supabase/client'
import { Droplets, Scissors, Trash2, Plus } from 'lucide-react'
import { Database } from '@/types/database.types'

type Batch = {
    id: string
    bucket_code: string
    product: { name: string, flower_color_hex: string }
    current_quantity: number
    entry_date: string
    last_water_change: string
    last_stem_cut: string
    status: 'active' | 'empty' | 'discarded'
}

export function BatchList() {
    const [batches, setBatches] = useState<Batch[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchBatches()
    }, [])

    async function fetchBatches() {
        const { data, error } = await supabase
            .from('inventory_batches')
            .select(`
        *,
        product:products(name, flower_color_hex)
      `)
            .eq('status', 'active')
            .order('entry_date', { ascending: true })

        if (data) setBatches(data as any)
        setLoading(false)
    }

    async function updateBatchAction(id: string, action: 'water' | 'cut' | 'discard') {
        const updates: Database['public']['Tables']['inventory_batches']['Update'] = {}
        const now = new Date().toISOString()

        if (action === 'water') updates.last_water_change = now
        if (action === 'cut') updates.last_stem_cut = now
        if (action === 'discard') updates.status = 'discarded'

        await (supabase.from('inventory_batches') as any).update(updates).eq('id', id)
        fetchBatches()
    }

    if (loading) return <div>Cargando lotes...</div>

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Lotes Activos (Baldes)</h2>
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Lote
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Producto</TableHead>
                            <TableHead>Cantidad</TableHead>
                            <TableHead>Ingreso</TableHead>
                            <TableHead>Estado Mantenimiento</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {batches.map((batch) => {
                            const daysSinceWater = differenceInDays(new Date(), new Date(batch.last_water_change))
                            const daysSinceCut = differenceInDays(new Date(), new Date(batch.last_stem_cut))

                            return (
                                <TableRow key={batch.id}>
                                    <TableCell className="font-medium">{batch.bucket_code}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded-full border"
                                                style={{ backgroundColor: batch.product.flower_color_hex || '#ccc' }}
                                            />
                                            {batch.product.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>{batch.current_quantity} tallos</TableCell>
                                    <TableCell>{format(new Date(batch.entry_date), 'dd MMM', { locale: es })}</TableCell>
                                    <TableCell>
                                        <div className="flex gap-2">
                                            <Badge variant={daysSinceWater > 2 ? "destructive" : "secondary"}>
                                                Agua: {daysSinceWater}d
                                            </Badge>
                                            <Badge variant={daysSinceCut > 3 ? "destructive" : "secondary"}>
                                                Corte: {daysSinceCut}d
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                title="Cambiar Agua"
                                                onClick={() => updateBatchAction(batch.id, 'water')}
                                            >
                                                <Droplets className="h-4 w-4 text-blue-500" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                title="Cortar Tallo"
                                                onClick={() => updateBatchAction(batch.id, 'cut')}
                                            >
                                                <Scissors className="h-4 w-4 text-orange-500" />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                title="Descartar"
                                                onClick={() => updateBatchAction(batch.id, 'discard')}
                                            >
                                                <Trash2 className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                        {batches.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No hay lotes activos. Registra una entrada de flores.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
