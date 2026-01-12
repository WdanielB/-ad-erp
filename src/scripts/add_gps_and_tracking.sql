-- ======================================
-- Script de actualización para:
-- 1. Agregar campos created_by a orders (seguimiento de vendedores)
-- 2. Agregar campos GPS a time_records
-- 3. Crear tabla business_settings
-- ======================================

-- 1. TABLA DE CONFIGURACIÓN DEL NEGOCIO
-- ======================================
CREATE TABLE IF NOT EXISTS business_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permisos
ALTER TABLE business_settings DISABLE ROW LEVEL SECURITY;
GRANT ALL ON business_settings TO anon;
GRANT ALL ON business_settings TO authenticated;

-- Insertar configuraciones predeterminadas
INSERT INTO business_settings (key, value) VALUES
    ('business_name', 'Florería Vitora'),
    ('business_latitude', ''),
    ('business_longitude', ''),
    ('allowed_radius_meters', '100'),
    ('require_location_for_clock', 'true')
ON CONFLICT (key) DO NOTHING;


-- 2. CAMPOS PARA TRACKING DE CREADOR DE ÓRDENES
-- ======================================
ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_by_name TEXT;


-- 3. CAMPOS GPS PARA TIME RECORDS
-- ======================================
ALTER TABLE time_records ADD COLUMN IF NOT EXISTS clock_in_latitude DECIMAL(10, 8);
ALTER TABLE time_records ADD COLUMN IF NOT EXISTS clock_in_longitude DECIMAL(11, 8);
ALTER TABLE time_records ADD COLUMN IF NOT EXISTS clock_out_latitude DECIMAL(10, 8);
ALTER TABLE time_records ADD COLUMN IF NOT EXISTS clock_out_longitude DECIMAL(11, 8);
ALTER TABLE time_records ADD COLUMN IF NOT EXISTS location_verified BOOLEAN DEFAULT false;


-- 4. ÍNDICES PARA MEJOR RENDIMIENTO
-- ======================================
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON orders(created_by);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_time_records_date ON time_records(record_date);


-- ======================================
-- VERIFICACIÓN
-- ======================================
-- Puedes verificar que todo se creó correctamente con:
-- SELECT * FROM business_settings;
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'orders' AND column_name IN ('created_by', 'created_by_name');
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'time_records' AND column_name LIKE '%latitude%';
