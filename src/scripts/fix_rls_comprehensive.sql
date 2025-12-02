-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public read access" ON products;
DROP POLICY IF EXISTS "Public insert access" ON products;
DROP POLICY IF EXISTS "Public update access" ON products;
DROP POLICY IF EXISTS "Public read access batches" ON inventory_batches;
DROP POLICY IF EXISTS "Public insert access batches" ON inventory_batches;
DROP POLICY IF EXISTS "Public update access batches" ON inventory_batches;

-- Enable RLS on all tables
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Products table policies
CREATE POLICY "Enable read access for all users" ON products FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON products FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON products FOR DELETE USING (true);

-- Inventory batches policies
CREATE POLICY "Enable read access for all users" ON inventory_batches FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON inventory_batches FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON inventory_batches FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON inventory_batches FOR DELETE USING (true);

-- Clients policies
CREATE POLICY "Enable read access for all users" ON clients FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON clients FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON clients FOR DELETE USING (true);

-- Orders policies
CREATE POLICY "Enable read access for all users" ON orders FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON orders FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON orders FOR DELETE USING (true);

-- Order items policies
CREATE POLICY "Enable read access for all users" ON order_items FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON order_items FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON order_items FOR DELETE USING (true);

-- Transactions policies
CREATE POLICY "Enable read access for all users" ON transactions FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON transactions FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON transactions FOR DELETE USING (true);
