'use client'

import { useState, useCallback, useEffect } from 'react'
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api'
import { Loader2 } from 'lucide-react'

const containerStyle = {
    width: '100%',
    height: '300px'
}

const defaultCenter = {
    lat: -12.0464,
    lng: -77.0428
}

interface LocationPickerProps {
    onLocationSelect: (location: { lat: number; lng: number }) => void
    initialLocation?: { lat: number; lng: number } | null
}

export function LocationPicker({ onLocationSelect, initialLocation }: LocationPickerProps) {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
    })

    const [map, setMap] = useState<google.maps.Map | null>(null)
    const [markerPosition, setMarkerPosition] = useState<google.maps.LatLngLiteral | null>(
        initialLocation || null
    )

    const onLoad = useCallback(function callback(map: google.maps.Map) {
        setMap(map)
    }, [])

    const onUnmount = useCallback(function callback(map: google.maps.Map) {
        setMap(null)
    }, [])

    const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const newPos = {
                lat: e.latLng.lat(),
                lng: e.latLng.lng()
            }
            setMarkerPosition(newPos)
            onLocationSelect(newPos)
        }
    }, [onLocationSelect])

    useEffect(() => {
        if (initialLocation) {
            setMarkerPosition(initialLocation)
        }
    }, [initialLocation])

    if (!isLoaded) {
        return <div className="h-[300px] w-full flex items-center justify-center bg-muted rounded-md border">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    }

    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
        return (
            <div className="h-[300px] w-full flex items-center justify-center bg-muted rounded-md border p-4 text-center text-muted-foreground text-sm">
                Para ver el mapa, configura la variable de entorno NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
            </div>
        )
    }

    return (
        <GoogleMap
            mapContainerStyle={containerStyle}
            center={markerPosition || defaultCenter}
            zoom={13}
            onLoad={onLoad}
            onUnmount={onUnmount}
            onClick={onMapClick}
            options={{
                streetViewControl: false,
                mapTypeControl: false,
                fullscreenControl: false,
            }}
        >
            {markerPosition && (
                <Marker position={markerPosition} />
            )}
        </GoogleMap>
    )
}
