import { supabase } from '../../lib/supabase'
import type { MilkRecord } from '../../lib/schemas'

function mapMilkRecord(row: any): MilkRecord {
  return {
    id: row.id,
    farmId: row.farm_id,
    cowId: row.cow_id,
    date: row.date,
    session: row.session,
    litres: Number(row.litres),
    recordedBy: row.recorded_by || '',
    createdAt: new Date(row.created_at)
  }
}

export async function getAllMilkRecords(farmId: string): Promise<MilkRecord[]> {
  const { data, error } = await supabase
    .from('milk_records')
    .select('*')
    .eq('farm_id', farmId)
    .order('date', { ascending: false })

  if (error) throw error
  return (data || []).map(mapMilkRecord)
}

export async function addMilkRecord(record: MilkRecord): Promise<void> {
  const { error } = await supabase.from('milk_records').insert({
    farm_id: record.farmId,
    cow_id: record.cowId,
    date: record.date,
    session: record.session,
    litres: record.litres,
    recorded_by: record.recordedBy
  })

  if (error) throw error
}

export async function deleteMilkRecord(id: string): Promise<void> {
  const { error } = await supabase.from('milk_records').delete().eq('id', id)
  if (error) throw error
}