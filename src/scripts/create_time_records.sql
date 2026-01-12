-- ======================================
-- Crear tabla time_records para registro de asistencia
-- Ejecutar en el SQL Editor de Supabase
-- ======================================

-- Crear tabla time_records
CREATE TABLE IF NOT EXISTS time_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    record_date DATE NOT NULL,
    clock_in TIMESTAMP WITH TIME ZONE,
    clock_out TIMESTAMP WITH TIME ZONE,
    break_start TIMESTAMP WITH TIME ZONE,
    break_end TIMESTAMP WITH TIME ZONE,
    clock_in_latitude DECIMAL(10, 8),
    clock_in_longitude DECIMAL(11, 8),
    clock_out_latitude DECIMAL(10, 8),
    clock_out_longitude DECIMAL(11, 8),
    location_verified BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'pending', -- pending, in_progress, completed
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_time_records_employee ON time_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_time_records_date ON time_records(record_date);
CREATE INDEX IF NOT EXISTS idx_time_records_employee_date ON time_records(employee_id, record_date);

-- Deshabilitar RLS para simplicidad (o configurar políticas según necesidad)
ALTER TABLE time_records DISABLE ROW LEVEL SECURITY;

-- Permisos
GRANT ALL ON time_records TO anon;
GRANT ALL ON time_records TO authenticated;

-- Verificación
SELECT 'Tabla time_records creada correctamente' as resultado;
