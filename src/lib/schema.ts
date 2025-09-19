import { pgTable, uuid, varchar, integer, decimal, timestamp, boolean, text, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

/**
 * Database schema for finance management system
 * Using Drizzle ORM with PostgreSQL
 */

// Budgets table
export const budgets = pgTable('budgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  month: varchar('month', { length: 7 }).notNull(), // YYYY-MM format
  totalIncome: decimal('total_income', { precision: 12, scale: 2 }).default('0').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  monthIdx: index('budgets_month_idx').on(table.month),
}))

// Budget categories table
export const budgetCategories = pgTable('budget_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  budgetId: uuid('budget_id').references(() => budgets.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  plannedAmount: decimal('planned_amount', { precision: 12, scale: 2 }).default('0').notNull(),
  actualAmount: decimal('actual_amount', { precision: 12, scale: 2 }).default('0').notNull(),
  type: varchar('type', { length: 20 }).notNull(), // 'income' | 'expense' | 'savings'
  categoryType: varchar('category_type', { length: 20 }).notNull(), // 'fixed' | 'variable'
  proportion: decimal('proportion', { precision: 5, scale: 4 }), // 0-1 for variable categories
  color: varchar('color', { length: 7 }), // Hex color
  isPermanent: boolean('is_permanent').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  budgetIdx: index('budget_categories_budget_idx').on(table.budgetId),
  typeIdx: index('budget_categories_type_idx').on(table.type),
}))

// Transactions table
export const transactions = pgTable('transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').references(() => budgetCategories.id, { onDelete: 'cascade' }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  description: text('description').notNull(),
  date: timestamp('date').notNull(),
  month: varchar('month', { length: 7 }).notNull(), // YYYY-MM format
  type: varchar('type', { length: 20 }).notNull(), // 'income' | 'expense'
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  categoryIdx: index('transactions_category_idx').on(table.categoryId),
  monthIdx: index('transactions_month_idx').on(table.month),
  dateIdx: index('transactions_date_idx').on(table.date),
}))

// User settings table
export const userSettings = pgTable('user_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  savingsGoal: decimal('savings_goal', { precision: 12, scale: 2 }).default('100000').notNull(),
  savingsGoalDescription: text('savings_goal_description').default('Цель накоплений').notNull(),
  currentMonth: varchar('current_month', { length: 7 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Relations
export const budgetsRelations = relations(budgets, ({ many }) => ({
  categories: many(budgetCategories),
}))

export const budgetCategoriesRelations = relations(budgetCategories, ({ one, many }) => ({
  budget: one(budgets, {
    fields: [budgetCategories.budgetId],
    references: [budgets.id],
  }),
  transactions: many(transactions),
}))

export const transactionsRelations = relations(transactions, ({ one }) => ({
  category: one(budgetCategories, {
    fields: [transactions.categoryId],
    references: [budgetCategories.id],
  }),
}))

// Export types
export type Budget = typeof budgets.$inferSelect
export type NewBudget = typeof budgets.$inferInsert
export type BudgetCategory = typeof budgetCategories.$inferSelect
export type NewBudgetCategory = typeof budgetCategories.$inferInsert
export type Transaction = typeof transactions.$inferSelect
export type NewTransaction = typeof transactions.$inferInsert
export type UserSettings = typeof userSettings.$inferSelect
export type NewUserSettings = typeof userSettings.$inferInsert
