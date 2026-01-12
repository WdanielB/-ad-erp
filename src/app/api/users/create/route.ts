import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Cliente con service_role para operaciones admin
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

export async function POST(request: NextRequest) {
    try {
        const { email, password, full_name, role, employee_id } = await request.json()

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email y contraseña son requeridos' },
                { status: 400 }
            )
        }

        // Crear usuario en auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirmar email
            user_metadata: {
                full_name,
                role: role || 'vendedor'
            }
        })

        if (authError) {
            return NextResponse.json(
                { error: authError.message },
                { status: 400 }
            )
        }

        // Actualizar el perfil con el employee_id si existe
        if (authData.user && employee_id) {
            // Actualizar user_profiles con employee_id
            await supabaseAdmin
                .from('user_profiles')
                .update({ 
                    employee_id,
                    role: role || 'vendedor',
                    full_name 
                })
                .eq('id', authData.user.id)

            // Actualizar empleado con user_id para vinculación bidireccional
            await supabaseAdmin
                .from('employees')
                .update({ user_id: authData.user.id })
                .eq('id', employee_id)
        }

        return NextResponse.json({
            success: true,
            user: {
                id: authData.user?.id,
                email: authData.user?.email
            }
        })

    } catch (error) {
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        )
    }
}
