'use client'

// React Imports
import { useState, useEffect } from 'react'
import type { ReactElement } from 'react'

// Type Imports
import type { SystemMode } from '@core/types'

// Hook Imports
import { useSettings } from '@core/hooks/useSettings'
import useLayoutInit from '@core/hooks/useLayoutInit'

type LayoutWrapperProps = {
  systemMode: SystemMode
  verticalLayout: ReactElement
  horizontalLayout: ReactElement
}

const LayoutWrapper = (props: LayoutWrapperProps) => {
  // Props
  const { systemMode, verticalLayout, horizontalLayout } = props

  // Hooks
  const { settings } = useSettings()
  const [mounted, setMounted] = useState(false)

  useLayoutInit(systemMode)

  // Asegurar que el componente esté montado antes de usar settings
  useEffect(() => {
    setMounted(true)
  }, [])

  // Asegurar valores por defecto consistentes para evitar problemas de hidratación
  const skin = mounted && settings?.skin ? settings.skin : 'default'
  const layout = mounted && settings?.layout ? settings.layout : 'vertical'

  // Return the layout based on the layout context
  return (
    <div className='flex flex-col flex-auto' data-skin={skin}>
      {layout === 'horizontal' ? horizontalLayout : verticalLayout}
    </div>
  )
}

export default LayoutWrapper
