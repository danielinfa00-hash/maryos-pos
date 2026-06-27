/**
 * Servicio de caja diaria: apertura, movimientos y cierre.
 */
import { supabase, isSupabaseConfigured, handleSupabaseError } from '../supabase/client'
import {
  getLocalTable,
  insertLocal,
  updateLocal,
  generateId,
} from './localStorage'
import { CASH_MOVEMENT, PAYMENT_METHOD } from '../utils/constants'
import { fetchSales } from './salesService'
import { getDateRange } from '../utils/formatters'

/** Obtiene la sesión de caja abierta actual */
export async function fetchOpenCashSession() {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('cash_sessions')
      .select('*, cash_movements(*)')
      .eq('is_open', true)
      .maybeSingle()

    if (error) handleSupabaseError(error, 'fetchOpenCashSession')
    return data
  }

  return getLocalTable('cash_sessions').find((s) => s.is_open) || null
}

/** Abre caja con monto inicial */
export async function openCashSession(openingAmount) {
  const record = {
    opening_amount: openingAmount,
    total_sales: 0,
    total_cash: 0,
    total_transfer: 0,
    is_open: true,
    opened_at: new Date().toISOString(),
  }

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('cash_sessions')
      .insert(record)
      .select()
      .single()

    if (error) handleSupabaseError(error, 'openCashSession')
    return data
  }

  return insertLocal('cash_sessions', { ...record, id: generateId('cash') })
}

/** Registra ingreso o egreso manual */
export async function addCashMovement(sessionId, type, amount, description) {
  const movement = {
    session_id: sessionId,
    movement_type: type,
    amount,
    description,
    created_at: new Date().toISOString(),
  }

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('cash_movements')
      .insert(movement)
      .select()
      .single()

    if (error) handleSupabaseError(error, 'addCashMovement')
    return data
  }

  return insertLocal('cash_movements', { ...movement, id: generateId('cm') })
}

/** Calcula resumen del día para cierre de caja */
export async function calculateCashSummary(session) {
  const { start, end } = getDateRange('hoy')
  const sales = await fetchSales({ startDate: start, endDate: end })

  const totalSales = sales.reduce((sum, s) => sum + Number(s.total), 0)
  const totalCash = sales
    .filter((s) => s.payment_method === PAYMENT_METHOD.CASH)
    .reduce((sum, s) => sum + Number(s.total), 0)
  const totalTransfer = sales
    .filter((s) => s.payment_method === PAYMENT_METHOD.TRANSFER)
    .reduce((sum, s) => sum + Number(s.total), 0)

  let movements = []
  if (isSupabaseConfigured) {
    const { data } = await supabase
      .from('cash_movements')
      .select('*')
      .eq('session_id', session.id)
    movements = data || []
  } else {
    movements = getLocalTable('cash_movements').filter((m) => m.session_id === session.id)
  }

  const extraIncome = movements
    .filter((m) => m.movement_type === CASH_MOVEMENT.INCOME)
    .reduce((sum, m) => sum + Number(m.amount), 0)

  const expenses = movements
    .filter((m) => m.movement_type === CASH_MOVEMENT.EXPENSE)
    .reduce((sum, m) => sum + Number(m.amount), 0)

  const expectedCash =
    Number(session.opening_amount) + totalCash + extraIncome - expenses

  return {
    totalSales,
    totalCash,
    totalTransfer,
    extraIncome,
    expenses,
    expectedCash,
  }
}

/** Cierra la sesión de caja */
export async function closeCashSession(sessionId, closingAmount, notes = '') {
  const session = isSupabaseConfigured
    ? (await supabase.from('cash_sessions').select('*').eq('id', sessionId).single()).data
    : getLocalTable('cash_sessions').find((s) => s.id === sessionId)

  const summary = await calculateCashSummary(session)
  const difference = Number(closingAmount) - summary.expectedCash

  const updates = {
    is_open: false,
    closing_amount: closingAmount,
    total_sales: summary.totalSales,
    total_cash: summary.totalCash,
    total_transfer: summary.totalTransfer,
    expected_cash: summary.expectedCash,
    difference,
    closed_at: new Date().toISOString(),
    notes,
  }

  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('cash_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single()

    if (error) handleSupabaseError(error, 'closeCashSession')
    return { session: data, summary, difference }
  }

  const updated = updateLocal('cash_sessions', sessionId, updates)
  return { session: updated, summary, difference }
}
