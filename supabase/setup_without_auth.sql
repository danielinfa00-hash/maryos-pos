-- ============================================================
-- Configuración de Supabase para Maryos POS sin autenticación
--
-- Como la app no usa Supabase Auth, necesitamos:
-- 1. Desactivar RLS en todas las tablas
-- 2. Quitar la FK a auth.users
-- 3. Eliminar políticas existentes
--
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Eliminar políticas RLS existentes
DO $$ DECLARE
  pol record;
BEGIN
  FOR pol IN SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', pol.policyname, pol.tablename);
  END LOOP;
END $$;

-- 2. Desactivar RLS en todas las tablas
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS restaurant_tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS recipes DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS recipe_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sale_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cash_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cash_movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS settings DISABLE ROW LEVEL SECURITY;

-- 3. Quitar FK a auth.users y otras FKs a users
ALTER TABLE IF EXISTS users DROP CONSTRAINT IF EXISTS users_id_fkey;
ALTER TABLE IF EXISTS orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE IF EXISTS sales DROP CONSTRAINT IF EXISTS sales_user_id_fkey;
ALTER TABLE IF EXISTS inventory_movements DROP CONSTRAINT IF EXISTS inventory_movements_user_id_fkey;
ALTER TABLE IF EXISTS cash_sessions DROP CONSTRAINT IF EXISTS cash_sessions_user_id_fkey;
ALTER TABLE IF EXISTS cash_movements DROP CONSTRAINT IF EXISTS cash_movements_user_id_fkey;

-- 4. Hacer user_id nullable en todas las tablas
ALTER TABLE orders ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE sales ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE inventory_movements ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE cash_sessions ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE cash_movements ALTER COLUMN user_id DROP NOT NULL;

-- 5. Otorgar permisos al rol anon (necesario para queries sin auth)
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
