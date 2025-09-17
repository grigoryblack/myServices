/**
 * Transaction entity types
 * Defines the core data structures for financial transactions
 */
export interface Transaction {
  id: string
  categoryId: string
  amount: number
  description: string
  date: Date
  month: string // YYYY-MM format
  type: 'income' | 'expense'
  createdAt: Date
}

export interface TransactionSummary {
  categoryId: string
  categoryName: string
  totalAmount: number
  transactionCount: number
  lastTransaction?: Date
}
