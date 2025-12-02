'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ArrowDown, ArrowUp, DollarSign } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { NewTransactionDialog } from './NewTransactionDialog'
import { supabase } from '@/utils/supabase/client'
import { Database } from '@/types/database.types'

type Transaction = Database['public']['Tables']['transactions']['Row']

export function TransactionList() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchTransactions()
    }, [])

    async function fetchTransactions() {
        setLoading(true)
        const { data } = await supabase
            .from('transactions')
            .select('*')
            .order('date', { ascending: false })
            .limit(50)

        if (data) setTransactions(data)
        setLoading(false)
    }

    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0)

    const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)

    const netProfit = totalIncome - totalExpenses

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
                        <ArrowUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">S/ {totalIncome.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
                        <ArrowDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">S/ {totalExpenses.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Utilidad Neta</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            S/ {netProfit.toFixed(2)}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Transacciones Recientes</h2>
                <NewTransactionDialog onTransactionAdded={fetchTransactions} />
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-right">Monto</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8">
                                    Cargando...
                                </TableCell>
                            </TableRow>
                        ) : transactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    No hay transacciones registradas.
                                </TableCell>
                            </TableRow>
                        ) : (
                            transactions.map((transaction) => (
                                <TableRow key={transaction.id}>
                                    <TableCell>
                                        {transaction.date ? format(new Date(transaction.date), 'dd/MM/yyyy HH:mm', { locale: es }) : '-'}
                                    </TableCell>
                                    <TableCell>{transaction.description}</TableCell>
                                    <TableCell>
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {transaction.type === 'income' ? 'Ingreso' : 'Gasto'}
                                        </span>
                                    </TableCell>
                                    <TableCell className={`text-right font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {transaction.type === 'income' ? '+' : '-'} S/ {transaction.amount.toFixed(2)}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
