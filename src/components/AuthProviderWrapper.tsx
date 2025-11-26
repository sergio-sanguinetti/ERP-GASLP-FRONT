'use client'

import { AuthProvider } from '@contexts/AuthContext'
import type { ReactNode } from 'react'

interface AuthProviderWrapperProps {
  children: ReactNode
}

const AuthProviderWrapper = ({ children }: AuthProviderWrapperProps) => {
  return <AuthProvider>{children}</AuthProvider>
}

export default AuthProviderWrapper

