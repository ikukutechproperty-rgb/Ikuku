import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import { createClient } from '@supabase/supabase-js'
import { rateLimit } from 'express-rate-limit'
import { z } from 'zod'

const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`)
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})
const app = express()
app.disable('x-powered-by')
app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }))
app.use(express.json({ limit: '16kb' }))

const transactionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
})

async function authenticate(req, res, next) {
  const token = req.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return res.status(401).json({ error: 'Authentication required.' })
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return res.status(401).json({ error: 'Session is invalid or expired.' })
  const { data: profile, error: profileError } = await supabase
    .from('profiles').select('id,display_name,role,status').eq('id', user.id).maybeSingle()
  if (profileError) return next(profileError)
  if (!profile || profile.status !== 'active') return res.status(403).json({ error: 'This account is unavailable.' })
  req.user = user
  req.profile = profile
  next()
}

function requireAdmin(req, res, next) {
  if (req.profile?.role !== 'admin') return res.status(403).json({ error: 'Administrator access required.' })
  next()
}

function handleQueryError(error) {
  if (error) throw error
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

app.get('/api/me', authenticate, (req, res) => {
  res.json({ profile: { ...req.profile, email: req.user.email } })
})

app.get('/api/transactions', authenticate, async (req, res, next) => {
  try {
    const { data, error } = await supabase.from('transactions')
      .select('id,type,amount,status,created_at')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(100)
    handleQueryError(error)
    res.json({ transactions: data })
  } catch (error) { next(error) }
})

const transactionSchema = z.object({
  type: z.enum(['deposit', 'withdrawal']),
  amount: z.number().finite().min(0.01).max(1_000_000),
})

app.post('/api/transactions', authenticate, transactionLimiter, async (req, res, next) => {
  try {
    const parsed = transactionSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Enter a valid demo transaction amount.' })
    const { data, error } = await supabase.from('transactions').insert({
      user_id: req.user.id,
      type: parsed.data.type,
      amount: parsed.data.amount,
    }).select('id,type,amount,status,created_at').single()
    handleQueryError(error)
    res.status(201).json({ transaction: data })
  } catch (error) { next(error) }
})

app.get('/api/admin/stats', authenticate, requireAdmin, async (_req, res, next) => {
  try {
    const [users, investments, transactions] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('investments').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('transactions').select('amount,status'),
    ])
    handleQueryError(users.error)
    handleQueryError(investments.error)
    handleQueryError(transactions.error)
    const rows = transactions.data || []
    res.json({
      users: users.count || 0,
      activeInvestments: investments.count || 0,
      pendingTransactions: rows.filter(row => row.status === 'pending').length,
      volume: rows.filter(row => row.status === 'approved').reduce((sum, row) => sum + Number(row.amount), 0),
    })
  } catch (error) { next(error) }
})

app.get('/api/admin/users', authenticate, requireAdmin, async (_req, res, next) => {
  try {
    const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
    handleQueryError(error)
    const profiles = await supabase.from('profiles')
      .select('id,display_name,role,status,created_at')
      .in('id', data.users.map(user => user.id))
    handleQueryError(profiles.error)
    const profileMap = new Map((profiles.data || []).map(profile => [profile.id, profile]))
    res.json({
      users: data.users.map(user => ({
        ...profileMap.get(user.id),
        id: user.id,
        email: user.email,
        created_at: profileMap.get(user.id)?.created_at || user.created_at,
      })),
    })
  } catch (error) { next(error) }
})

const userStatusSchema = z.object({ status: z.enum(['active', 'suspended']) })
app.patch('/api/admin/users/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const parsed = userStatusSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid account status.' })
    const { data: target, error: lookupError } = await supabase.from('profiles')
      .select('id,role').eq('id', req.params.id).maybeSingle()
    handleQueryError(lookupError)
    if (!target) return res.status(404).json({ error: 'User not found.' })
    if (target.role === 'admin') return res.status(403).json({ error: 'Administrator accounts cannot be suspended here.' })
    const { error } = await supabase.from('profiles').update({ status: parsed.data.status }).eq('id', target.id)
    handleQueryError(error)
    res.json({ ok: true })
  } catch (error) { next(error) }
})

app.delete('/api/admin/users/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ error: 'You cannot delete your own account.' })
    const { data: target, error: lookupError } = await supabase.from('profiles')
      .select('id,role').eq('id', req.params.id).maybeSingle()
    handleQueryError(lookupError)
    if (!target) return res.status(404).json({ error: 'User not found.' })
    if (target.role === 'admin') return res.status(403).json({ error: 'Administrator accounts cannot be deleted here.' })
    const { error } = await supabase.auth.admin.deleteUser(target.id)
    handleQueryError(error)
    res.json({ ok: true })
  } catch (error) { next(error) }
})

app.get('/api/admin/transactions', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const status = req.query.status === 'pending' ? 'pending' : null
    let query = supabase.from('transactions')
      .select('id,user_id,type,amount,status,created_at')
      .order('created_at', { ascending: false })
      .limit(200)
    if (status) query = query.eq('status', status)
    const { data, error } = await query
    handleQueryError(error)
    res.json({ transactions: data })
  } catch (error) { next(error) }
})

const approvalSchema = z.object({ status: z.enum(['approved', 'rejected']) })
app.patch('/api/admin/transactions/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const parsed = approvalSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid transaction status.' })
    const { data, error } = await supabase.from('transactions')
      .update({ status: parsed.data.status, reviewed_by: req.user.id, reviewed_at: new Date().toISOString() })
      .eq('id', req.params.id).eq('status', 'pending')
      .select('id,status').maybeSingle()
    handleQueryError(error)
    if (!data) return res.status(409).json({ error: 'This request has already been reviewed or does not exist.' })
    res.json({ transaction: data })
  } catch (error) { next(error) }
})

app.use((_req, res) => res.status(404).json({ error: 'Not found.' }))
app.use((error, _req, res, _next) => {
  console.error('API request failed:', error.message)
  res.status(500).json({ error: 'An unexpected server error occurred.' })
})

const port = Number(process.env.PORT) || 3001
app.listen(port, () => console.log(`Ikuku API listening on http://localhost:${port}`))
