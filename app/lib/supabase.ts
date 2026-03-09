import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy singleton — avoids invalid URL errors at module load when env vars aren't set
let _client: SupabaseClient | null = null
export function getSupabaseClient(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder'
    )
  }
  return _client
}

// Named export for convenience in client components
export const supabase = {
  from: (...args: Parameters<SupabaseClient['from']>) => getSupabaseClient().from(...args),
  rpc: (...args: Parameters<SupabaseClient['rpc']>) => getSupabaseClient().rpc(...args),
  auth: {
    signIn: () => getSupabaseClient().auth,
  },
} as unknown as SupabaseClient

// Server-side client with service role (for API routes)
export function createServerClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'placeholder'
  )
}
