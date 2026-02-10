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
                    main_flower_id: string | null
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
                    main_flower_id?: string | null
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
                    main_flower_id?: string | null
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
            flower_colors: {
                Row: {
                    id: string
                    name: string
                    hex: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    hex: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    hex?: string
                    created_at?: string
                }
            }
            product_flower_colors: {
                Row: {
                    id: string
                    product_id: string | null
                    color_id: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    product_id?: string | null
                    color_id?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    product_id?: string | null
                    color_id?: string | null
                    created_at?: string
                }
            }
            product_recipe_flower_colors: {
                Row: {
                    id: string
                    recipe_id: string | null
                    color_id: string | null
                    quantity: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    recipe_id?: string | null
                    color_id?: string | null
                    quantity?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    recipe_id?: string | null
                    color_id?: string | null
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
                    color_id: string | null
                    quantity: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    order_item_id?: string | null
                    product_id?: string | null
                    color_id?: string | null
                    quantity?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    order_item_id?: string | null
                    product_id?: string | null
                    color_id?: string | null
                    quantity?: number | null
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
            employees: {
                Row: {
                    id: string
                    employee_code: string | null
                    first_name: string
                    last_name: string
                    email: string | null
                    phone: string | null
                    position: string | null
                    department: string | null
                    hire_date: string | null
                    birth_date: string | null
                    address: string | null
                    emergency_contact_name: string | null
                    emergency_contact_phone: string | null
                    hourly_rate: number | null
                    salary: number | null
                    status: 'active' | 'inactive' | 'on_leave' | 'terminated'
                    photo_url: string | null
                    notes: string | null
                    custom_fields: Record<string, any> | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    employee_code?: string | null
                    first_name: string
                    last_name: string
                    email?: string | null
                    phone?: string | null
                    position?: string | null
                    department?: string | null
                    hire_date?: string | null
                    birth_date?: string | null
                    address?: string | null
                    emergency_contact_name?: string | null
                    emergency_contact_phone?: string | null
                    hourly_rate?: number | null
                    salary?: number | null
                    status?: 'active' | 'inactive' | 'on_leave' | 'terminated'
                    photo_url?: string | null
                    notes?: string | null
                    custom_fields?: Record<string, any> | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    employee_code?: string | null
                    first_name?: string
                    last_name?: string
                    email?: string | null
                    phone?: string | null
                    position?: string | null
                    department?: string | null
                    hire_date?: string | null
                    birth_date?: string | null
                    address?: string | null
                    emergency_contact_name?: string | null
                    emergency_contact_phone?: string | null
                    hourly_rate?: number | null
                    salary?: number | null
                    status?: 'active' | 'inactive' | 'on_leave' | 'terminated'
                    photo_url?: string | null
                    notes?: string | null
                    custom_fields?: Record<string, any> | null
                    created_at?: string
                    updated_at?: string
                }
            }
            time_records: {
                Row: {
                    id: string
                    employee_id: string
                    record_date: string
                    clock_in: string | null
                    clock_out: string | null
                    break_start: string | null
                    break_end: string | null
                    total_break_minutes: number | null
                    total_work_minutes: number | null
                    total_hours: number | null
                    overtime_minutes: number | null
                    status: 'in_progress' | 'completed' | 'approved' | 'rejected'
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    employee_id: string
                    record_date?: string
                    clock_in?: string | null
                    clock_out?: string | null
                    break_start?: string | null
                    break_end?: string | null
                    total_break_minutes?: number | null
                    total_work_minutes?: number | null
                    total_hours?: number | null
                    overtime_minutes?: number | null
                    status?: 'in_progress' | 'completed' | 'approved' | 'rejected'
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    employee_id?: string
                    record_date?: string
                    clock_in?: string | null
                    clock_out?: string | null
                    break_start?: string | null
                    break_end?: string | null
                    total_break_minutes?: number | null
                    total_work_minutes?: number | null
                    total_hours?: number | null
                    overtime_minutes?: number | null
                    status?: 'in_progress' | 'completed' | 'approved' | 'rejected'
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            time_breaks: {
                Row: {
                    id: string
                    time_record_id: string
                    break_start: string
                    break_end: string | null
                    break_type: string | null
                    duration_minutes: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    time_record_id: string
                    break_start: string
                    break_end?: string | null
                    break_type?: string | null
                    duration_minutes?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    time_record_id?: string
                    break_start?: string
                    break_end?: string | null
                    break_type?: string | null
                    duration_minutes?: number | null
                    created_at?: string
                }
            }
            employee_custom_fields: {
                Row: {
                    id: string
                    field_name: string
                    field_label: string
                    field_type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'textarea'
                    options: any[] | null
                    is_required: boolean | null
                    is_active: boolean | null
                    display_order: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    field_name: string
                    field_label: string
                    field_type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'textarea'
                    options?: any[] | null
                    is_required?: boolean | null
                    is_active?: boolean | null
                    display_order?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    field_name?: string
                    field_label?: string
                    field_type?: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'textarea'
                    options?: any[] | null
                    is_required?: boolean | null
                    is_active?: boolean | null
                    display_order?: number | null
                    created_at?: string
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
            employee_status: 'active' | 'inactive' | 'on_leave' | 'terminated'
            time_record_status: 'in_progress' | 'completed' | 'approved' | 'rejected'
            custom_field_type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'textarea'
        }
    }
}
