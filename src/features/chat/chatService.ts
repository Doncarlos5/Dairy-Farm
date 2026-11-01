import { supabase } from '../../lib/supabase'

export type Message = {
  id: string
  farmId: string
  senderId: string
  senderName: string
  content: string
  createdAt: Date
}

export async function getMessages(farmId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('farm_id', farmId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data || []).map(row => ({
    id: row.id,
    farmId: row.farm_id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    content: row.content,
    createdAt: new Date(row.created_at)
  }))
}

export async function sendMessage(farmId: string, senderId: string, senderName: string, content: string): Promise<void> {
  const { error } = await supabase.from('messages').insert({
    farm_id: farmId,
    sender_id: senderId,
    sender_name: senderName,
    content: content
  })
  if (error) throw error
}

// Listen for new messages in real-time
export function subscribeToMessages(farmId: string, onNewMessage: (msg: Message) => void) {
  return supabase
    .channel('public:messages')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `farm_id=eq.${farmId}`
      },
      (payload) => {
        const row = payload.new
        onNewMessage({
          id: row.id,
          farmId: row.farm_id,
          senderId: row.sender_id,
          senderName: row.sender_name,
          content: row.content,
          createdAt: new Date(row.created_at)
        })
      }
    )
    .subscribe()
}