import { assets, type Asset } from '../data'

const coinIds: Record<string, string> = {
  bitcoin: 'BTC',
  ethereum: 'ETH',
  solana: 'SOL',
  cardano: 'ADA',
}

type CoinGeckoMarket = {
  id: string
  current_price: number
  price_change_percentage_24h: number | null
}

export async function fetchMarketPrices(signal?: AbortSignal): Promise<Asset[]> {
  const response = await fetch(
    'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin%2Cethereum%2Csolana%2Ccardano&price_change_percentage=24h',
    { headers: { Accept: 'application/json' }, signal },
  )

  if (!response.ok) {
    throw new Error(`Market data provider returned ${response.status}.`)
  }

  const rows: unknown = await response.json()
  if (!Array.isArray(rows)) {
    throw new Error('Market data provider returned an invalid response.')
  }

  const marketBySymbol = new Map<string, CoinGeckoMarket>()
  for (const row of rows) {
    if (
      typeof row === 'object' &&
      row !== null &&
      'id' in row &&
      typeof row.id === 'string' &&
      row.id in coinIds &&
      'current_price' in row &&
      typeof row.current_price === 'number' &&
      Number.isFinite(row.current_price) &&
      'price_change_percentage_24h' in row &&
      (row.price_change_percentage_24h === null ||
        (typeof row.price_change_percentage_24h === 'number' &&
          Number.isFinite(row.price_change_percentage_24h)))
    ) {
      marketBySymbol.set(coinIds[row.id], row as CoinGeckoMarket)
    }
  }

  if (marketBySymbol.size !== assets.length) {
    throw new Error('Market data provider returned incomplete price data.')
  }

  return assets.map(asset => {
    const market = marketBySymbol.get(asset.symbol)
    if (!market) throw new Error(`Market data is unavailable for ${asset.name}.`)
    return {
      ...asset,
      price: market.current_price,
      change: market.price_change_percentage_24h ?? 0,
    }
  })
}
