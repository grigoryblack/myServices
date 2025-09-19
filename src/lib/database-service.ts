import { db } from './database'
import { budgets, budgetCategories, transactions, userSettings } from './schema'
import { eq, and, desc } from 'drizzle-orm'
import type { Budget as DBBudget, BudgetCategory as DBBudgetCategory, Transaction as DBTransaction } from './schema'
import type { Budget, BudgetCategory, Transaction, BudgetSummary, SavingsSummary } from '@/entities'

/**
 * Database service layer
 * Handles all database operations for the finance management system
 */

export class DatabaseService {
  // Budget operations
  static async createBudget(name: string, month: string, totalIncome = 0): Promise<Budget> {
    const [budget] = await db.insert(budgets).values({
      name,
      month,
      totalIncome: totalIncome.toString(),
    }).returning()

    return this.mapDBBudgetToBudget(budget, [])
  }

  static async getBudget(month: string): Promise<Budget | null> {
    const budget = await db.query.budgets.findFirst({
      where: eq(budgets.month, month),
      with: {
        categories: {
          with: {
            transactions: true
          }
        }
      }
    })

    if (!budget) return null

    return this.mapDBBudgetToBudget(budget, budget.categories)
  }

  static async getAllBudgets(): Promise<Budget[]> {
    const allBudgets = await db.query.budgets.findMany({
      with: {
        categories: {
          with: {
            transactions: true
          }
        }
      },
      orderBy: [desc(budgets.month)]
    })

    return allBudgets.map(budget => this.mapDBBudgetToBudget(budget, budget.categories))
  }

  static async updateBudgetIncome(month: string, totalIncome: number): Promise<void> {
    await db.update(budgets)
      .set({ 
        totalIncome: totalIncome.toString(),
        updatedAt: new Date()
      })
      .where(eq(budgets.month, month))
  }

  // Category operations
  static async addCategory(budgetId: string, categoryData: Omit<BudgetCategory, 'id' | 'actualAmount'>): Promise<BudgetCategory> {
    const [category] = await db.insert(budgetCategories).values({
      budgetId,
      name: categoryData.name,
      plannedAmount: categoryData.plannedAmount.toString(),
      actualAmount: '0',
      type: categoryData.type,
      categoryType: categoryData.categoryType,
      proportion: categoryData.proportion?.toString(),
      color: categoryData.color,
      isPermanent: categoryData.isPermanent,
    }).returning()

    return this.mapDBCategoryToCategory(category)
  }

  static async updateCategory(categoryId: string, updates: Partial<BudgetCategory>): Promise<void> {
    const updateData: any = {}
    
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.plannedAmount !== undefined) updateData.plannedAmount = updates.plannedAmount.toString()
    if (updates.actualAmount !== undefined) updateData.actualAmount = updates.actualAmount.toString()
    if (updates.type !== undefined) updateData.type = updates.type
    if (updates.categoryType !== undefined) updateData.categoryType = updates.categoryType
    if (updates.proportion !== undefined) updateData.proportion = updates.proportion?.toString()
    if (updates.color !== undefined) updateData.color = updates.color
    if (updates.isPermanent !== undefined) updateData.isPermanent = updates.isPermanent

    await db.update(budgetCategories)
      .set(updateData)
      .where(eq(budgetCategories.id, categoryId))
  }

  static async removeCategory(categoryId: string): Promise<void> {
    await db.delete(budgetCategories).where(eq(budgetCategories.id, categoryId))
  }

  // Transaction operations
  static async addTransaction(transactionData: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values({
      categoryId: transactionData.categoryId,
      amount: transactionData.amount.toString(),
      description: transactionData.description,
      date: transactionData.date,
      month: transactionData.month,
      type: transactionData.type,
    }).returning()

    return this.mapDBTransactionToTransaction(transaction)
  }

  static async updateTransaction(transactionId: string, updates: Partial<Omit<Transaction, 'id' | 'createdAt'>>): Promise<void> {
    const updateData: any = {}
    
    if (updates.categoryId !== undefined) updateData.categoryId = updates.categoryId
    if (updates.amount !== undefined) updateData.amount = updates.amount.toString()
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.date !== undefined) updateData.date = updates.date
    if (updates.month !== undefined) updateData.month = updates.month
    if (updates.type !== undefined) updateData.type = updates.type

    await db.update(transactions)
      .set(updateData)
      .where(eq(transactions.id, transactionId))
  }

  static async removeTransaction(transactionId: string): Promise<void> {
    await db.delete(transactions).where(eq(transactions.id, transactionId))
  }

  static async getTransactionsByCategory(categoryId: string, month?: string): Promise<Transaction[]> {
    const whereCondition = month 
      ? and(eq(transactions.categoryId, categoryId), eq(transactions.month, month))
      : eq(transactions.categoryId, categoryId)

    const categoryTransactions = await db.select()
      .from(transactions)
      .where(whereCondition)
      .orderBy(desc(transactions.date))

    return categoryTransactions.map(this.mapDBTransactionToTransaction)
  }

  // User settings operations
  static async getUserSettings(): Promise<{ savingsGoal: number; savingsGoalDescription: string; currentMonth: string }> {
    const settings = await db.query.userSettings.findFirst()
    
    if (!settings) {
      // Create default settings
      const [newSettings] = await db.insert(userSettings).values({
        savingsGoal: '100000',
        savingsGoalDescription: 'Цель накоплений',
        currentMonth: new Date().toISOString().slice(0, 7),
      }).returning()
      
      return {
        savingsGoal: parseFloat(newSettings.savingsGoal),
        savingsGoalDescription: newSettings.savingsGoalDescription,
        currentMonth: newSettings.currentMonth,
      }
    }

    return {
      savingsGoal: parseFloat(settings.savingsGoal),
      savingsGoalDescription: settings.savingsGoalDescription,
      currentMonth: settings.currentMonth,
    }
  }

  static async updateUserSettings(updates: {
    savingsGoal?: number
    savingsGoalDescription?: string
    currentMonth?: string
  }): Promise<void> {
    const settings = await db.query.userSettings.findFirst()
    
    const updateData: any = { updatedAt: new Date() }
    if (updates.savingsGoal !== undefined) updateData.savingsGoal = updates.savingsGoal.toString()
    if (updates.savingsGoalDescription !== undefined) updateData.savingsGoalDescription = updates.savingsGoalDescription
    if (updates.currentMonth !== undefined) updateData.currentMonth = updates.currentMonth

    if (settings) {
      await db.update(userSettings).set(updateData).where(eq(userSettings.id, settings.id))
    } else {
      await db.insert(userSettings).values({
        ...updateData,
        savingsGoal: updateData.savingsGoal || '100000',
        savingsGoalDescription: updateData.savingsGoalDescription || 'Цель накоплений',
        currentMonth: updateData.currentMonth || new Date().toISOString().slice(0, 7),
      })
    }
  }

  // Mapping functions
  private static mapDBBudgetToBudget(dbBudget: DBBudget, dbCategories: any[] = []): Budget {
    return {
      id: dbBudget.id,
      name: dbBudget.name,
      month: dbBudget.month,
      totalIncome: parseFloat(dbBudget.totalIncome),
      categories: dbCategories.map(cat => this.mapDBCategoryToCategory(cat)),
      createdAt: dbBudget.createdAt,
      updatedAt: dbBudget.updatedAt,
    }
  }

  private static mapDBCategoryToCategory(dbCategory: DBBudgetCategory): BudgetCategory {
    return {
      id: dbCategory.id,
      name: dbCategory.name,
      plannedAmount: parseFloat(dbCategory.plannedAmount),
      actualAmount: parseFloat(dbCategory.actualAmount),
      type: dbCategory.type as 'income' | 'expense' | 'savings',
      categoryType: dbCategory.categoryType as 'fixed' | 'variable',
      proportion: dbCategory.proportion ? parseFloat(dbCategory.proportion) : undefined,
      color: dbCategory.color || undefined,
      isPermanent: dbCategory.isPermanent || false,
    }
  }

  private static mapDBTransactionToTransaction(dbTransaction: DBTransaction): Transaction {
    return {
      id: dbTransaction.id,
      categoryId: dbTransaction.categoryId,
      amount: parseFloat(dbTransaction.amount),
      description: dbTransaction.description,
      date: dbTransaction.date,
      month: dbTransaction.month,
      type: dbTransaction.type as 'income' | 'expense',
      createdAt: dbTransaction.createdAt,
    }
  }
}
