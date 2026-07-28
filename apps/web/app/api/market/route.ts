import { NextRequest, NextResponse } from 'next/server'

const demoMarketPrice = {
  symbol: 'MON',
  priceUsd: 0.25,
  source: 'local-fallback',
  updatedAt: new Date().toISOString(),
}

const demoMarketAnalysis = {
  symbol: 'MON',
  priceUsd: 0.25,
  change24h: -0.3,
  volatility: 'low',
  trend: 'neutral',
  support: 0.24,
  resistance: 0.26,
  liquidityScore: 'medium',
  recommendation: 'Range-bound market. Consider limit orders near support ($0.24) and resistance ($0.26).',
  riskLevel: 'low',
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const symbol = searchParams.get('symbol')
  const chainId = searchParams.get('chainId') || '10143'
  const type = searchParams.get('type') || 'price' // 'price' or 'analysis'
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL

  if (!symbol) {
    return NextResponse.json({ ok: false, error: 'Missing required param: symbol' }, { status: 400 })
  }

  if (apiUrl) {
    try {
      const endpoint = type === 'analysis' ? 'analysis' : 'price'
      const res = await fetch(`${apiUrl}/market/${endpoint}/${symbol}?chainId=${chainId}`)
      if (res.ok) {
        const data = await res.json()
        return NextResponse.json({ ok: true, data })
      }
    } catch {
      // Fall through to demo response.
    }
  }

  if (type === 'analysis') {
    return NextResponse.json({ ok: true, data: { ...demoMarketAnalysis, symbol: symbol.toUpperCase() }, demo: true })
  }

  return NextResponse.json({ ok: true, data: { ...demoMarketPrice, symbol: symbol.toUpperCase() }, demo: true })
}