'use client'

import { useState } from 'react'
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

interface AddStockDialogProps {
    products: Product[]
    onStockAdded: () => void
}

export function AddStockDialog({ products, onStockAdded }: AddStockDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [selectedProductId, setSelectedProductId] = useState('')
    const [quantity, setQuantity] = useState('')
    const [inputType, setInputType] = useState<'stems' | 'packages'>('packages')

    const selectedProduct = products.find(p => p.id === selectedProductId)

    async function handleSubmit() {
        if (!selectedProductId || !quantity) return

        setLoading(true)
        try {
            const product = products.find(p => p.id === selectedProductId)
            if (!product) return

            // Calculate stems to add
            const unitsPerPackage = product.units_per_package || 1
            const stemsToAdd = inputType === 'packages'
                ? parseInt(quantity) * unitsPerPackage
                : parseInt(quantity)

            const newStock = (product.stock || 0) + stemsToAdd

            const { error } = await (supabase
                .from('products') as any)
                .update({ stock: newStock })
                .eq('id', selectedProductId)

            if (error) throw error

            alert(`Stock actualizado: +${stemsToAdd} tallos`)
            onStockAdded()
            setOpen(false)
            setSelectedProductId('')
            setQuantity('')
            setInputType('packages')
        } catch (error) {
            console.error('Error adding stock:', error)
            alert('Error al añadir stock')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Añadir Stock
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Añadir Stock al Inventario</DialogTitle>
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
                        <Label>Tipo de entrada</Label>
                        <Select value={inputType} onValueChange={(v) => setInputType(v as 'stems' | 'packages')}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="packages">Paquetes</SelectItem>
                                <SelectItem value="stems">Tallos individuales</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Cantidad</Label>
                        <Input
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder={inputType === 'packages' ? 'Número de paquetes' : 'Número de tallos'}
                        />
                        {selectedProduct && inputType === 'packages' && quantity && (
                            <p className="text-sm text-muted-foreground">
                                = {parseInt(quantity) * (selectedProduct.units_per_package || 1)} tallos
                            </p>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={loading || !selectedProductId || !quantity}>
                        {loading ? 'Añadiendo...' : 'Añadir Stock'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
