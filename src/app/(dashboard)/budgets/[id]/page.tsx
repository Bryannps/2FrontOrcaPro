'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Edit3, 
  Trash2, 
  Download, 
  Send, 
  Calculator,
  Calendar,
  Building,
  FileText,
  DollarSign
} from 'lucide-react';

interface BudgetItem {
  id: string;
  field_name: string;
  value: number;
  unit_cost: number;
  total_cost: number;
}

interface Budget {
  id: string;
  title: string;
  description: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  profit_amount: number;
  total_amount: number;
  created_at: string;
  updated_at: string;
  company: {
    id: string;
    name: string;
    email: string;
  };
  template: {
    id: string;
    name: string;
    category: string;
  };
  items: BudgetItem[];
}

export default function BudgetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [deleting, setDeleting] = useState(false);

  const budgetId = params.id as string;

  useEffect(() => {
    if (budgetId) {
      fetchBudget();
    }
  }, [budgetId]);

  const fetchBudget = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/budgets/${budgetId}`);
      setBudget(response.data.data);
    } catch (error) {
      console.error('Erro ao carregar orçamento:', error);
      router.push('/budgets');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!budget || !confirm('Tem certeza que deseja excluir este orçamento?')) return;

    try {
      setDeleting(true);
      await api.delete(`/budgets/${budget.id}`);
      router.push('/budgets');
    } catch (error) {
      console.error('Erro ao excluir orçamento:', error);
      alert('Erro ao excluir orçamento');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-800' },
      pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
      approved: { label: 'Aprovado', color: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rejeitado', color: 'bg-red-100 text-red-800' }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.draft;
    
    return (
      <Badge className={statusInfo.color}>
        {statusInfo.label}
      </Badge>
    );
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!budget) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Orçamento não encontrado</h2>
          <Button onClick={() => router.push('/budgets')}>
            Voltar para Orçamentos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/budgets')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{budget.title}</h1>
            <div className="flex items-center gap-4 mt-2">
              {getStatusBadge(budget.status)}
              <span className="text-sm text-gray-500">
                Criado em {formatDate(budget.created_at)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
          <Button variant="outline" size="sm">
            <Send className="h-4 w-4 mr-2" />
            Enviar por E-mail
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/budgets/${budget.id}/edit`)}
          >
            <Edit3 className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {deleting ? 'Excluindo...' : 'Excluir'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-2 space-y-6">
          {/* Budget Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informações do Orçamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Descrição</h4>
                <p className="text-gray-600">
                  {budget.description || 'Nenhuma descrição fornecida'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Template Utilizado</h4>
                  <p className="text-gray-600">{budget.template.name}</p>
                  <span className="text-sm text-gray-500">
                    Categoria: {budget.template.category}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-700 mb-1">Última Atualização</h4>
                  <p className="text-gray-600">{formatDate(budget.updated_at)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Budget Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Itens do Orçamento
              </CardTitle>
              <CardDescription>
                Detalhamento dos itens e valores calculados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Item</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Quantidade</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">V. Unitário</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">V. Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budget.items.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-3 px-4 text-gray-900">{item.field_name}</td>
                        <td className="py-3 px-4 text-right text-gray-600">{item.value}</td>
                        <td className="py-3 px-4 text-right text-gray-600">
                          {formatCurrency(item.unit_cost)}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-gray-900">
                          {formatCurrency(item.total_cost)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Empresa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">{budget.company?.name || 'Nome não disponível'}</h4>
                <p className="text-sm text-gray-600">{budget.company?.email || 'Email não disponível'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Resumo Financeiro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(budget.subtotal)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Margem de Lucro:</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(budget.profit_amount)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Impostos:</span>
                <span className="font-medium text-orange-600">
                  {formatCurrency(budget.tax_amount)}
                </span>
              </div>
              
              <hr />
              
              <div className="flex justify-between text-lg">
                <span className="font-semibold text-gray-900">Total:</span>
                <span className="font-bold text-blue-600">
                  {formatCurrency(budget.total_amount)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Histórico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Orçamento criado</p>
                    <p className="text-xs text-gray-500">{formatDate(budget.created_at)}</p>
                  </div>
                </div>
                
                {budget.updated_at !== budget.created_at && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Última atualização</p>
                      <p className="text-xs text-gray-500">{formatDate(budget.updated_at)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}