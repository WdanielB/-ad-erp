-- Add order item recipe snapshot tables

-- 1) Recipe snapshot per order item
CREATE TABLE IF NOT EXISTS order_item_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    source_recipe_id UUID REFERENCES product_recipes(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_item_recipes_order_item
ON order_item_recipes (order_item_id);

CREATE INDEX IF NOT EXISTS idx_order_item_recipes_product
ON order_item_recipes (product_id);

COMMENT ON TABLE order_item_recipes IS 'Snapshot of recipe lines per order item (per unit)';

-- 2) Color quantities per order item recipe line
CREATE TABLE IF NOT EXISTS order_item_recipe_flower_colors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_recipe_id UUID REFERENCES order_item_recipes(id) ON DELETE CASCADE,
    color_id UUID REFERENCES flower_colors(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_item_recipe_colors_recipe
ON order_item_recipe_flower_colors (order_item_recipe_id);

COMMENT ON TABLE order_item_recipe_flower_colors IS 'Color quantities for order item recipe lines (per unit)';

-- RLS and permissions
ALTER TABLE order_item_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_recipe_flower_colors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on order_item_recipes"
ON order_item_recipes FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on order_item_recipe_flower_colors"
ON order_item_recipe_flower_colors FOR ALL USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON order_item_recipes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON order_item_recipe_flower_colors TO anon;
