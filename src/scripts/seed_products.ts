import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const flowers = [
    {
        name: 'Rosas Rojas (Paquete x 24)',
        type: 'flower',
        price: 60.00,
        cost: 35.00,
        stock: 50,
        care_days_water: 2,
        care_days_cut: 3,
        flower_color_name: 'Rojo',
        flower_color_hex: '#FF0000',
        image_url: 'https://images.unsplash.com/photo-1548695607-9c73430ba065?q=80&w=1000&auto=format&fit=crop'
    },
    {
        name: 'Tulipanes Variados (Paquete x 10)',
        type: 'flower',
        price: 80.00,
        cost: 45.00,
        stock: 30,
        care_days_water: 1,
        care_days_cut: 2,
        flower_color_name: 'Variado',
        flower_color_hex: '#FFC0CB',
        image_url: 'https://images.unsplash.com/photo-1520763185298-1b434c919102?q=80&w=1000&auto=format&fit=crop'
    },
    {
        name: 'Girasoles (Paquete x 5)',
        type: 'flower',
        price: 45.00,
        cost: 20.00,
        stock: 40,
        care_days_water: 2,
        care_days_cut: 4,
        flower_color_name: 'Amarillo',
        flower_color_hex: '#FFD700',
        image_url: 'https://images.unsplash.com/photo-1470509037663-253afd7f0f51?q=80&w=1000&auto=format&fit=crop'
    },
    {
        name: 'Lirios Blancos (Paquete x 10)',
        type: 'flower',
        price: 55.00,
        cost: 28.00,
        stock: 25,
        care_days_water: 2,
        care_days_cut: 3,
        flower_color_name: 'Blanco',
        flower_color_hex: '#FFFFFF',
        image_url: 'https://images.unsplash.com/photo-1572454591674-2739f30d8c40?q=80&w=1000&auto=format&fit=crop'
    },
    {
        name: 'Claveles (Paquete x 24)',
        type: 'flower',
        price: 35.00,
        cost: 15.00,
        stock: 60,
        care_days_water: 3,
        care_days_cut: 4,
        flower_color_name: 'Rosado',
        flower_color_hex: '#FF69B4',
        image_url: 'https://images.unsplash.com/photo-1566808908647-63f47e07256c?q=80&w=1000&auto=format&fit=crop'
    },
    {
        name: 'Gerberas (Paquete x 12)',
        type: 'flower',
        price: 48.00,
        cost: 25.00,
        stock: 35,
        care_days_water: 2,
        care_days_cut: 3,
        flower_color_name: 'Naranja',
        flower_color_hex: '#FFA500',
        image_url: 'https://images.unsplash.com/photo-1527061011665-3652c757a4d4?q=80&w=1000&auto=format&fit=crop'
    },
    {
        name: 'Hortensias Azules (Unidad)',
        type: 'flower',
        price: 25.00,
        cost: 12.00,
        stock: 20,
        care_days_water: 1,
        care_days_cut: 2,
        flower_color_name: 'Azul',
        flower_color_hex: '#4169E1',
        image_url: 'https://images.unsplash.com/photo-1501430654243-c934cec2e1c0?q=80&w=1000&auto=format&fit=crop'
    },
    {
        name: 'Astromelias (Paquete x 10)',
        type: 'flower',
        price: 30.00,
        cost: 12.00,
        stock: 45,
        care_days_water: 3,
        care_days_cut: 4,
        flower_color_name: 'Lila',
        flower_color_hex: '#D8BFD8',
        image_url: 'https://images.unsplash.com/photo-1563241527-9d2b33d36eb3?q=80&w=1000&auto=format&fit=crop'
    },
    {
        name: 'Gypsophila / Lluvia (Paquete)',
        type: 'flower',
        price: 25.00,
        cost: 10.00,
        stock: 40,
        care_days_water: 3,
        care_days_cut: 5,
        flower_color_name: 'Blanco',
        flower_color_hex: '#F0F8FF',
        image_url: 'https://images.unsplash.com/photo-1602615576820-ea14cf3e476a?q=80&w=1000&auto=format&fit=crop'
    },
    {
        name: 'Orquídea Phalaenopsis (Planta)',
        type: 'flower',
        price: 120.00,
        cost: 70.00,
        stock: 10,
        care_days_water: 7,
        care_days_cut: 0, // No cut needed usually
        flower_color_name: 'Blanco',
        flower_color_hex: '#FFFFFF',
        image_url: 'https://images.unsplash.com/photo-1546255506-69760773994d?q=80&w=1000&auto=format&fit=crop'
    }
]

async function seed() {
    console.log('Seeding products...')

    for (const flower of flowers) {
        const { error } = await supabase
            .from('products')
            .insert(flower)

        if (error) {
            console.error(`Error inserting ${flower.name}:`, error.message)
        } else {
            console.log(`Inserted: ${flower.name}`)
        }
    }

    console.log('Seeding complete!')
}

seed()
