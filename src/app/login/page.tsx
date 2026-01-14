'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/utils/supabase/client'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [checkingSession, setCheckingSession] = useState(true)
    const router = useRouter()

    // Verificar si ya hay sesión activa
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                router.replace('/pos')
            } else {
                setCheckingSession(false)
            }
        }
        checkSession()
    }, [router])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                setError(error.message === 'Invalid login credentials' 
                    ? 'Credenciales inválidas. Verifica tu email y contraseña.'
                    : error.message)
                setLoading(false)
                return
            }

            if (data.session) {
                // Login exitoso - redirigir al POS
                // El AuthContext se encargará de cargar el perfil
                router.push('/pos')
                return
            }
        } catch (err) {
            console.error('Login error:', err)
            setError('Error al iniciar sesión. Intenta de nuevo.')
            setLoading(false)
        }
    }

    // Mostrar loading mientras verifica sesión
    if (checkingSession) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1e212b' }}>
                <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#1e212b' }}>
            <Card className="w-full max-w-md mx-4 shadow-lg">
                <CardHeader className="text-center space-y-4">
                    <div className="flex justify-center overflow-hidden">
                        <img 
                            src="https://cdn.shopify.com/s/files/1/0649/4083/4883/files/ICONOS_y_LOGOS.png?v=1768371235" 
                            alt="Vitora Logo" 
                            className="w-56 object-cover object-center"
                            style={{ height: '80px', objectFit: 'cover' }}
                        />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold">Vitora ERP</CardTitle>
                        <CardDescription>Sistema de Gestión</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-100 text-red-800 border border-red-300 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="tu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Iniciando sesión...
                                </>
                            ) : (
                                'Iniciar Sesión'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
