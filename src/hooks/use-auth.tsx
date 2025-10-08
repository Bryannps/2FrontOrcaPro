/**
 * Hook de autenticação
 * Gerencia estado de login, logout e dados do usuário
 */

'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { api, apiEndpoints } from '@/lib/api'
import { User, AuthResponse, LoginData, RegisterData } from '@/types'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  login: (data: LoginData) => Promise<{ success: boolean; error?: string }>
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const isAuthenticated = !!user && !!token

  // Verificar autenticação ao carregar
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const storedToken = localStorage.getItem('auth_token')
      
      if (!storedToken) {
        setLoading(false)
        return
      }

      setToken(storedToken)
      
      // Verificar se o token ainda é válido
      const response = await api.get(apiEndpoints.auth.me)
      const userData = response.data.data.user
      
      setUser(userData)
    } catch (error: any) {
      console.error('Erro ao verificar autenticação:', error)
      
      // Se for erro de rede (backend não disponível), não limpar o token
      if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        console.warn('Backend não disponível. Mantendo token para quando conexão for restaurada.')
        // Manter o token mas não definir o usuário ainda
        setUser(null)
      } else {
        // Token inválido, expirado ou outro erro de autenticação
        localStorage.removeItem('auth_token')
        setToken(null)
        setUser(null)
      }
    } finally {
      setLoading(false)
    }
  }

  const login = async (data: LoginData) => {
    try {
      setLoading(true)
      
      const response = await api.post(apiEndpoints.auth.login, data)
      const authData: AuthResponse = response.data.data
      
      // Salvar token e dados do usuário
      localStorage.setItem('auth_token', authData.token)
      setToken(authData.token)
      setUser(authData.user)
      
      return { success: true }
    } catch (error: any) {
      console.error('Erro no login:', error)
      
      let errorMessage = 'Erro ao fazer login'
      
      if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão.'
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      
      return { 
        success: false, 
        error: errorMessage
      }
    } finally {
      setLoading(false)
    }
  }

  const register = async (data: RegisterData) => {
    try {
      setLoading(true)
      
      const response = await api.post(apiEndpoints.auth.register, data)
      const authData: AuthResponse = response.data.data
      
      // Salvar token e dados do usuário
      localStorage.setItem('auth_token', authData.token)
      setToken(authData.token)
      setUser(authData.user)
      
      return { success: true }
    } catch (error: any) {
      console.error('Erro no registro:', error)
      
      let errorMessage = 'Erro ao registrar'
      
      if (error.code === 'NETWORK_ERROR' || error.message === 'Network Error') {
        errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão.'
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      }
      
      return { 
        success: false, 
        error: errorMessage
      }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    setToken(null)
    setUser(null)
    
    // Redirecionar para login
    window.location.href = '/login'
  }

  const refreshUser = async () => {
    try {
      const response = await api.get(apiEndpoints.auth.me)
      const userData = response.data.data.user
      setUser(userData)
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error)
      logout()
    }
  }

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}