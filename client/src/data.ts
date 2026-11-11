export type Asset = {
  symbol: string
  name: string
  price: number
  change: number
  color: string
  icon: string
  points: string
}

export const assets: Asset[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 67432.18, change: 2.45, color: '#f7931a', icon: '₿', points: '0,31 14,25 28,30 42,15 56,19 70,10 84,16 98,6 112,11 126,2' },
  { symbol: 'ETH', name: 'Ethereum', price: 3521.64, change: 1.82, color: '#8b9cff', icon: '◆', points: '0,24 14,29 28,19 42,25 56,12 70,17 84,6 98,13 112,4 126,7' },
  { symbol: 'SOL', name: 'Solana', price: 174.29, change: 5.67, color: '#a78bfa', icon: '◎', points: '0,29 14,21 28,27 42,12 56,17 70,7 84,13 98,4 112,10 126,1' },
  { symbol: 'ADA', name: 'Cardano', price: 0.6241, change: -0.83, color: '#4ea1ff', icon: '₳', points: '0,8 14,14 28,10 42,21 56,14 70,26 84,17 98,29 112,22 126,30' },
]

export type Transaction = {
  id: string
  type: 'deposit' | 'withdrawal'
  amount: number
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  user_id?: string
}
