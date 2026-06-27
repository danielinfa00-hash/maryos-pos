/**
 * Constantes globales del sistema Maryos POS.
 * Centralizar valores evita errores de tipeo y facilita mantenimiento.
 */

// Estados de mesa
export const TABLE_STATUS = {
  FREE: 'libre',
  OCCUPIED: 'ocupada',
  BILL_REQUESTED: 'cuenta_solicitada',
}

export const TABLE_STATUS_LABELS = {
  libre: 'Libre',
  ocupada: 'Ocupada',
  cuenta_solicitada: 'Cuenta solicitada',
}

// Estados de pedido / cocina
export const ORDER_STATUS = {
  PENDING: 'pendiente',
  PREPARING: 'preparando',
  DELIVERED: 'entregado',
  PAID: 'cobrado',
}

export const ORDER_STATUS_LABELS = {
  pendiente: 'Pendiente',
  preparando: 'Preparando',
  entregado: 'Entregado',
  cobrado: 'Cobrado',
}

// Métodos de pago
export const PAYMENT_METHOD = {
  CASH: 'efectivo',
  TRANSFER: 'transferencia',
}

export const PAYMENT_METHOD_LABELS = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
}

// Movimientos de inventario
export const INVENTORY_MOVEMENT = {
  ENTRY: 'entrada',
  SALE: 'venta',
  ADJUSTMENT: 'ajuste',
  LOSS: 'perdida',
}

// Movimientos de caja
export const CASH_MOVEMENT = {
  INCOME: 'ingreso',
  EXPENSE: 'egreso',
}

// Rutas de navegación
export const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/mesas', label: 'Mesas', icon: 'UtensilsCrossed' },
  { path: '/ventas', label: 'Ventas', icon: 'ShoppingCart' },
  { path: '/inventario', label: 'Inventario', icon: 'Package' },
  { path: '/recetas', label: 'Recetas', icon: 'BookOpen' },
  { path: '/historial', label: 'Historial de Ventas', icon: 'History' },
  { path: '/caja', label: 'Caja', icon: 'Wallet' },
  { path: '/estadisticas', label: 'Estadísticas', icon: 'BarChart3' },
  { path: '/configuracion', label: 'Configuración', icon: 'Settings' },
]

// Ancho de ticket térmico ESC/POS (58mm)
export const TICKET_WIDTH_MM = 58
