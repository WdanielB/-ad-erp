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
import { Label } from '@/components/ui/label'
import { supabase } from '@/utils/supabase/client'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Database } from '@/types/database.types'

type Product = Database['public']['Tables']['products']['Row']
type FlowerColor = Database['public']['Tables']['flower_colors']['Row']

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

interface RecipeColorItem {
    color_id: string
    quantity: number
}

interface RecipeItem {
    id?: string
    child_product_id: string
    quantity: number
    product_name?: string
    colorItems?: RecipeColorItem[]
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
    const [availableColors, setAvailableColors] = useState<FlowerColor[]>([])
    const [defaultColorIdsByProduct, setDefaultColorIdsByProduct] = useState<Record<string, string[]>>({})
    const [selectedColorIds, setSelectedColorIds] = useState<string[]>([])
    const [newColorName, setNewColorName] = useState('')
    const [newColorHex, setNewColorHex] = useState('#ef4444')
    const [catalogColorToAdd, setCatalogColorToAdd] = useState('')

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

    useEffect(() => {
        async function loadColors() {
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

            if (productToEdit?.id) {
                setSelectedColorIds(defaults[productToEdit.id] || [])
            }
        }

        loadColors()
    }, [productToEdit?.id])

    // Load existing recipe if editing
    useEffect(() => {
        async function loadRecipe() {
            if (!productToEdit?.id) return
            const { data } = await (supabase
                .from('product_recipes') as any)
                .select('id, child_product_id, quantity')
                .eq('parent_product_id', productToEdit.id)

            if (data && data.length > 0) {
                const recipeIds = data.map((r: any) => r.id)
                const { data: colorData } = await (supabase
                    .from('product_recipe_flower_colors') as any)
                    .select('recipe_id, color_id, quantity')
                    .in('recipe_id', recipeIds)

                const colorMap: Record<string, RecipeColorItem[]> = {}
                ;(colorData ?? []).forEach((row: any) => {
                    if (!row.recipe_id || !row.color_id) return
                    colorMap[row.recipe_id] = colorMap[row.recipe_id] || []
                    colorMap[row.recipe_id].push({ color_id: row.color_id, quantity: row.quantity || 1 })
                })

                const items: RecipeItem[] = data.map((r: any) => {
                    const prod = allProducts.find(p => p.id === r.child_product_id)
                    return {
                        id: r.id,
                        child_product_id: r.child_product_id,
                        quantity: r.quantity,
                        product_name: prod?.name || 'Producto',
                        colorItems: colorMap[r.id] || []
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
            const defaultColorIds = defaultColorIdsByProduct[newRecipeProductId] || []
            const initialColorItems: RecipeColorItem[] =
                prod.type === 'flower' && defaultColorIds.length > 0
                    ? [{ color_id: defaultColorIds[0], quantity: newRecipeQuantity }]
                    : []
            setRecipeItems(prev => [...prev, {
                child_product_id: newRecipeProductId,
                quantity: newRecipeQuantity,
                product_name: prod.name,
                colorItems: initialColorItems
            }])
        }
        setNewRecipeProductId('')
        setNewRecipeQuantity(1)
    }

    function removeRecipeItem(childId: string) {
        setRecipeItems(prev => prev.filter(r => r.child_product_id !== childId))
    }

    function addRecipeColor(childId: string) {
        const item = recipeItems.find(r => r.child_product_id === childId)
        if (!item) return
        const defaultColorIds = defaultColorIdsByProduct[childId] || []
        const usedColorIds = new Set((item.colorItems || []).map(ci => ci.color_id))
        const nextDefault = defaultColorIds.find(id => !usedColorIds.has(id))
        const nextAny = availableColors.find(c => !usedColorIds.has(c.id))?.id
        const nextColorId = nextDefault || nextAny
        if (!nextColorId) return

        setRecipeItems(prev => prev.map(r =>
            r.child_product_id === childId
                ? { ...r, colorItems: [...(r.colorItems || []), { color_id: nextColorId, quantity: 1 }] }
                : r
        ))
    }

    function updateRecipeColor(childId: string, index: number, patch: Partial<RecipeColorItem>) {
        setRecipeItems(prev => prev.map(r => {
            if (r.child_product_id !== childId) return r
            const nextColors = [...(r.colorItems || [])]
            const current = nextColors[index]
            if (!current) return r
            nextColors[index] = { ...current, ...patch }
            return { ...r, colorItems: nextColors }
        }))
    }

    function removeRecipeColor(childId: string, index: number) {
        setRecipeItems(prev => prev.map(r => {
            if (r.child_product_id !== childId) return r
            const nextColors = [...(r.colorItems || [])]
            nextColors.splice(index, 1)
            return { ...r, colorItems: nextColors }
        }))
    }

    async function handleCreateColor() {
        const trimmedName = newColorName.trim()
        const trimmedHex = newColorHex.trim()
        if (!trimmedName || !trimmedHex) {
            alert('Escribe un nombre y selecciona un color')
            return
        }

        try {
            // Check if already loaded locally
            const normalizedName = trimmedName.toLowerCase()
            const existingLocal = availableColors.find(c => c.name.toLowerCase() === normalizedName)
            if (existingLocal) {
                setSelectedColorIds(prev => Array.from(new Set([...prev, existingLocal.id])))
                setNewColorName('')
                return
            }

            // Try insert (ignore error — unique constraint may fire if already exists)
            const { error: insertError } = await supabase
                .from('flower_colors')
                .insert({ name: trimmedName, hex: trimmedHex } as any)

            if (insertError) {
                console.warn('Insert color warning:', insertError.message)
            }

            // Always re-fetch to get the actual row
            const { data: fetched, error: fetchError } = await supabase
                .from('flower_colors')
                .select('*')
                .ilike('name', trimmedName)
                .limit(1)
                .single()

            if (fetchError || !fetched) {
                console.warn('Fetch color error:', fetchError?.message)
                alert('No se pudo crear el color. Error: ' + (fetchError?.message || 'No data returned'))
                return
            }

            const color = fetched as FlowerColor
            setAvailableColors(prev => {
                const exists = prev.find(c => c.id === color.id)
                if (exists) return prev
                return [...prev, color].sort((a, b) => a.name.localeCompare(b.name))
            })
            setSelectedColorIds(prev => Array.from(new Set([...prev, color.id])))
            setNewColorName('')
        } catch (err: any) {
            console.warn('handleCreateColor exception:', err)
            alert('Error inesperado al crear color: ' + (err?.message || String(err)))
        }
    }

    function addDefaultColor(colorId: string) {
        if (!colorId) return
        setSelectedColorIds(prev => Array.from(new Set([...prev, colorId])))
        setCatalogColorToAdd('')
    }

    function removeDefaultColor(colorId: string) {
        setSelectedColorIds(prev => prev.filter(id => id !== colorId))
    }

    async function onSubmit(data: ProductFormValues) {
        setLoading(true)
        try {
            const submitData: any = { ...data }

            if (submitData.type === 'flower') {
                const primaryColor = availableColors.find(c => c.id === selectedColorIds[0])
                if (primaryColor) {
                    submitData.flower_color_name = primaryColor.name
                    submitData.flower_color_hex = primaryColor.hex
                } else {
                    delete submitData.flower_color_name
                    delete submitData.flower_color_hex
                }
            }

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

            if (productId) {
                if (submitData.type === 'flower') {
                    await (supabase.from('product_flower_colors') as any)
                        .delete()
                        .eq('product_id', productId)

                    if (selectedColorIds.length > 0) {
                        const defaultRows = selectedColorIds.map(colorId => ({
                            product_id: productId,
                            color_id: colorId
                        }))
                        const { error: defaultError } = await (supabase.from('product_flower_colors') as any)
                            .insert(defaultRows)
                        if (defaultError) console.error('Error saving flower default colors:', defaultError)
                    }
                } else {
                    await (supabase.from('product_flower_colors') as any)
                        .delete()
                        .eq('product_id', productId)
                }
            }

            // Save recipe for composite products
            if (submitData.type === 'composite' && productId) {
                // Delete existing recipe
                await (supabase.from('product_recipes') as any)
                    .delete().eq('parent_product_id', productId)

                if (recipeItems.length > 0) {
                    // Insert new recipe
                    const recipeData = recipeItems.map(item => ({
                        parent_product_id: productId,
                        child_product_id: item.child_product_id,
                        quantity: item.quantity
                    }))

                    const { data: createdRecipes, error: recipeError } = await (supabase.from('product_recipes') as any)
                        .insert(recipeData)
                        .select()
                    if (recipeError) console.error('Error saving recipe:', recipeError)

                    if (!recipeError && createdRecipes) {
                        const colorRows = createdRecipes.flatMap((recipe: any, index: number) => {
                            const colorItems = recipeItems[index]?.colorItems || []
                            return colorItems
                                .filter(ci => ci.quantity > 0)
                                .map(ci => ({
                                    recipe_id: recipe.id,
                                    color_id: ci.color_id,
                                    quantity: ci.quantity
                                }))
                        })

                        if (colorRows.length > 0) {
                            const { error: colorError } = await (supabase.from('product_recipe_flower_colors') as any)
                                .insert(colorRows)
                            if (colorError) console.error('Error saving recipe colors:', colorError)
                        }
                    }
                }
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
                                <div className="space-y-3">
                                    <Label>Colores disponibles</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Selecciona los colores por defecto de esta flor. El primer color se usa como color principal en listas.
                                    </p>
                                    <div className="flex gap-2 items-center">
                                        <Select value={catalogColorToAdd} onValueChange={setCatalogColorToAdd}>
                                            <SelectTrigger className="h-9">
                                                <SelectValue placeholder="Agregar color del catalogo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableColors
                                                    .filter(color => !selectedColorIds.includes(color.id))
                                                    .map(color => (
                                                        <SelectItem key={color.id} value={color.id}>
                                                            <span className="flex items-center gap-2">
                                                                <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: color.hex }} />
                                                                {color.name}
                                                            </span>
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                        <Button type="button" variant="outline" size="sm" onClick={() => addDefaultColor(catalogColorToAdd)} disabled={!catalogColorToAdd}>
                                            Agregar
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedColorIds.map(colorId => {
                                            const color = availableColors.find(c => c.id === colorId)
                                            if (!color) return null
                                            return (
                                                <div key={colorId} className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
                                                    <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: color.hex }} />
                                                    <span className="font-medium">{color.name}</span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-5 w-5 text-muted-foreground"
                                                        onClick={() => removeDefaultColor(colorId)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            )
                                        })}
                                        {selectedColorIds.length === 0 && (
                                            <span className="text-xs text-muted-foreground">Sin colores seleccionados</span>
                                        )}
                                    </div>
                                    <div className="rounded-md border p-3 space-y-2 bg-background">
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
                                                Crear y agregar
                                            </Button>
                                        </div>
                                    </div>
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
                                                const isFlower = prod?.type === 'flower'
                                                return (
                                                    <div key={item.child_product_id} className="flex items-center justify-between bg-background p-2 rounded border">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                            {prod?.flower_color_hex && (
                                                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: prod.flower_color_hex }} />
                                                            )}
                                                            <span className="text-sm font-medium">{item.product_name || prod?.name}</span>
                                                            </div>
                                                            {isFlower && (
                                                                <div className="mt-2 space-y-2">
                                                                    <div className="text-xs text-muted-foreground">Colores</div>
                                                                    {(item.colorItems || []).map((colorItem, index) => {
                                                                        const usedColorIds = new Set((item.colorItems || []).map(ci => ci.color_id))
                                                                        const defaultIds = new Set(defaultColorIdsByProduct[item.child_product_id] || [])
                                                                        const options = availableColors
                                                                            .filter(color => color.id === colorItem.color_id || !usedColorIds.has(color.id))
                                                                            .sort((a, b) => {
                                                                                const aDefault = defaultIds.has(a.id)
                                                                                const bDefault = defaultIds.has(b.id)
                                                                                if (aDefault !== bDefault) return aDefault ? -1 : 1
                                                                                return a.name.localeCompare(b.name)
                                                                            })

                                                                        return (
                                                                            <div key={`${colorItem.color_id}-${index}`} className="flex items-center gap-2">
                                                                                <Select
                                                                                    value={colorItem.color_id}
                                                                                    onValueChange={(value) => updateRecipeColor(item.child_product_id, index, { color_id: value })}
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
                                                                                    value={colorItem.quantity}
                                                                                    onChange={(e) => updateRecipeColor(item.child_product_id, index, { quantity: parseInt(e.target.value) || 1 })}
                                                                                    className="w-20 h-8"
                                                                                />
                                                                                <span className="text-xs text-muted-foreground">uds</span>
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-8 w-8 text-destructive"
                                                                                    onClick={() => removeRecipeColor(item.child_product_id, index)}
                                                                                >
                                                                                    <Trash2 className="h-3 w-3" />
                                                                                </Button>
                                                                            </div>
                                                                        )
                                                                    })}
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => addRecipeColor(item.child_product_id)}
                                                                        disabled={availableColors.length === 0}
                                                                    >
                                                                        Agregar color
                                                                    </Button>
                                                                </div>
                                                            )}
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
