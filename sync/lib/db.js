import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SECRET_KEY } = process.env;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  throw new Error('Missing required env vars: SUPABASE_URL, SUPABASE_SECRET_KEY');
}

export const db = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);
