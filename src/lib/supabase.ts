import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type UserProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: {
    name: string;
    description: string | null;
  } | null;
  classification: {
    name: string;
    level: number;
    description: string | null;
  } | null;
};