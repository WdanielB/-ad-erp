'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Flower2, Loader2, Eye, EyeOff } from 'lucide-react'
import { supabase } from '@/utils/supabase/client'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

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

        if (data.user) {
            // Verificar si el usuario está activo (con timeout)
            try {
                const { data: profile, error: profileError } = await (supabase
                    .from('user_profiles')
                    .select('is_active, role')
                    .eq('id', data.user.id)
                    .single() as any)

                if (profileError) {
                    console.log('Error al cargar perfil:', profileError.message)
                    // Si no hay perfil, continuar de todos modos
                }

                if (profile && !profile.is_active) {
                    await supabase.auth.signOut()
                    setError('Tu cuenta está desactivada. Contacta al administrador.')
                    setLoading(false)
                    return
                }
            } catch (err) {
                console.log('Error verificando perfil:', err)
                // Continuar de todos modos si hay error
            }

            router.push('/')
            router.refresh()
        }

        setLoading(false)
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-pink-50">
            <Card className="w-full max-w-md mx-4 shadow-lg">
                <CardHeader className="text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Flower2 className="h-10 w-10 text-primary" />
                        </div>
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold">Vitora ERP</CardTitle>
                        <CardDescription>Florería Vitora - Sistema de Gestión</CardDescription>
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
