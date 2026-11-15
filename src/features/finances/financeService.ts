import { supabase } from '../../lib/supabase'
import type { Sale, Expense } from '../../lib/schemas'

// --- SALES ---
export async function getAllSales(farmId: string): Promise<Sale[]> {
  const { data, error } = await supabase.from('sales').select('*').eq('farm_id', farmId).order('date', { ascending: false })
  if (error) throw error
  return (data || []).map((row) => ({
    id: row.id, farmId: row.farm_id, date: row.date, litres: Number(row.litres),
    pricePerLitre: Number(row.price_per_litre), total: Number(row.total),
    buyer: row.buyer || undefined, notes: row.notes || undefined,
    status: row.status as 'pending' | 'approved' | 'rejected',
    createdByName: row.created_by_name || undefined, // <-- ADD
    createdAt: new Date(row.created_at)
  }))
}

export async function addSale(sale: Omit<Sale, 'id' | 'total' | 'createdAt'>): Promise<void> {
  const { error } = await supabase.from('sales').insert({
    farm_id: sale.farmId, date: sale.date, litres: sale.litres,
    price_per_litre: sale.pricePerLitre, buyer: sale.buyer, notes: sale.notes,
    status: sale.status,
    created_by_name: sale.createdByName // <-- ADD
  })
  if (error) throw error
}

export async function deleteSale(id: string): Promise<void> {
  const { error } = await supabase.from('sales').delete().eq('id', id)
  if (error) throw error
}

// --- EXPENSES ---
export async function getAllExpenses(farmId: string): Promise<Expense[]> {
  const { data, error } = await supabase.from('expenses').select('*').eq('farm_id', farmId).order('date', { ascending: false })
  if (error) throw error
  return (data || []).map((row) => ({
    id: row.id, farmId: row.farm_id, date: row.date, category: row.category,
    amount: Number(row.amount), description: row.description || undefined,
    status: row.status as 'pending' | 'approved' | 'rejected',
    feedItemId: row.feed_item_id || undefined,
    quantityAdded: row.quantity_added ? Number(row.quantity_added) : undefined,
    createdByName: row.created_by_name || undefined,
    createdAt: new Date(row.created_at),
    statusUpdatedAt: row.status_updated_at ? new Date(row.status_updated_at) : undefined
  }))
}

export async function addExpense(expense: Omit<Expense, 'id' | 'createdAt' | 'statusUpdatedAt'>): Promise<void> {
  const { error } = await supabase.from('expenses').insert({
    farm_id: expense.farmId, date: expense.date, category: expense.category,
    amount: expense.amount, description: expense.description,
    status: expense.status,
    feed_item_id: expense.feedItemId,
    quantity_added: expense.quantityAdded,
    created_by_name: expense.createdByName
  })
  if (error) throw error
}

export async function approveExpense(id: string): Promise<void> {
  const { error } = await supabase.rpc('approve_expense', { expense_id: id })
  if (error) throw error
}

export async function rejectExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').update({ status: 'rejected', status_updated_at: new Date().toISOString() }).eq('id', id)
  if (error) throw error
}

export async function deleteExpense(id: string): Promise<void> {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error
}