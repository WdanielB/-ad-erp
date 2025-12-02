'use client'

import { useState } from 'react'
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
import { Loader2 } from 'lucide-react'

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
    is_active: z.boolean().default(true),
})

type ProductFormValues = z.infer<typeof productSchema>

interface ProductFormProps {
    productToEdit?: any // Using any for simplicity, but ideally should be Product type
    onSuccess?: () => void
}

export function ProductForm({ productToEdit, onSuccess }: ProductFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

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
        },
    })

    const productType = form.watch('type')

    async function onSubmit(data: ProductFormValues) {
        setLoading(true)
        try {
            // Clean up data based on type
            const submitData = { ...data }

            if (submitData.type !== 'flower') {
                delete submitData.flower_color_name
                delete submitData.flower_color_hex
                delete submitData.care_days_water
                delete submitData.care_days_cut
            }

            if (submitData.type !== 'composite') {
                delete submitData.labor_cost
            }

            let error;

            if (productToEdit) {
                const { error: updateError } = await (supabase
                    .from('products') as any)
                    .update(submitData)
                    .eq('id', productToEdit.id)
                error = updateError
            } else {
                const { error: insertError } = await (supabase
                    .from('products') as any)
                    .insert(submitData)
                error = insertError
            }

            if (error) throw error

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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
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
                                                <FormControl>
                                                    <RadioGroupItem value="standard" />
                                                </FormControl>
                                                <FormLabel className="font-normal">
                                                    Estándar (Jarrones, Peluches, Tarjetas)
                                                </FormLabel>
                                            </FormItem>
                                            <FormItem className="flex items-center space-x-3 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value="flower" />
                                                </FormControl>
                                                <FormLabel className="font-normal">
                                                    Flor (Perecedero, requiere cuidado)
                                                </FormLabel>
                                            </FormItem>
                                            <FormItem className="flex items-center space-x-3 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value="composite" />
                                                </FormControl>
                                                <FormLabel className="font-normal">
                                                    Compuesto (Ramos, Arreglos)
                                                </FormLabel>
                                            </FormItem>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre del Producto</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ej: Rosas Rojas Importadas" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="sku"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>SKU (Código)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Generado autom. si vacío" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Detalles del producto..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Precio de Venta</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="cost"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Costo Unitario</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {productType !== 'composite' && (
                            <FormField
                                control={form.control}
                                name="stock"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Stock Inicial</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            {productType === 'flower'
                                                ? 'Cantidad total de tallos disponibles.'
                                                : 'Unidades disponibles.'}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {productType === 'flower' && (
                            <div className="p-4 border rounded-md bg-muted/20 space-y-4">
                                <h3 className="font-medium">Detalles de Flor</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="flower_color_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nombre Color</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Rojo Pasión" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="flower_color_hex"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Color HEX</FormLabel>
                                                <div className="flex gap-2">
                                                    <FormControl>
                                                        <Input type="color" className="w-12 p-1 h-10" {...field} />
                                                    </FormControl>
                                                    <Input placeholder="#FF0000" {...field} />
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="care_days_water"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Cambio Agua (Días)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="care_days_cut"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Corte Tallo (Días)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" {...field} />
                                                </FormControl>
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
                                <FormField
                                    control={form.control}
                                    name="labor_cost"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Costo Mano de Obra</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.01" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="text-sm text-muted-foreground">
                                    * La receta (ingredientes) se configurará después de crear el producto.
                                </div>
                            </div>
                        )}

                        <FormField
                            control={form.control}
                            name="is_active"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>
                                            Producto Activo
                                        </FormLabel>
                                        <FormDescription>
                                            Visible en el catálogo de ventas.
                                        </FormDescription>
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
