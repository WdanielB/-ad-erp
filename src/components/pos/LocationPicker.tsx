'use client'

import { MapPin } from 'lucide-react'

interface LocationPickerProps {
    onLocationSelect: (location: { lat: number; lng: number }) => void
    initialLocation?: { lat: number; lng: number } | null
}

export function LocationPicker({ onLocationSelect, initialLocation }: LocationPickerProps) {
    return (
        <div className="h-[150px] w-full flex flex-col items-center justify-center bg-muted/50 rounded-md border border-dashed p-4 text-center text-muted-foreground">
            <MapPin className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Integración de mapas pendiente</p>
            <p className="text-xs mt-1">(Se habilitará en una futura actualización)</p>
        </div>
    )
}
