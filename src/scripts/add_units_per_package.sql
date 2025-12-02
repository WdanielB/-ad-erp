-- Add units_per_package column to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS units_per_package INTEGER DEFAULT 1;

-- Update existing products with their units per package
UPDATE products SET units_per_package = 24 WHERE name LIKE '%Paquete x 24%';
UPDATE products SET units_per_package = 10 WHERE name LIKE '%Paquete x 10%';
UPDATE products SET units_per_package = 5 WHERE name LIKE '%Paquete x 5%';
UPDATE products SET units_per_package = 12 WHERE name LIKE '%Paquete x 12%';
UPDATE products SET units_per_package = 1 WHERE name LIKE '%Unidad%' OR name LIKE '%Planta%' OR name LIKE '%Paquete)%';

-- Update stock to reflect total stems (stock * units_per_package)
UPDATE products SET stock = stock * units_per_package WHERE units_per_package > 1;

-- Update product names to remove package info and show as individual stems
UPDATE products SET name = 'Rosas Rojas' WHERE name = 'Rosas Rojas (Paquete x 24)';
UPDATE products SET name = 'Tulipanes Variados' WHERE name = 'Tulipanes Variados (Paquete x 10)';
UPDATE products SET name = 'Girasoles' WHERE name = 'Girasoles (Paquete x 5)';
UPDATE products SET name = 'Lirios Blancos' WHERE name = 'Lirios Blancos (Paquete x 10)';
UPDATE products SET name = 'Claveles' WHERE name = 'Claveles (Paquete x 24)';
UPDATE products SET name = 'Gerberas' WHERE name = 'Gerberas (Paquete x 12)';
UPDATE products SET name = 'Hortensias Azules' WHERE name = 'Hortensias Azules (Unidad)';
UPDATE products SET name = 'Astromelias' WHERE name = 'Astromelias (Paquete x 10)';
UPDATE products SET name = 'Gypsophila / Lluvia' WHERE name = 'Gypsophila / Lluvia (Paquete)';
UPDATE products SET name = 'Orquídea Phalaenopsis' WHERE name = 'Orquídea Phalaenopsis (Planta)';

-- Update prices to reflect per-stem pricing
UPDATE products SET price = ROUND(price / units_per_package, 2) WHERE units_per_package > 1;
UPDATE products SET cost = ROUND(cost / units_per_package, 2) WHERE units_per_package > 1;
