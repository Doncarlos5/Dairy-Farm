import { supabase } from '../../lib/supabase'
import type { Note } from '../../lib/schemas'

function mapNote(row: any): Note {
  return {
    id: row.id,
    farmId: row.farm_id,
    cowId: row.cow_id || undefined,
    date: row.date,
    text: row.text,
    createdBy: row.created_by || '',
    createdAt: new Date(row.created_at)
  }
}

export async function getAllNotes(farmId: string): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('farm_id', farmId)
    .order('date', { ascending: false })

  if (error) throw error
  return (data || []).map(mapNote)
}

export async function addNote(note: Note): Promise<void> {
  const { error } = await supabase.from('notes').insert({
    farm_id: note.farmId,
    cow_id: note.cowId || null,
    date: note.date,
    text: note.text,
    created_by: note.createdBy
  })

  if (error) throw error
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from('notes').delete().eq('id', id)
  if (error) throw error
}