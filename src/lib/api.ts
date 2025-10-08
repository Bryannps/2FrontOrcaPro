/**
 * Cliente API - Configuração do Axios
 * Gerencia todas as requisições para o backend
 */

import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Criar instância do axios
export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - adiciona token JWT automaticamente
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - trata erros globalmente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token')
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// Endpoints da API
export const apiEndpoints = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    me: '/auth/me',
    validateToken: '/auth/validate-token',
  },
  companies: {
    me: '/companies/me',
    stats: '/companies/stats',
    updateSettings: '/companies/settings',
  },
  templates: {
    list: '/templates',
    create: '/templates',
    show: (id: string) => `/templates/${id}`,
    update: (id: string) => `/templates/${id}`,
    delete: (id: string) => `/templates/${id}`,
  },
  budgets: {
    list: '/budgets',
    create: '/budgets',
    show: (id: string) => `/budgets/${id}`,
    update: (id: string) => `/budgets/${id}`,
    delete: (id: string) => `/budgets/${id}`,
    calculate: '/budgets/calculate',
    updateStatus: (id: string) => `/budgets/${id}/status`,
  },
}

export default api