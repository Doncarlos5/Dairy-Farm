import { supabase } from '../../lib/supabase'
import type { FeedItem, FeedAudit } from '../../lib/schemas'

function mapFeedItem(row: any): FeedItem {
  return {
    id: row.id, farmId: row.farm_id, name: row.name, category: row.category,
    quantity: Number(row.quantity), unit: row.unit, reorderLevel: Number(row.reorder_level),
    costPerUnit: Number(row.cost_per_unit), lastRestocked: row.last_restocked || undefined,
    createdAt: new Date(row.created_at)
  }
}

function mapFeedAudit(row: any): FeedAudit {
  return {
    id: row.id,
    farmId: row.farm_id,
    date: row.date,
    auditorName: row.auditor_name,
    details: row.details,
    createdAt: new Date(row.created_at)
  }
}

export async function getAllFeed(farmId: string): Promise<FeedItem[]> {
  const { data, error } = await supabase.from('feed_inventory').select('*').eq('farm_id', farmId).order('name', { ascending: true })
  if (error) throw error
  return (data || []).map(mapFeedItem)
}

export async function addFeedItem(item: Omit<FeedItem, 'id' | 'createdAt'>): Promise<FeedItem> {
  const { data, error } = await supabase.from('feed_inventory').insert({
    farm_id: item.farmId, name: item.name, category: item.category,
    quantity: item.quantity, unit: item.unit, reorder_level: item.reorderLevel,
    cost_per_unit: item.costPerUnit, last_restocked: item.lastRestocked || new Date().toISOString().slice(0, 10)
  }).select().single()
  if (error) throw error
  return mapFeedItem(data)
}

export async function updateFeedQuantity(id: string, newQuantity: number): Promise<void> {
  const { error } = await supabase.from('feed_inventory').update({ quantity: newQuantity, last_restocked: new Date().toISOString().slice(0, 10) }).eq('id', id)
  if (error) throw error
}

export async function deleteFeedItem(id: string): Promise<void> {
  const { error } = await supabase.from('feed_inventory').delete().eq('id', id)
  if (error) throw error
}

export async function logFeedUsage(
  farmId: string, feedItemId: string, cowId: string | null, quantity: number, recordedBy: string, currentStock: number
): Promise<void> {
  const { error: logError } = await supabase.from('feed_consumption').insert({
    farm_id: farmId, feed_item_id: feedItemId, cow_id: cowId,
    date: new Date().toISOString().slice(0, 10), quantity_used: quantity, recorded_by: recordedBy
  })
  if (logError) throw logError

  const newStock = Math.max(0, currentStock - quantity)
  const { error: stockError } = await supabase.from('feed_inventory').update({ quantity: newStock }).eq('id', feedItemId)
  if (stockError) throw stockError
}

export async function getTodayFeedUsage(farmId: string) {
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase.from('feed_consumption').select('*').eq('farm_id', farmId).eq('date', today)
  if (error) throw error
  return data || []
}

// --- NEW AUDIT FUNCTIONS ---
export async function saveFeedAudit(farmId: string, auditorName: string, details: any[]): Promise<void> {
  const { error } = await supabase.from('feed_audits').insert({
    farm_id: farmId,
    date: new Date().toISOString().slice(0, 10),
    auditor_name: auditorName,
    details: details
  })
  if (error) throw error
}

export async function getAllFeedAudits(farmId: string): Promise<FeedAudit[]> {
  const { data, error } = await supabase.from('feed_audits').select('*').eq('farm_id', farmId).order('date', { ascending: false })
  if (error) throw error
  return (data || []).map(mapFeedAudit)
}