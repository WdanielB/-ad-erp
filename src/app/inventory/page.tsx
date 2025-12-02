'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AddStockDialog } from '@/components/inventory/AddStockDialog'
import { ShrinkageDialog } from '@/components/inventory/ShrinkageDialog'
import { ProductDialog } from '@/components/inventory/ProductDialog'
import { supabase } from '@/utils/supabase/client'
import { Database } from '@/types/database.types'

type Product = Database['public']['Tables']['products']['Row']

export default function InventoryPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
    const [productToDelete, setProductToDelete] = useState<Product | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [processingId, setProcessingId] = useState<string | null>(null)

    async function fetchProducts() {
        setLoading(true)
        const { data } = await supabase
            .from('products')
            .select('*')
            .order('created_at', { ascending: false })

        if (data) setProducts(data)
        setLoading(false)
    }

    async function handleDeleteProduct() {
        if (!productToDelete) return
        setProcessingId(productToDelete.id)

        try {
            // Check for dependencies (optional but recommended)
            // For now, we'll just try to delete and catch error if FK constraint fails
            const { error } = await (supabase
                .from('products') as any)
                .delete()
                .eq('id', productToDelete.id)

            if (error) throw error

            setProductToDelete(null)
            await fetchProducts()
        } catch (error: any) {
            console.error('Error deleting product:', error)
            alert('No se puede eliminar el producto porque tiene registros asociados (ventas, recetas, etc). Intenta desactivarlo en su lugar.')
        } finally {
            setProcessingId(null)
        }
    }

    useEffect(() => {
        fetchProducts()
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Inventario</h1>
                <div className="flex gap-2">
                    <AddStockDialog products={products} onStockAdded={fetchProducts} />
                    <ShrinkageDialog products={products} onShrinkageRecorded={fetchProducts} />
                    <Link href="/inventory/batches">
                        <Button variant="outline">Gestión de Lotes</Button>
                    </Link>
                    <Link href="/inventory/prices">
                        <Button variant="outline">Gestión de Precios</Button>
                    </Link>
                    <Button onClick={() => {
                        setSelectedProduct(null)
                        setIsDialogOpen(true)
                    }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Producto
                    </Button>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>SKU</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Precio</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products?.map((product) => (
                            <TableRow key={product.id}>
                                <TableCell className="font-medium">
                                    <div className="flex flex-col">
                                        <span>{product.name}</span>
                                        {product.type === 'flower' && (
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <span
                                                    className="w-2 h-2 rounded-full inline-block"
                                                    style={{ backgroundColor: product.flower_color_hex || 'transparent' }}
                                                />
                                                {product.flower_color_name}
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>{product.sku || '-'}</TableCell>
                                <TableCell>
                                    <Badge variant="outline" className="capitalize">
                                        {product.type === 'standard' ? 'Estándar' :
                                            product.type === 'flower' ? 'Flor' : 'Compuesto'}
                                    </Badge>
                                </TableCell>
                                <TableCell>S/ {product.price.toFixed(2)}</TableCell>
                                <TableCell>
                                    {product.type === 'composite' ? '-' : `${product.stock || 0} tallos`}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={product.is_active ? 'default' : 'secondary'}>
                                        {product.is_active ? 'Activo' : 'Inactivo'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                setSelectedProduct(product)
                                                setIsDialogOpen(true)
                                            }}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive hover:text-destructive"
                                            onClick={() => setProductToDelete(product)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!products?.length && (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    No hay productos registrados.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <ProductDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                productToEdit={selectedProduct}
                onProductSaved={fetchProducts}
            />

            <AlertDialog open={!!productToDelete} onOpenChange={(open) => !open && setProductToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar Producto?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Si el producto tiene ventas asociadas, no se podrá eliminar.
                            En ese caso, se recomienda desactivarlo.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteProduct}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={!!processingId}
                        >
                            {processingId ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Eliminar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
