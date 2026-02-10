-- Add color catalog and selections for flowers and recipes

-- 1) Color catalog
CREATE TABLE IF NOT EXISTS flower_colors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    hex VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_flower_colors_name_hex
ON flower_colors (lower(name), hex);

COMMENT ON TABLE flower_colors IS 'Catalog of available flower colors (name + hex)';

-- 2) Default colors per flower product
CREATE TABLE IF NOT EXISTS product_flower_colors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    color_id UUID REFERENCES flower_colors(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_flower_colors_unique
ON product_flower_colors (product_id, color_id);

COMMENT ON TABLE product_flower_colors IS 'Default color options for a flower product';

-- 3) Color quantities per recipe line (for composite products)
CREATE TABLE IF NOT EXISTS product_recipe_flower_colors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipe_id UUID REFERENCES product_recipes(id) ON DELETE CASCADE,
    color_id UUID REFERENCES flower_colors(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_flower_colors_recipe
ON product_recipe_flower_colors (recipe_id);

COMMENT ON TABLE product_recipe_flower_colors IS 'Color quantities for flower ingredients in recipes';

-- 4) Add color to custom item flower composition (POS)
ALTER TABLE custom_item_flowers
ADD COLUMN IF NOT EXISTS color_id UUID REFERENCES flower_colors(id);

CREATE INDEX IF NOT EXISTS idx_custom_item_flowers_color
ON custom_item_flowers (order_item_id, product_id, color_id);

-- Permissions and RLS
GRANT SELECT, INSERT, UPDATE, DELETE ON flower_colors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_flower_colors TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_recipe_flower_colors TO anon;

ALTER TABLE flower_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_flower_colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_recipe_flower_colors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on flower_colors"
ON flower_colors FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on product_flower_colors"
ON product_flower_colors FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on product_recipe_flower_colors"
ON product_recipe_flower_colors FOR ALL USING (true) WITH CHECK (true);
