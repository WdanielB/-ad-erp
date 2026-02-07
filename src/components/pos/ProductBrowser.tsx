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
    const [activeGroup, setActiveGroup] = useState<'composite' | 'flower' | 'standard'>('composite')

    useEffect(() => {
        fetchProducts()
    }, [])

    useEffect(() => {
        const groupFiltered = products.filter(p => p.type === activeGroup)
        if (!search) {
            setFilteredProducts(groupFiltered)
        } else {
            const lowerSearch = search.toLowerCase()
            setFilteredProducts(
                groupFiltered.filter(p =>
                    p.name.toLowerCase().includes(lowerSearch) ||
                    p.sku?.toLowerCase().includes(lowerSearch)
                )
            )
        }
    }, [search, products, activeGroup])

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

            <div className="flex flex-wrap gap-2">
                <Button
                    size="sm"
                    variant={activeGroup === 'composite' ? 'default' : 'outline'}
                    onClick={() => setActiveGroup('composite')}
                >
                    Composiciones (Ramos)
                </Button>
                <Button
                    size="sm"
                    variant={activeGroup === 'flower' ? 'default' : 'outline'}
                    onClick={() => setActiveGroup('flower')}
                >
                    Flores
                </Button>
                <Button
                    size="sm"
                    variant={activeGroup === 'standard' ? 'default' : 'outline'}
                    onClick={() => setActiveGroup('standard')}
                >
                    Adicionales
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
                {loading ? (
                    <div className="text-center py-8 text-muted-foreground">Cargando productos...</div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        {filteredProducts.map((product) => (
                            <Card key={product.id} className="flex flex-col justify-between cursor-pointer hover:border-primary transition-colors" onClick={() => onAddToCart(product)}>
                                <div className="aspect-square w-full overflow-hidden rounded-t-xl bg-muted flex items-center justify-center">
                                    {product.image_url ? (
                                        <img
                                            src={product.image_url}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-xs text-muted-foreground">Sin imagen</span>
                                    )}
                                </div>
                                <CardHeader className="p-3 pb-1">
                                    <div className="flex justify-between items-start">
                                        <CardTitle className="text-xs font-medium leading-tight line-clamp-2">
                                            {product.name}
                                        </CardTitle>
                                        {product.type === 'flower' && (
                                            <div
                                                className="w-2.5 h-2.5 rounded-full border shrink-0 ml-1"
                                                style={{ backgroundColor: product.flower_color_hex || '#ccc' }}
                                                title={product.flower_color_name || 'Color'}
                                            />
                                        )}
                                    </div>
                                    {product.sku && <div className="text-[10px] text-muted-foreground">{product.sku}</div>}
                                </CardHeader>
                                <CardContent className="p-3 pt-0 pb-2">
                                    <div className="text-sm font-bold">S/ {product.price.toFixed(2)}</div>
                                    {product.stock !== null && (
                                        <div className={`text-[10px] ${product.stock <= 5 ? 'text-red-500' : 'text-muted-foreground'}`}>
                                            Stock: {product.stock}
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="p-2">
                                    <Button size="sm" className="w-full h-8 text-xs" variant="secondary">
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
