export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            categories: {
                Row: {
                    id: string
                    name: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    created_at?: string
                }
            }
            products: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    sku: string | null
                    type: 'standard' | 'flower' | 'composite'
                    price: number
                    cost: number | null
                    stock: number | null
                    category_id: string | null
                    image_url: string | null
                    flower_color_name: string | null
                    flower_color_hex: string | null
                    care_days_water: number | null
                    care_days_cut: number | null
                    labor_cost: number | null
                    units_per_package: number | null
                    is_active: boolean | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    sku?: string | null
                    type?: 'standard' | 'flower' | 'composite'
                    price: number
                    cost?: number | null
                    stock?: number | null
                    category_id?: string | null
                    image_url?: string | null
                    flower_color_name?: string | null
                    flower_color_hex?: string | null
                    care_days_water?: number | null
                    care_days_cut?: number | null
                    labor_cost?: number | null
                    units_per_package?: number | null
                    is_active?: boolean | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    sku?: string | null
                    type?: 'standard' | 'flower' | 'composite'
                    price?: number
                    cost?: number | null
                    stock?: number | null
                    category_id?: string | null
                    image_url?: string | null
                    flower_color_name?: string | null
                    flower_color_hex?: string | null
                    care_days_water?: number | null
                    care_days_cut?: number | null
                    labor_cost?: number | null
                    units_per_package?: number | null
                    is_active?: boolean | null
                    created_at?: string
                }
            }
            product_recipes: {
                Row: {
                    id: string
                    parent_product_id: string | null
                    child_product_id: string | null
                    quantity: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    parent_product_id?: string | null
                    child_product_id?: string | null
                    quantity: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    parent_product_id?: string | null
                    child_product_id?: string | null
                    quantity?: number
                    created_at?: string
                }
            }
            inventory_batches: {
                Row: {
                    id: string
                    product_id: string | null
                    bucket_code: string
                    initial_quantity: number
                    current_quantity: number
                    entry_date: string | null
                    last_water_change: string | null
                    last_stem_cut: string | null
                    status: 'active' | 'empty' | 'discarded' | null
                    cost_per_unit: number | null
                }
                Insert: {
                    id?: string
                    product_id?: string | null
                    bucket_code: string
                    initial_quantity: number
                    current_quantity: number
                    entry_date?: string | null
                    last_water_change?: string | null
                    last_stem_cut?: string | null
                    status?: 'active' | 'empty' | 'discarded' | null
                    cost_per_unit?: number | null
                }
                Update: {
                    id?: string
                    product_id?: string | null
                    bucket_code?: string
                    initial_quantity?: number
                    current_quantity?: number
                    entry_date?: string | null
                    last_water_change?: string | null
                    last_stem_cut?: string | null
                    status?: 'active' | 'empty' | 'discarded' | null
                    cost_per_unit?: number | null
                }
            }
            clients: {
                Row: {
                    id: string
                    full_name: string
                    phone: string | null
                    email: string | null
                    address: string | null
                    birthday: string | null
                    notes: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    full_name: string
                    phone?: string | null
                    email?: string | null
                    address?: string | null
                    birthday?: string | null
                    notes?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    full_name?: string
                    phone?: string | null
                    email?: string | null
                    address?: string | null
                    birthday?: string | null
                    notes?: string | null
                    created_at?: string
                }
            }
            orders: {
                Row: {
                    id: string
                    client_id: string | null
                    total_amount: number
                    status: 'pending' | 'paid' | 'preparing' | 'delivered' | 'cancelled' | null
                    delivery_date: string
                    delivery_address: string | null
                    delivery_type: string | null
                    client_phone: string | null
                    dedication: string | null
                    notes: string | null
                    label_color: string | null
                    delivery_fee: number | null
                    delivery_latitude: number | null
                    delivery_longitude: number | null
                    ticket_number: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    client_id?: string | null
                    total_amount: number
                    status?: 'pending' | 'paid' | 'preparing' | 'delivered' | 'cancelled' | null
                    delivery_date: string
                    delivery_address?: string | null
                    delivery_type?: string | null
                    client_phone?: string | null
                    dedication?: string | null
                    notes?: string | null
                    label_color?: string | null
                    delivery_fee?: number | null
                    delivery_latitude?: number | null
                    delivery_longitude?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    client_id?: string | null
                    total_amount?: number
                    status?: 'pending' | 'paid' | 'preparing' | 'delivered' | 'cancelled' | null
                    delivery_date?: string
                    delivery_address?: string | null
                    delivery_type?: string | null
                    client_phone?: string | null
                    dedication?: string | null
                    notes?: string | null
                    label_color?: string | null
                    delivery_fee?: number | null
                    delivery_latitude?: number | null
                    delivery_longitude?: number | null
                    created_at?: string
                }
            }
            order_items: {
                Row: {
                    id: string
                    order_id: string | null
                    product_id: string | null
                    custom_item_name: string | null
                    quantity: number
                    unit_price: number
                    subtotal: number | null
                    is_custom: boolean | null
                }
                Insert: {
                    id?: string
                    order_id?: string | null
                    product_id?: string | null
                    custom_item_name?: string | null
                    quantity: number
                    unit_price: number
                    subtotal?: number | null
                    is_custom?: boolean | null
                }
                Update: {
                    id?: string
                    order_id?: string | null
                    product_id?: string | null
                    custom_item_name?: string | null
                    quantity?: number
                    unit_price?: number
                    subtotal?: number | null
                    is_custom?: boolean | null
                }
            }
            transaction_categories: {
                Row: {
                    id: string
                    name: string
                    type: 'income' | 'expense'
                }
                Insert: {
                    id?: string
                    name: string
                    type: 'income' | 'expense'
                }
                Update: {
                    id?: string
                    name?: string
                    type?: 'income' | 'expense'
                }
            }
            transactions: {
                Row: {
                    id: string
                    description: string
                    amount: number
                    type: 'income' | 'expense'
                    category_id: string | null
                    date: string | null
                    related_order_id: string | null
                    related_batch_id: string | null
                }
                Insert: {
                    id?: string
                    description: string
                    amount: number
                    type: 'income' | 'expense'
                    category_id?: string | null
                    date?: string | null
                    related_order_id?: string | null
                    related_batch_id?: string | null
                }
                Update: {
                    id?: string
                    description?: string
                    amount?: number
                    type?: 'income' | 'expense'
                    category_id?: string | null
                    date?: string | null
                    related_order_id?: string | null
                    related_batch_id?: string | null
                }
            }
            custom_item_flowers: {
                Row: {
                    id: string
                    order_item_id: string | null
                    product_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    order_item_id?: string | null
                    product_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    order_item_id?: string | null
                    product_id?: string | null
                    created_at?: string
                }
            }
            product_price_history: {
                Row: {
                    id: string
                    product_id: string | null
                    price: number
                    cost: number | null
                    recorded_at: string
                }
                Insert: {
                    id?: string
                    product_id?: string | null
                    price: number
                    cost?: number | null
                    recorded_at?: string
                }
                Update: {
                    id?: string
                    product_id?: string | null
                    price?: number
                    cost?: number | null
                    recorded_at?: string
                }
            }
            settings: {
                Row: {
                    id: string
                    key: string
                    value: string | null
                    description: string | null
                    category: string | null
                    updated_at: string
                }
                Insert: {
                    id?: string
                    key: string
                    value?: string | null
                    description?: string | null
                    category?: string | null
                    updated_at?: string
                }
                Update: {
                    id?: string
                    key?: string
                    value?: string | null
                    description?: string | null
                    category?: string | null
                    updated_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            product_type: 'standard' | 'flower' | 'composite'
            order_status: 'pending' | 'paid' | 'preparing' | 'delivered' | 'cancelled'
            batch_status: 'active' | 'empty' | 'discarded'
            transaction_type: 'income' | 'expense'
        }
    }
}
