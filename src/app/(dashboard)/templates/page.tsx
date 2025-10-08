/**
 * Página de listagem de templates
 * Interface para visualizar e gerenciar templates
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { api, apiEndpoints } from '@/lib/api'
import { BudgetTemplate } from '@/types'
import { formatDate } from '@/lib/utils'
import { Plus, FileText, Edit, Trash2, Copy } from 'lucide-react'

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<BudgetTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const response = await api.get(apiEndpoints.templates.list)
      setTemplates(response.data.data)
    } catch (error) {
      console.error('Erro ao carregar templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return

    try {
      await api.delete(apiEndpoints.templates.delete(id))
      setTemplates(templates.filter(t => t.id !== id))
    } catch (error) {
      console.error('Erro ao excluir template:', error)
      alert('Erro ao excluir template')
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await api.patch(apiEndpoints.templates.update(id), {
        is_active: !isActive
      })
      setTemplates(templates.map(t => 
        t.id === id ? { ...t, is_active: !isActive } : t
      ))
    } catch (error) {
      console.error('Erro ao atualizar template:', error)
      alert('Erro ao atualizar template')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-full"></div>
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Templates</h1>
          <p className="text-gray-600 mt-1">
            Gerencie seus templates de orçamento
          </p>
        </div>
        <Link href="/templates/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Novo Template
          </Button>
        </Link>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum template encontrado
            </h3>
            <p className="text-gray-600 mb-6">
              Comece criando seu primeiro template de orçamento
            </p>
            <Link href="/templates/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Template
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {template.description || 'Sem descrição'}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        template.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {template.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    <strong>Categorias:</strong> {template.categories?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Campos:</strong>{' '}
                    {template.categories?.reduce((total, cat) => total + (cat.fields?.length || 0), 0) || 0}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Criado em:</strong> {formatDate(template.created_at)}
                  </div>
                  
                  <div className="flex gap-2 pt-3">
                    <Link href={`/templates/${template.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleActive(template.id, template.is_active)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      {template.is_active ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}