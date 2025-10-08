/**
 * Página de Registro
 * Interface para cadastro de novas empresas
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { RegisterData } from '@/types'

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email deve ter um formato válido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  document: z.string().optional(),
})

export default function RegisterPage() {
  const router = useRouter()
  const { register: registerUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
  })

  const onSubmit = async (data: RegisterData) => {
    setIsLoading(true)
    setError('')

    const result = await registerUser(data)

    if (result.success) {
      router.push('/dashboard')
    } else {
      setError(result.error || 'Erro ao registrar empresa')
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Sistema de Orçamentos
          </h1>
          <p className="mt-2 text-gray-600">
            Cadastre sua empresa para começar
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cadastrar Empresa</CardTitle>
            <CardDescription>
              Preencha os dados da sua empresa para criar uma conta
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Empresa *
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Nome da sua empresa"
                  error={errors.name?.message}
                  {...register('name')}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contato@empresa.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>

              <div>
                <label htmlFor="document" className="block text-sm font-medium text-gray-700 mb-1">
                  CNPJ (opcional)
                </label>
                <Input
                  id="document"
                  type="text"
                  placeholder="00.000.000/0000-00"
                  error={errors.document?.message}
                  {...register('document')}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Senha *
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Crie uma senha segura"
                  error={errors.password?.message}
                  {...register('password')}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                loading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Cadastrando...' : 'Cadastrar Empresa'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Já tem uma conta?{' '}
                <Link 
                  href="/login" 
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Faça login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}