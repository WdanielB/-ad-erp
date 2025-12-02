'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Database } from '@/types/database.types'
import { supabase } from '@/utils/supabase/client'
import { Loader2 } from 'lucide-react'

type Client = Database['public']['Tables']['clients']['Row']

interface ClientDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    clientToEdit?: Client | null
    onClientSaved: () => void
}

export function ClientDialog({ open, onOpenChange, clientToEdit, onClientSaved }: ClientDialogProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        email: '',
        address: '',
        birthday: '',
        notes: ''
    })

    useEffect(() => {
        if (clientToEdit) {
            setFormData({
                full_name: clientToEdit.full_name,
                phone: clientToEdit.phone || '',
                email: clientToEdit.email || '',
                address: clientToEdit.address || '',
                birthday: clientToEdit.birthday || '',
                notes: clientToEdit.notes || ''
            })
        } else {
            setFormData({
                full_name: '',
                phone: '',
                email: '',
                address: '',
                birthday: '',
                notes: ''
            })
        }
    }, [clientToEdit, open])

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        try {
            const dataToSave = {
                full_name: formData.full_name,
                phone: formData.phone || null,
                email: formData.email || null,
                address: formData.address || null,
                birthday: formData.birthday || null,
                notes: formData.notes || null
            }

            if (clientToEdit) {
                const { error } = await (supabase
                    .from('clients') as any)
                    .update(dataToSave)
                    .eq('id', clientToEdit.id)

                if (error) throw error
            } else {
                const { error } = await (supabase
                    .from('clients') as any)
                    .insert(dataToSave)

                if (error) throw error
            }

            onClientSaved()
            onOpenChange(false)
        } catch (error) {
            console.error('Error saving client:', error)
            alert('Error al guardar el cliente')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{clientToEdit ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="full_name">Nombre Completo *</Label>
                        <Input
                            id="full_name"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Teléfono</Label>
                            <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="birthday">Cumpleaños</Label>
                            <Input
                                id="birthday"
                                type="date"
                                value={formData.birthday}
                                onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address">Dirección</Label>
                        <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas</Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
