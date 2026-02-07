'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { supabase } from '@/utils/supabase/client'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Database } from '@/types/database.types'

type Product = Database['public']['Tables']['products']['Row']

const productSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    description: z.string().optional(),
    sku: z.string().optional(),
    type: z.enum(['standard', 'flower', 'composite']),
    price: z.coerce.number().min(0, 'El precio no puede ser negativo'),
    cost: z.coerce.number().min(0, 'El costo no puede ser negativo').optional(),
    stock: z.coerce.number().int().min(0).optional(),
    category_id: z.string().optional(),
    image_url: z.string().url().optional().or(z.literal('')),
    // Flower specific
    flower_color_name: z.string().optional(),
    flower_color_hex: z.string().optional(),
    care_days_water: z.coerce.number().int().min(1).optional(),
    care_days_cut: z.coerce.number().int().min(1).optional(),
    // Composite specific
    labor_cost: z.coerce.number().min(0).optional(),
    main_flower_id: z.string().optional(),
    is_active: z.boolean().default(true),
})

type ProductFormValues = z.infer<typeof productSchema>

interface RecipeItem {
    child_product_id: string
    quantity: number
    product_name?: string
}

interface ProductFormProps {
    productToEdit?: any
    onSuccess?: () => void
}

export function ProductForm({ productToEdit, onSuccess }: ProductFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [flowers, setFlowers] = useState<Product[]>([])
    const [allProducts, setAllProducts] = useState<Product[]>([])
    const [recipeItems, setRecipeItems] = useState<RecipeItem[]>([])
    const [newRecipeProductId, setNewRecipeProductId] = useState('')
    const [newRecipeQuantity, setNewRecipeQuantity] = useState(1)

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productSchema) as any,
        defaultValues: {
            name: productToEdit?.name || '',
            description: productToEdit?.description || '',
            sku: productToEdit?.sku || '',
            type: productToEdit?.type || 'standard',
            price: productToEdit?.price || 0,
            cost: productToEdit?.cost || 0,
            stock: productToEdit?.stock || 0,
            is_active: productToEdit?.is_active ?? true,
            category_id: productToEdit?.category_id || '',
            image_url: productToEdit?.image_url || '',
            flower_color_name: productToEdit?.flower_color_name || '',
            flower_color_hex: productToEdit?.flower_color_hex || '',
            care_days_water: productToEdit?.care_days_water || 2,
            care_days_cut: productToEdit?.care_days_cut || 3,
            labor_cost: productToEdit?.labor_cost || 0,
            main_flower_id: productToEdit?.main_flower_id || '',
        },
    })

    const productType = form.watch('type')

    // Load flowers and all products for recipe selection
    useEffect(() => {
        async function loadProducts() {
            const { data } = await supabase
                .from('products')
                .select('*')
                .eq('is_active', true)
                .order('name')

            const allProds = (data ?? []) as Product[]
            if (allProds.length > 0) {
                setAllProducts(allProds)
                setFlowers(allProds.filter(p => p.type === 'flower'))
            }
        }
        loadProducts()
    }, [])

    // Load existing recipe if editing
    useEffect(() => {
        async function loadRecipe() {
            if (!productToEdit?.id) return
            const { data } = await (supabase
                .from('product_recipes') as any)
                .select('child_product_id, quantity')
                .eq('parent_product_id', productToEdit.id)

            if (data && data.length > 0) {
                const items: RecipeItem[] = data.map((r: any) => {
                    const prod = allProducts.find(p => p.id === r.child_product_id)
                    return {
                        child_product_id: r.child_product_id,
                        quantity: r.quantity,
                        product_name: prod?.name || 'Producto'
                    }
                })
                setRecipeItems(items)
            }
        }
        if (allProducts.length > 0) loadRecipe()
    }, [productToEdit, allProducts])

    function addRecipeItem() {
        if (!newRecipeProductId) return
        const prod = allProducts.find(p => p.id === newRecipeProductId)
        if (!prod) return
        // Don't add duplicates
        if (recipeItems.find(r => r.child_product_id === newRecipeProductId)) {
            setRecipeItems(prev => prev.map(r =>
                r.child_product_id === newRecipeProductId
                    ? { ...r, quantity: r.quantity + newRecipeQuantity }
                    : r
            ))
        } else {
            setRecipeItems(prev => [...prev, {
                child_product_id: newRecipeProductId,
                quantity: newRecipeQuantity,
                product_name: prod.name
            }])
        }
        setNewRecipeProductId('')
        setNewRecipeQuantity(1)
    }

    function removeRecipeItem(childId: string) {
        setRecipeItems(prev => prev.filter(r => r.child_product_id !== childId))
    }

    async function onSubmit(data: ProductFormValues) {
        setLoading(true)
        try {
            const submitData: any = { ...data }

            if (submitData.type !== 'flower') {
                delete submitData.flower_color_name
                delete submitData.flower_color_hex
                delete submitData.care_days_water
                delete submitData.care_days_cut
            }

            if (submitData.type !== 'composite') {
                delete submitData.labor_cost
                delete submitData.main_flower_id
            }

            // Sanitize empty strings to null
            if (submitData.category_id === '') delete submitData.category_id
            if (submitData.image_url === '') delete submitData.image_url
            if (submitData.sku === '') delete submitData.sku
            if (submitData.flower_color_name === '') delete submitData.flower_color_name
            if (submitData.flower_color_hex === '') delete submitData.flower_color_hex
            if (submitData.main_flower_id === '') submitData.main_flower_id = null

            let productId: string | null = null

            if (productToEdit) {
                const { error: updateError } = await (supabase.from('products') as any)
                    .update(submitData).eq('id', productToEdit.id)
                if (updateError) throw updateError
                productId = productToEdit.id
            } else {
                const { data: newProduct, error: insertError } = await (supabase.from('products') as any)
                    .insert(submitData).select().single()
                if (insertError) throw insertError
                productId = newProduct.id
            }

            // Save recipe for composite products
            if (submitData.type === 'composite' && productId && recipeItems.length > 0) {
                // Delete existing recipe
                await (supabase.from('product_recipes') as any)
                    .delete().eq('parent_product_id', productId)

                // Insert new recipe
                const recipeData = recipeItems.map(item => ({
                    parent_product_id: productId,
                    child_product_id: item.child_product_id,
                    quantity: item.quantity
                }))

                const { error: recipeError } = await (supabase.from('product_recipes') as any)
                    .insert(recipeData)
                if (recipeError) console.error('Error saving recipe:', recipeError)
            }

            if (onSuccess) {
                onSuccess()
            } else {
                router.push('/inventory')
                router.refresh()
            }
        } catch (error) {
            console.error('Error saving product:', error)
            alert('Error al guardar el producto')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                    <div className="space-y-6 min-w-0">
                        <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel>Tipo de Producto</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            className="flex flex-col space-y-1"
                                        >
                                            <FormItem className="flex items-center space-x-3 space-y-0">
                                                <FormControl><RadioGroupItem value="standard" /></FormControl>
                                                <FormLabel className="font-normal">Estándar (Jarrones, Peluches, Tarjetas)</FormLabel>
                                            </FormItem>
                                            <FormItem className="flex items-center space-x-3 space-y-0">
                                                <FormControl><RadioGroupItem value="flower" /></FormControl>
                                                <FormLabel className="font-normal">Flor (Perecedero, requiere cuidado)</FormLabel>
                                            </FormItem>
                                            <FormItem className="flex items-center space-x-3 space-y-0">
                                                <FormControl><RadioGroupItem value="composite" /></FormControl>
                                                <FormLabel className="font-normal">Compuesto (Ramos, Arreglos)</FormLabel>
                                            </FormItem>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField control={form.control} name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre del Producto</FormLabel>
                                    <FormControl><Input placeholder="Ej: Rosas Rojas Importadas" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField control={form.control} name="sku"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>SKU (Código)</FormLabel>
                                    <FormControl><Input placeholder="Generado autom. si vacío" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField control={form.control} name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción</FormLabel>
                                    <FormControl><Textarea placeholder="Detalles del producto..." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField control={form.control} name="image_url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Imagen (URL)</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="https://..."
                                            {...field}
                                        />
                                    </FormControl>
                                    {field.value && (
                                        <div className="mt-2 w-full max-w-sm aspect-[4/3] rounded-md overflow-hidden border bg-muted">
                                            <img
                                                src={field.value}
                                                alt="Vista previa"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    )}
                                    <FormDescription>Agrega un link de imagen para mostrarla en el catálogo.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="space-y-6 min-w-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <FormField control={form.control} name="price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Precio de Venta</FormLabel>
                                        <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField control={form.control} name="cost"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Costo Unitario</FormLabel>
                                        <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {productType !== 'composite' && (
                            <FormField control={form.control} name="stock"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Stock Inicial</FormLabel>
                                        <FormControl><Input type="number" {...field} /></FormControl>
                                        <FormDescription>
                                            {productType === 'flower' ? 'Cantidad total de tallos disponibles.' : 'Unidades disponibles.'}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {productType === 'flower' && (
                            <div className="p-4 border rounded-md bg-muted/20 space-y-4">
                                <h3 className="font-medium">Detalles de Flor</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="flower_color_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nombre Color</FormLabel>
                                                <FormControl><Input placeholder="Rojo Pasión" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField control={form.control} name="flower_color_hex"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Color HEX</FormLabel>
                                                <div className="flex gap-2">
                                                    <FormControl><Input type="color" className="w-12 p-1 h-10" {...field} /></FormControl>
                                                    <Input placeholder="#FF0000" {...field} />
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField control={form.control} name="care_days_water"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Cambio Agua (Días)</FormLabel>
                                                <FormControl><Input type="number" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField control={form.control} name="care_days_cut"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Corte Tallo (Días)</FormLabel>
                                                <FormControl><Input type="number" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        )}

                        {productType === 'composite' && (
                            <div className="p-4 border rounded-md bg-muted/20 space-y-4">
                                <h3 className="font-medium">Detalles de Producción</h3>

                                {/* Main Flower */}
                                <FormField control={form.control} name="main_flower_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Flor Principal</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || ''}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecciona la flor principal" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none">Sin flor principal</SelectItem>
                                                    {flowers.map(flower => (
                                                        <SelectItem key={flower.id} value={flower.id}>
                                                            <span className="flex items-center gap-2">
                                                                {flower.flower_color_hex && (
                                                                    <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: flower.flower_color_hex }} />
                                                                )}
                                                                {flower.name}
                                                            </span>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormDescription>La flor predominante de este arreglo</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Labor Cost */}
                                <FormField control={form.control} name="labor_cost"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Costo Mano de Obra</FormLabel>
                                            <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                {/* Recipe */}
                                <div className="space-y-3">
                                    <h4 className="font-medium text-sm">Receta (Ingredientes)</h4>
                                    <p className="text-xs text-muted-foreground">
                                        Define las flores y productos necesarios para crear este arreglo
                                    </p>

                                    {/* Existing recipe items */}
                                    {recipeItems.length > 0 && (
                                        <div className="space-y-2">
                                            {recipeItems.map(item => {
                                                const prod = allProducts.find(p => p.id === item.child_product_id)
                                                return (
                                                    <div key={item.child_product_id} className="flex items-center justify-between bg-background p-2 rounded border">
                                                        <div className="flex items-center gap-2">
                                                            {prod?.flower_color_hex && (
                                                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: prod.flower_color_hex }} />
                                                            )}
                                                            <span className="text-sm font-medium">{item.product_name || prod?.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                value={item.quantity}
                                                                onChange={(e) => setRecipeItems(prev => prev.map(r =>
                                                                    r.child_product_id === item.child_product_id
                                                                        ? { ...r, quantity: parseInt(e.target.value) || 1 }
                                                                        : r
                                                                ))}
                                                                className="w-20 h-8"
                                                            />
                                                            <span className="text-xs text-muted-foreground">uds</span>
                                                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                                                                onClick={() => removeRecipeItem(item.child_product_id)}>
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}

                                    {/* Add new recipe item */}
                                    <div className="flex gap-2 items-end">
                                        <div className="flex-1">
                                            <Select value={newRecipeProductId} onValueChange={setNewRecipeProductId}>
                                                <SelectTrigger className="h-9">
                                                    <SelectValue placeholder="Agregar ingrediente..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {allProducts
                                                        .filter(p => !recipeItems.find(r => r.child_product_id === p.id))
                                                        .map(product => (
                                                            <SelectItem key={product.id} value={product.id}>
                                                                <span className="flex items-center gap-2">
                                                                    {product.flower_color_hex && (
                                                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: product.flower_color_hex }} />
                                                                    )}
                                                                    {product.name}
                                                                    {product.type === 'flower' && ' 🌸'}
                                                                </span>
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <Input type="number" min="1" value={newRecipeQuantity}
                                            onChange={(e) => setNewRecipeQuantity(parseInt(e.target.value) || 1)}
                                            className="w-20 h-9" placeholder="Cant" />
                                        <Button type="button" variant="outline" size="sm" onClick={addRecipeItem} disabled={!newRecipeProductId}>
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {/* Recipe cost summary */}
                                    {recipeItems.length > 0 && (
                                        <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                                            Costo de materiales: S/ {recipeItems.reduce((sum, item) => {
                                                const prod = allProducts.find(p => p.id === item.child_product_id)
                                                return sum + ((prod?.cost || 0) * item.quantity)
                                            }, 0).toFixed(2)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <FormField control={form.control} name="is_active"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Producto Activo</FormLabel>
                                        <FormDescription>Visible en el catálogo de ventas.</FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {productToEdit ? 'Guardar Cambios' : 'Crear Producto'}
                </Button>
            </form>
        </Form>
    )
}
