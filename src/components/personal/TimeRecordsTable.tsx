'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { supabase } from '@/utils/supabase/client'
import { 
    Calendar, Download, Loader2, Search, Clock, 
    ChevronLeft, ChevronRight
} from 'lucide-react'

type Employee = {
    id: string
    employee_code: string | null
    first_name: string
    last_name: string
}

type TimeRecord = {
    id: string
    employee_id: string
    record_date: string
    clock_in: string | null
    clock_out: string | null
    total_hours: number | null
    total_break_minutes: number | null
    overtime_minutes: number | null
    status: string
    employees?: Employee
}

interface TimeRecordsTableProps {
    employees: Employee[]
}

export function TimeRecordsTable({ employees }: TimeRecordsTableProps) {
    const [loading, setLoading] = useState(true)
    const [records, setRecords] = useState<TimeRecord[]>([])
    const [selectedEmployee, setSelectedEmployee] = useState<string>('all')
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    })

    useEffect(() => {
        fetchRecords()
    }, [selectedEmployee, dateRange])

    async function fetchRecords() {
        setLoading(true)
        try {
            let query = (supabase.from('time_records') as any)
                .select('*, employees(*)')
                .gte('record_date', dateRange.start)
                .lte('record_date', dateRange.end)
                .order('record_date', { ascending: false })

            if (selectedEmployee !== 'all') {
                query = query.eq('employee_id', selectedEmployee)
            }

            const { data } = await query

            setRecords(data || [])
        } catch (error) {
            console.error('Error fetching records:', error)
        } finally {
            setLoading(false)
        }
    }

    const getStatusBadge = (status: string) => {
        const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string }> = {
            in_progress: { variant: 'default', label: 'En progreso' },
            completed: { variant: 'secondary', label: 'Completado' },
            approved: { variant: 'outline', label: 'Aprobado' },
            rejected: { variant: 'destructive', label: 'Rechazado' }
        }
        const config = variants[status] || variants.completed
        return <Badge variant={config.variant}>{config.label}</Badge>
    }

    const formatTime = (dateString: string | null) => {
        if (!dateString) return '--:--'
        return new Date(dateString).toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
        })
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-ES', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        })
    }

    const totalHours = records.reduce((sum, r) => sum + (r.total_hours || 0), 0)
    const totalOvertime = records.reduce((sum, r) => sum + (r.overtime_minutes || 0), 0)

    const exportToCSV = () => {
        const headers = ['Fecha', 'Empleado', 'Código', 'Entrada', 'Salida', 'Descanso (min)', 'Total Horas', 'Horas Extra', 'Estado']
        const rows = records.map(r => [
            r.record_date,
            r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : '',
            r.employees?.employee_code || '',
            formatTime(r.clock_in),
            formatTime(r.clock_out),
            r.total_break_minutes || 0,
            r.total_hours?.toFixed(2) || '0.00',
            ((r.overtime_minutes || 0) / 60).toFixed(2),
            r.status
        ])

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `registros_tiempo_${dateRange.start}_${dateRange.end}.csv`
        a.click()
    }

    // Quick date presets
    const setPresetRange = (preset: string) => {
        const today = new Date()
        let start: Date
        
        switch (preset) {
            case 'today':
                start = today
                break
            case 'week':
                start = new Date(today.setDate(today.getDate() - 7))
                break
            case 'month':
                start = new Date(today.getFullYear(), today.getMonth(), 1)
                break
            case 'last_month':
                start = new Date(today.getFullYear(), today.getMonth() - 1, 1)
                const end = new Date(today.getFullYear(), today.getMonth(), 0)
                setDateRange({
                    start: start.toISOString().split('T')[0],
                    end: end.toISOString().split('T')[0]
                })
                return
            default:
                start = new Date(today.setDate(today.getDate() - 7))
        }
        
        setDateRange({
            start: start.toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0]
        })
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center">
                            <Calendar className="mr-2 h-5 w-5" />
                            Historial de Registros
                        </CardTitle>
                        <CardDescription>
                            Consulta y exporta los registros de tiempo
                        </CardDescription>
                    </div>
                    <Button variant="outline" onClick={exportToCSV}>
                        <Download className="mr-2 h-4 w-4" />
                        Exportar CSV
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="space-y-1">
                        <label className="text-sm text-muted-foreground">Empleado</label>
                        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Todos los empleados" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los empleados</SelectItem>
                                {employees.map((emp) => (
                                    <SelectItem key={emp.id} value={emp.id}>
                                        {emp.first_name} {emp.last_name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm text-muted-foreground">Desde</label>
                        <Input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                            className="w-[160px]"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm text-muted-foreground">Hasta</label>
                        <Input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                            className="w-[160px]"
                        />
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setPresetRange('today')}>
                            Hoy
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setPresetRange('week')}>
                            Semana
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setPresetRange('month')}>
                            Este Mes
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setPresetRange('last_month')}>
                            Mes Anterior
                        </Button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">Total Registros</p>
                        <p className="text-2xl font-bold">{records.length}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">Horas Totales</p>
                        <p className="text-2xl font-bold">{totalHours.toFixed(1)}h</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">Horas Extra</p>
                        <p className="text-2xl font-bold">{(totalOvertime / 60).toFixed(1)}h</p>
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : records.length === 0 ? (
                    <div className="text-center py-12">
                        <Clock className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">Sin registros</h3>
                        <p className="text-muted-foreground">
                            No hay registros para el período seleccionado
                        </p>
                    </div>
                ) : (
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead>Empleado</TableHead>
                                    <TableHead>Entrada</TableHead>
                                    <TableHead>Salida</TableHead>
                                    <TableHead>Descanso</TableHead>
                                    <TableHead>Total Horas</TableHead>
                                    <TableHead>Horas Extra</TableHead>
                                    <TableHead>Estado</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {records.map((record) => (
                                    <TableRow key={record.id}>
                                        <TableCell className="font-medium">
                                            {formatDate(record.record_date)}
                                        </TableCell>
                                        <TableCell>
                                            {record.employees 
                                                ? `${record.employees.first_name} ${record.employees.last_name}`
                                                : '-'
                                            }
                                        </TableCell>
                                        <TableCell>{formatTime(record.clock_in)}</TableCell>
                                        <TableCell>{formatTime(record.clock_out)}</TableCell>
                                        <TableCell>{record.total_break_minutes || 0} min</TableCell>
                                        <TableCell className="font-medium">
                                            {record.total_hours?.toFixed(2) || '0.00'}h
                                        </TableCell>
                                        <TableCell>
                                            {record.overtime_minutes && record.overtime_minutes > 0 ? (
                                                <Badge variant="outline" className="text-orange-600">
                                                    +{(record.overtime_minutes / 60).toFixed(1)}h
                                                </Badge>
                                            ) : (
                                                '-'
                                            )}
                                        </TableCell>
                                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
