import { TransactionList } from '@/components/finance/TransactionList'

export default function FinancePage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Finanzas</h1>
                <p className="text-muted-foreground">
                    Gestión de ingresos, gastos y rentabilidad.
                </p>
            </div>

            <TransactionList />
        </div>
    )
}
