import { supabase } from './supabase'

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const { data } = await supabase!.auth.getSession()
  const token = data.session?.access_token
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.error || 'Request failed. Please try again.')
  return result as T
}
