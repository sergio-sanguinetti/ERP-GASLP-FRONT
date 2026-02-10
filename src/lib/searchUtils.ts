/**
 * Normaliza texto para búsqueda: minúsculas y sin acentos (coincidencia parcial sin importar acentos).
 */
const MAP_ACENTOS: Record<string, string> = {
  á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ñ: 'n',
  Á: 'a', É: 'e', Í: 'i', Ó: 'o', Ú: 'u', Ñ: 'n',
}

export function normalizarParaBusqueda(str: string | null | undefined): string {
  if (str == null || typeof str !== 'string') return ''
  let s = str.toLowerCase().trim()
  Object.keys(MAP_ACENTOS).forEach(ac => {
    s = s.split(ac).join(MAP_ACENTOS[ac])
  })
  return s
}

/** Comprueba si un texto normalizado incluye la query normalizada (para búsqueda parcial sin acentos). */
export function coincideBusqueda(texto: string | null | undefined, queryNormalizada: string): boolean {
  if (!queryNormalizada) return true
  return normalizarParaBusqueda(texto).includes(queryNormalizada)
}
