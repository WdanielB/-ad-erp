'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Pencil, Trash2, Loader2, Phone, Mail, MapPin, Cake } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Database } from '@/types/database.types'
import { supabase } from '@/utils/supabase/client'
import { ClientDialog } from './ClientDialog'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

type Client = Database['public']['Tables']['clients']['Row']

export function ClientsView() {
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [clientToEdit, setClientToEdit] = useState<Client | null>(null)
    const [clientToDelete, setClientToDelete] = useState<Client | null>(null)

    async function fetchClients() {
        setLoading(true)
        let query = supabase
            .from('clients')
            .select('*')
            .order('full_name', { ascending: true })

        if (searchTerm) {
            query = query.ilike('full_name', `%${searchTerm}%`)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching clients:', error)
        } else {
            setClients(data || [])
        }
        setLoading(false)
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchClients()
        }, 300)

        return () => clearTimeout(timer)
    }, [searchTerm])

    async function handleDeleteClient() {
        if (!clientToDelete) return

        try {
            const { error } = await supabase
                .from('clients')
                .delete()
                .eq('id', clientToDelete.id)

            if (error) throw error

            setClients(clients.filter(c => c.id !== clientToDelete.id))
            setClientToDelete(null)
        } catch (error) {
            console.error('Error deleting client:', error)
            alert('Error al eliminar el cliente. Es posible que tenga pedidos asociados.')
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="relative w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar clientes..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <Button onClick={() => {
                    setClientToEdit(null)
                    setIsDialogOpen(true)
                }}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Cliente
                </Button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Contacto</TableHead>
                            <TableHead>Dirección</TableHead>
                            <TableHead>Cumpleaños</TableHead>
                            <TableHead>Notas</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                </TableCell>
                            </TableRow>
                        ) : clients.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No se encontraron clientes
                                </TableCell>
                            </TableRow>
                        ) : (
                            clients.map((client) => (
                                <TableRow key={client.id}>
                                    <TableCell className="font-medium">{client.full_name}</TableCell>
                                    <TableCell>
                                        <div className="space-y-1 text-sm">
                                            {client.phone && (
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                                    {client.phone}
                                                </div>
                                            )}
                                            {client.email && (
                                                <div className="flex items-center gap-2">
                                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                                    {client.email}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {client.address && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                                {client.address}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {client.birthday && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Cake className="h-3 w-3 text-muted-foreground" />
                                                {format(new Date(client.birthday), 'd MMMM', { locale: es })}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                                        {client.notes}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setClientToEdit(client)
                                                    setIsDialogOpen(true)
                                                }}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => setClientToDelete(client)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <ClientDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                clientToEdit={clientToEdit}
                onClientSaved={fetchClients}
            />

            <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar cliente?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Si el cliente tiene pedidos asociados, no se podrá eliminar.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteClient} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
