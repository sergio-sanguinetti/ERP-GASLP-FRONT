'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { authAPI, type Usuario, type LoginRequest, type Verify2FARequest } from '@lib/api'

interface AuthContextType {
  user: Usuario | null
  token: string | null
  loading: boolean
  login: (data: LoginRequest) => Promise<{ requires2FA?: boolean }>
  verify2FA: (data: Verify2FARequest) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<Usuario | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Cargar token y usuario del localStorage al iniciar
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')

      if (storedToken && storedUser) {
        setToken(storedToken)
        try {
          setUser(JSON.parse(storedUser))
        } catch (e) {
          console.error('Error parsing stored user:', e)
          localStorage.removeItem('user')
          localStorage.removeItem('token')
        }
      }
    }
    setLoading(false)
  }, [])

  const login = async (data: LoginRequest): Promise<{ requires2FA?: boolean }> => {
    try {
      const response = await authAPI.login(data)

      if (response.requires2FA && response.token) {
        // Guardar token temporal para 2FA
        if (typeof window !== 'undefined') {
          localStorage.setItem('tempToken', response.token)
        }
        return { requires2FA: true }
      }

      if (response.token) {
        // Login exitoso sin 2FA
        setToken(response.token)
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', response.token)
        }

        // Obtener perfil del usuario
        const profile = await authAPI.getProfile()
        setUser(profile)
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(profile))
        }

        router.push('/')
        return {}
      }

      throw new Error('No se recibió token')
    } catch (error: any) {
      throw error
    }
  }

  const verify2FA = async (data: Verify2FARequest): Promise<void> => {
    try {
      // Usar el token temporal guardado
      if (typeof window !== 'undefined') {
        const tempToken = localStorage.getItem('tempToken')
        if (tempToken) {
          localStorage.setItem('token', tempToken)
        }
      }

      const response = await authAPI.verify2FA(data)

      if (response.token) {
        // Token final recibido
        setToken(response.token)
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', response.token)
          localStorage.removeItem('tempToken')
        }

        // Obtener perfil del usuario
        const profile = await authAPI.getProfile()
        setUser(profile)
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(profile))
        }

        router.push('/')
      } else {
        throw new Error('No se recibió token')
      }
    } catch (error: any) {
      // Limpiar token temporal en caso de error
      if (typeof window !== 'undefined') {
        localStorage.removeItem('tempToken')
      }
      throw error
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('tempToken')
    }
    router.push('/login')
  }

  const isAuthenticated = !!token && !!user

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        verify2FA,
        logout,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

