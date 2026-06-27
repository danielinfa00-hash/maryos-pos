export function hasRole() { return true }
export function isAdmin() { return true }
export function isCashier() { return false }
export function canAccessRoute() { return true }
export const PERMISSIONS = {
  manageInventory: () => true,
  manageSettings: () => true,
  viewStats: () => true,
  manageTables: () => true,
  processSales: () => true,
  manageCash: () => true,
}
