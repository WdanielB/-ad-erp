-- Add quantity to custom_item_flowers for custom bouquet composition
ALTER TABLE custom_item_flowers
ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;

COMMENT ON COLUMN custom_item_flowers.quantity IS 'Units of the flower used in the custom item';

CREATE INDEX IF NOT EXISTS idx_custom_item_flowers_order_item_quantity
ON custom_item_flowers(order_item_id, product_id);