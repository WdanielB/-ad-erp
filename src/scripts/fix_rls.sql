-- Enable RLS on products table (if not already enabled)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Allow public read access to products
CREATE POLICY "Public read access" ON products FOR SELECT USING (true);

-- Allow public insert access to products (for creating new products)
CREATE POLICY "Public insert access" ON products FOR INSERT WITH CHECK (true);

-- Allow public update access to products (for updating stock)
CREATE POLICY "Public update access" ON products FOR UPDATE USING (true);

-- Repeat for inventory_batches if needed
ALTER TABLE inventory_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access batches" ON inventory_batches FOR SELECT USING (true);
CREATE POLICY "Public insert access batches" ON inventory_batches FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access batches" ON inventory_batches FOR UPDATE USING (true);
