-- Add new fields to orders table for scheduled order details
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_type VARCHAR(50); -- 'delivery' or 'pickup'
ALTER TABLE orders ADD COLUMN IF NOT EXISTS client_phone VARCHAR(20);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dedication TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add comment to describe the fields
COMMENT ON COLUMN orders.delivery_type IS 'Type of order: delivery (entrega) or pickup (recojo)';
COMMENT ON COLUMN orders.client_phone IS 'Client phone number for contact';
COMMENT ON COLUMN orders.dedication IS 'Dedication message for the order';
COMMENT ON COLUMN orders.notes IS 'Additional notes for the order';
