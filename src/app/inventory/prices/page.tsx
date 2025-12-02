'use client'

import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { supabase } from '@/utils/supabase/client'
import { Database } from '@/types/database.types'

type Product = Database['public']['Tables']['products']['Row']
type PriceHistory = Database['public']['Tables']['product_price_history']['Row']

export default function PriceManagementPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([])
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [editingPrice, setEditingPrice] = useState<{ [key: string]: string }>({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchProducts()
    }, [])

    async function fetchProducts() {
        setLoading(true)
        const { data } = await supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .order('name')

        if (data) setProducts(data)
        setLoading(false)
    }

    async function fetchPriceHistory(productId: string) {
        const { data } = await supabase
            .from('product_price_history')
            .select('*')
            .eq('product_id', productId)
            .order('recorded_at', { ascending: false })

        if (data) setPriceHistory(data)
    }

    async function handlePriceUpdate(product: Product) {
        const newPrice = parseFloat(editingPrice[product.id] || product.price.toString())

        if (newPrice === product.price) return

        try {
            // Record price history
            await (supabase
                .from('product_price_history') as any)
                .insert({
                    product_id: product.id,
                    price: newPrice,
                    cost: product.cost,
                    recorded_at: new Date().toISOString()
                })

            // Update product price
            await (supabase
                .from('products') as any)
                .update({ price: newPrice })
                .eq('id', product.id)

            alert('Precio actualizado exitosamente')
            fetchProducts()
            setEditingPrice(prev => {
                const newState = { ...prev }
                delete newState[product.id]
                return newState
            })
        } catch (error) {
            console.error('Error updating price:', error)
            alert('Error al actualizar el precio')
        }
    }

    function handleViewHistory(product: Product) {
        setSelectedProduct(product)
        fetchPriceHistory(product.id)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-lg">Cargando productos...</div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <DollarSign className="h-8 w-8" />
                        Gestión de Precios
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Actualiza precios y visualiza el historial
                    </p>
                </div>
            </div>

            <Tabs defaultValue="products" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="products">Lista de Productos</TabsTrigger>
                    <TabsTrigger value="history">Historial de Precios</TabsTrigger>
                </TabsList>

                <TabsContent value="products">
                    <Card>
                        <CardHeader>
                            <CardTitle>Productos y Precios</CardTitle>
                            <CardDescription>
                                Haz clic en el precio para editarlo. Los cambios se guardan en el historial.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Producto</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Stock</TableHead>
                                        <TableHead>Precio Actual</TableHead>
                                        <TableHead>Nuevo Precio</TableHead>
                                        <TableHead>Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {products.map(product => (
                                        <TableRow key={product.id}>
                                            <TableCell className="font-medium">{product.name}</TableCell>
                                            <TableCell>
                                                <span className="capitalize">{product.type}</span>
                                            </TableCell>
                                            <TableCell>
                                                {product.stock !== null ? `${product.stock} tallos` : 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-semibold">S/ {product.price.toFixed(2)}</span>
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder={product.price.toFixed(2)}
                                                    value={editingPrice[product.id] || ''}
                                                    onChange={(e) => setEditingPrice(prev => ({
                                                        ...prev,
                                                        [product.id]: e.target.value
                                                    }))}
                                                    className="w-24"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handlePriceUpdate(product)}
                                                        disabled={!editingPrice[product.id]}
                                                    >
                                                        Actualizar
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleViewHistory(product)}
                                                    >
                                                        <History className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>Historial de Cambios de Precio</CardTitle>
                            <CardDescription>
                                Selecciona un producto de la lista para ver su historial
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {selectedProduct ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                                        <TrendingUp className="h-5 w-5" />
                                        <div>
                                            <h3 className="font-semibold">{selectedProduct.name}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Precio actual: S/ {selectedProduct.price.toFixed(2)}
                                            </p>
                                        </div>
                                    </div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Fecha</TableHead>
                                                <TableHead>Precio</TableHead>
                                                <TableHead>Costo</TableHead>
                                                <TableHead>Margen</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {priceHistory.map(record => {
                                                const margin = record.cost
                                                    ? ((record.price - record.cost) / record.price * 100).toFixed(1)
                                                    : 'N/A'
                                                return (
                                                    <TableRow key={record.id}>
                                                        <TableCell>
                                                            {new Date(record.recorded_at).toLocaleString('es-PE')}
                                                        </TableCell>
                                                        <TableCell className="font-semibold">
                                                            S/ {record.price.toFixed(2)}
                                                        </TableCell>
                                                        <TableCell>
                                                            {record.cost ? `S/ ${record.cost.toFixed(2)}` : 'N/A'}
                                                        </TableCell>
                                                        <TableCell>
                                                            {margin !== 'N/A' ? `${margin}%` : 'N/A'}
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                            {priceHistory.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                                                        No hay historial de precios para este producto
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="text-center text-muted-foreground py-8">
                                    Selecciona un producto de la pestaña "Lista de Productos" para ver su historial
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Price History Dialog */}
            <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Historial de Precios - {selectedProduct?.name}</DialogTitle>
                        <DialogDescription>
                            Evolución de precios a lo largo del tiempo
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Precio</TableHead>
                                    <TableHead>Costo</TableHead>
                                    <TableHead>Margen</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {priceHistory.map(record => {
                                    const margin = record.cost
                                        ? ((record.price - record.cost) / record.price * 100).toFixed(1)
                                        : 'N/A'
                                    return (
                                        <TableRow key={record.id}>
                                            <TableCell>
                                                {new Date(record.recorded_at).toLocaleString('es-PE')}
                                            </TableCell>
                                            <TableCell className="font-semibold">
                                                S/ {record.price.toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                {record.cost ? `S/ ${record.cost.toFixed(2)}` : 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                {margin !== 'N/A' ? `${margin}%` : 'N/A'}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
