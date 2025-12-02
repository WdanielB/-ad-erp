'use client'

import { useState, useEffect } from 'react'
import { Search, ShoppingCart } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/utils/supabase/client'
import { Database } from '@/types/database.types'

type Product = Database['public']['Tables']['products']['Row']

interface ProductBrowserProps {
    onAddToCart: (product: Product) => void
}

export function ProductBrowser({ onAddToCart }: ProductBrowserProps) {
    const [products, setProducts] = useState<Product[]>([])
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchProducts()
    }, [])

    useEffect(() => {
        if (!search) {
            setFilteredProducts(products)
        } else {
            const lowerSearch = search.toLowerCase()
            setFilteredProducts(
                products.filter(p =>
                    p.name.toLowerCase().includes(lowerSearch) ||
                    p.sku?.toLowerCase().includes(lowerSearch)
                )
            )
        }
    }, [search, products])

    async function fetchProducts() {
        const { data } = await supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .order('name')

        if (data) {
            setProducts(data)
            setFilteredProducts(data)
        }
        setLoading(false)
    }

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar productos..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8"
                />
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Cargando productos...</div>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredProducts.map((product) => (
                            <Card key={product.id} className="flex flex-col justify-between cursor-pointer hover:border-primary transition-colors" onClick={() => onAddToCart(product)}>
                                <CardHeader className="p-4 pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-sm font-medium leading-tight line-clamp-2">
                                            {product.name}
                                        </CardTitle>
                                        {product.type === 'flower' && (
                                            <div
                                                className="w-3 h-3 rounded-full border shrink-0 ml-1"
                                                style={{ backgroundColor: product.flower_color_hex || '#ccc' }}
                                                title={product.flower_color_name || 'Color'}
                                            />
                                        )}
                                    </div>
                                    {product.sku && <div className="text-xs text-muted-foreground">{product.sku}</div>}
                                </CardHeader>
                                <CardContent className="p-4 pt-0 pb-2">
                                    <div className="text-lg font-bold">S/ {product.price.toFixed(2)}</div>
                                    {product.stock !== null && (
                                        <div className={`text-xs ${product.stock <= 5 ? 'text-red-500' : 'text-muted-foreground'}`}>
                                            Stock: {product.stock}
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="p-2">
                                    <Button size="sm" className="w-full" variant="secondary">
                                        <ShoppingCart className="mr-2 h-3 w-3" /> Agregar
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                        {filteredProducts.length === 0 && (
                            <div className="col-span-full text-center py-8 text-muted-foreground">
                                No se encontraron productos.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
