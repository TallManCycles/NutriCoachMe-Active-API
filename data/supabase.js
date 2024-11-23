import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVCE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;