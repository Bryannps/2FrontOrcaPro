/**
 * Tipos TypeScript para o sistema
 * Define interfaces e tipos utilizados em todo o frontend
 */

// Tipos de autenticação
export interface User {
  id: string
  name: string
  email: string
  document?: string
  settings: {
    currency: string
    tax_rate: number
    profit_margin: number
  }
}

export interface AuthResponse {
  user: User
  token: string
  expires_in: string
}

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  document?: string
}

// Tipos de empresa
export interface Company {
  id: string
  name: string
  email: string
  document?: string
  settings: Record<string, any>
  created_at: string
  updated_at: string
}

// Tipos de templates
export type FieldType = 'text' | 'number' | 'select' | 'date' | 'boolean' | 'calculated'

export interface FieldCalculation {
  is_calculated: boolean
  formula: string
  depends_on: string[]
}

export interface BudgetField {
  id: string
  label: string
  type: FieldType
  required: boolean
  options?: any
  validation?: string
  order: number
  calculation: FieldCalculation
  category_id: string
}

export interface BudgetCategory {
  id: string
  name: string
  order: number
  is_repeatable: boolean
  validation_rules: Record<string, any>
  template_id: string
  fields: BudgetField[]
}

export interface CalculationRules {
  formula: string
  variables: string[]
  conditions: any[]
  strategy?: 'default' | 'industrial' | 'service'
}

export interface BudgetTemplate {
  id: string
  name: string
  description?: string
  is_active: boolean
  calculation_rules: CalculationRules
  company_id: string
  categories: BudgetCategory[]
  created_at: string
}

export interface CreateTemplateData {
  name: string
  description?: string
  categories: CreateCategoryData[]
  calculation_rules?: CalculationRules
}

export interface CreateCategoryData {
  name: string
  order: number
  is_repeatable?: boolean
  fields: CreateFieldData[]
}

export interface CreateFieldData {
  label: string
  type: FieldType
  required?: boolean
  options?: any
  validation?: string
  order: number
  calculation?: FieldCalculation
}

// Tipos de orçamentos
export type BudgetStatus = 'draft' | 'sent' | 'approved' | 'rejected'

export interface BudgetItem {
  id: string
  field_values: Record<string, any>
  amount: number
  order: number
  budget_id: string
  category_id: string
  category?: BudgetCategory
}

export interface Budget {
  id: string
  title: string
  status: BudgetStatus
  custom_data: Record<string, any>
  total_amount: number
  version: number
  company_id: string
  template_id: string
  company?: Company
  template?: BudgetTemplate
  items: BudgetItem[]
  created_at: string
}

export interface CreateBudgetData {
  template_id: string
  title: string
  items: CreateBudgetItemData[]
}

export interface CreateBudgetItemData {
  category_id: string
  field_values: Record<string, any>
  order: number
}

export interface CalculationResult {
  items: CalculatedItem[]
  total: number
  subtotals: Record<string, number>
  metadata?: Record<string, any>
}

export interface CalculatedItem {
  category_id: string
  field_values: Record<string, any>
  amount: number
  order: number
}

// Tipos de resposta da API
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface PaginatedResponse<T> {
  success: boolean
  message: string
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

// Tipos de componentes
export interface SelectOption {
  value: string
  label: string
}

export interface FormError {
  field: string
  message: string
}

// Estados de loading
export interface LoadingState {
  loading: boolean
  error: string | null
}

// Stats da empresa
export interface CompanyStats {
  total_templates: number
  total_budgets: number
  total_budget_value: number
  active_templates: number
  draft_budgets: number
  approved_budgets: number
}