-- Add label color to orders for calendar visualization
ALTER TABLE orders ADD COLUMN IF NOT EXISTS label_color VARCHAR(20) DEFAULT '#3b82f6';

-- Create table for tracking flower composition in custom items
CREATE TABLE IF NOT EXISTS custom_item_flowers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for price history tracking
CREATE TABLE IF NOT EXISTS product_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    price DECIMAL(10, 2) NOT NULL,
    cost DECIMAL(10, 2),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments
COMMENT ON COLUMN orders.label_color IS 'Hex color code for calendar label visualization';
COMMENT ON TABLE custom_item_flowers IS 'Tracks which flowers are used in custom/temporary items';
COMMENT ON TABLE product_price_history IS 'Historical record of product prices for trend analysis';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_custom_item_flowers_order_item ON custom_item_flowers(order_item_id);
CREATE INDEX IF NOT EXISTS idx_price_history_product ON product_price_history(product_id, recorded_at DESC);

-- Grant permissions to anon role
GRANT SELECT, INSERT, UPDATE, DELETE ON custom_item_flowers TO anon;
GRANT SELECT, INSERT ON product_price_history TO anon;

-- Enable RLS
ALTER TABLE custom_item_flowers ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_price_history ENABLE ROW LEVEL SECURITY;

-- Create permissive policies
CREATE POLICY "Allow all operations on custom_item_flowers" ON custom_item_flowers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on product_price_history" ON product_price_history FOR ALL USING (true) WITH CHECK (true);
