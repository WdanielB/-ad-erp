'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown, Plus, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
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
import { supabase } from '@/utils/supabase/client'
import { Database } from '@/types/database.types'

type Client = Database['public']['Tables']['clients']['Row']

interface ClientSearchProps {
    onClientSelect: (client: Client | null) => void
    selectedClient: Client | null
}

export function ClientSearch({ onClientSelect, selectedClient }: ClientSearchProps) {
    const [open, setOpen] = useState(false)
    const [clients, setClients] = useState<Client[]>([])
    const [search, setSearch] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [newClientName, setNewClientName] = useState('')
    const [newClientPhone, setNewClientPhone] = useState('')

    useEffect(() => {
        if (open) {
            fetchClients()
        }
    }, [open])

    async function fetchClients() {
        const { data } = await supabase
            .from('clients')
            .select('*')
            .order('full_name')
            .limit(50)

        if (data) setClients(data)
    }

    async function createClient() {
        if (!newClientName) return

        const { data, error } = await (supabase
            .from('clients') as any)
            .insert({
                full_name: newClientName,
                phone: newClientPhone || null,
            })
            .select()
            .single()

        if (data) {
            onClientSelect(data)
            setDialogOpen(false)
            setOpen(false)
            setNewClientName('')
            setNewClientPhone('')
        }
    }

    return (
        <div className="flex items-center space-x-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                    >
                        {selectedClient ? (
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <div className="flex flex-col items-start text-xs">
                                    <span className="font-medium">{selectedClient.full_name}</span>
                                    {selectedClient.phone && <span className="text-muted-foreground">{selectedClient.phone}</span>}
                                </div>
                            </div>
                        ) : (
                            "Buscar cliente..."
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                    <Command>
                        <CommandInput placeholder="Buscar cliente..." onValueChange={setSearch} />
                        <CommandList>
                            <CommandEmpty>
                                <div className="p-2 text-center text-sm">
                                    No encontrado.
                                    <Button
                                        variant="link"
                                        size="sm"
                                        className="mt-1 h-auto p-0 text-primary"
                                        onClick={() => setDialogOpen(true)}
                                    >
                                        Crear "{search}"
                                    </Button>
                                </div>
                            </CommandEmpty>
                            <CommandGroup>
                                {clients.map((client) => (
                                    <CommandItem
                                        key={client.id}
                                        value={client.full_name}
                                        onSelect={() => {
                                            onClientSelect(client)
                                            setOpen(false)
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedClient?.id === client.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex flex-col">
                                            <span>{client.full_name}</span>
                                            {client.phone && <span className="text-xs text-muted-foreground">{client.phone}</span>}
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nuevo Cliente</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Nombre Completo</Label>
                            <Input
                                value={newClientName}
                                onChange={(e) => setNewClientName(e.target.value)}
                                placeholder="Ej: Juan Pérez"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Teléfono</Label>
                            <Input
                                value={newClientPhone}
                                onChange={(e) => setNewClientPhone(e.target.value)}
                                placeholder="Ej: 999 999 999"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={createClient} disabled={!newClientName}>Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
