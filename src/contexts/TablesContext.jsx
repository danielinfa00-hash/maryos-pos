/**
 * Contexto de mesas.
 * Centraliza el estado de mesas para sincronizar entre vistas.
 */
import { createContext, useContext, useState, useCallback } from 'react'
import * as tablesService from '../services/tablesService'

const TablesContext = createContext(null)

export function TablesProvider({ children }) {
  const [tables, setTables] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const loadTables = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await tablesService.fetchTables()
      setTables(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const createTable = useCallback(async (name) => {
    const table = await tablesService.createTable(name)
    setTables((prev) => [...prev, table].sort((a, b) => a.sort_order - b.sort_order))
    return table
  }, [])

  const updateTable = useCallback(async (id, updates) => {
    const updated = await tablesService.updateTable(id, updates)
    setTables((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)))
    return updated
  }, [])

  const removeTable = useCallback(async (id) => {
    await tablesService.deleteTable(id)
    setTables((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const value = {
    tables,
    loading,
    error,
    loadTables,
    createTable,
    updateTable,
    removeTable,
  }

  return <TablesContext.Provider value={value}>{children}</TablesContext.Provider>
}

export function useTables() {
  const context = useContext(TablesContext)
  if (!context) throw new Error('useTables debe usarse dentro de TablesProvider')
  return context
}
