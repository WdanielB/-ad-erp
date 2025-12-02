'use client'

import { useState, useEffect } from 'react'
import { Search, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { supabase } from '@/utils/supabase/client'
import { Database } from '@/types/database.types'

type Product = Database['public']['Tables']['products']['Row']

interface VisualBatchCreatorProps {
    onBatchCreated: () => void
}

export function VisualBatchCreator({ onBatchCreated }: VisualBatchCreatorProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [products, setProducts] = useState<Product[]>([])
    const [search, setSearch] = useState('')
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [bucketCode, setBucketCode] = useState('')
    const [quantity, setQuantity] = useState('')

    useEffect(() => {
        if (open) {
            fetchProducts()
        }
    }, [open])

    async function fetchProducts() {
        const { data } = await supabase
            .from('products')
            .select('*')
            .eq('type', 'flower') // Only flowers go into buckets usually
            .eq('is_active', true)
            .order('name')

        if (data) setProducts(data)
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    )

    async function handleSubmit() {
        if (!selectedProduct || !bucketCode || !quantity) return

        setLoading(true)
        try {
            const { error } = await (supabase
                .from('inventory_batches') as any)
                .insert({
                    product_id: selectedProduct.id,
                    bucket_code: bucketCode,
                    initial_quantity: parseInt(quantity),
                    current_quantity: parseInt(quantity),
                    status: 'active',
                    entry_date: new Date().toISOString(),
                })

            if (error) throw error

            onBatchCreated()
            setOpen(false)
            setSelectedProduct(null)
            setBucketCode('')
            setQuantity('')
            setSearch('')
        } catch (error) {
            console.error('Error creating batch:', error)
            alert('Error al crear el balde')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Balde
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Balde</DialogTitle>
                </DialogHeader>

                <div className="flex gap-6 flex-1 min-h-0 py-4">
                    {/* Left: Product Selection */}
                    <div className="flex-1 flex flex-col gap-4 border-r pr-6">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar flor..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="grid grid-cols-2 gap-3">
                                {filteredProducts.map(product => (
                                    <div
                                        key={product.id}
                                        className={`cursor-pointer border rounded-lg p-2 hover:bg-muted transition-colors ${selectedProduct?.id === product.id ? 'ring-2 ring-primary border-primary' : ''}`}
                                        onClick={() => setSelectedProduct(product)}
                                    >
                                        <div className="aspect-square bg-muted rounded-md mb-2 overflow-hidden flex items-center justify-center">
                                            {product.image_url ? (
                                                <img src={product.image_url} alt={product.name} className="object-cover w-full h-full" />
                                            ) : (
                                                <span className="text-2xl">🌸</span>
                                            )}
                                        </div>
                                        <div className="text-sm font-medium truncate">{product.name}</div>
                                        {product.flower_color_hex && (
                                            <div
                                                className="w-4 h-4 rounded-full mt-1 border"
                                                style={{ backgroundColor: product.flower_color_hex }}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Right: Batch Details */}
                    <div className="w-1/3 flex flex-col gap-6">
                        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 text-center bg-muted/10">
                            {selectedProduct ? (
                                <>
                                    <div className="w-32 h-32 bg-muted rounded-full overflow-hidden mb-4 flex items-center justify-center shadow-lg">
                                        {selectedProduct.image_url ? (
                                            <img src={selectedProduct.image_url} alt={selectedProduct.name} className="object-cover w-full h-full" />
                                        ) : (
                                            <span className="text-4xl">🌸</span>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-xl">{selectedProduct.name}</h3>
                                    <p className="text-muted-foreground text-sm">{selectedProduct.sku || 'Sin SKU'}</p>
                                </>
                            ) : (
                                <div className="text-muted-foreground">
                                    Selecciona una flor para ver la vista previa del balde
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Código del Balde</Label>
                                <Input
                                    value={bucketCode}
                                    onChange={(e) => setBucketCode(e.target.value)}
                                    placeholder="Ej: B-001"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Cantidad (Tallos)</Label>
                                <Input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={loading || !selectedProduct || !bucketCode || !quantity}>
                        {loading ? 'Creando...' : 'Crear Balde'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
