import { getSupabaseBackend } from './supabase';
import type { Database } from '../types/database';

type ConversationRow = Database['public']['Functions']['list_my_repair_conversations']['Returns'][number];
export type RepairMessage = Database['public']['Tables']['repair_messages']['Row'];

export interface RepairConversation {
  repairId: string;
  reference: string;
  device: string;
  model: string;
  customerId: string;
  technicianUserId: string;
  customerName: string;
  technicianName: string;
  status: Database['public']['Enums']['repair_status'];
  lastMessageAt: string | null;
}

/** An accepted repair is a conversation for exactly its customer and technician. */
export async function fetchRepairConversations(): Promise<RepairConversation[]> {
  const { data, error } = await getSupabaseBackend().rpc('list_my_repair_conversations');
  if (error) throw error;
  return ((data ?? []) as ConversationRow[]).map(row => ({
    repairId: row.repair_id, reference: row.reference, device: row.device, model: row.model,
    customerId: row.customer_id, technicianUserId: row.technician_user_id,
    customerName: row.customer_name, technicianName: row.technician_name,
    status: row.status, lastMessageAt: row.last_message_at,
  }));
}

export async function fetchRepairMessages(repairId: string): Promise<RepairMessage[]> {
  const { data, error } = await getSupabaseBackend().from('repair_messages')
    .select('*').eq('repair_id', repairId).order('created_at', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** A server-confirmed insert, with a stable id so a lost reply cannot duplicate a message. */
export async function sendRepairMessage(repairId: string, body: string, id: string, senderId: string): Promise<RepairMessage> {
  const backend = getSupabaseBackend();
  const { data, error } = await backend.from('repair_messages')
    .insert({ id, repair_id: repairId, body }).select('*').single();
  if (!error && data) return data;
  const { data: existing } = await backend.from('repair_messages').select('*').eq('id', id).maybeSingle();
  if (existing?.repair_id === repairId && existing.sender_id === senderId && existing.body === body) return existing;
  throw error ?? new Error('FIXHUB did not confirm your message.');
}
