'use client'

import { useState } from 'react'
import { Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/utils/supabase/client'
import { Database } from '@/types/database.types'

type Product = Database['public']['Tables']['products']['Row']

interface ShrinkageDialogProps {
    products: Product[]
    onShrinkageRecorded: () => void
}

export function ShrinkageDialog({ products, onShrinkageRecorded }: ShrinkageDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selectedProductId, setSelectedProductId] = useState('')
    const [quantity, setQuantity] = useState('')
    const [reason, setReason] = useState('')

    async function handleSubmit() {
        if (!selectedProductId || !quantity) return

        setLoading(true)
        try {
            const product = products.find(p => p.id === selectedProductId)
            if (!product) return

            const stemsToRemove = parseInt(quantity)
            const newStock = Math.max(0, (product.stock || 0) - stemsToRemove)

            const { error } = await (supabase
                .from('products') as any)
                .update({ stock: newStock })
                .eq('id', selectedProductId)

            if (error) throw error

            // Optionally record the shrinkage in transactions as an expense
            await (supabase.from('transactions') as any).insert({
                description: `Merma: ${product.name} - ${stemsToRemove} tallos${reason ? ` (${reason})` : ''}`,
                amount: stemsToRemove * (product.cost || 0),
                type: 'expense',
                date: new Date().toISOString(),
            })

            alert(`Merma registrada: -${stemsToRemove} tallos`)
            onShrinkageRecorded()
            setOpen(false)
            setSelectedProductId('')
            setQuantity('')
            setReason('')
        } catch (error) {
            console.error('Error recording shrinkage:', error)
            alert('Error al registrar merma')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Minus className="mr-2 h-4 w-4" />
                    Registrar Merma
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Registrar Merma de Inventario</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Producto</Label>
                        <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un producto" />
                            </SelectTrigger>
                            <SelectContent>
                                {products.map(product => (
                                    <SelectItem key={product.id} value={product.id}>
                                        {product.name} (Stock actual: {product.stock || 0} tallos)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Cantidad de tallos a descontar</Label>
                        <Input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder="Número de tallos"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Motivo (opcional)</Label>
                        <Textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Ej: Flores marchitas, daño en transporte, etc."
                            rows={3}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || !selectedProductId || !quantity}
                        variant="destructive"
                    >
                        {loading ? 'Registrando...' : 'Registrar Merma'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
