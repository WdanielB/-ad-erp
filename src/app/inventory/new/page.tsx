import { ProductForm } from '@/components/inventory/ProductForm'

export default function NewProductPage() {
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Nuevo Producto</h1>
                <p className="text-muted-foreground">
                    Registra un nuevo producto, flor o arreglo en el catálogo.
                </p>
            </div>
            <ProductForm />
        </div>
    )
}
