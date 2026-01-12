-- Agregar columna user_id a employees para vincular con cuentas de usuario
ALTER TABLE employees ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);

-- También agregar employee_id a user_profiles si no existe
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES employees(id);

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_user_profiles_employee_id ON user_profiles(employee_id);
