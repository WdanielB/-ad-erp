'use client'

import { MaintenanceTaskList } from '@/components/workshop/MaintenanceTaskList'
import { VisualBatchCreator } from '@/components/workshop/VisualBatchCreator'

export default function WorkshopPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Taller & Mantenimiento</h1>
                    <p className="text-muted-foreground">
                        Gestión visual de baldes y tareas de cuidado.
                    </p>
                </div>
                <VisualBatchCreator onBatchCreated={() => window.location.reload()} />
            </div>

            <MaintenanceTaskList />
        </div>
    )
}
