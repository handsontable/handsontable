import { createClient } from '@supabase/supabase-js';

// Created once at module load and shared across the app. PostgREST manages
// connection pooling on the server, so there is nothing to configure here.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
