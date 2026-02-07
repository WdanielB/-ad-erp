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
            <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
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
