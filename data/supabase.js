import { createClient } from '@supabase/supabase-js';
import process from "process";

let supabaseUrl = process.env.SUPABASE_URL;
let supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseKey);

// Initialize Supabase client
if (process.env.NODE_ENV === 'development') {
    console.log('Using development Supabase credentials');
    supabaseUrl = process.env.SUPABASE_LOCAL_URL;
    supabaseKey = process.env.SUPABASE_TEST_SERVICE_ROLE_KEY
} 

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;