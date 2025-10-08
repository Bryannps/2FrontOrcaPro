/**
 * Página principal do Dashboard
 * Visão geral com estatísticas e atalhos
 */

'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { api, apiEndpoints } from '@/lib/api'
import { CompanyStats } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { FileText, Receipt, Plus, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const [stats, setStats] = useState<CompanyStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const response = await api.get(apiEndpoints.companies.stats)
      setStats(response.data.data)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-3">
          <Link href="/templates/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Template
            </Button>
          </Link>
          <Link href="/budgets/new">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Novo Orçamento
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_templates || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.active_templates || 0} ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orçamentos</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_budgets || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.draft_budgets || 0} em rascunho
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.approved_budgets || 0}</div>
            <p className="text-xs text-muted-foreground">
              Orçamentos aprovados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats?.total_budget_value || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Em orçamentos criados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Atalhos para as principais funcionalidades
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/templates">
              <Button className="w-full justify-start">
                <FileText className="h-4 w-4 mr-2" />
                Gerenciar Templates
              </Button>
            </Link>
            <Link href="/budgets">
              <Button variant="outline" className="w-full justify-start">
                <Receipt className="h-4 w-4 mr-2" />
                Ver Orçamentos
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
            <CardDescription>
              Visão geral da sua atividade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Templates ativos:</span>
                <span className="font-medium">{stats?.active_templates || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Orçamentos em rascunho:</span>
                <span className="font-medium">{stats?.draft_budgets || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Orçamentos aprovados:</span>
                <span className="font-medium">{stats?.approved_budgets || 0}</span>
              </div>
              <div className="flex justify-between border-t pt-3">
                <span className="text-sm font-medium">Valor total:</span>
                <span className="font-bold text-blue-600">
                  {formatCurrency(stats?.total_budget_value || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}