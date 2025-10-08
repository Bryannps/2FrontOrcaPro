'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { api, apiEndpoints } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Calculator, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Template {
  id: string;
  name: string;
  description: string;
  categories: Category[];
}

interface Category {
  id: string;
  name: string;
  order: number;
  is_repeatable: boolean;
  fields: Field[];
}

interface Field {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'boolean';
  required: boolean;
  options?: any;
  order: number;
}

interface BudgetItem {
  category_id: string;
  field_values: Record<string, any>;
  order: number;
}

export default function NewBudgetPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [calculatedTotal, setCalculatedTotal] = useState(0);

  useEffect(() => {
    if (user) {
      fetchTemplates();
    }
  }, [user]);

  // Auto-calculate when items or template change
  useEffect(() => {
    if (selectedTemplate && items.length > 0) {
      const hasValidItems = items.some(item => 
        item.category_id && 
        typeof item.field_values === 'object' && 
        typeof item.order === 'number'
      );
      
      if (hasValidItems) {
        calculateTotal();
      }
    }
  }, [items, selectedTemplate]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get(apiEndpoints.templates.list);
      setTemplates(response.data.data || []);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    // Initialize items with one item per category
    const initialItems = template.categories.map((category, index) => ({
      category_id: category.id,
      field_values: {},
      order: index
    }));
    setItems(initialItems);
  };

  const updateFieldValue = (itemIndex: number, fieldId: string, value: any) => {
    const updatedItems = [...items];
    updatedItems[itemIndex].field_values[fieldId] = value;
    setItems(updatedItems);
    // calculateTotal will be called automatically via useEffect
  };

  const addItem = (categoryId: string) => {
    const newItem: BudgetItem = {
      category_id: categoryId,
      field_values: {},
      order: items.length
    };
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
    // calculateTotal will be called automatically via useEffect
  };


  const calculateTotal = useCallback(async () => {
    console.log('calculateTotal called');
    console.log('selectedTemplate:', selectedTemplate);
    console.log('items:', items);
    console.log('items.length:', items.length);
    
    if (!selectedTemplate) {
      console.warn('No template selected');
      return;
    }
    
    if (items.length === 0) {
      console.warn('No items to calculate');
      return;
    }

    // Validate items structure and required fields before sending
    const validationErrors: string[] = [];
    
    const validItems = items.filter(item => {
      console.log('Validating item:', item);
      
      // Basic structure validation
      const hasBasicStructure = item.category_id && 
        typeof item.field_values === 'object' && 
        typeof item.order === 'number';
      
      if (!hasBasicStructure) {
        console.log('Item failed basic validation:', item);
        return false;
      }
      
      // Find the category for this item
      const category = selectedTemplate.categories.find(cat => cat.id === item.category_id);
      if (!category) {
        validationErrors.push(`Categoria não encontrada para o item ${item.order + 1}`);
        return false;
      }
      
      // Check required fields
      const requiredFields = category.fields.filter(field => field.required);
      for (const field of requiredFields) {
        const value = item.field_values[field.id];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          validationErrors.push(`Campo obrigatório "${field.label}" não preenchido na categoria "${category.name}"`);
        }
      }
      
      console.log('Item is valid:', hasBasicStructure);
      return hasBasicStructure;
    });

    console.log('validItems:', validItems);
    console.log('validItems.length:', validItems.length);
    console.log('validationErrors:', validationErrors);

    // Show validation errors before making API call
    if (validationErrors.length > 0) {
      const errorMessage = `Por favor, corrija os seguintes erros:\n\n${validationErrors.join('\n')}`;
      alert(errorMessage);
      return;
    }

    if (validItems.length === 0) {
      console.warn('Nenhum item válido para calcular');
      alert('Adicione pelo menos um item válido para calcular o orçamento.');
      return;
    }

    const payload = {
      template_id: selectedTemplate.id,
      items: validItems
    };
    
    console.log('Payload to be sent:', JSON.stringify(payload, null, 2));

    try {
      const response = await api.post(apiEndpoints.budgets.calculate, payload);
      console.log('Success response:', response.data);
      setCalculatedTotal(response.data.data.total || 0);
    } catch (error: any) {
      console.error('Erro ao calcular orçamento:', error);
      
      // Log detailed error information
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        console.error('Request Data:', JSON.stringify(payload, null, 2));
        
        // Parse and display specific validation errors
        if (error.response.status === 400 && error.response.data) {
          const errorData = error.response.data;
          
          if (errorData.message) {
            console.error('Validation Error:', errorData.message);
          }
          
          if (errorData.errors && Array.isArray(errorData.errors)) {
            console.error('Specific Errors:');
            errorData.errors.forEach((err: string, index: number) => {
              console.error(`  ${index + 1}. ${err}`);
            });
            
            // Show user-friendly alert with specific errors
            const errorMessage = `Erro de validação:\n\n${errorData.errors.join('\n')}`;
            alert(errorMessage);
          } else {
            console.error('Erro de validação: Verifique se todos os campos obrigatórios estão preenchidos');
          }
        }
        
        if (error.response.status === 404) {
          console.error('Template não encontrado ou não pertence à sua empresa');
          alert('Template não encontrado. Verifique se o template ainda existe.');
        }
      }
    }
  }, [selectedTemplate, items]);

  const handleSave = async () => {
    if (!selectedTemplate || !title.trim()) {
      alert('Por favor, selecione um template e informe um título');
      return;
    }

    // Validate items before saving (same validation as calculateTotal)
    const validationErrors: string[] = [];
    
    const validItems = items.filter(item => {
      // Basic structure validation
      const hasBasicStructure = item.category_id && 
        typeof item.field_values === 'object' && 
        typeof item.order === 'number';
      
      if (!hasBasicStructure) {
        return false;
      }
      
      // Find the category for this item
      const category = selectedTemplate.categories.find(cat => cat.id === item.category_id);
      if (!category) {
        validationErrors.push(`Categoria não encontrada para o item ${item.order + 1}`);
        return false;
      }
      
      // Check required fields
      const requiredFields = category.fields.filter(field => field.required);
      for (const field of requiredFields) {
        const value = item.field_values[field.id];
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          validationErrors.push(`Campo obrigatório "${field.label}" não preenchido na categoria "${category.name}"`);
        }
      }
      
      return hasBasicStructure;
    });

    // Show validation errors before saving
    if (validationErrors.length > 0) {
      const errorMessage = `Por favor, corrija os seguintes erros antes de salvar:\n\n${validationErrors.join('\n')}`;
      alert(errorMessage);
      return;
    }

    if (validItems.length === 0) {
      alert('Adicione pelo menos um item válido ao orçamento');
      return;
    }

    try {
      setSaving(true);
      const response = await api.post(apiEndpoints.budgets.create, {
        template_id: selectedTemplate.id,
        title: title.trim(),
        items: validItems
      });

      if (response.data.success) {
        router.push('/budgets');
      }
    } catch (error: any) {
      console.error('Erro ao salvar orçamento:', error);
      
      let errorMessage = 'Erro ao salvar orçamento';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = 'Dados inválidos. Verifique se todos os campos obrigatórios estão preenchidos.';
      }
      
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/budgets">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Novo Orçamento</h1>
          <p className="text-gray-600 mt-1">
            Crie um novo orçamento baseado em um template
          </p>
        </div>
      </div>

      {/* Template Selection */}
      {!selectedTemplate ? (
        <Card>
          <CardHeader>
            <CardTitle>Selecione um Template</CardTitle>
            <CardDescription>
              Escolha um template para basear seu orçamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            {templates.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum template disponível</p>
                <Link href="/templates/new" className="mt-4 inline-block">
                  <Button>Criar Template</Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {templates.map((template) => (
                  <Card 
                    key={template.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600">
                        {template.categories.length} categoria(s)
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Budget Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Orçamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nome do orçamento"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalhes do orçamento (opcional)"
                  className="mt-1"
                />
              </div>
              <div className="text-sm text-gray-600">
                Template selecionado: <strong>{selectedTemplate.name}</strong>
              </div>
            </CardContent>
          </Card>

          {/* Budget Items */}
          {selectedTemplate.categories.map((category, categoryIndex) => {
            const categoryItems = items.filter(item => item.category_id === category.id);
            
            return (
              <Card key={category.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    {category.is_repeatable && (
                      <Button
                        onClick={() => addItem(category.id)}
                        size="sm"
                        variant="outline"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Item
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {categoryItems.length === 0 ? (
                    <div className="text-center py-4">
                      <Button onClick={() => addItem(category.id)} variant="outline">
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Primeiro Item
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {categoryItems.map((item, itemIndex) => {
                        const globalItemIndex = items.findIndex(i => i === item);
                        
                        return (
                          <div key={`${item.category_id}-${itemIndex}`} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="font-medium">Item {itemIndex + 1}</h4>
                              {category.is_repeatable && categoryItems.length > 1 && (
                                <Button
                                  onClick={() => removeItem(globalItemIndex)}
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {category.fields.map((field) => (
                                <div key={field.id}>
                                  <Label htmlFor={`${field.id}-${itemIndex}`}>
                                    {field.label}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                  </Label>
                                  <Input
                                    id={`${field.id}-${itemIndex}`}
                                    type={field.type === 'number' ? 'number' : 'text'}
                                    value={item.field_values[field.id] || ''}
                                    onChange={(e) => updateFieldValue(
                                      globalItemIndex, 
                                      field.id, 
                                      field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                                    )}
                                    className="mt-1"
                                    step={field.type === 'number' ? 'any' : undefined}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {/* Total and Actions */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Total Calculado:</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(calculatedTotal)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={calculateTotal}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Calculator className="h-4 w-4" />
                    Recalcular
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={saving || !title.trim()}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? 'Salvando...' : 'Salvar Orçamento'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}