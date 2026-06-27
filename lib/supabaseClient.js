import { createClient } from '@supabase/supabase-js'

// Get these from your .env.local file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if they exist (prevents errors)
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Supabase URL or Anon Key is missing!')
  console.error('Make sure .env.local has both variables.')
}

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
