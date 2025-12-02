-- Grant table-level permissions to the anon role
-- This is required BEFORE RLS policies can work

GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Specifically grant permissions on each table
GRANT SELECT, INSERT, UPDATE, DELETE ON products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON inventory_batches TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON clients TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON orders TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON order_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON transactions TO anon;

-- Now run the RLS policies (these should already exist from the previous script)
-- But we'll recreate them to be sure

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Enable insert access for all users" ON products;
DROP POLICY IF EXISTS "Enable update access for all users" ON products;
DROP POLICY IF EXISTS "Enable delete access for all users" ON products;

-- Products table policies
CREATE POLICY "Enable read access for all users" ON products FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON products FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON products FOR DELETE USING (true);

-- Repeat for other tables
DROP POLICY IF EXISTS "Enable read access for all users" ON inventory_batches;
DROP POLICY IF EXISTS "Enable insert access for all users" ON inventory_batches;
DROP POLICY IF EXISTS "Enable update access for all users" ON inventory_batches;
DROP POLICY IF EXISTS "Enable delete access for all users" ON inventory_batches;

CREATE POLICY "Enable read access for all users" ON inventory_batches FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON inventory_batches FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON inventory_batches FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON inventory_batches FOR DELETE USING (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON clients;
DROP POLICY IF EXISTS "Enable insert access for all users" ON clients;
DROP POLICY IF EXISTS "Enable update access for all users" ON clients;
DROP POLICY IF EXISTS "Enable delete access for all users" ON clients;

CREATE POLICY "Enable read access for all users" ON clients FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON clients FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON clients FOR DELETE USING (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON orders;
DROP POLICY IF EXISTS "Enable insert access for all users" ON orders;
DROP POLICY IF EXISTS "Enable update access for all users" ON orders;
DROP POLICY IF EXISTS "Enable delete access for all users" ON orders;

CREATE POLICY "Enable read access for all users" ON orders FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON orders FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON orders FOR DELETE USING (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON order_items;
DROP POLICY IF EXISTS "Enable insert access for all users" ON order_items;
DROP POLICY IF EXISTS "Enable update access for all users" ON order_items;
DROP POLICY IF EXISTS "Enable delete access for all users" ON order_items;

CREATE POLICY "Enable read access for all users" ON order_items FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON order_items FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON order_items FOR DELETE USING (true);

DROP POLICY IF EXISTS "Enable read access for all users" ON transactions;
DROP POLICY IF EXISTS "Enable insert access for all users" ON transactions;
DROP POLICY IF EXISTS "Enable update access for all users" ON transactions;
DROP POLICY IF EXISTS "Enable delete access for all users" ON transactions;

CREATE POLICY "Enable read access for all users" ON transactions FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON transactions FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON transactions FOR DELETE USING (true);
