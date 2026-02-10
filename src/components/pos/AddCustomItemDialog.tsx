'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { supabase } from '@/utils/supabase/client'
import { Database } from '@/types/database.types'

type Product = Database['public']['Tables']['products']['Row']

interface AddCustomItemDialogProps {
    onAddCustomItem: (name: string, price: number, flowerItems: Array<{ productId: string; quantity: number }>) => void
}

export function AddCustomItemDialog({ onAddCustomItem }: AddCustomItemDialogProps) {
    const [open, setOpen] = useState(false)
    const [itemName, setItemName] = useState('')
    const [itemPrice, setItemPrice] = useState('')
    const [flowers, setFlowers] = useState<Product[]>([])
    const [flowerQuantities, setFlowerQuantities] = useState<Record<string, number>>({})

    useEffect(() => {
        async function fetchFlowers() {
            const { data } = await supabase
                .from('products')
                .select('*')
                .eq('type', 'flower')
                .eq('is_active', true)
                .order('name')

            if (data) setFlowers(data)
        }

        if (open) {
            fetchFlowers()
        }
    }, [open])

    function updateFlowerQuantity(flowerId: string, value: string) {
        const qty = Math.max(0, parseInt(value) || 0)
        setFlowerQuantities(prev => ({ ...prev, [flowerId]: qty }))
    }

    function handleAdd() {
        if (!itemName || !itemPrice) return

        const flowerItems = Object.entries(flowerQuantities)
            .filter(([, qty]) => qty > 0)
            .map(([productId, quantity]) => ({ productId, quantity }))

        onAddCustomItem(itemName, parseFloat(itemPrice), flowerItems)
        setItemName('')
        setItemPrice('')
        setFlowerQuantities({})
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar Producto Temporal
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Agregar Producto Temporal</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Nombre del Producto</Label>
                        <Input
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                            placeholder="Ej: Arreglo especial"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Precio (S/)</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={itemPrice}
                            onChange={(e) => setItemPrice(e.target.value)}
                            placeholder="0.00"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Flores principales y unidades (opcional)</Label>
                        <p className="text-xs text-muted-foreground mb-2">
                            Asigna cantidades por flor para análisis de inventario
                        </p>
                        <ScrollArea className="h-56 rounded-md border p-3">
                            <div className="space-y-2">
                                {flowers.map((flower) => (
                                    <div key={flower.id} className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            {flower.flower_color_hex && (
                                                <span
                                                    className="w-3 h-3 rounded-full inline-block border"
                                                    style={{ backgroundColor: flower.flower_color_hex }}
                                                />
                                            )}
                                            <span className="text-sm font-medium truncate">{flower.name}</span>
                                        </div>
                                        <Input
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            value={flowerQuantities[flower.id] ?? ''}
                                            onChange={(e) => updateFlowerQuantity(flower.id, e.target.value)}
                                            className="h-8 w-20"
                                        />
                                    </div>
                                ))}
                                {flowers.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No hay flores disponibles
                                    </p>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleAdd} disabled={!itemName || !itemPrice}>
                        Agregar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
