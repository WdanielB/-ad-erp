'use client'

import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ShieldX, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export default function NoAccessPage() {
    const { profile, signOut } = useAuth()

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
            <Card className="w-full max-w-md mx-4 shadow-lg">
                <CardHeader className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                            <ShieldX className="h-10 w-10 text-red-600" />
                        </div>
                    </div>
                    <CardTitle className="text-xl font-bold text-red-800">
                        Acceso Denegado
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-muted-foreground">
                        No tienes permiso para acceder a esta sección.
                    </p>
                    {profile && (
                        <p className="text-sm text-muted-foreground">
                            Tu rol actual: <span className="font-medium capitalize">{profile.role}</span>
                        </p>
                    )}
                    <div className="flex flex-col gap-2 pt-4">
                        <Link href="/">
                            <Button className="w-full">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver al Dashboard
                            </Button>
                        </Link>
                        <Button variant="outline" onClick={signOut}>
                            Cerrar Sesión
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
