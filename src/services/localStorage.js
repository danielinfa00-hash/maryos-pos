/**
 * Capa de almacenamiento local para modo demo (sin Supabase).
 * Simula las tablas principales usando localStorage.
 * Útil para desarrollo y demostración sin backend.
 */

const STORAGE_KEY = 'maryos_pos_data'

const defaultData = {
  restaurant_tables: [
    { id: 't1', name: 'Mesa 1', status: 'libre', total_amount: 0, item_count: 0, sort_order: 1, is_active: true },
    { id: 't2', name: 'Mesa 2', status: 'libre', total_amount: 0, item_count: 0, sort_order: 2, is_active: true },
    { id: 't3', name: 'Mesa 3', status: 'libre', total_amount: 0, item_count: 0, sort_order: 3, is_active: true },
    { id: 't4', name: 'Mesa 4', status: 'libre', total_amount: 0, item_count: 0, sort_order: 4, is_active: true },
  ],
  categories: [
    { id: 'c1', name: 'Hamburguesas', sort_order: 1, is_active: true },
    { id: 'c2', name: 'Perros Calientes', sort_order: 2, is_active: true },
    { id: 'c3', name: 'Salchipapas', sort_order: 3, is_active: true },
    { id: 'c4', name: 'Chicharrón y Chuzos', sort_order: 4, is_active: true },
    { id: 'c5', name: 'Bebidas', sort_order: 5, is_active: true },
    { id: 'c6', name: 'Adicionales', sort_order: 6, is_active: true },
  ],
  products: [
    { id: 'p1', category_id: 'c1', name: 'SENCILLA', description: 'Carne.', price: 10000, is_available: true, sort_order: 1 },
    { id: 'p2', category_id: 'c1', name: 'DOBLE', description: 'Doble carne con queso mozarella.', price: 12000, is_available: true, sort_order: 2 },
    { id: 'p3', category_id: 'c1', name: 'ESPECIAL', description: 'Carne, queso mozarella, tocineta, huevo de codorniz.', price: 12000, is_available: true, sort_order: 3 },
    { id: 'p4', category_id: 'c1', name: 'SUPER', description: 'Carne, tocineta, queso mozarella, queso amarillo, huevo frito, huevo de codorniz.', price: 14000, is_available: true, sort_order: 4 },
    { id: 'p5', category_id: 'c1', name: 'POLLO', description: 'Pechuga de pollo, queso mozarella, queso amarillo, tocineta, huevo de codorniz.', price: 15000, is_available: true, sort_order: 5 },
    { id: 'p6', category_id: 'c1', name: 'AHUMADA', description: 'Chuleta Ahumada, queso mozarella, queso amarillo, tocineta, huevo de codorniz.', price: 16000, is_available: true, sort_order: 6 },
    { id: 'p7', category_id: 'c1', name: 'MIXTO', description: 'Carne, pollo, queso mozarella, queso amarillo, tocineta, huevo de codorniz.', price: 18000, is_available: true, sort_order: 7 },
    { id: 'p8', category_id: 'c1', name: 'VENEZOLANA', description: 'Carne, chuleta Ahumada, tocineta, queso amarillo, queso mozarella, queso crema, huevo frito, aguacate.', price: 20000, is_available: true, sort_order: 8 },
    { id: 'p9', category_id: 'c2', name: 'PERRO SENCILLO', description: 'Salchicha.', price: 7000, is_available: true, sort_order: 1 },
    { id: 'p10', category_id: 'c2', name: 'PERRO BUTI', description: 'Con 2 Butifarra.', price: 8000, is_available: true, sort_order: 2 },
    { id: 'p11', category_id: 'c2', name: 'PERRO QUESO', description: 'Salchicha, queso mozarella.', price: 9000, is_available: true, sort_order: 3 },
    { id: 'p12', category_id: 'c2', name: 'PERRO ESPECIAL', description: 'Salchicha, queso mozarella, tocineta.', price: 10000, is_available: true, sort_order: 4 },
    { id: 'p13', category_id: 'c2', name: 'PERRO RANCHERO', description: 'Salchicha Zenú ranchera, queso mozarella, tocineta, huevo codorniz.', price: 12000, is_available: true, sort_order: 5 },
    { id: 'p14', category_id: 'c2', name: 'SUPER QUESO', description: 'Salchicha, queso mozarella, queso amarillo, queso crema, huevo de codorniz.', price: 12000, is_available: true, sort_order: 6 },
    { id: 'p15', category_id: 'c2', name: 'PERRO SUPER', description: 'Salchicha súper grande, tocineta, queso mozarella, queso amarillo, huevo codorniz.', price: 13000, is_available: true, sort_order: 7 },
    { id: 'p16', category_id: 'c2', name: 'AREPA BURGUER', description: 'Carne, queso mozarella, tocineta.', price: 10000, is_available: true, sort_order: 8 },
    { id: 'p17', category_id: 'c3', name: 'PEQUEÑA', description: 'Salchicha, queso, salsa.', price: 6000, is_available: true, sort_order: 1 },
    { id: 'p18', category_id: 'c3', name: 'MEDIANA', description: 'Salchicha, coctelera, ranchera, huevo de codorniz, queso, salsas.', price: 9000, is_available: true, sort_order: 2 },
    { id: 'p19', category_id: 'c3', name: 'GRANDE', description: 'Salchicha, chorizo, coctelera, ranchera, huevo de codorniz, queso, salsas.', price: 12000, is_available: true, sort_order: 3 },
    { id: 'p20', category_id: 'c3', name: 'SUPER', description: 'Salchicha, nuggets de pollo, chorizo, coctelera, ranchera, huevo de codorniz, queso, salsas.', price: 15000, is_available: true, sort_order: 4 },
    { id: 'p21', category_id: 'c3', name: 'MIXTA', description: 'Carne desmechada, tocineta, pollo, salchicha, maíz, huevo de codorniz, queso, salsa.', price: 20000, is_available: true, sort_order: 5 },
    { id: 'p22', category_id: 'c4', name: 'CHICHARRÓN', description: 'Ceviche, chicharrón, papas francesa, guacamole, patacones.', price: 20000, is_available: true, sort_order: 1 },
    { id: 'p23', category_id: 'c4', name: 'BONDIOLA', description: 'Bondiola.', price: 20000, is_available: true, sort_order: 2 },
    { id: 'p24', category_id: 'c4', name: 'CHUZOS MIXTO', description: 'Papas francesa, ensalada.', price: 14000, is_available: true, sort_order: 3 },
    { id: 'p25', category_id: 'c4', name: 'CHUZOS', description: 'Chuzo, arepa con ahogao.', price: 7000, is_available: true, sort_order: 4 },
    { id: 'p26', category_id: 'c4', name: 'BUTIFARRA', description: 'Butifarra.', price: 1500, is_available: true, sort_order: 5 },
    { id: 'p27', category_id: 'c5', name: 'AGUA 200ML', description: 'Agua 200ml.', price: 2000, is_available: true, sort_order: 1 },
    { id: 'p28', category_id: 'c5', name: 'AGUA 500ML', description: 'Agua 500ml.', price: 3500, is_available: true, sort_order: 2 },
    { id: 'p29', category_id: 'c5', name: 'COCACOLA 200ML', description: 'Cocacola 200ml.', price: 2500, is_available: true, sort_order: 3 },
    { id: 'p30', category_id: 'c5', name: 'COCACOLA 400ML', description: 'Cocacola 400ml.', price: 3500, is_available: true, sort_order: 4 },
    { id: 'p31', category_id: 'c5', name: 'COCACOLA 1L', description: 'Cocacola 1L.', price: 5000, is_available: true, sort_order: 5 },
    { id: 'p32', category_id: 'c5', name: 'COCACOLA 1.5L', description: 'Cocacola 1.5L.', price: 7000, is_available: true, sort_order: 6 },
    { id: 'p33', category_id: 'c5', name: 'POSTOBON 200ML', description: 'Postobon 200ml.', price: 2000, is_available: true, sort_order: 7 },
    { id: 'p34', category_id: 'c5', name: 'POSTOBON 400ML', description: 'Postobon 400ml.', price: 3000, is_available: true, sort_order: 8 },
    { id: 'p35', category_id: 'c5', name: 'POSTOBON 1L', description: 'Postobon 1L.', price: 4500, is_available: true, sort_order: 9 },
    { id: 'p36', category_id: 'c5', name: 'OTROS SURTIDOS 400ML', description: 'Otros surtidos 400ml.', price: 3000, is_available: true, sort_order: 10 },
    { id: 'p37', category_id: 'c5', name: 'OTROS SURTIDOS 1.5L', description: 'Otros surtidos 1.5L.', price: 6000, is_available: true, sort_order: 11 },
    { id: 'p38', category_id: 'c5', name: 'GATORADE', description: 'Gatorade.', price: 5000, is_available: true, sort_order: 12 },
    { id: 'p39', category_id: 'c5', name: 'POWER', description: 'Power.', price: 4000, is_available: true, sort_order: 13 },
    { id: 'p40', category_id: 'c5', name: 'BRETAÑA', description: 'Bretaña.', price: 4000, is_available: true, sort_order: 14 },
    { id: 'p41', category_id: 'c5', name: 'SODA', description: 'Soda.', price: 3000, is_available: true, sort_order: 15 },
    { id: 'p42', category_id: 'c5', name: 'HIT CAJITA', description: 'Hit cajita.', price: 2000, is_available: true, sort_order: 16 },
    { id: 'p43', category_id: 'c5', name: 'HIT BOTELLA', description: 'Hit botella.', price: 3500, is_available: true, sort_order: 17 },
    { id: 'p44', category_id: 'c5', name: 'CERVEZA', description: 'Cerveza.', price: 4500, is_available: true, sort_order: 18 },
    { id: 'p45', category_id: 'c5', name: 'MALTA', description: 'Malta.', price: 3000, is_available: true, sort_order: 19 },
    { id: 'p46', category_id: 'c6', name: 'HUEVO DE CODORNIZ', description: 'Huevo de codorniz.', price: 500, is_available: true, sort_order: 1 },
  ],
  inventory_items: [
    { id: 'i1', name: 'Pan', unit: 'unidad', current_stock: 100, min_stock: 20, is_active: true },
    { id: 'i2', name: 'Salchicha', unit: 'unidad', current_stock: 12, min_stock: 15, is_active: true },
    { id: 'i3', name: 'Queso Mozzarella', unit: 'gramo', current_stock: 180, min_stock: 200, is_active: true },
    { id: 'i4', name: 'Carne', unit: 'gramo', current_stock: 5000, min_stock: 500, is_active: true },
    { id: 'i5', name: 'Tocineta', unit: 'porción', current_stock: 50, min_stock: 10, is_active: true },
  ],
  recipes: [],
  recipe_items: [],
  orders: [],
  order_items: [],
  sales: [],
  sale_items: [],
  inventory_movements: [],
  cash_sessions: [],
  cash_movements: [],
  settings: [
    { key: 'restaurant', value: { name: 'Maryos POS', address: 'Calle Demo 123', phone: '300 000 0000', tax_rate: 0 } },
    { key: 'printer', value: { width_mm: 58, enabled: true } },
  ],
  invoice_counter: 1000,
}

function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {
    // Si localStorage está corrupto, reiniciar
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData))
  return structuredClone(defaultData)
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/** Genera IDs únicos simples para modo demo */
export function generateId(prefix = 'id') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

/** Obtiene una "tabla" del almacenamiento local */
export function getLocalTable(tableName) {
  const data = loadData()
  return data[tableName] || []
}

/** Inserta un registro en una tabla local */
export function insertLocal(tableName, record) {
  const data = loadData()
  if (!data[tableName]) data[tableName] = []
  data[tableName].push(record)
  saveData(data)
  return record
}

/** Actualiza un registro por id */
export function updateLocal(tableName, id, updates) {
  const data = loadData()
  const index = data[tableName]?.findIndex((r) => r.id === id)
  if (index === -1) return null
  data[tableName][index] = { ...data[tableName][index], ...updates }
  saveData(data)
  return data[tableName][index]
}

/** Elimina un registro por id */
export function deleteLocal(tableName, id) {
  const data = loadData()
  data[tableName] = data[tableName]?.filter((r) => r.id !== id) || []
  saveData(data)
}

/** Obtiene el objeto de datos completo (para operaciones complejas) */
export function getLocalData() {
  return loadData()
}

/** Guarda el objeto de datos completo */
export function setLocalData(data) {
  saveData(data)
}

/** Incrementa el contador de facturas */
export function nextInvoiceNumber() {
  const data = loadData()
  data.invoice_counter = (data.invoice_counter || 1000) + 1
  saveData(data)
  return data.invoice_counter
}
