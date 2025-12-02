'use client'

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { ProductForm } from './ProductForm'
import { Database } from '@/types/database.types'

type Product = Database['public']['Tables']['products']['Row']

interface ProductDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    productToEdit?: Product | null
    onProductSaved: () => void
}

export function ProductDialog({ open, onOpenChange, productToEdit, onProductSaved }: ProductDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{productToEdit ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
                </DialogHeader>
                <ProductForm
                    productToEdit={productToEdit}
                    onSuccess={() => {
                        onProductSaved()
                        onOpenChange(false)
                    }}
                />
            </DialogContent>
        </Dialog>
    )
}
