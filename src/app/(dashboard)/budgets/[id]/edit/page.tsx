'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Calculator } from 'lucide-react';

interface TemplateField {
  id: string;
  name: string;
  type: string;
  unit: string;
  default_cost: number;
}

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
  template: {
    id: string;
    name: string;
    category: string;
    fields: TemplateField[];
  };
  items: BudgetItem[];
}

export default function EditBudgetPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [budget, setBudget] = useState<Budget | null>(null);
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('draft');
  const [fieldValues, setFieldValues] = useState<Record<string, { value: number; unitCost: number }>>({});
  
  // Calculation states
  const [subtotal, setSubtotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [profitAmount, setProfitAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  const budgetId = params.id as string;

  useEffect(() => {
    if (budgetId) {
      fetchBudget();
    }
  }, [budgetId]);

  useEffect(() => {
    calculateTotals();
  }, [fieldValues]);

  const fetchBudget = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/budgets/${budgetId}`);
      const budgetData = response.data.data;
      
      setBudget(budgetData);
      setTitle(budgetData.title);
      setDescription(budgetData.description || '');
      setStatus(budgetData.status);
      
      // Initialize field values with existing data
      const values: Record<string, { value: number; unitCost: number }> = {};
      budgetData.items.forEach((item: BudgetItem) => {
        values[item.field_name] = {
          value: item.value,
          unitCost: item.unit_cost
        };
      });
      setFieldValues(values);
      
    } catch (error) {
      console.error('Erro ao carregar orçamento:', error);
      router.push('/budgets');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = async () => {
    if (!budget || Object.keys(fieldValues).length === 0) return;

    try {
      const items = Object.entries(fieldValues).map(([fieldName, data]) => ({
        field_name: fieldName,
        value: data.value,
        unit_cost: data.unitCost
      }));

      const response = await api.post('/budgets/calculate', {
        template_id: budget.template.id,
        items
      });

      const calculation = response.data.data;
      setSubtotal(calculation.subtotal);
      setTaxAmount(calculation.tax_amount);
      setProfitAmount(calculation.profit_amount);
      setTotalAmount(calculation.total_amount);
    } catch (error) {
      console.error('Erro ao calcular totais:', error);
    }
  };

  const handleFieldChange = (fieldName: string, field: 'value' | 'unitCost', newValue: number) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldName]: {
        ...prev[fieldName],
        [field]: newValue
      }
    }));
  };

  const handleSave = async () => {
    if (!budget || !title.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    try {
      setSaving(true);

      const items = Object.entries(fieldValues).map(([fieldName, data]) => ({
        field_name: fieldName,
        value: data.value,
        unit_cost: data.unitCost
      }));

      const budgetData = {
        title: title.trim(),
        description: description.trim(),
        status,
        template_id: budget.template.id,
        items
      };

      await api.patch(`/budgets/${budget.id}`, budgetData);
      
      alert('Orçamento atualizado com sucesso!');
      router.push(`/budgets/${budget.id}`);
    } catch (error) {
      console.error('Erro ao salvar orçamento:', error);
      alert('Erro ao salvar orçamento');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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
            onClick={() => router.push(`/budgets/${budget.id}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Editar Orçamento</h1>
            <p className="text-gray-600 mt-1">
              Template: {budget.template.name} - {budget.template.category}
            </p>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="xl:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>
                Configure os dados principais do orçamento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Título do Orçamento *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Digite o título do orçamento"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva os detalhes do orçamento"
                  rows={3}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Rascunho</option>
                  <option value="pending">Pendente</option>
                  <option value="approved">Aprovado</option>
                  <option value="rejected">Rejeitado</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Template Fields */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Itens do Orçamento
              </CardTitle>
              <CardDescription>
                Configure os valores para cada campo do template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {budget.template.fields.map((field) => {
                  const fieldValue = fieldValues[field.name] || {
                    value: 1,
                    unitCost: field.default_cost
                  };

                  return (
                    <div key={field.id} className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">{field.name}</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Quantidade</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={fieldValue.value}
                            onChange={(e) => handleFieldChange(
                              field.name, 
                              'value', 
                              parseFloat(e.target.value) || 0
                            )}
                            className="mt-1"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Unidade: {field.unit}
                          </p>
                        </div>

                        <div>
                          <Label>Custo Unitário</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={fieldValue.unitCost}
                            onChange={(e) => handleFieldChange(
                              field.name, 
                              'unitCost', 
                              parseFloat(e.target.value) || 0
                            )}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label>Total</Label>
                          <div className="mt-1 px-3 py-2 bg-gray-50 border rounded-md">
                            {formatCurrency(fieldValue.value * fieldValue.unitCost)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Calculation Summary */}
        <div>
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Resumo do Orçamento</CardTitle>
              <CardDescription>
                Valores calculados automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Margem de Lucro:</span>
                <span className="font-medium text-green-600">
                  {formatCurrency(profitAmount)}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Impostos:</span>
                <span className="font-medium text-orange-600">
                  {formatCurrency(taxAmount)}
                </span>
              </div>
              
              <hr />
              
              <div className="flex justify-between text-lg">
                <span className="font-semibold text-gray-900">Total:</span>
                <span className="font-bold text-blue-600">
                  {formatCurrency(totalAmount)}
                </span>
              </div>

              <div className="mt-6 pt-4 border-t">
                <Button 
                  onClick={handleSave} 
                  disabled={saving}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}