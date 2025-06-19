import { createClient } from '@supabase/supabase-js'

// For Vite projects, only use import.meta.env (NOT process.env)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://eepxrnqcefpvzxqkpjaw.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlcHhybnFjZWZwdnp4cWtwamF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU2ODM5NDgsImV4cCI6MjA0MTI1OTk0OH0.cs_yQnvzrK-8CRYyvlbzfbhZhIqdC3X9fO-UugRCGuI'

// Validation
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables:')
  console.error('- VITE_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '❌ Missing')
  console.error('- VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓ Set' : '❌ Missing')
  throw new Error('Missing Supabase environment variables')
}

console.log('🔗 Supabase client initializing...')
console.log('- URL:', supabaseUrl)
console.log('- Anon Key:', supabaseAnonKey ? '✓ Present' : '❌ Missing')

// Create Supabase client with proper configuration
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'Accept': '*/*',
      'prefer': 'return=representation'
    }
  }
})

console.log('✅ Supabase client initialized successfully')

export default supabase