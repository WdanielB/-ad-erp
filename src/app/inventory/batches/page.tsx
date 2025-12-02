import { BatchList } from '@/components/inventory/BatchList'

export default function BatchesPage() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Gestión de Lotes (Baldes)</h1>
                <p className="text-muted-foreground">
                    Control de flores perecederas, cambios de agua y cortes de tallo.
                </p>
            </div>
            <BatchList />
        </div>
    )
}
