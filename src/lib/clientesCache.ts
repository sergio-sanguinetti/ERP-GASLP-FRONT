/**
 * Caché local de clientes en el panel web para carga rápida y actualización en segundo plano.
 * La caché es por sede (sedeId) para no mezclar datos entre sedes.
 */
function cacheKey(sedeId: string | null): string {
  return `@erpgaslp_web:clientes_cache_${sedeId || 'sin_sede'}`
}

function lastUpdateKey(sedeId: string | null): string {
  return `@erpgaslp_web:clientes_last_update_${sedeId || 'sin_sede'}`
}

export function getClientesCache(sedeId: string | null): unknown[] | null {
  try {
    const raw = typeof window !== 'undefined' ? localStorage.getItem(cacheKey(sedeId)) : null
    if (!raw) return null
    const data = JSON.parse(raw)
    return Array.isArray(data) ? data : null
  } catch {
    return null
  }
}

export function setClientesCache(sedeId: string | null, clientes: unknown[]): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(cacheKey(sedeId), JSON.stringify(clientes))
      const iso = new Date().toISOString()
      localStorage.setItem(lastUpdateKey(sedeId), iso)
    }
  } catch (e) {
    console.warn('clientesCache set error', e)
  }
}

export function getClientesLastUpdate(sedeId: string | null): string | null {
  try {
    return typeof window !== 'undefined' ? localStorage.getItem(lastUpdateKey(sedeId)) : null
  } catch {
    return null
  }
}

export function formatRelativeTime(isoString: string | null): string {
  if (!isoString) return ''
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffMins < 1) return 'Ahora mismo'
    if (diffMins < 60) return `Hace ${diffMins} min`
    if (diffHours < 24) return `Hace ${diffHours} h`
    if (diffDays < 7) return `Hace ${diffDays} día(s)`
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
  } catch {
    return ''
  }
}
