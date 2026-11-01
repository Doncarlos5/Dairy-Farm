import { supabase } from '../../lib/supabase'
import type { HealthRecord } from '../../lib/schemas'

function mapHealthRecord(row: any): HealthRecord {
  return {
    id: row.id,
    farmId: row.farm_id,
    cowId: row.cow_id,
    date: row.date,
    condition: row.condition,
    drug: row.drug,
    dose: row.dose || '',
    route: row.route || 'injection',
    withdrawalDays: row.withdrawal_days || 0,
    withdrawalEndDate: row.withdrawal_end_date || '',
    vetName: row.vet_name || undefined,
    cost: row.cost ? Number(row.cost) : undefined,
    notes: row.notes || undefined,
    weight: row.weight ? Number(row.weight) : undefined,
    bcs: row.bcs ? Number(row.bcs) : undefined,
    temperature: row.temperature ? Number(row.temperature) : undefined,
    vaccination: row.vaccination || undefined,
    createdAt: new Date(row.created_at)
  }
}

export async function getAllHealthRecords(farmId: string): Promise<HealthRecord[]> {
  const { data, error } = await supabase
    .from('health_records')
    .select('*')
    .eq('farm_id', farmId)
    .order('date', { ascending: false })

  if (error) throw error
  return (data || []).map(mapHealthRecord)
}

export async function getHealthForCow(cowId: string): Promise<HealthRecord[]> {
  const { data, error } = await supabase
    .from('health_records')
    .select('*')
    .eq('cow_id', cowId)
    .order('date', { ascending: false })

  if (error) throw error
  return (data || []).map(mapHealthRecord)
}

export async function addHealthRecord(record: HealthRecord): Promise<void> {
  const { error } = await supabase.from('health_records').insert({
    farm_id: record.farmId,
    cow_id: record.cowId,
    date: record.date,
    condition: record.condition,
    drug: record.drug,
    dose: record.dose,
    route: record.route,
    withdrawal_days: record.withdrawalDays,
    withdrawal_end_date: record.withdrawalEndDate || null,
    vet_name: record.vetName,
    cost: record.cost,
    notes: record.notes,
    weight: record.weight,
    bcs: record.bcs,
    temperature: record.temperature,
    vaccination: record.vaccination
  })

  if (error) throw error
}

export async function deleteHealthRecord(id: string): Promise<void> {
  const { error } = await supabase.from('health_records').delete().eq('id', id)
  if (error) throw error
}

export function isUnderWithdrawal(record: HealthRecord): boolean {
  if (!record.withdrawalEndDate) return false
  const today = new Date().toISOString().slice(0, 10)
  return record.withdrawalEndDate >= today
}