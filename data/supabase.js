import { createClient } from '@supabase/supabase-js';
import process from "process";

let supabaseUrl = process.env.SUPABASE_URL;

// Initialize Supabase client
if (process.env.NODE_ENV === 'development') {
    console.log('Using development Supabase credentials');
    supabaseUrl = process.env.SUPABASE_LOCAL_URL;
} else {
    supabaseUrl = process.env.SUPABASE_URL;
}
const supabaseKey = process.env.SUPABASE_SERVCE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;