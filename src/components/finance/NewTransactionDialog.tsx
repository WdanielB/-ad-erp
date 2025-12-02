'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/utils/supabase/client'

interface NewTransactionDialogProps {
    onTransactionAdded: () => void
}

export function NewTransactionDialog({ onTransactionAdded }: NewTransactionDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [description, setDescription] = useState('')
    const [amount, setAmount] = useState('')
    const [type, setType] = useState<'income' | 'expense'>('expense')

    async function handleSubmit() {
        if (!description || !amount) return

        setLoading(true)
        try {
            const { error } = await (supabase
                .from('transactions') as any)
                .insert({
                    description,
                    amount: parseFloat(amount),
                    type,
                    date: new Date().toISOString(),
                })

            if (error) throw error

            onTransactionAdded()
            setOpen(false)
            setDescription('')
            setAmount('')
            setType('expense')
        } catch (error) {
            console.error('Error adding transaction:', error)
            alert('Error al registrar la transacción')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Transacción
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Registrar Transacción</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Descripción</Label>
                        <Input
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ej: Pago de luz, Venta de flores..."
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Monto (S/)</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select value={type} onValueChange={(v: 'income' | 'expense') => setType(v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="income">Ingreso</SelectItem>
                                <SelectItem value="expense">Gasto</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={loading || !description || !amount}>
                        {loading ? 'Guardando...' : 'Guardar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
