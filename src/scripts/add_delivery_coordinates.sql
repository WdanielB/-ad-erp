-- Add latitude and longitude columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS delivery_latitude float8,
ADD COLUMN IF NOT EXISTS delivery_longitude float8;

-- Comment on columns
COMMENT ON COLUMN orders.delivery_latitude IS 'Latitude of the delivery location';
COMMENT ON COLUMN orders.delivery_longitude IS 'Longitude of the delivery location';
