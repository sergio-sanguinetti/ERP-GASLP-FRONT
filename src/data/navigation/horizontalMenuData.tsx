// Type Imports
import type { HorizontalMenuDataType } from '@/types/menuTypes'

const horizontalMenuData = (): HorizontalMenuDataType[] => [
  {
    label: 'Home',
    href: '/home',
    icon: 'tabler-smart-home'
  },
  {
    label: 'Clientes',
    href: '/clientes',
    icon: 'tabler-users'
  },
  {
    label: 'Ventas',
    href: '/ventas',
    icon: 'tabler-shopping-cart'
  },
  {
    label: 'Créditos y Abonos',
    href: '/creditos-abonos',
    icon: 'tabler-credit-card'
  },
  {
    label: 'Corte Caja',
    href: '/corte-caja',
    icon: 'tabler-cash'
  },
  {
    label: 'Reportes',
    href: '/reportes',
    icon: 'tabler-chart-bar'
  },
  {
    label: 'Configuración',
    icon: 'tabler-settings',
    children: [
      {
        label: 'Usuarios',
        href: '/configuracion/usuarios',
        icon: 'tabler-user-cog'
      },
      {
        label: 'Formas de Pago',
        href: '/configuracion/formas-pago',
        icon: 'tabler-credit-card-pay'
      },
      {
        label: 'Rutas',
        href: '/configuracion/rutas',
        icon: 'tabler-route'
      },
      {
        label: 'Tickets',
        href: '/configuracion/tickets',
        icon: 'tabler-receipt'
      }
    ]
  }
]

export default horizontalMenuData
