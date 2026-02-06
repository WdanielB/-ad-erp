-- =============================================
-- Script: Add main_flower_id to products + notes to orders
-- Date: 2026-02-05
-- Description: 
--   1. Adds main_flower_id column to products (for composite products)
--   2. Ensures notes column exists on orders
--   3. Creates product_recipes table if not exists
-- =============================================

-- 1. Add main_flower_id to products table (references another product of type 'flower')
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'main_flower_id'
    ) THEN
        ALTER TABLE products ADD COLUMN main_flower_id UUID REFERENCES products(id) ON DELETE SET NULL;
        COMMENT ON COLUMN products.main_flower_id IS 'For composite products: the main/primary flower used';
    END IF;
END $$;

-- 2. Ensure notes column exists on orders (should already exist but just in case)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'notes'
    ) THEN
        ALTER TABLE orders ADD COLUMN notes TEXT;
    END IF;
END $$;

-- 3. Create product_recipes table if not exists
CREATE TABLE IF NOT EXISTS product_recipes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    child_product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS on product_recipes
ALTER TABLE product_recipes ENABLE ROW LEVEL SECURITY;

-- 5. Create permissive policy for product_recipes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'product_recipes' AND policyname = 'Allow all for product_recipes'
    ) THEN
        CREATE POLICY "Allow all for product_recipes" ON product_recipes FOR ALL USING (true) WITH CHECK (true);
    END IF;
END $$;

-- 6. Grant permissions
GRANT ALL ON product_recipes TO authenticated;
GRANT ALL ON product_recipes TO anon;
