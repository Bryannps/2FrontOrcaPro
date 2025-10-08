'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import type { BudgetTemplate } from '@/types';

interface Field {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'boolean' | 'calculated';
  required: boolean;
  order: number;
  options?: any;
  validation?: string;
}

interface Category {
  id: string;
  name: string;
  order: number;
  is_repeatable: boolean;
  fields: Field[];
}

export default function EditTemplatePage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const templateId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form data
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);

  // Load template data
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const response = await api.get(`/templates/${templateId}`);
        const template: BudgetTemplate = response.data.data;
        
        setName(template.name);
        setDescription(template.description || '');
        setCategories(template.categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          order: cat.order,
          is_repeatable: cat.is_repeatable,
          fields: cat.fields.map(field => ({
            id: field.id,
            label: field.label,
            type: field.type as Field['type'],
            required: field.required,
            order: field.order,
            options: field.options,
            validation: field.validation
          }))
        })));
      } catch (error) {
        console.error('Erro ao carregar template:', error);
        alert('Erro ao carregar template');
        router.push('/templates');
      } finally {
        setLoading(false);
      }
    };

    if (templateId) {
      loadTemplate();
    }
  }, [templateId, router]);

  const addCategory = () => {
    const newCategory: Category = {
      id: `temp-${Date.now()}`,
      name: '',
      order: categories.length,
      is_repeatable: false,
      fields: []
    };
    setCategories([...categories, newCategory]);
  };

  const removeCategory = (categoryId: string) => {
    setCategories(categories.filter(cat => cat.id !== categoryId));
  };

  const updateCategory = (categoryId: string, updates: Partial<Category>) => {
    setCategories(categories.map(cat => 
      cat.id === categoryId ? { ...cat, ...updates } : cat
    ));
  };

  const addField = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;

    const newField: Field = {
      id: `temp-field-${Date.now()}`,
      label: '',
      type: 'text',
      required: false,
      order: category.fields.length
    };

    updateCategory(categoryId, {
      fields: [...category.fields, newField]
    });
  };

  const removeField = (categoryId: string, fieldId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;

    updateCategory(categoryId, {
      fields: category.fields.filter(field => field.id !== fieldId)
    });
  };

  const updateField = (categoryId: string, fieldId: string, updates: Partial<Field>) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;

    updateCategory(categoryId, {
      fields: category.fields.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      )
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Por favor, informe o nome do template');
      return;
    }

    if (categories.length === 0) {
      alert('Por favor, adicione pelo menos uma categoria');
      return;
    }

    // Validate categories
    for (const category of categories) {
      if (!category.name.trim()) {
        alert('Por favor, preencha o nome de todas as categorias');
        return;
      }
      if (category.fields.length === 0) {
        alert(`A categoria "${category.name}" deve ter pelo menos um campo`);
        return;
      }
      for (const field of category.fields) {
        if (!field.label.trim()) {
          alert(`Por favor, preencha o rótulo de todos os campos na categoria "${category.name}"`);
          return;
        }
      }
    }

    try {
      setSaving(true);
      
      // Prepare data for API
      const templateData = {
        name: name.trim(),
        description: description.trim(),
        categories: categories.map(cat => ({
          id: cat.id.startsWith('temp-') ? undefined : cat.id, // Don't send temp IDs
          name: cat.name.trim(),
          order: cat.order,
          is_repeatable: cat.is_repeatable,
          fields: cat.fields.map(field => ({
            id: field.id.startsWith('temp-') ? undefined : field.id, // Don't send temp IDs
            label: field.label.trim(),
            type: field.type,
            required: field.required,
            order: field.order,
            options: field.options,
            validation: field.validation
          }))
        }))
      };

      const response = await api.put(`/templates/${templateId}`, templateData);

      if (response.data.success) {
        router.push('/templates');
      }
    } catch (error) {
      console.error('Erro ao atualizar template:', error);
      alert('Erro ao atualizar template');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Carregando template...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/templates">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Editar Template</h1>
          <p className="text-gray-600 mt-1">
            Modifique o template "{name}"
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Template Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Template</CardTitle>
            <CardDescription>
              Defina o nome e descrição do template
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Template *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Construção Residencial"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição detalhada do template (opcional)"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Categorias</CardTitle>
                <CardDescription>
                  Organize os campos do orçamento em categorias
                </CardDescription>
              </div>
              <Button onClick={addCategory} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Categoria
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {categories.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Nenhuma categoria adicionada</p>
                <Button onClick={addCategory} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeira Categoria
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {categories.map((category, categoryIndex) => (
                  <div key={category.id} className="border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium">Categoria {categoryIndex + 1}</h3>
                      <Button
                        onClick={() => removeCategory(category.id)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <Label htmlFor={`category-name-${category.id}`}>Nome da Categoria *</Label>
                        <Input
                          id={`category-name-${category.id}`}
                          value={category.name}
                          onChange={(e) => updateCategory(category.id, { name: e.target.value })}
                          placeholder="Ex: Materiais, Mão de obra"
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-center space-x-2 mt-6">
                        <input
                          type="checkbox"
                          id={`repeatable-${category.id}`}
                          checked={category.is_repeatable}
                          onChange={(e) => updateCategory(category.id, { is_repeatable: e.target.checked })}
                          className="rounded"
                        />
                        <Label htmlFor={`repeatable-${category.id}`}>
                          Categoria repetível (permite múltiplos itens)
                        </Label>
                      </div>
                    </div>

                    {/* Fields */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <Label className="text-base font-medium">Campos</Label>
                        <Button
                          onClick={() => addField(category.id)}
                          size="sm"
                          variant="outline"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Campo
                        </Button>
                      </div>

                      {category.fields.length === 0 ? (
                        <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
                          <p className="text-gray-500 mb-2">Nenhum campo adicionado</p>
                          <Button
                            onClick={() => addField(category.id)}
                            size="sm"
                            variant="outline"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Adicionar Campo
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {category.fields.map((field, fieldIndex) => (
                            <div key={field.id} className="bg-gray-50 p-4 rounded-lg">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="font-medium">Campo {fieldIndex + 1}</h4>
                                <Button
                                  onClick={() => removeField(category.id, field.id)}
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <Label htmlFor={`field-label-${field.id}`}>Rótulo *</Label>
                                  <Input
                                    id={`field-label-${field.id}`}
                                    value={field.label}
                                    onChange={(e) => updateField(category.id, field.id, { label: e.target.value })}
                                    placeholder="Ex: Quantidade, Valor"
                                    className="mt-1"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`field-type-${field.id}`}>Tipo</Label>
                                  <select
                                    id={`field-type-${field.id}`}
                                    value={field.type}
                                    onChange={(e) => updateField(category.id, field.id, { type: e.target.value as Field['type'] })}
                                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="text">Texto</option>
                                    <option value="number">Número</option>
                                    <option value="select">Seleção</option>
                                    <option value="date">Data</option>
                                    <option value="boolean">Sim/Não</option>
                                  </select>
                                </div>
                                <div className="flex items-center space-x-2 mt-6">
                                  <input
                                    type="checkbox"
                                    id={`field-required-${field.id}`}
                                    checked={field.required}
                                    onChange={(e) => updateField(category.id, field.id, { required: e.target.checked })}
                                    className="rounded"
                                  />
                                  <Label htmlFor={`field-required-${field.id}`}>
                                    Campo obrigatório
                                  </Label>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-end space-x-4">
              <Link href="/templates">
                <Button variant="outline">Cancelar</Button>
              </Link>
              <Button
                onClick={handleSave}
                disabled={saving || !name.trim() || categories.length === 0}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Salvando...' : 'Atualizar Template'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}