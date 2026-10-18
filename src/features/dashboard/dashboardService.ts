import { supabase } from '../../lib/supabase'
import type { Cow, MilkRecord, HealthRecord } from '../../lib/schemas'

export async function getDashboardStats(farmId: string) {
  const [cowsRes, milkRes, healthRes] = await Promise.all([
    supabase.from('cows').select('*').eq('farm_id', farmId),
    supabase.from('milk_records').select('*').eq('farm_id', farmId),
    supabase.from('health_records').select('*').eq('farm_id', farmId)
  ])

  if (cowsRes.error) throw cowsRes.error
  if (milkRes.error) throw milkRes.error
  if (healthRes.error) throw healthRes.error

  // We will need to map the snake_case database fields to camelCase for the dashboard.
  const cows = (cowsRes.data || []).map((c: any) => ({
    id: c.id,
    farmId: c.farm_id,
    tagId: c.tag_id,
    name: c.name,
    breed: c.breed,
    birthDate: c.birth_date,
    lactationNumber: c.lactation_number,
    status: c.status,
    pregnancyStatus: c.pregnancy_status,
  })) as Cow[]

  const milkRecords = (milkRes.data || []).map((m: any) => ({
    id: m.id,
    farmId: m.farm_id,
    cowId: m.cow_id,
    date: m.date,
    session: m.session,
    litres: Number(m.litres),
    recordedBy: m.recorded_by
  })) as MilkRecord[]

  const healthRecords = (healthRes.data || []).map((h: any) => ({
    id: h.id,
    farmId: h.farm_id,
    cowId: h.cow_id,
    date: h.date,
    condition: h.condition,
    drug: h.drug,
    withdrawalEndDate: h.withdrawal_end_date,
    // add other fields if needed by the dashboard
  })) as HealthRecord[]

  return { cows, milkRecords, healthRecords }
}