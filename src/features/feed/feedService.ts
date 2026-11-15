import { supabase } from '../../lib/supabase'
import type { FeedItem } from '../../lib/schemas'

function mapFeedItem(row: any): FeedItem {
  return {
    id: row.id,
    farmId: row.farm_id,
    name: row.name,
    category: row.category,
    quantity: Number(row.quantity),
    unit: row.unit,
    reorderLevel: Number(row.reorder_level),
    costPerUnit: Number(row.cost_per_unit),
    lastRestocked: row.last_restocked || undefined,
    createdAt: new Date(row.created_at)
  }
}

export async function getAllFeed(farmId: string): Promise<FeedItem[]> {
  const { data, error } = await supabase
    .from('feed_inventory')
    .select('*')
    .eq('farm_id', farmId)
    .order('name', { ascending: true })

  if (error) throw error
  return (data || []).map(mapFeedItem)
}

export async function addFeedItem(item: Omit<FeedItem, 'id' | 'createdAt'>): Promise<FeedItem> {
  const { data, error } = await supabase
    .from('feed_inventory')
    .insert({
      farm_id: item.farmId,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unit: item.unit,
      reorder_level: item.reorderLevel,
      cost_per_unit: item.costPerUnit,
      last_restocked: item.lastRestocked || new Date().toISOString().slice(0, 10)
    })
    .select()
    .single()

  if (error) throw error
  return mapFeedItem(data)
}

export async function updateFeedQuantity(id: string, newQuantity: number): Promise<void> {
  const { error } = await supabase
    .from('feed_inventory')
    .update({ 
      quantity: newQuantity,
      last_restocked: new Date().toISOString().slice(0, 10)
    })
    .eq('id', id)
  if (error) throw error
}

export async function deleteFeedItem(id: string): Promise<void> {
  const { error } = await supabase.from('feed_inventory').delete().eq('id', id)
  if (error) throw error
}