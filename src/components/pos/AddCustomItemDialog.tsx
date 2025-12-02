'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
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
    onAddCustomItem: (name: string, price: number, flowerIds: string[]) => void
}

export function AddCustomItemDialog({ onAddCustomItem }: AddCustomItemDialogProps) {
    const [open, setOpen] = useState(false)
    const [itemName, setItemName] = useState('')
    const [itemPrice, setItemPrice] = useState('')
    const [flowers, setFlowers] = useState<Product[]>([])
    const [selectedFlowers, setSelectedFlowers] = useState<string[]>([])

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

    function handleFlowerToggle(flowerId: string) {
        setSelectedFlowers(prev =>
            prev.includes(flowerId)
                ? prev.filter(id => id !== flowerId)
                : [...prev, flowerId]
        )
    }

    function handleAdd() {
        if (!itemName || !itemPrice) return

        onAddCustomItem(itemName, parseFloat(itemPrice), selectedFlowers)
        setItemName('')
        setItemPrice('')
        setSelectedFlowers([])
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
                        <Label>Flores que incluye (opcional)</Label>
                        <p className="text-xs text-muted-foreground mb-2">
                            Selecciona las flores para análisis de ventas
                        </p>
                        <ScrollArea className="h-48 rounded-md border p-3">
                            <div className="space-y-2">
                                {flowers.map((flower) => (
                                    <div key={flower.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={flower.id}
                                            checked={selectedFlowers.includes(flower.id)}
                                            onCheckedChange={() => handleFlowerToggle(flower.id)}
                                        />
                                        <label
                                            htmlFor={flower.id}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                                        >
                                            {flower.flower_color_hex && (
                                                <span
                                                    className="w-3 h-3 rounded-full inline-block border"
                                                    style={{ backgroundColor: flower.flower_color_hex }}
                                                />
                                            )}
                                            {flower.name}
                                        </label>
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
