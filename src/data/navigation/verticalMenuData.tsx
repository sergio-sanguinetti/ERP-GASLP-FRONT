// Type Imports
import type { VerticalMenuDataType } from '@/types/menuTypes'

const verticalMenuData = (): VerticalMenuDataType[] => [
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
    label: 'Newsletter',
    href: '/newsletter',
    icon: 'tabler-news'
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
        label: 'Sedes',
        href: '/configuracion/sedes',
        icon: 'tabler-building-store'
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
        label: 'Zonas',
        href: '/zonas',
        icon: 'tabler-map-pin'
      },
      {
        label: 'Tickets',
        href: '/configuracion/tickets',
        icon: 'tabler-receipt'
      }
    ]
  }
]

export default verticalMenuData
