// Type Imports
import type { HorizontalMenuDataType } from '@/types/menuTypes'

const horizontalMenuData = (role?: string): HorizontalMenuDataType[] => {
  // Roles que ven newsletter y reportes
  const seeExtra = ['superAdministrador', 'administrador', 'oficina', 'planta'].includes(role || '')
  
  // Roles que ven caja
  const seeCaja = role !== 'oficina'

  // Roles que ven configuración
  const seeConfigAdmin = ['superAdministrador', 'administrador'].includes(role || '')
  const seeConfigTotal = role === 'superAdministrador'

  const menu: HorizontalMenuDataType[] = [
    { label: 'Home', href: '/home', icon: 'tabler-smart-home' },
    { label: 'Clientes', href: '/clientes', icon: 'tabler-users' },
    { label: 'Ventas', href: '/ventas', icon: 'tabler-shopping-cart' },
    { label: 'Créditos y Abonos', href: '/creditos-abonos', icon: 'tabler-credit-card' }
  ]

  if (seeCaja) {
    menu.push({ label: 'Corte Caja', href: '/corte-caja', icon: 'tabler-cash' })
  }

  if (seeExtra) {
    menu.push({ label: 'Reportes', href: '/reportes', icon: 'tabler-chart-bar' })
  }

  if (seeConfigAdmin) {
    const configChildren: any[] = []
    if (seeConfigTotal) {
      configChildren.push({ label: 'Usuarios', href: '/configuracion/usuarios', icon: 'tabler-user-cog' })
      configChildren.push({ label: 'Sedes', href: '/configuracion/sedes', icon: 'tabler-building-store' })
    }
    
    configChildren.push({ label: 'Formas de Pago', href: '/configuracion/formas-pago', icon: 'tabler-credit-card-pay' })
    configChildren.push({ label: 'Rutas', href: '/configuracion/rutas', icon: 'tabler-route' })
    configChildren.push({ label: 'Tickets', href: '/configuracion/tickets', icon: 'tabler-receipt' })

    menu.push({
      label: 'Configuración',
      icon: 'tabler-settings',
      children: configChildren
    })
  }

  return menu
}

export default horizontalMenuData
