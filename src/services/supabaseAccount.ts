import type { Database } from '../types/database';
import { getSupabaseBackend } from './supabase';

export type SupabaseAccount = Database['public']['Functions']['get_my_account']['Returns'][number];
export interface ProfileChanges { fullName: string; phone: string; city: string }

export async function fetchMySupabaseAccount(): Promise<SupabaseAccount> {
  const { data, error } = await getSupabaseBackend().rpc('get_my_account').single();
  if (error || !data) throw new Error('Your Supabase account profile could not be loaded. Check your session and database migrations.', { cause: error });
  return data;
}

export async function updateMySupabaseProfile(changes: ProfileChanges) {
  // Explicit allow-list: extra properties such as role/user_id never enter the update.
  const patch = { full_name: changes.fullName.trim(), phone: changes.phone.trim(), city: changes.city.trim() };
  if (patch.full_name.length < 2 || patch.full_name.length > 120 || patch.phone.length > 32 || patch.city.length > 120) {
    throw new Error('Use a name of 2–120 characters, a phone number up to 32 characters, and a city up to 120 characters.');
  }
  const client = getSupabaseBackend();
  const { data: identity, error: identityError } = await client.auth.getUser();
  if (identityError || !identity.user) throw new Error('Sign in to update your Supabase profile.', { cause: identityError });
  const { data, error } = await client.from('profiles').update(patch).eq('user_id', identity.user.id).select().single();
  if (error || !data) throw new Error('Your profile could not be saved. Your changes have not been confirmed.', { cause: error });
  return data;
}
