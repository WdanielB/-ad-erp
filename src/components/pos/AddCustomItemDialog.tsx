'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
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
type FlowerColor = Database['public']['Tables']['flower_colors']['Row']

interface FlowerColorItem {
    colorId: string
    quantity: number
}

interface AddCustomItemDialogProps {
    onAddCustomItem: (name: string, price: number, flowerItems: Array<{ productId: string; colorItems: FlowerColorItem[] }>) => void
}

export function AddCustomItemDialog({ onAddCustomItem }: AddCustomItemDialogProps) {
    const [open, setOpen] = useState(false)
    const [itemName, setItemName] = useState('')
    const [itemPrice, setItemPrice] = useState('')
    const [flowers, setFlowers] = useState<Product[]>([])
    const [availableColors, setAvailableColors] = useState<FlowerColor[]>([])
    const [defaultColorIdsByProduct, setDefaultColorIdsByProduct] = useState<Record<string, string[]>>({})
    const [flowerColorSelections, setFlowerColorSelections] = useState<Record<string, FlowerColorItem[]>>({})
    const [newColorName, setNewColorName] = useState('')
    const [newColorHex, setNewColorHex] = useState('#ef4444')

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

        async function fetchColors() {
            const { data: colorData } = await supabase
                .from('flower_colors')
                .select('*')
                .order('name')

            const { data: defaultData } = await supabase
                .from('product_flower_colors')
                .select('product_id, color_id')

            const defaults: Record<string, string[]> = {}
            ;(defaultData ?? []).forEach((row: any) => {
                if (!row.product_id || !row.color_id) return
                defaults[row.product_id] = defaults[row.product_id] || []
                defaults[row.product_id].push(row.color_id)
            })

            setAvailableColors((colorData ?? []) as FlowerColor[])
            setDefaultColorIdsByProduct(defaults)
        }

        if (open) {
            fetchFlowers()
            fetchColors()
            setFlowerColorSelections({})
        }
    }, [open])

    function addFlowerColor(flowerId: string) {
        const current = flowerColorSelections[flowerId] || []
        const usedIds = new Set(current.map(ci => ci.colorId))
        const defaultIds = defaultColorIdsByProduct[flowerId] || []
        const nextDefault = defaultIds.find(id => !usedIds.has(id))
        const nextAny = availableColors.find(c => !usedIds.has(c.id))?.id
        const nextColorId = nextDefault || nextAny
        if (!nextColorId) return

        setFlowerColorSelections(prev => ({
            ...prev,
            [flowerId]: [...current, { colorId: nextColorId, quantity: 1 }]
        }))
    }

    function updateFlowerColor(flowerId: string, index: number, patch: Partial<FlowerColorItem>) {
        setFlowerColorSelections(prev => {
            const current = [...(prev[flowerId] || [])]
            if (!current[index]) return prev
            current[index] = { ...current[index], ...patch }
            return { ...prev, [flowerId]: current }
        })
    }

    function removeFlowerColor(flowerId: string, index: number) {
        setFlowerColorSelections(prev => {
            const current = [...(prev[flowerId] || [])]
            current.splice(index, 1)
            return { ...prev, [flowerId]: current }
        })
    }

    async function handleCreateColor() {
        const trimmedName = newColorName.trim()
        const trimmedHex = newColorHex.trim()
        if (!trimmedName || !trimmedHex) return

        const { data, error } = await (supabase.from('flower_colors') as any)
            .insert({ name: trimmedName, hex: trimmedHex })
            .select()
            .single()

        if (error || !data) {
            console.error('Error creating color:', error)
            return
        }

        setAvailableColors(prev => [...prev, data as FlowerColor].sort((a, b) => a.name.localeCompare(b.name)))
        setNewColorName('')
    }

    function handleAdd() {
        if (!itemName || !itemPrice) return

        const flowerItems = Object.entries(flowerColorSelections)
            .map(([productId, colorItems]) => ({
                productId,
                colorItems: colorItems.filter(ci => ci.quantity > 0)
            }))
            .filter(entry => entry.colorItems.length > 0)

        onAddCustomItem(itemName, parseFloat(itemPrice), flowerItems)
        setItemName('')
        setItemPrice('')
        setFlowerColorSelections({})
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
                            Define colores y cantidades para que taller sepa la composicion exacta
                        </p>
                        <div className="rounded-md border p-3 space-y-2 bg-muted/20">
                            <Label>Crear color nuevo</Label>
                            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                                <Input
                                    type="color"
                                    className="w-14 h-10 p-1"
                                    value={newColorHex}
                                    onChange={(e) => setNewColorHex(e.target.value)}
                                />
                                <Input
                                    placeholder="Nombre del color"
                                    value={newColorName}
                                    onChange={(e) => setNewColorName(e.target.value)}
                                />
                                <Button type="button" variant="outline" onClick={handleCreateColor} disabled={!newColorName.trim()}>
                                    Crear
                                </Button>
                            </div>
                        </div>
                        <ScrollArea className="h-56 rounded-md border p-3">
                            <div className="space-y-2">
                                {flowers.map((flower) => (
                                    <div key={flower.id} className="space-y-2 border-b pb-3 last:border-b-0 last:pb-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2 min-w-0">
                                                {flower.flower_color_hex && (
                                                    <span
                                                        className="w-3 h-3 rounded-full inline-block border"
                                                        style={{ backgroundColor: flower.flower_color_hex }}
                                                    />
                                                )}
                                                <span className="text-sm font-medium truncate">{flower.name}</span>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => addFlowerColor(flower.id)}
                                                disabled={availableColors.length === 0}
                                            >
                                                Agregar color
                                            </Button>
                                        </div>
                                        {(flowerColorSelections[flower.id] || []).map((colorItem, index) => {
                                            const usedColorIds = new Set((flowerColorSelections[flower.id] || []).map(ci => ci.colorId))
                                            const defaultIds = new Set(defaultColorIdsByProduct[flower.id] || [])
                                            const options = availableColors
                                                .filter(color => color.id === colorItem.colorId || !usedColorIds.has(color.id))
                                                .sort((a, b) => {
                                                    const aDefault = defaultIds.has(a.id)
                                                    const bDefault = defaultIds.has(b.id)
                                                    if (aDefault !== bDefault) return aDefault ? -1 : 1
                                                    return a.name.localeCompare(b.name)
                                                })

                                            return (
                                                <div key={`${colorItem.colorId}-${index}`} className="flex items-center gap-2">
                                                    <Select
                                                        value={colorItem.colorId}
                                                        onValueChange={(value) => updateFlowerColor(flower.id, index, { colorId: value })}
                                                    >
                                                        <SelectTrigger className="h-8">
                                                            <SelectValue placeholder="Color" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {options.map(color => (
                                                                <SelectItem key={color.id} value={color.id}>
                                                                    <span className="flex items-center gap-2">
                                                                        <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: color.hex }} />
                                                                        {color.name}
                                                                    </span>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        placeholder="0"
                                                        value={colorItem.quantity}
                                                        onChange={(e) => updateFlowerColor(flower.id, index, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                                                        className="h-8 w-20"
                                                    />
                                                    <span className="text-xs text-muted-foreground">uds</span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive"
                                                        onClick={() => removeFlowerColor(flower.id, index)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            )
                                        })}
                                        {(flowerColorSelections[flower.id] || []).length === 0 && (
                                            <p className="text-xs text-muted-foreground">Sin colores seleccionados</p>
                                        )}
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
