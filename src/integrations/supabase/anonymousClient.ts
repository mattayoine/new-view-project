
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://xbrjocsiqgoomlqkrbky.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhicmpvY3NpcWdvb21scWtyYmt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1MjUxNTIsImV4cCI6MjA2NjEwMTE1Mn0.pUWifLkhw_t3MBKJ5b-sDrPjn-XJyY0tcd9b5OZAf2M";

// Anonymous client specifically for public operations like application submissions
export const anonymousSupabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    }
  },
  global: {
    headers: {
      'apikey': SUPABASE_PUBLISHABLE_KEY
    }
  }
});
