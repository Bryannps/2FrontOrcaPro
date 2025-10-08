'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings as SettingsIcon, Save, User, Building, DollarSign, Percent } from 'lucide-react';

interface CompanySettings {
  currency: string;
  tax_rate: number;
  profit_margin: number;
}

interface Company {
  id: string;
  name: string;
  email: string;
  document?: string;
  settings: CompanySettings;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [document, setDocument] = useState('');
  const [currency, setCurrency] = useState('BRL');
  const [taxRate, setTaxRate] = useState(0.18);
  const [profitMargin, setProfitMargin] = useState(0.3);

  useEffect(() => {
    if (user) {
      fetchCompanyData();
    }
  }, [user]);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/companies/me');
      const companyData = response.data.data;
      
      setCompany(companyData);
      setName(companyData.name || '');
      setEmail(companyData.email || '');
      setDocument(companyData.document || '');
      setCurrency(companyData.settings?.currency || 'BRL');
      setTaxRate(companyData.settings?.tax_rate || 0.18);
      setProfitMargin(companyData.settings?.profit_margin || 0.3);
    } catch (error) {
      console.error('Erro ao carregar dados da empresa:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const settingsData = {
        currency,
        tax_rate: taxRate,
        profit_margin: profitMargin
      };

      await api.patch('/companies/settings', settingsData);
      
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`;
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
        <SettingsIcon className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600 mt-1">
            Gerencie as configurações da sua empresa e preferências do sistema
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              <CardTitle>Informações da Empresa</CardTitle>
            </div>
            <CardDescription>
              Dados básicos da sua empresa (somente leitura)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company-name">Nome da Empresa</Label>
                <Input
                  id="company-name"
                  value={name}
                  disabled
                  className="mt-1 bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="company-email">E-mail</Label>
                <Input
                  id="company-email"
                  value={email}
                  disabled
                  className="mt-1 bg-gray-50"
                />
              </div>
            </div>
            {document && (
              <div>
                <Label htmlFor="company-document">Documento (CNPJ/CPF)</Label>
                <Input
                  id="company-document"
                  value={document}
                  disabled
                  className="mt-1 bg-gray-50"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Financial Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <CardTitle>Configurações Financeiras</CardTitle>
            </div>
            <CardDescription>
              Configure os parâmetros financeiros para cálculos de orçamentos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="currency">Moeda</Label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="BRL">Real Brasileiro (BRL)</option>
                  <option value="USD">Dólar Americano (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="tax-rate">Taxa de Impostos</Label>
                <div className="mt-1 relative">
                  <Input
                    id="tax-rate"
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="pr-12"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <Percent className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Atual: {formatPercentage(taxRate)}
                </p>
              </div>
              
              <div>
                <Label htmlFor="profit-margin">Margem de Lucro</Label>
                <div className="mt-1 relative">
                  <Input
                    id="profit-margin"
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={profitMargin}
                    onChange={(e) => setProfitMargin(parseFloat(e.target.value) || 0)}
                    className="pr-12"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <Percent className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Atual: {formatPercentage(profitMargin)}
                </p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Como funciona?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• <strong>Taxa de Impostos:</strong> Percentual aplicado sobre o valor total dos orçamentos</li>
                <li>• <strong>Margem de Lucro:</strong> Percentual de lucro desejado sobre os custos</li>
                <li>• <strong>Cálculo:</strong> (Custos + Margem de Lucro) + Taxa de Impostos = Valor Final</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* User Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-purple-600" />
              <CardTitle>Informações do Usuário</CardTitle>
            </div>
            <CardDescription>
              Dados do usuário logado no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nome</Label>
                <p className="mt-1 px-3 py-2 bg-gray-50 border rounded-md">
                  {user?.name || 'N/A'}
                </p>
              </div>
              <div>
                <Label>E-mail</Label>
                <p className="mt-1 px-3 py-2 bg-gray-50 border rounded-md">
                  {user?.email || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Salvando...' : 'Salvar Configurações'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}