import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Activity, ArrowDownLeft, ArrowLeftRight, ArrowRight, ArrowUpRight, Bell,
  Check, ChevronDown, CircleHelp, Clock3, Eye, EyeOff, LayoutDashboard,
  LogOut, Menu, Plus, ShieldCheck, Sparkles, TrendingUp, Wallet, X, Zap,
} from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { api } from './lib/api'
import { fetchMarketPrices } from './lib/market'
import { supabase } from './lib/supabase'
import { assets as sampleAssets, type Asset, type Transaction } from './data'

type Profile = { id: string; display_name: string | null; role: string; status: string }
type AdminStats = { users: number; activeInvestments: number; pendingTransactions: number; volume: number }
type AdminUser = { id: string; email: string; display_name: string | null; status: string; role: string; created_at: string }

const money = (value: number, symbol?: string) => value.toLocaleString('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: symbol === 'ADA' ? 4 : 2,
  minimumFractionDigits: 2,
})
const shortDate = (value: string) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

function Logo({ small = false }: { small?: boolean }) {
  return <div className={`brand ${small ? 'brand-small' : ''}`}><span className="brand-mark"><span /></span><span>ikuku</span></div>
}

function Sparkline({ points, color, large = false }: { points: string; color: string; large?: boolean }) {
  return <svg className={large ? 'sparkline sparkline-large' : 'sparkline'} viewBox="0 0 128 36" preserveAspectRatio="none" aria-hidden="true">
    <polyline points={points} fill="none" stroke={color} strokeWidth={large ? 2 : 1.8} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
}

function LandingScreen({
  onOpenAuth,
  assets,
  marketLive,
  marketUpdatedAt,
}: {
  onOpenAuth: (mode: 'login' | 'signup') => void
  assets: Asset[]
  marketLive: boolean
  marketUpdatedAt: Date | null
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  return <main className="landing-page">
    <header className="landing-nav"><a className="landing-logo" href="#home" aria-label="Ikuku home"><Logo /></a>
      <button className="icon-btn landing-menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation"><Menu size={21} /></button>
      <nav className={menuOpen ? 'landing-links is-open' : 'landing-links'}><a href="#features" onClick={() => setMenuOpen(false)}>Why Ikuku</a><a href="#markets" onClick={() => setMenuOpen(false)}>Markets</a><a href="#about" onClick={() => setMenuOpen(false)}>Our approach</a><button className="landing-mobile-cta" onClick={() => onOpenAuth('signup')}>Get started <ArrowRight size={15} /></button></nav>
      <div className="landing-nav-actions"><button className="button button-quiet" onClick={() => onOpenAuth('login')}>Log in</button><button className="button button-primary" onClick={() => onOpenAuth('signup')}>Get started <ArrowRight size={15} /></button></div>
    </header>
    <section className="landing-hero" id="home"><div className="hero-copy"><div className="hero-kicker"><span className="live-dot" /> A CALMER WAY TO EXPLORE DIGITAL ASSETS</div><h1>Invest in your<br />understanding<span>.</span></h1><p>Make sense of digital assets with a clear, thoughtful workspace built around you — not the noise.</p><div className="hero-actions"><button className="button button-primary" onClick={() => onOpenAuth('signup')}>Explore Ikuku <ArrowRight size={16} /></button><button className="button button-quiet" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>See how it works <span className="hero-play">↓</span></button></div><div className="hero-trust"><ShieldCheck size={15} /><span>Privacy-minded by design</span><i /><span>Built for learning</span></div></div>
      <div className="hero-art" aria-label="Illustrative portfolio preview"><div className="hero-glow" /><div className="hero-orbit orbit-a" /><div className="hero-orbit orbit-b" /><div className="hero-card"><div className="hero-card-head"><span>YOUR SAMPLE PORTFOLIO</span><span className="demo-tag">DEMO</span></div><div className="hero-card-total">$24,850<span>+8.24%</span></div><div className="hero-card-sub">Illustrative value · not real funds</div><svg viewBox="0 0 400 112" className="hero-chart" aria-hidden="true"><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#52d89c" stopOpacity=".24" /><stop offset="1" stopColor="#52d89c" stopOpacity="0" /></linearGradient></defs><path d="M0 88 C30 77 40 95 70 68 S106 84 130 54 S168 72 192 44 S225 54 253 36 S293 55 317 26 S359 38 400 7 V112 H0Z" fill="url(#chartFill)" /><path d="M0 88 C30 77 40 95 70 68 S106 84 130 54 S168 72 192 44 S225 54 253 36 S293 55 317 26 S359 38 400 7" fill="none" stroke="#57dda2" strokeWidth="2.5" strokeLinecap="round" /></svg><div className="hero-card-assets">{assets.slice(0, 3).map((asset, i) => <div key={asset.symbol}><span className="coin-icon" style={{ color: asset.color, background: `${asset.color}15` }}>{asset.icon}</span><b>{asset.symbol}</b><span>{['48%', '32%', '20%'][i]}</span><i style={{ background: asset.color, width: `${[48, 32, 20][i]}%` }} /></div>)}</div></div><span className="floating-chip chip-one"><span className="live-dot" /> DEMO VALUES</span><span className="floating-chip chip-two"><Sparkles size={14} /> Learn at your pace</span></div>
    </section>
    <section className="ticker-section" id="markets"><div className="ticker-title"><span className={marketLive ? 'live-dot' : 'sample-dot'} /> MARKET SNAPSHOT <small>{marketLive ? `LIVE MARKET DATA · USD${marketUpdatedAt ? ` · UPDATED ${marketUpdatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}` : 'SAMPLE DATA · LIVE FEED UNAVAILABLE'}</small></div><div className="ticker-items">{assets.map(asset => <div className="ticker-item" key={asset.symbol}><span className="ticker-symbol" style={{ color: asset.color }}>{asset.icon}</span><b>{asset.symbol}</b><span>{money(asset.price, asset.symbol)}</span><small className={asset.change > 0 ? 'positive' : 'negative'}>{asset.change > 0 ? '+' : ''}{asset.change.toFixed(2)}%</small></div>)}</div></section>
    <section className="landing-features" id="features"><div className="landing-section-heading"><div className="eyebrow muted-eyebrow">A BETTER WAY TO GET ORIENTED</div><h2>Built for a clearer<br />perspective.</h2><p>Whether you're exploring for the first time or finding your rhythm, Ikuku gives you a thoughtful place to start.</p></div><div className="feature-cards"><article><span className="feature-icon"><Activity size={19} /></span><h3>See the whole picture</h3><p>Explore sample portfolios, asset allocations, and market movements in one uncluttered view.</p></article><article><span className="feature-icon blue-feature"><ShieldCheck size={19} /></span><h3>Your space, your pace</h3><p>Simple, secure account access keeps your personal demo workspace private and easy to manage.</p></article><article><span className="feature-icon violet-feature"><Sparkles size={19} /></span><h3>Learn by exploring</h3><p>Try simulated transactions and illustrative savings examples, with no money or commitments involved.</p></article></div></section>
    <section className="landing-quote" id="about"><div className="quote-mark">“</div><blockquote>Good decisions start with understanding. We’re here to make the view a little clearer.</blockquote><div className="quote-attribution"><span className="quote-avatar">I</span><span><b>The Ikuku approach</b><small>Clarity over noise. Always.</small></span></div></section>
    <section className="landing-cta"><div><div className="eyebrow">YOUR JOURNEY STARTS HERE</div><h2>Curiosity looks good on you.</h2><p>Build your own demo workspace and explore digital assets with a little more clarity.</p></div><button className="button button-primary" onClick={() => onOpenAuth('signup')}>Create free account <ArrowRight size={16} /></button></section>
    <footer className="landing-footer"><Logo /><span>© 2026 Ikuku · An educational demo experience</span><span>Not a bank or brokerage · No real funds</span></footer>
    <div className="landing-disclaimer">Market prices are fetched from CoinGecko and may be delayed. Portfolio values and returns are sample data. Digital assets are volatile; this site does not provide financial advice or execute real transactions.</div>
  </main>
}

function AuthScreen({ onAuthenticated, onBack, initialSignup = false }: { onAuthenticated: (user: User) => void; onBack: () => void; initialSignup?: boolean }) {
  const [signup, setSignup] = useState(initialSignup)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setNotice('')
    if (!supabase) { setError('Connect Supabase to enable account access. See the setup guide.'); return }
    if (password.length < 8) { setError('Use a password with at least 8 characters.'); return }
    setBusy(true)
    try {
      if (signup) {
        const { data, error: authError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { display_name: name.trim() } },
        })
        if (authError) throw authError
        if (data.session && data.user) onAuthenticated(data.user)
        else setNotice('Check your email to confirm your account, then sign in.')
      } else {
        const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (authError) throw authError
        if (data.user) onAuthenticated(data.user)
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to authenticate.')
    } finally { setBusy(false) }
  }

  return <main className="auth-page">
    <div className="auth-decoration decor-one" /><div className="auth-decoration decor-two" />
    <nav className="auth-top"><button className="auth-back" onClick={onBack}><Logo /></button><span className="secure-label"><ShieldCheck size={15} /> Secure workspace</span></nav>
    <div className="auth-layout">
      <section className="auth-story">
        <div className="eyebrow"><span className="live-dot" /> YOUR DIGITAL ASSET COMPANION</div>
        <h1>A clearer view<br />of <span>what's next.</span></h1>
        <p>Explore the digital asset landscape with a calmer, more considered workspace. Your journey, at your pace.</p>
        <div className="story-foot"><div className="story-line" /><span>Clarity over noise. Always.</span></div>
      </section>
      <section className="auth-card">
        <div className="auth-tabs"><button className={!signup ? 'active' : ''} onClick={() => { setSignup(false); setError('') }}>Sign in</button><button className={signup ? 'active' : ''} onClick={() => { setSignup(true); setError('') }}>Create account</button></div>
        <div className="auth-heading"><h2>{signup ? 'Create your account' : 'Welcome back'}</h2><p>{signup ? 'Start your Ikuku journey in just a moment.' : 'Enter your details to access your workspace.'}</p></div>
        <form onSubmit={submit} className="auth-form">
          {signup && <label>Your name<input autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Alex Morgan" required maxLength={80} /></label>}
          <label>Email address<input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required /></label>
          <label>Password<div className="password-wrap"><input type={showPassword ? 'text' : 'password'} autoComplete={signup ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" required minLength={8} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
          {error && <div role="alert" className="form-message error">{error}</div>}
          {notice && <div role="status" className="form-message success">{notice}</div>}
          <button className="button button-primary auth-submit" disabled={busy}>{busy ? 'Please wait…' : signup ? 'Create account' : 'Sign in'}<ArrowRight size={17} /></button>
        </form>
        <div className="auth-note"><ShieldCheck size={15} /> Your account is protected with secure authentication.</div>
        <p className="auth-demo-note">Demo experience only. No real assets, deposits, or investment returns.</p>
      </section>
    </div>
    <div className="auth-bottom"><span>© 2025 Ikuku Financial Technologies</span><span><CircleHelp size={14} /> Need help?</span></div>
  </main>
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null)
  const [marketAssets, setMarketAssets] = useState<Asset[]>(sampleAssets)
  const [marketLive, setMarketLive] = useState(false)
  const [marketUpdatedAt, setMarketUpdatedAt] = useState<Date | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [page, setPage] = useState('Overview')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionError, setActionError] = useState('')
  const [busy, setBusy] = useState(false)
  const [modal, setModal] = useState<'deposit' | 'withdrawal' | 'invest' | ''>('')
  const [amount, setAmount] = useState('')
  const [mobileMenu, setMobileMenu] = useState(false)

  useEffect(() => {
    let active = true
    let controller: AbortController | null = null

    async function refreshMarket() {
      controller?.abort()
      controller = new AbortController()
      const timeout = window.setTimeout(() => controller?.abort(), 12_000)
      try {
        const latest = await fetchMarketPrices(controller.signal)
        if (active) {
          setMarketAssets(latest)
          setMarketLive(true)
          setMarketUpdatedAt(new Date())
        }
      } catch (error) {
        if (active && !(error instanceof DOMException && error.name === 'AbortError')) {
          setMarketAssets(sampleAssets)
          setMarketLive(false)
          console.error('Live market refresh failed; showing clearly labeled sample prices.', error)
        }
      } finally {
        window.clearTimeout(timeout)
      }
    }

    void refreshMarket()
    const interval = window.setInterval(() => void refreshMarket(), 60_000)
    return () => {
      active = false
      controller?.abort()
      window.clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null)
      if (!data.session) setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
      if (!session) { setProfile(null); setTransactions([]); setLoading(false) }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) return
    let active = true
    setLoading(true)
    Promise.all([
      api<{ profile: Profile }>('/api/me'),
      api<{ transactions: Transaction[] }>('/api/transactions'),
    ]).then(([me, result]) => {
      if (!active) return
      setProfile(me.profile)
      setTransactions(result.transactions)
      setActionError('')
    }).catch(error => {
      if (active) setActionError(error instanceof Error ? error.message : 'Could not load your workspace.')
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [user])

  const isAdmin = profile?.role === 'admin'
  const navItems = ['Overview', 'Portfolio', 'Activity', ...(isAdmin ? ['Admin'] : [])]
  const pendingCount = transactions.filter(item => item.status === 'pending').length
  const realized = transactions.filter(item => item.status === 'approved' && item.type === 'deposit').reduce((sum, item) => sum + Number(item.amount), 0)
  const portfolioValue = 24850 + realized
  const greetingName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'there'

  async function refreshTransactions() {
    const result = await api<{ transactions: Transaction[] }>('/api/transactions')
    setTransactions(result.transactions)
  }

  async function submitTransaction(event: FormEvent) {
    event.preventDefault()
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0 || value > 1_000_000) {
      setActionError('Enter an amount between $0.01 and $1,000,000.')
      return
    }
    setBusy(true)
    setActionError('')
    try {
      await api('/api/transactions', { method: 'POST', body: JSON.stringify({ type: modal, amount: value }) })
      await refreshTransactions()
      setModal('')
      setAmount('')
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not submit this request.')
    } finally { setBusy(false) }
  }

  async function loadAdmin() {
    setBusy(true)
    setActionError('')
    try {
      const [statsResult, userResult, transactionResult] = await Promise.all([
        api<AdminStats>('/api/admin/stats'),
        api<{ users: AdminUser[] }>('/api/admin/users'),
        api<{ transactions: Transaction[] }>('/api/admin/transactions?status=pending'),
      ])
      setStats(statsResult)
      setUsers(userResult.users)
      setTransactions(transactionResult.transactions)
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not load administration data.')
    } finally { setBusy(false) }
  }

  useEffect(() => { if (page === 'Admin' && isAdmin) void loadAdmin() }, [page, isAdmin])

  async function updateTransaction(id: string, status: 'approved' | 'rejected') {
    setBusy(true)
    try {
      await api(`/api/admin/transactions/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
      await loadAdmin()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not update transaction.')
    } finally { setBusy(false) }
  }

  async function updateUser(id: string, status: string) {
    setBusy(true)
    try {
      await api(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
      await loadAdmin()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not update user.')
    } finally { setBusy(false) }
  }

  async function deleteUser(id: string, email: string) {
    if (!window.confirm(`Permanently delete ${email}? This also removes their demo data and cannot be undone.`)) return
    setBusy(true)
    setActionError('')
    try {
      await api(`/api/admin/users/${id}`, { method: 'DELETE' })
      await loadAdmin()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not delete user.')
    } finally { setBusy(false) }
  }

  async function logout() {
    await supabase?.auth.signOut()
    setUser(null)
    setPage('Overview')
  }

  if (!user) return authMode
    ? <AuthScreen onAuthenticated={setUser} onBack={() => setAuthMode(null)} initialSignup={authMode === 'signup'} />
    : <LandingScreen onOpenAuth={setAuthMode} assets={marketAssets} marketLive={marketLive} marketUpdatedAt={marketUpdatedAt} />
  if (loading) return <div className="loading-screen"><Logo /><div className="loader" />Loading your workspace</div>

  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu ? 'sidebar-open' : ''}`}>
      <div className="sidebar-top"><Logo /><button className="icon-btn mobile-close" onClick={() => setMobileMenu(false)} aria-label="Close menu"><X size={19} /></button></div>
      <div className="workspace-switch"><span className="workspace-avatar">I</span><span><b>Personal workspace</b><small>Free plan</small></span><ChevronDown size={15} /></div>
      <div className="nav-caption">WORKSPACE</div>
      <nav className="main-nav">{navItems.map((item, index) => <button key={item} className={`nav-item ${page === item ? 'selected' : ''}`} onClick={() => { setPage(item); setMobileMenu(false) }}>
        {index === 0 ? <LayoutDashboard size={18} /> : index === 1 ? <Wallet size={18} /> : index === 2 ? <Activity size={18} /> : <ShieldCheck size={18} />}{item}{item === 'Activity' && pendingCount > 0 && <span className="nav-badge">{pendingCount}</span>}
      </button>)}</nav>
      <div className="sidebar-bottom">
        <div className="sidebar-help"><div className="help-icon"><Sparkles size={16} /></div><b>New to digital assets?</b><p>Explore our beginner-friendly guide to get oriented.</p><button onClick={() => setPage('Portfolio')}>Explore the guide <ArrowRight size={13} /></button></div>
        <div className="sidebar-user"><div className="user-avatar">{greetingName.charAt(0).toUpperCase()}</div><div className="user-meta"><b>{greetingName}</b><small>{user.email}</small></div><button className="icon-btn logout-btn" onClick={logout} aria-label="Sign out"><LogOut size={17} /></button></div>
      </div>
    </aside>
    {mobileMenu && <button className="sidebar-scrim" onClick={() => setMobileMenu(false)} aria-label="Close navigation" />}

    <main className="main-area">
      <header className="topbar"><button className="icon-btn menu-toggle" onClick={() => setMobileMenu(true)} aria-label="Open menu"><Menu size={20} /></button><div className="breadcrumb">Workspace <span>/</span> <b>{page}</b></div><div className="topbar-right"><span className="market-status"><span className={marketLive ? 'live-dot' : 'sample-dot'} /> {marketLive ? 'Live market prices' : 'Sample prices'}</span><button className="icon-btn notification-btn" aria-label="Notifications"><Bell size={18} /><i /></button><div className="top-avatar">{greetingName.charAt(0).toUpperCase()}</div></div></header>
      {actionError && <div className="global-error" role="alert">{actionError}<button onClick={() => setActionError('')} aria-label="Dismiss error"><X size={15} /></button></div>}
      <div className="content">
        {page === 'Admin' && isAdmin ? <section className="page-section">
          <div className="page-title-row"><div><div className="eyebrow muted-eyebrow">PLATFORM MANAGEMENT</div><h1>Admin overview</h1><p>Monitor demo activity across your Ikuku workspace.</p></div><button className="button button-secondary" onClick={() => void loadAdmin()}><Activity size={16} /> Refresh data</button></div>
          <div className="notice-banner"><ShieldCheck size={17} /> Administrative tools are restricted to verified admin accounts. All requests are simulated.</div>
          <div className="stats-grid admin-stats">
            {[['Total users', stats?.users ?? '—', <Wallet size={17} />], ['Active investments', stats?.activeInvestments ?? '—', <TrendingUp size={17} />], ['Pending requests', stats?.pendingTransactions ?? '—', <Clock3 size={17} />], ['Demo volume', stats ? money(stats.volume) : '—', <ArrowLeftRight size={17} />]].map(([label, value, icon]) => <div className="stat-card" key={String(label)}><div className="stat-label">{label}<span className="stat-icon">{icon}</span></div><div className="stat-value">{value}</div><div className="stat-foot">Workspace totals · simulated</div></div>)}
          </div>
          <div className="panel admin-panel"><div className="panel-heading"><div><h2>Transaction approvals</h2><p>Review incoming demo requests</p></div><span className="count-pill">{transactions.filter(t => t.status === 'pending').length} pending</span></div>
            <div className="table-scroll"><table><thead><tr><th>Request</th><th>Type</th><th>Amount</th><th>Submitted</th><th>Action</th></tr></thead><tbody>
              {transactions.filter(t => t.status === 'pending').map(t => <tr key={t.id}><td><span className="mono">#{t.id.slice(0, 8)}</span></td><td className="capitalize">{t.type}</td><td>{money(Number(t.amount))}</td><td>{shortDate(t.created_at)}</td><td><div className="table-actions"><button className="approve-btn" disabled={busy} onClick={() => void updateTransaction(t.id, 'approved')}><Check size={14} /> Approve</button><button className="decline-btn" disabled={busy} onClick={() => void updateTransaction(t.id, 'rejected')}>Decline</button></div></td></tr>)}
              {transactions.filter(t => t.status === 'pending').length === 0 && <tr><td colSpan={5} className="empty-row">No pending demo requests.</td></tr>}
            </tbody></table></div>
          </div>
          <div className="panel admin-panel"><div className="panel-heading"><div><h2>User management</h2><p>Review accounts and access status</p></div><span className="count-pill">{users.length} accounts</span></div><div className="table-scroll"><table><thead><tr><th>User</th><th>Role</th><th>Joined</th><th>Status</th><th>Manage</th></tr></thead><tbody>
            {users.map(item => <tr key={item.id}><td><b>{item.display_name || 'Member'}</b><small className="table-sub">{item.email}</small></td><td className="capitalize">{item.role}</td><td>{shortDate(item.created_at)}</td><td><span className={`status-tag ${item.status}`}>{item.status}</span></td><td>{item.role === 'admin' ? <span className="muted">Protected</span> : <div className="user-manage"><select value={item.status} disabled={busy} onChange={e => void updateUser(item.id, e.target.value)} aria-label={`Set ${item.email} status`}><option value="active">Active</option><option value="suspended">Suspended</option></select><button className="delete-user-btn" disabled={busy} onClick={() => void deleteUser(item.id, item.email)}>Delete</button></div>}</td></tr>)}
            {users.length === 0 && <tr><td colSpan={5} className="empty-row">No users found.</td></tr>}
          </tbody></table></div></div>
        </section> : page === 'Activity' ? <section className="page-section">
          <div className="page-title-row"><div><div className="eyebrow muted-eyebrow">YOUR ACCOUNT</div><h1>Activity</h1><p>A transparent record of your simulated transactions.</p></div><button className="button button-secondary" onClick={() => void refreshTransactions()}><Activity size={16} /> Refresh</button></div>
          <div className="panel activity-panel"><div className="panel-heading"><div><h2>All transactions</h2><p>Deposits and withdrawals</p></div><span className="count-pill">{transactions.length} total</span></div>
            <div className="table-scroll"><table><thead><tr><th>Transaction</th><th>Type</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead><tbody>
              {transactions.map(t => <tr key={t.id}><td><span className={`transaction-icon ${t.type}`}><ArrowDownLeft size={16} /></span><span className="mono">#{t.id.slice(0, 8)}</span></td><td className="capitalize">{t.type}</td><td>{new Date(t.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</td><td>{money(Number(t.amount))}</td><td><span className={`status-tag ${t.status}`}>{t.status}</span></td></tr>)}
              {transactions.length === 0 && <tr><td colSpan={5} className="empty-row">No activity yet. Start by exploring a simulated deposit.</td></tr>}
            </tbody></table></div>
          </div>
        </section> : page === 'Portfolio' ? <section className="page-section">
          <div className="page-title-row"><div><div className="eyebrow muted-eyebrow">YOUR DIGITAL ASSETS</div><h1>Portfolio</h1><p>A closer look at your demo allocation and the market.</p></div><button className="button button-primary" onClick={() => setModal('invest')}><Plus size={16} /> Explore plans</button></div>
          <div className="portfolio-summary panel"><div><span className="stat-label">Total demo portfolio</span><div className="big-amount">{money(portfolioValue)}</div><span className="positive-change"><TrendingUp size={14} /> 8.24% <span className="muted">all time</span></span></div><div className="portfolio-chart"><div className="donut-chart"><div><b>4</b><small>assets</small></div></div><div className="chart-legend">{marketAssets.slice(0, 3).map((a, i) => <span key={a.symbol}><i style={{ background: a.color }} />{a.name}<b>{[48, 32, 20][i]}%</b></span>)}</div></div></div>
          <div className="section-header"><div><h2>Your assets</h2><p>{marketLive ? 'Live indicative prices · 24-hour change' : 'Sample prices · live market feed unavailable'}</p></div></div>
          <div className="panel asset-list">{marketAssets.map((a, i) => <div className="asset-row" key={a.symbol}><div className="coin-icon" style={{ color: a.color, background: `${a.color}15` }}>{a.icon}</div><div className="asset-name"><b>{a.name}</b><small>{a.symbol}</small></div><div className="asset-chart"><Sparkline points={a.points} color={a.change > 0 ? '#3ddc97' : '#f47782'} /></div><div className="asset-price"><b>{money(a.price, a.symbol)}</b><small className={a.change > 0 ? 'positive' : 'negative'}>{a.change > 0 ? '+' : ''}{a.change.toFixed(2)}%</small></div><div className="asset-value"><b>{money(portfolioValue * [0.48, 0.32, 0.2, 0][i])}</b><small>{[48, 32, 20, 0][i]}% of portfolio</small></div></div>)}</div>
          <div className="disclaimer"><CircleHelp size={16} /><span>{marketLive ? 'Market prices are fetched from CoinGecko and may be delayed. Portfolio balances and allocation are sample figures only.' : 'Live market prices are temporarily unavailable, so sample prices are shown instead. Portfolio balances are simulated.'} Crypto assets are volatile; this app does not execute trades or provide financial advice.</span></div>
        </section> : <section className="page-section">
          <div className="welcome-row"><div><div className="eyebrow muted-eyebrow"><span className="live-dot" /> YOUR OVERVIEW</div><h1>Good morning, {greetingName.split(' ')[0]} <span className="wave">✦</span></h1><p>Here's what's happening with your workspace today.</p></div><button className="button button-secondary date-button"><Clock3 size={15} /> Last 30 days <ChevronDown size={15} /></button></div>
          <div className="demo-banner"><span><Zap size={17} /></span><div><b>This is a demo workspace</b><p>Balances, prices, and returns are examples only — no real funds or investments are involved.</p></div><button onClick={() => setPage('Portfolio')} aria-label="Explore portfolio"><ArrowRight size={17} /></button></div>
          <div className="stats-grid">
            <div className="stat-card balance-card"><div className="stat-label">Total portfolio value <span className="stat-icon"><Wallet size={17} /></span></div><div className="stat-value">{money(portfolioValue)}</div><div className="stat-foot"><span className="positive-change"><TrendingUp size={13} /> +8.24%</span><span> compared to last month</span></div><div className="balance-spark"><Sparkline points="0,32 15,28 30,30 45,18 60,24 75,14 90,21 105,9 120,12 135,0" color="#69e8ad" large /></div></div>
            <div className="stat-card"><div className="stat-label">Total invested <span className="stat-icon"><ArrowUpRight size={17} /></span></div><div className="stat-value">{money(18600)}</div><div className="stat-foot"><span className="stat-note">Across 3 demo assets</span></div><div className="mini-progress"><i /></div></div>
            <div className="stat-card"><div className="stat-label">Total returns <span className="stat-icon"><TrendingUp size={17} /></span></div><div className="stat-value positive">+{money(2140)}</div><div className="stat-foot"><span className="positive-change"><TrendingUp size={13} /> +11.5%</span><span> overall return</span></div><div className="returns-bars"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div></div>
          </div>
          <div className="dashboard-grid">
            <div className="panel market-panel"><div className="panel-heading"><div><h2>Market watch</h2><p>{marketLive ? 'CoinGecko prices · sample 7-day trends' : 'Sample prices · live feed unavailable'}</p></div><button className="link-button" onClick={() => setPage('Portfolio')}>View all <ArrowRight size={14} /></button></div>
              <div className="market-table"><div className="market-head"><span>ASSET</span><span>PRICE</span><span>24H</span><span>SAMPLE TREND</span></div>{marketAssets.map(a => <div className="market-row" key={a.symbol}><div className="market-coin"><span className="coin-icon" style={{ color: a.color, background: `${a.color}15` }}>{a.icon}</span><span><b>{a.name}</b><small>{a.symbol}</small></span></div><b className="market-price">{money(a.price, a.symbol)}</b><span className={a.change > 0 ? 'positive' : 'negative'}>{a.change > 0 ? '+' : ''}{a.change.toFixed(2)}%</span><Sparkline points={a.points} color={a.change > 0 ? '#3ddc97' : '#f47782'} /></div>)}</div>
            </div>
            <div className="panel allocation-panel"><div className="panel-heading"><div><h2>Asset allocation</h2><p>By portfolio value</p></div><button className="icon-btn" onClick={() => setPage('Portfolio')} aria-label="Open portfolio"><ArrowRight size={16} /></button></div><div className="allocation-visual"><div className="donut-chart"><div><b>100%</b><small>allocated</small></div></div></div><div className="allocation-list">{marketAssets.slice(0, 3).map((a, i) => <div key={a.symbol}><span><i style={{ background: a.color }} />{a.name}</span><b>{[48, 32, 20][i]}%</b></div>)}</div></div>
          </div>
          <div className="lower-grid">
            <div className="panel activity-preview"><div className="panel-heading"><div><h2>Recent activity</h2><p>Your latest account movements</p></div><button className="link-button" onClick={() => setPage('Activity')}>View all <ArrowRight size={14} /></button></div>
              {transactions.slice(0, 3).map(t => <div className="activity-row" key={t.id}><span className={`transaction-icon ${t.type}`}>{t.type === 'deposit' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}</span><span className="activity-label"><b>{t.type === 'deposit' ? 'Demo deposit' : 'Demo withdrawal'}</b><small>{shortDate(t.created_at)}</small></span><b>{t.type === 'deposit' ? '+' : '−'}{money(Number(t.amount))}</b><span className={`status-tag ${t.status}`}>{t.status}</span></div>)}
              {transactions.length === 0 && <div className="empty-activity"><span className="empty-icon"><ArrowLeftRight size={20} /></span><b>No activity just yet</b><p>Your demo transactions will show up here.</p><button className="link-button" onClick={() => setModal('deposit')}>Try a demo deposit <ArrowRight size={13} /></button></div>}
            </div>
            <div className="panel plans-panel"><div className="panel-heading"><div><h2>Explore plans</h2><p>Learn with simulated examples</p></div><span className="demo-tag">DEMO</span></div><div className="plan-card"><span className="plan-icon"><Sparkles size={17} /></span><div><b>Flexible savings</b><p>Learn how a flexible plan might work.</p></div><span className="plan-rate">3.2%<small>sample APR</small></span></div><div className="plan-card"><span className="plan-icon purple"><Clock3 size={17} /></span><div><b>Fixed-term example</b><p>Explore a simulated 90-day term.</p></div><span className="plan-rate">5.0%<small>sample APR</small></span></div><button className="button button-outline full-width" onClick={() => setModal('invest')}>Explore demo plans <ArrowRight size={15} /></button><div className="tiny-disclaimer">Illustrative rates only. No real yield or investment.</div></div>
          </div>
          <div className="quick-actions"><div><h2>Quick actions</h2><p>Manage your simulated account</p></div><button onClick={() => setModal('deposit')}><span className="quick-icon green"><ArrowDownLeft size={17} /></span><b>Demo deposit</b><ArrowRight size={15} /></button><button onClick={() => setModal('withdrawal')}><span className="quick-icon blue"><ArrowUpRight size={17} /></span><b>Demo withdrawal</b><ArrowRight size={15} /></button><button onClick={() => setPage('Activity')}><span className="quick-icon violet"><ArrowLeftRight size={17} /></span><b>View activity</b><ArrowRight size={15} /></button></div>
        </section>}
      </div>
      <footer className="footer"><span>© 2025 Ikuku · Demo experience only</span><span>Not a bank or brokerage. <a href="#disclaimer" onClick={e => { e.preventDefault(); setPage('Portfolio') }}>Risk disclosure</a></span></footer>
    </main>
    {modal && <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) { setModal(''); setActionError('') } }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><button className="icon-btn modal-close" onClick={() => setModal('')} aria-label="Close"><X size={18} /></button><div className="modal-icon">{modal === 'deposit' ? <ArrowDownLeft size={21} /> : modal === 'withdrawal' ? <ArrowUpRight size={21} /> : <Sparkles size={21} />}</div><h2 id="modal-title">{modal === 'invest' ? 'Explore a demo plan' : `Create a demo ${modal}`}</h2><p>{modal === 'invest' ? 'Investment plans are examples only. This demo does not invest funds or generate returns.' : 'This is a simulated request. No money will be moved or deposited.'}</p>
      {modal === 'invest' ? <div className="modal-plan-info"><b>Flexible savings example</b><span>3.2% sample APR · Illustrative only</span></div> : <form onSubmit={submitTransaction}><label>Amount (USD)<div className="amount-input"><span>$</span><input type="number" inputMode="decimal" min="0.01" max="1000000" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required /></div></label><div className="modal-helper"><ShieldCheck size={14} /> Simulation only — no real funds involved.</div><button className="button button-primary full-width" disabled={busy}>{busy ? 'Submitting…' : 'Submit demo request'}<ArrowRight size={15} /></button></form>}
      {modal === 'invest' && <button className="button button-primary full-width" onClick={() => setModal('')}>Got it <Check size={15} /></button>}</section></div>}
  </div>
}

export default App
