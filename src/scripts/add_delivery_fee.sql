-- Add delivery_fee to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10, 2) DEFAULT 0;

COMMENT ON COLUMN orders.delivery_fee IS 'Delivery fee charged for this order';
