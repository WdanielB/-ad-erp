-- Create settings table for admin configurations
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    category VARCHAR(50),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO settings (key, value, description, category) VALUES
('delivery_fee_default', '10', 'Precio por defecto del delivery', 'pricing'),
('business_hours_start', '09:00', 'Hora de apertura', 'schedule'),
('business_hours_end', '18:00', 'Hora de cierre', 'schedule'),
('delivery_time_range', '30-50', 'Rango de tiempo de entrega en minutos', 'delivery'),
('business_name', 'Vitora', 'Nombre del negocio', 'general'),
('business_phone', '999999999', 'Teléfono del negocio', 'general'),
('business_address', 'Lima, Perú', 'Dirección del negocio', 'general'),
('tax_rate', '0', 'Tasa de impuesto (%)', 'pricing'),
('currency_symbol', 'S/', 'Símbolo de moneda', 'general')
ON CONFLICT (key) DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON settings TO anon;

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all operations on settings" ON settings FOR ALL USING (true) WITH CHECK (true);

-- Create index
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);

COMMENT ON TABLE settings IS 'System-wide configuration settings for the admin panel';
