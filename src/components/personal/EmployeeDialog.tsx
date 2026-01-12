'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { supabase } from '@/utils/supabase/client'
import { Loader2, CheckCircle2, XCircle, UserPlus } from 'lucide-react'

type Employee = {
    id: string
    employee_code: string | null
    first_name: string
    last_name: string
    email: string | null
    phone: string | null
    position: string | null
    department: string | null
    hire_date: string | null
    birth_date?: string | null
    address?: string | null
    emergency_contact_name?: string | null
    emergency_contact_phone?: string | null
    hourly_rate: number | null
    salary?: number | null
    status: 'active' | 'inactive' | 'on_leave' | 'terminated'
    notes?: string | null
}

type UserRole = 'vendedor' | 'florista' | 'repartidor' | 'admin'

interface EmployeeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    employee: Employee | null
    onSuccess: () => void
}

const departments = [
    'Ventas',
    'Taller',
    'Entregas',
    'Administración',
    'Otro'
]

const positions = [
    'Florista',
    'Vendedor/a',
    'Repartidor',
    'Cajero/a',
    'Gerente',
    'Asistente',
    'Otro'
]

const userRoles: { value: UserRole, label: string }[] = [
    { value: 'vendedor', label: 'Vendedor - POS, Clientes, Taller, Calendario' },
    { value: 'florista', label: 'Florista - Inventario, Taller, Calendario' },
    { value: 'repartidor', label: 'Repartidor - Calendario' },
    { value: 'admin', label: 'Admin - Acceso completo (excepto config)' },
]

export function EmployeeDialog({ open, onOpenChange, employee, onSuccess }: EmployeeDialogProps) {
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [createAccount, setCreateAccount] = useState(false)
    const [accountPassword, setAccountPassword] = useState('')
    const [accountRole, setAccountRole] = useState<UserRole>('vendedor')
    const [formData, setFormData] = useState<Partial<Employee>>({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        position: '',
        department: '',
        hire_date: new Date().toISOString().split('T')[0],
        birth_date: '',
        address: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        hourly_rate: 0,
        salary: 0,
        status: 'active',
        notes: ''
    })

    // Update form when employee changes
    useState(() => {
        if (employee) {
            setFormData({
                first_name: employee.first_name || '',
                last_name: employee.last_name || '',
                email: employee.email || '',
                phone: employee.phone || '',
                position: employee.position || '',
                department: employee.department || '',
                hire_date: employee.hire_date || new Date().toISOString().split('T')[0],
                birth_date: employee.birth_date || '',
                address: employee.address || '',
                emergency_contact_name: employee.emergency_contact_name || '',
                emergency_contact_phone: employee.emergency_contact_phone || '',
                hourly_rate: employee.hourly_rate || 0,
                salary: employee.salary || 0,
                status: employee.status || 'active',
                notes: employee.notes || ''
            })
        } else {
            setFormData({
                first_name: '',
                last_name: '',
                email: '',
                phone: '',
                position: '',
                department: '',
                hire_date: new Date().toISOString().split('T')[0],
                birth_date: '',
                address: '',
                emergency_contact_name: '',
                emergency_contact_phone: '',
                hourly_rate: 0,
                salary: 0,
                status: 'active',
                notes: ''
            })
        }
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        // Validar si se quiere crear cuenta
        if (createAccount && !employee) {
            if (!formData.email) {
                setMessage({ type: 'error', text: 'Se requiere email para crear cuenta de usuario' })
                setLoading(false)
                return
            }
            if (!accountPassword || accountPassword.length < 6) {
                setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' })
                setLoading(false)
                return
            }
        }

        const dataToSave = {
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email || null,
            phone: formData.phone || null,
            position: formData.position || null,
            department: formData.department || null,
            hire_date: formData.hire_date || null,
            birth_date: formData.birth_date || null,
            address: formData.address || null,
            emergency_contact_name: formData.emergency_contact_name || null,
            emergency_contact_phone: formData.emergency_contact_phone || null,
            hourly_rate: formData.hourly_rate || 0,
            salary: formData.salary || 0,
            status: formData.status || 'active',
            notes: formData.notes || null
        }

        if (employee) {
            // Update
            const { error } = await supabase
                .from('employees')
                .update(dataToSave)
                .eq('id', employee.id)
            
            setLoading(false)
            if (error) {
                setMessage({ type: 'error', text: 'Error al actualizar: ' + error.message })
                return
            }
            setMessage({ type: 'success', text: '✓ Empleado actualizado correctamente' })
        } else {
            // Insert employee
            const { error, data } = await supabase
                .from('employees')
                .insert([dataToSave])
                .select()
            
            if (error) {
                setLoading(false)
                setMessage({ type: 'error', text: 'Error al crear: ' + error.message })
                return
            }

            const newEmployeeId = data?.[0]?.id

            // Crear cuenta de usuario si se solicitó
            if (createAccount && formData.email && accountPassword) {
                const fullName = `${formData.first_name} ${formData.last_name}`
                
                const response = await fetch('/api/users/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: formData.email,
                        password: accountPassword,
                        full_name: fullName,
                        role: accountRole,
                        employee_id: newEmployeeId
                    })
                })

                const result = await response.json()
                
                if (!response.ok) {
                    setLoading(false)
                    setMessage({ type: 'error', text: 'Empleado creado pero error en cuenta: ' + result.error })
                    setTimeout(() => {
                        onSuccess()
                        onOpenChange(false)
                        setMessage(null)
                    }, 3000)
                    return
                }

                setLoading(false)
                setMessage({ type: 'success', text: '✓ Empleado y cuenta de usuario creados correctamente' })
            } else {
                setLoading(false)
                setMessage({ type: 'success', text: '✓ Empleado creado correctamente' })
            }
        }

        // Esperar mostrando el mensaje de éxito antes de cerrar
        setTimeout(() => {
            onSuccess()
            onOpenChange(false)
            setMessage(null)
            // Reset account fields
            setCreateAccount(false)
            setAccountPassword('')
            setAccountRole('vendedor')
        }, 1500)
    }

    // Reset form when dialog opens
    const handleOpenChange = (open: boolean) => {
        if (open && employee) {
            setFormData({
                first_name: employee.first_name || '',
                last_name: employee.last_name || '',
                email: employee.email || '',
                phone: employee.phone || '',
                position: employee.position || '',
                department: employee.department || '',
                hire_date: employee.hire_date || new Date().toISOString().split('T')[0],
                birth_date: employee.birth_date || '',
                address: employee.address || '',
                emergency_contact_name: employee.emergency_contact_name || '',
                emergency_contact_phone: employee.emergency_contact_phone || '',
                hourly_rate: employee.hourly_rate || 0,
                salary: employee.salary || 0,
                status: employee.status || 'active',
                notes: employee.notes || ''
            })
        } else if (open && !employee) {
            setFormData({
                first_name: '',
                last_name: '',
                email: '',
                phone: '',
                position: '',
                department: '',
                hire_date: new Date().toISOString().split('T')[0],
                birth_date: '',
                address: '',
                emergency_contact_name: '',
                emergency_contact_phone: '',
                hourly_rate: 0,
                salary: 0,
                status: 'active',
                notes: ''
            })
        }
        onOpenChange(open)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {employee ? 'Editar Empleado' : 'Nuevo Empleado'}
                    </DialogTitle>
                    <DialogDescription>
                        {employee ? 'Modifica los datos del empleado' : 'Completa los datos del nuevo empleado'}
                    </DialogDescription>
                </DialogHeader>

                {/* Mensaje de éxito o error */}
                {message && (
                    <div className={`flex items-center gap-2 p-3 rounded-lg ${
                        message.type === 'success' 
                            ? 'bg-green-100 text-green-800 border border-green-300' 
                            : 'bg-red-100 text-red-800 border border-red-300'
                    }`}>
                        {message.type === 'success' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                        )}
                        <span className="font-medium">{message.text}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Información básica */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="first_name">Nombre *</Label>
                            <Input
                                id="first_name"
                                required
                                value={formData.first_name}
                                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="last_name">Apellido *</Label>
                            <Input
                                id="last_name"
                                required
                                value={formData.last_name}
                                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email || ''}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Teléfono</Label>
                            <Input
                                id="phone"
                                value={formData.phone || ''}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Trabajo */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="position">Cargo</Label>
                            <Select 
                                value={formData.position || ''} 
                                onValueChange={(value) => setFormData({ ...formData, position: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar cargo" />
                                </SelectTrigger>
                                <SelectContent>
                                    {positions.map((pos) => (
                                        <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="department">Departamento</Label>
                            <Select 
                                value={formData.department || ''} 
                                onValueChange={(value) => setFormData({ ...formData, department: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar departamento" />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.map((dept) => (
                                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="hire_date">Fecha de Contratación</Label>
                            <Input
                                id="hire_date"
                                type="date"
                                value={formData.hire_date || ''}
                                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="birth_date">Fecha de Nacimiento</Label>
                            <Input
                                id="birth_date"
                                type="date"
                                value={formData.birth_date || ''}
                                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Compensación */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="hourly_rate">Tarifa por Hora ($)</Label>
                            <Input
                                id="hourly_rate"
                                type="number"
                                step="0.01"
                                value={formData.hourly_rate || ''}
                                onChange={(e) => setFormData({ ...formData, hourly_rate: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="salary">Salario Mensual ($)</Label>
                            <Input
                                id="salary"
                                type="number"
                                step="0.01"
                                value={formData.salary || ''}
                                onChange={(e) => setFormData({ ...formData, salary: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Estado</Label>
                            <Select 
                                value={formData.status || 'active'} 
                                onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Activo</SelectItem>
                                    <SelectItem value="inactive">Inactivo</SelectItem>
                                    <SelectItem value="on_leave">En Permiso</SelectItem>
                                    <SelectItem value="terminated">Terminado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Dirección */}
                    <div className="space-y-2">
                        <Label htmlFor="address">Dirección</Label>
                        <Input
                            id="address"
                            value={formData.address || ''}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>

                    {/* Contacto de emergencia */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="emergency_contact_name">Contacto de Emergencia</Label>
                            <Input
                                id="emergency_contact_name"
                                value={formData.emergency_contact_name || ''}
                                onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="emergency_contact_phone">Teléfono Emergencia</Label>
                            <Input
                                id="emergency_contact_phone"
                                value={formData.emergency_contact_phone || ''}
                                onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Notas */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas</Label>
                        <Textarea
                            id="notes"
                            rows={3}
                            value={formData.notes || ''}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    {/* Crear cuenta de usuario - Solo para nuevos empleados */}
                    {!employee && (
                        <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
                            <div className="flex items-center space-x-2">
                                <Checkbox 
                                    id="createAccount"
                                    checked={createAccount}
                                    onCheckedChange={(checked) => setCreateAccount(checked === true)}
                                />
                                <Label htmlFor="createAccount" className="flex items-center gap-2 cursor-pointer">
                                    <UserPlus className="h-4 w-4" />
                                    Crear cuenta de acceso al sistema
                                </Label>
                            </div>

                            {createAccount && (
                                <div className="space-y-4 pt-2">
                                    <p className="text-sm text-muted-foreground">
                                        Se usará el email del empleado para la cuenta. El empleado podrá iniciar sesión con estas credenciales.
                                    </p>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="accountPassword">Contraseña *</Label>
                                            <Input
                                                id="accountPassword"
                                                type="password"
                                                placeholder="Mínimo 6 caracteres"
                                                value={accountPassword}
                                                onChange={(e) => setAccountPassword(e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="accountRole">Rol de acceso *</Label>
                                            <Select 
                                                value={accountRole} 
                                                onValueChange={(value: UserRole) => setAccountRole(value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {userRoles.map((role) => (
                                                        <SelectItem key={role.value} value={role.value}>
                                                            {role.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {!formData.email && (
                                        <p className="text-sm text-orange-600">
                                            ⚠️ Ingresa un email arriba para poder crear la cuenta
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {employee ? 'Guardar Cambios' : (createAccount ? 'Crear Empleado y Cuenta' : 'Crear Empleado')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
