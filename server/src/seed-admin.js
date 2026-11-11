import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env
const email = process.env.ADMIN_EMAIL || 'ikukusdomain@gmail.com'
const password = process.env.ADMIN_PASSWORD

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.')
}
if (!password || password.length < 14) {
  throw new Error('Set ADMIN_PASSWORD to a unique password of at least 14 characters before seeding.')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const { data: existing, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
if (listError) throw listError
let admin = existing.users.find(user => user.email?.toLowerCase() === email.toLowerCase())

if (!admin) {
  const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm: true })
  if (error) throw error
  admin = data.user
}

const { error } = await supabase.from('profiles').upsert({
  id: admin.id,
  display_name: 'Ikuku Admin',
  role: 'admin',
  status: 'active',
}, { onConflict: 'id' })
if (error) throw error

console.log(`Administrator ready: ${email}`)
