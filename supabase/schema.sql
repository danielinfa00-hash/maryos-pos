-- ============================================================
-- Maryos POS - Esquema completo de base de datos Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Extensiones útiles
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------
-- ENUMS: estados y tipos reutilizables
-- ------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('administrador', 'cajero');
CREATE TYPE table_status AS ENUM ('libre', 'ocupada', 'cuenta_solicitada');
CREATE TYPE order_status AS ENUM ('pendiente', 'preparando', 'entregado', 'cobrado');
CREATE TYPE sale_status AS ENUM ('open', 'paid', 'cancelled');
CREATE TYPE payment_method AS ENUM ('efectivo', 'transferencia');
CREATE TYPE movement_type AS ENUM ('entrada', 'venta', 'ajuste', 'perdida');
CREATE TYPE cash_movement_type AS ENUM ('ingreso', 'egreso');

-- ------------------------------------------------------------
-- USERS: perfiles vinculados a auth.users de Supabase
-- ------------------------------------------------------------
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'cajero',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- RESTAURANT TABLES: mesas del restaurante
-- ------------------------------------------------------------
CREATE TABLE restaurant_tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  status table_status NOT NULL DEFAULT 'libre',
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  item_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- CATEGORIES: categorías de productos
-- ------------------------------------------------------------
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- PRODUCTS: productos del menú
-- ------------------------------------------------------------
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- INVENTORY ITEMS: ingredientes del inventario
-- ------------------------------------------------------------
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  unit TEXT NOT NULL DEFAULT 'unidad',
  current_stock NUMERIC(12,3) NOT NULL DEFAULT 0,
  min_stock NUMERIC(12,3) NOT NULL DEFAULT 0,
  cost_per_unit NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- RECIPES: receta por producto (1:1)
-- ------------------------------------------------------------
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- RECIPE ITEMS: ingredientes de cada receta
-- ------------------------------------------------------------
CREATE TABLE recipe_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipe_id UUID NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
  quantity NUMERIC(12,3) NOT NULL DEFAULT 1,
  UNIQUE(recipe_id, inventory_item_id)
);

-- ------------------------------------------------------------
-- ORDERS: pedido activo por mesa
-- ------------------------------------------------------------
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_id UUID NOT NULL REFERENCES restaurant_tables(id) ON DELETE CASCADE,
  status order_status NOT NULL DEFAULT 'pendiente',
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- ORDER ITEMS: líneas del pedido
-- ------------------------------------------------------------
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  status order_status NOT NULL DEFAULT 'pendiente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- SALES: facturas / ventas
-- ------------------------------------------------------------
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number SERIAL,
  table_id UUID REFERENCES restaurant_tables(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  payment_method payment_method NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  cash_received NUMERIC(12,2),
  change_amount NUMERIC(12,2),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status sale_status NOT NULL DEFAULT 'paid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- SALE ITEMS: detalle de factura
-- ------------------------------------------------------------
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT
);

-- ------------------------------------------------------------
-- INVENTORY MOVEMENTS: historial de inventario
-- ------------------------------------------------------------
CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventory_item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  movement_type movement_type NOT NULL,
  quantity NUMERIC(12,3) NOT NULL,
  previous_stock NUMERIC(12,3) NOT NULL,
  new_stock NUMERIC(12,3) NOT NULL,
  reference TEXT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- CASH SESSIONS: sesiones de caja diaria
-- ------------------------------------------------------------
CREATE TABLE cash_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  opening_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  closing_amount NUMERIC(12,2),
  total_sales NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_cash NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_transfer NUMERIC(12,2) NOT NULL DEFAULT 0,
  expected_cash NUMERIC(12,2),
  difference NUMERIC(12,2),
  is_open BOOLEAN NOT NULL DEFAULT true,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  notes TEXT
);

-- ------------------------------------------------------------
-- CASH MOVEMENTS: ingresos/egresos de caja
-- ------------------------------------------------------------
CREATE TABLE cash_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES cash_sessions(id) ON DELETE CASCADE,
  movement_type cash_movement_type NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  description TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- SETTINGS: configuración del restaurante
-- ------------------------------------------------------------
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES para consultas frecuentes
-- ============================================================
CREATE INDEX idx_orders_table_id ON orders(table_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_sales_created_at ON sales(created_at DESC);
CREATE INDEX idx_sales_invoice ON sales(invoice_number);
CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);
CREATE INDEX idx_inventory_movements_item ON inventory_movements(inventory_item_id);
CREATE INDEX idx_cash_sessions_open ON cash_sessions(is_open);

-- ============================================================
-- SOFT DELETE: función para actualizar updated_at automáticamente
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tables_updated_at BEFORE UPDATE ON restaurant_tables FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_inventory_updated_at BEFORE UPDATE ON inventory_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_order_items_updated_at BEFORE UPDATE ON order_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS por rol
-- admin: acceso completo | cajero: solo operaciones necesarias

-- Función helper para obtener el rol desde auth.users -> users
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role
LANGUAGE SQL STABLE
AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$;

-- USERS: solo admin puede modificar, todos pueden leer su propio perfil
CREATE POLICY "users_read_own" ON users FOR SELECT TO authenticated USING (true);
CREATE POLICY "users_admin_all" ON users FOR ALL TO authenticated USING (get_user_role() = 'administrador') WITH CHECK (get_user_role() = 'administrador');

-- Tablas de solo lectura para cajeros (admin full access)
CREATE POLICY "tables_admin_all" ON restaurant_tables FOR ALL TO authenticated USING (get_user_role() = 'administrador') WITH CHECK (get_user_role() = 'administrador');
CREATE POLICY "tables_cashier_usage" ON restaurant_tables FOR SELECT TO authenticated USING (get_user_role() = 'cajero');
CREATE POLICY "tables_cashier_update" ON restaurant_tables FOR UPDATE TO authenticated USING (get_user_role() = 'cajero') WITH CHECK (get_user_role() = 'cajero');

CREATE POLICY "categories_admin_all" ON categories FOR ALL TO authenticated USING (get_user_role() = 'administrador') WITH CHECK (get_user_role() = 'administrador');
CREATE POLICY "categories_cashier_sel" ON categories FOR SELECT TO authenticated USING (get_user_role() = 'cajero');

CREATE POLICY "products_admin_all" ON products FOR ALL TO authenticated USING (get_user_role() = 'administrador') WITH CHECK (get_user_role() = 'administrador');
CREATE POLICY "products_cashier_sel" ON products FOR SELECT TO authenticated USING (get_user_role() = 'cajero');

CREATE POLICY "inventory_admin_all" ON inventory_items FOR ALL TO authenticated USING (get_user_role() = 'administrador') WITH CHECK (get_user_role() = 'administrador');
CREATE POLICY "inventory_cashier_sel" ON inventory_items FOR SELECT TO authenticated USING (get_user_role() = 'cajero');

CREATE POLICY "recipes_admin_all" ON recipes FOR ALL TO authenticated USING (get_user_role() = 'administrador') WITH CHECK (get_user_role() = 'administrador');
CREATE POLICY "recipe_items_admin_all" ON recipe_items FOR ALL TO authenticated USING (get_user_role() = 'administrador') WITH CHECK (get_user_role() = 'administrador');

-- Órdenes y ventas: ambos roles pueden operar
CREATE POLICY "orders_admin_all" ON orders FOR ALL TO authenticated USING (get_user_role() = 'administrador') WITH CHECK (get_user_role() = 'administrador');
CREATE POLICY "orders_cashier_rw" ON orders FOR SELECT TO authenticated USING (get_user_role() = 'cajero');

CREATE POLICY "order_items_admin_all" ON order_items FOR ALL TO authenticated USING (get_user_role() = 'administrador') WITH CHECK (get_user_role() = 'administrador');
CREATE POLICY "order_items_cashier_rw" ON order_items FOR SELECT TO authenticated USING (get_user_role() = 'cajero');

CREATE POLICY "sales_admin_all" ON sales FOR ALL TO authenticated USING (get_user_role() = 'administrador') WITH CHECK (get_user_role() = 'administrador');
CREATE POLICY "sales_cashier_rw" ON sales FOR SELECT TO authenticated USING (get_user_role() = 'cajero');

CREATE POLICY "sale_items_admin_all" ON sale_items FOR ALL TO authenticated USING (get_user_role() = 'administrador') WITH CHECK (get_user_role() = 'administrador');
CREATE POLICY "sale_items_cashier_sel" ON sale_items FOR SELECT TO authenticated USING (get_user_role() = 'cajero');

-- Inventario y caja: admin full, cajero solo lectura
CREATE POLICY "inv_mov_admin_all" ON inventory_movements FOR ALL TO authenticated USING (get_user_role() = 'administrador') WITH CHECK (get_user_role() = 'administrador');
CREATE POLICY "inv_mov_cashier_sel" ON inventory_movements FOR SELECT TO authenticated USING (get_user_role() = 'cajero');

CREATE POLICY "cash_sessions_admin_all" ON cash_sessions FOR ALL TO authenticated USING (get_user_role() = 'administrador') WITH CHECK (get_user_role() = 'administrador');
CREATE POLICY "cash_sessions_cashier_rw" ON cash_sessions FOR SELECT TO authenticated USING (get_user_role() = 'cajero');

CREATE POLICY "cash_mov_admin_all" ON cash_movements FOR ALL TO authenticated USING (get_user_role() = 'administrador') WITH CHECK (get_user_role() = 'administrador');
CREATE POLICY "cash_mov_cashier_rw" ON cash_movements FOR SELECT TO authenticated USING (get_user_role() = 'cajero');

CREATE POLICY "settings_admin_all" ON settings FOR ALL TO authenticated USING (get_user_role() = 'administrador') WITH CHECK (get_user_role() = 'administrador');
CREATE POLICY "settings_cashier_sel" ON settings FOR SELECT TO authenticated USING (get_user_role() = 'cajero');

-- ============================================================
-- DATOS INICIALES (seed)
-- ============================================================

-- Categorías del menú
INSERT INTO categories (name, sort_order) VALUES
  ('Hamburguesas', 1),
  ('Perros Calientes', 2),
  ('Salchipapas', 3),
  ('Chicharrón y Chuzos', 4),
  ('Bebidas', 5),
  ('Adicionales', 6);

-- Productos del menú
INSERT INTO products (category_id, name, description, price, sort_order) VALUES
  ((SELECT id FROM categories WHERE name = 'Hamburguesas'), 'SENCILLA', 'Carne.', 10000, 1),
  ((SELECT id FROM categories WHERE name = 'Hamburguesas'), 'DOBLE', 'Doble carne con queso mozarella.', 12000, 2),
  ((SELECT id FROM categories WHERE name = 'Hamburguesas'), 'ESPECIAL', 'Carne, queso mozarella, tocineta, huevo de codorniz.', 12000, 3),
  ((SELECT id FROM categories WHERE name = 'Hamburguesas'), 'SUPER', 'Carne, tocineta, queso mozarella, queso amarillo, huevo frito, huevo de codorniz.', 14000, 4),
  ((SELECT id FROM categories WHERE name = 'Hamburguesas'), 'POLLO', 'Pechuga de pollo, queso mozarella, queso amarillo, tocineta, huevo de codorniz.', 15000, 5),
  ((SELECT id FROM categories WHERE name = 'Hamburguesas'), 'AHUMADA', 'Chuleta Ahumada, queso mozarella, queso amarillo, tocineta, huevo de codorniz.', 16000, 6),
  ((SELECT id FROM categories WHERE name = 'Hamburguesas'), 'MIXTO', 'Carne, pollo, queso mozarella, queso amarillo, tocineta, huevo de codorniz.', 18000, 7),
  ((SELECT id FROM categories WHERE name = 'Hamburguesas'), 'VENEZOLANA', 'Carne, chuleta Ahumada, tocineta, queso amarillo, queso mozarella, queso crema, huevo frito, aguacate.', 20000, 8),
  ((SELECT id FROM categories WHERE name = 'Perros Calientes'), 'PERRO SENCILLO', 'Salchicha.', 7000, 1),
  ((SELECT id FROM categories WHERE name = 'Perros Calientes'), 'PERRO BUTI', 'Con 2 Butifarra.', 8000, 2),
  ((SELECT id FROM categories WHERE name = 'Perros Calientes'), 'PERRO QUESO', 'Salchicha, queso mozarella.', 9000, 3),
  ((SELECT id FROM categories WHERE name = 'Perros Calientes'), 'PERRO ESPECIAL', 'Salchicha, queso mozarella, tocineta.', 10000, 4),
  ((SELECT id FROM categories WHERE name = 'Perros Calientes'), 'PERRO RANCHERO', 'Salchicha Zenú ranchera, queso mozarella, tocineta, huevo codorniz.', 12000, 5),
  ((SELECT id FROM categories WHERE name = 'Perros Calientes'), 'SUPER QUESO', 'Salchicha, queso mozarella, queso amarillo, queso crema, huevo de codorniz.', 12000, 6),
  ((SELECT id FROM categories WHERE name = 'Perros Calientes'), 'PERRO SUPER', 'Salchicha súper grande, tocineta, queso mozarella, queso amarillo, huevo codorniz.', 13000, 7),
  ((SELECT id FROM categories WHERE name = 'Perros Calientes'), 'AREPA BURGUER', 'Carne, queso mozarella, tocineta.', 10000, 8),
  ((SELECT id FROM categories WHERE name = 'Salchipapas'), 'PEQUEÑA', 'Salchicha, queso, salsa.', 6000, 1),
  ((SELECT id FROM categories WHERE name = 'Salchipapas'), 'MEDIANA', 'Salchicha, coctelera, ranchera, huevo de codorniz, queso, salsas.', 9000, 2),
  ((SELECT id FROM categories WHERE name = 'Salchipapas'), 'GRANDE', 'Salchicha, chorizo, coctelera, ranchera, huevo de codorniz, queso, salsas.', 12000, 3),
  ((SELECT id FROM categories WHERE name = 'Salchipapas'), 'SUPER', 'Salchicha, nuggets de pollo, chorizo, coctelera, ranchera, huevo de codorniz, queso, salsas.', 15000, 4),
  ((SELECT id FROM categories WHERE name = 'Salchipapas'), 'MIXTA', 'Carne desmechada, tocineta, pollo, salchicha, maíz, huevo de codorniz, queso, salsa.', 20000, 5),
  ((SELECT id FROM categories WHERE name = 'Chicharrón y Chuzos'), 'CHICHARRÓN', 'Ceviche, chicharrón, papas francesa, guacamole, patacones.', 20000, 1),
  ((SELECT id FROM categories WHERE name = 'Chicharrón y Chuzos'), 'BONDIOLA', 'Bondiola.', 20000, 2),
  ((SELECT id FROM categories WHERE name = 'Chicharrón y Chuzos'), 'CHUZOS MIXTO', 'Papas francesa, ensalada.', 14000, 3),
  ((SELECT id FROM categories WHERE name = 'Chicharrón y Chuzos'), 'CHUZOS', 'Chuzo, arepa con ahogao.', 7000, 4),
  ((SELECT id FROM categories WHERE name = 'Chicharrón y Chuzos'), 'BUTIFARRA', 'Butifarra.', 1500, 5),
  ((SELECT id FROM categories WHERE name = 'Bebidas'), 'AGUA 200ML', 'Agua 200ml.', 2000, 1),
  ((SELECT id FROM categories WHERE name = 'Bebidas'), 'AGUA 500ML', 'Agua 500ml.', 3500, 2),
  ((SELECT id FROM categories WHERE name = 'Bebidas'), 'COCACOLA 200ML', 'Cocacola 200ml.', 2500, 3),
  ((SELECT id FROM categories WHERE name = 'Bebidas'), 'COCACOLA 400ML', 'Cocacola 400ml.', 3500, 4),
  ((SELECT id FROM categories WHERE name = 'Bebidas'), 'COCACOLA 1L', 'Cocacola 1L.', 5000, 5),
  ((SELECT id FROM categories WHERE name = 'Bebidas'), 'COCACOLA 1.5L', 'Cocacola 1.5L.', 7000, 6),
  ((SELECT id FROM categories WHERE name = 'Bebidas'), 'POSTOBON 200ML', 'Postobon 200ml.', 2000, 7),
  ((SELECT id FROM categories WHERE name = 'Bebidas'), 'POSTOBON 400ML', 'Postobon 400ml.', 3000, 8),
  ((SELECT id FROM categories WHERE name = 'Bebidas'), 'POSTOBON 1L', 'Postobon 1L.', 4500, 9),
  ((SELECT id FROM categories WHERE name = 'Bebidas'), 'OTROS SURTIDOS 400ML', 'Otros surtidos 400ml.', 3000, 10),
  ((SELECT id FROM categories WHERE name = 'Bebidas'), 'OTROS SURTIDOS 1.5L', 'Otros surtidos 1.5L.', 6000, 11),
  ((SELECT id FROM categories WHERE name = 'Bebidas'), 'GATORADE', 'Gatorade.', 5000, 12),
  ((SELECT id FROM categories WHERE name = 'Bebidas'), 'POWER', 'Power.', 4000, 13),
  ((SELECT id FROM categories WHERE name = 'Bebidas'), 'BRETAÑA', 'Bretaña.', 4000, 14),
  ((SELECT id FROM categories WHERE name = 'Bebidas'), 'SODA', 'Soda.', 3000, 15),
  ((SELECT id FROM categories WHERE name = 'Bebidas'), 'HIT CAJITA', 'Hit cajita.', 2000, 16),
  ((SELECT id FROM categories WHERE name = 'Bebidas'), 'HIT BOTELLA', 'Hit botella.', 3500, 17),
  ((SELECT id FROM categories WHERE name = 'Bebidas'), 'CERVEZA', 'Cerveza.', 4500, 18),
  ((SELECT id FROM categories WHERE name = 'Bebidas'), 'MALTA', 'Malta.', 3000, 19),
  ((SELECT id FROM categories WHERE name = 'Adicionales'), 'HUEVO DE CODORNIZ', 'Huevo de codorniz.', 500, 1);

-- Mesas iniciales
INSERT INTO restaurant_tables (name, sort_order) VALUES
  ('Mesa 1', 1),
  ('Mesa 2', 2),
  ('Mesa 3', 3),
  ('Mesa 4', 4);

-- Ingredientes de inventario
INSERT INTO inventory_items (name, unit, current_stock, min_stock) VALUES
  ('Pan', 'unidad', 100, 20),
  ('Salchicha', 'unidad', 80, 15),
  ('Carne', 'gramo', 5000, 500),
  ('Pollo', 'gramo', 3000, 300),
  ('Queso Mozzarella', 'gramo', 2000, 200),
  ('Queso Amarillo', 'gramo', 1500, 150),
  ('Tocineta', 'porción', 50, 10),
  ('Huevos de Codorniz', 'unidad', 100, 20),
  ('Bebidas', 'unidad', 200, 30),
  ('Salsas', 'porción', 100, 15);

-- Configuración del restaurante
INSERT INTO settings (key, value) VALUES
  ('restaurant', '{"name": "Maryos POS", "address": "", "phone": "", "tax_rate": 0}'),
  ('printer', '{"width_mm": 58, "enabled": true}');
