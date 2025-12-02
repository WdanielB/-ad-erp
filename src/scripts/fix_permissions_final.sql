-- Enable RLS on tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable all access for orders" ON orders;
DROP POLICY IF EXISTS "Enable all access for order_items" ON order_items;
DROP POLICY IF EXISTS "Enable all access for transactions" ON transactions;

-- Create permissive policies for development/testing
-- ORDERS
CREATE POLICY "Enable all access for orders" ON orders
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ORDER ITEMS
CREATE POLICY "Enable all access for order_items" ON order_items
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- TRANSACTIONS
CREATE POLICY "Enable all access for transactions" ON transactions
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Grant permissions to authenticated and anon roles (just in case)
GRANT ALL ON orders TO authenticated;
GRANT ALL ON orders TO anon;
GRANT ALL ON order_items TO authenticated;
GRANT ALL ON order_items TO anon;
GRANT ALL ON transactions TO authenticated;
GRANT ALL ON transactions TO anon;
GRANT ALL ON clients TO authenticated;
GRANT ALL ON clients TO anon;
