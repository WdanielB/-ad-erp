-- Fix permissions: grant ALL roles access to flower/recipe tables
-- Run this in Supabase Dashboard > SQL Editor

GRANT ALL ON flower_colors TO anon, authenticated, service_role;
GRANT ALL ON product_flower_colors TO anon, authenticated, service_role;
GRANT ALL ON product_recipe_flower_colors TO anon, authenticated, service_role;
GRANT ALL ON custom_item_flowers TO anon, authenticated, service_role;
GRANT ALL ON order_item_recipes TO anon, authenticated, service_role;
GRANT ALL ON order_item_recipe_flower_colors TO anon, authenticated, service_role;
