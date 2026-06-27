/**
 * Cliente Supabase centralizado.
 * Lee las variables de entorno de Vite (prefijo VITE_).
 * Si no hay credenciales, la app funciona en modo demo con localStorage.
 */
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** true cuando Supabase está configurado correctamente */
export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('tu-proyecto') &&
  supabaseAnonKey !== 'tu-anon-key'
)

/** Cliente Supabase (null en modo demo) */
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

/** Helper para manejar errores de Supabase de forma uniforme */
export function handleSupabaseError(error, context = 'Operación') {
  console.error(`[Supabase] ${context}:`, error)
  throw new Error(error?.message || `Error en ${context}`)
}
