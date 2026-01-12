'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
    Users, Plus, Search, Clock, UserPlus, Calendar, 
    Timer, Coffee, LogIn, LogOut, Loader2, Trash2, Edit, MoreHorizontal
} from "lucide-react"
import { supabase } from '@/utils/supabase/client'
import { EmployeeDialog } from '@/components/personal/EmployeeDialog'
import { TimeClockCard } from '@/components/personal/TimeClockCard'
import { TimeRecordsTable } from '@/components/personal/TimeRecordsTable'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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
    status: 'active' | 'inactive' | 'on_leave' | 'terminated'
    hourly_rate: number | null
}

type TimeRecord = {
    id: string
    employee_id: string
    record_date: string
    clock_in: string | null
    clock_out: string | null
    break_start: string | null
    break_end: string | null
    total_hours: number | null
    total_break_minutes: number | null
    status: string
    employees?: Employee
}

export default function PersonalPage() {
    const [loading, setLoading] = useState(true)
    const [employees, setEmployees] = useState<Employee[]>([])
    const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null)

    useEffect(() => {
        fetchData()
    }, [])

    async function fetchData() {
        setLoading(true)
        try {
            // Fetch employees
            const { data: empData } = await (supabase
                .from('employees') as any)
                .select('*')
                .order('first_name')

            setEmployees(empData || [])

            // Fetch today's time records
            const today = new Date().toISOString().split('T')[0]
            const { data: timeData } = await (supabase
                .from('time_records') as any)
                .select('*, employees(*)')
                .eq('record_date', today)

            setTimeRecords(timeData || [])
        } catch (error) {
            console.error('Error fetching data:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredEmployees = employees.filter(emp => 
        `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employee_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.position?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const activeEmployees = employees.filter(e => e.status === 'active').length
    const clockedInToday = timeRecords.filter(t => t.clock_in && !t.clock_out).length
    const totalHoursToday = timeRecords.reduce((sum, t) => sum + (t.total_hours || 0), 0)

    const handleEdit = (employee: Employee) => {
        setEditingEmployee(employee)
        setDialogOpen(true)
    }

    const handleDelete = async () => {
        if (!employeeToDelete) return
        
        try {
            await (supabase.from('employees') as any)
                .delete()
                .eq('id', employeeToDelete.id)
            
            fetchData()
        } catch (error) {
            console.error('Error deleting employee:', error)
        } finally {
            setDeleteDialogOpen(false)
            setEmployeeToDelete(null)
        }
    }

    const confirmDelete = (employee: Employee) => {
        setEmployeeToDelete(employee)
        setDeleteDialogOpen(true)
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
            active: { variant: 'default', label: 'Activo' },
            inactive: { variant: 'secondary', label: 'Inactivo' },
            on_leave: { variant: 'outline', label: 'Permiso' },
            terminated: { variant: 'destructive', label: 'Terminado' }
        }
        const config = variants[status] || variants.inactive
        return <Badge variant={config.variant}>{config.label}</Badge>
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Administración de Personal</h1>
                    <p className="text-muted-foreground">Gestiona empleados y control de tiempo</p>
                </div>
                <Button onClick={() => { setEditingEmployee(null); setDialogOpen(true) }}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Nuevo Empleado
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Empleados Activos</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{activeEmployees}</div>
                        <p className="text-xs text-muted-foreground">de {employees.length} total</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Trabajando Ahora</CardTitle>
                        <LogIn className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{clockedInToday}</div>
                        <p className="text-xs text-muted-foreground">registraron entrada hoy</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Horas Hoy</CardTitle>
                        <Timer className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalHoursToday.toFixed(1)}h</div>
                        <p className="text-xs text-muted-foreground">horas trabajadas</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Fecha</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {new Date().toLocaleDateString('es-ES', { weekday: 'long' })}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="employees" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="employees">
                        <Users className="mr-2 h-4 w-4" />
                        Empleados
                    </TabsTrigger>
                    <TabsTrigger value="timeclock">
                        <Clock className="mr-2 h-4 w-4" />
                        Reloj de Tiempo
                    </TabsTrigger>
                    <TabsTrigger value="records">
                        <Calendar className="mr-2 h-4 w-4" />
                        Historial
                    </TabsTrigger>
                </TabsList>

                {/* Empleados Tab */}
                <TabsContent value="employees" className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar empleado..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredEmployees.map((employee) => (
                            <Card key={employee.id} className="relative">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                                                {employee.first_name[0]}{employee.last_name[0]}
                                            </div>
                                            <div>
                                                <CardTitle className="text-base">
                                                    {employee.first_name} {employee.last_name}
                                                </CardTitle>
                                                <p className="text-sm text-muted-foreground">
                                                    {employee.employee_code}
                                                </p>
                                            </div>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEdit(employee)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Editar
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    onClick={() => confirmDelete(employee)}
                                                    className="text-destructive"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Eliminar
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Cargo:</span>
                                            <span>{employee.position || '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Departamento:</span>
                                            <span>{employee.department || '-'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Teléfono:</span>
                                            <span>{employee.phone || '-'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Estado:</span>
                                            {getStatusBadge(employee.status)}
                                        </div>
                                        {employee.hourly_rate && (
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Tarifa/hora:</span>
                                                <span className="font-medium">${employee.hourly_rate}</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {filteredEmployees.length === 0 && (
                        <div className="text-center py-12">
                            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                            <h3 className="mt-4 text-lg font-semibold">No hay empleados</h3>
                            <p className="text-muted-foreground">
                                {searchTerm ? 'No se encontraron resultados' : 'Agrega tu primer empleado'}
                            </p>
                        </div>
                    )}
                </TabsContent>

                {/* Time Clock Tab */}
                <TabsContent value="timeclock" className="space-y-4">
                    <TimeClockCard 
                        employees={employees.filter(e => e.status === 'active')} 
                        timeRecords={timeRecords}
                        onRefresh={fetchData}
                    />
                </TabsContent>

                {/* Records Tab */}
                <TabsContent value="records" className="space-y-4">
                    <TimeRecordsTable employees={employees} />
                </TabsContent>
            </Tabs>

            {/* Employee Dialog */}
            <EmployeeDialog 
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                employee={editingEmployee}
                onSuccess={fetchData}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar empleado?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente a 
                            <strong> {employeeToDelete?.first_name} {employeeToDelete?.last_name}</strong> y 
                            todos sus registros de tiempo.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
