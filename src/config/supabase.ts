// #scope:auth
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ENV from './environment';
import { Database } from '../types/supabase.types';

export const supabase = createClient<Database>(
  ENV.supabase.url,
  ENV.supabase.anonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      storage: AsyncStorage,
    },
  }
);

export default supabase;