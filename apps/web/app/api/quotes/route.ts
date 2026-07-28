import { NextRequest, NextResponse } from 'next/server'

const demoQuotes = {
  quotes: [
    {
      aggregator: 'odos',
      amountIn: '100000000000000000',
      tokenIn: 'MON',
      tokenOut: 'USDC',
      amountOut: '18420000',
      amountOutFormatted: '18.42',
      priceImpact: 0.18,
      gasEstimate: '142000',
      gasEstimateUsd: 0.04,
      route: [{ protocol: 'Monad DEX', tokenIn: 'MON', tokenOut: 'USDC', share: 100 }],
      effectiveRate: 18.38,
    },
    {
      aggregator: '1inch',
      amountIn: '100000000000000000',
      tokenIn: 'MON',
      tokenOut: 'USDC',
      amountOut: '18350000',
      amountOutFormatted: '18.35',
      priceImpact: 0.22,
      gasEstimate: '155000',
      gasEstimateUsd: 0.05,
      route: [{ protocol: 'Monad DEX', tokenIn: 'MON', tokenOut: 'USDC', share: 100 }],
      effectiveRate: 18.30,
    },
    {
      aggregator: 'direct',
      amountIn: '100000000000000000',
      tokenIn: 'MON',
      tokenOut: 'USDC',
      amountOut: '18280000',
      amountOutFormatted: '18.28',
      priceImpact: 0.35,
      gasEstimate: '180000',
      gasEstimateUsd: 0.06,
      route: [{ protocol: 'Monad DEX', tokenIn: 'MON', tokenOut: 'USDC', share: 100 }],
      effectiveRate: 18.22,
    },
  ],
  bestQuote: {
    aggregator: 'odos',
    amountIn: '100000000000000000',
    tokenIn: 'MON',
    tokenOut: 'USDC',
    amountOut: '18420000',
    amountOutFormatted: '18.42',
    priceImpact: 0.18,
    gasEstimate: '142000',
    gasEstimateUsd: 0.04,
    route: [{ protocol: 'Monad DEX', tokenIn: 'MON', tokenOut: 'USDC', share: 100 }],
    effectiveRate: 18.38,
  },
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tokenIn = searchParams.get('tokenIn')
  const tokenOut = searchParams.get('tokenOut')
  const amountIn = searchParams.get('amountIn')
  const chainId = searchParams.get('chainId') || '10143'
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL

  if (!tokenIn || !tokenOut || !amountIn) {
    return NextResponse.json({ ok: false, error: 'Missing required params: tokenIn, tokenOut, amountIn' }, { status: 400 })
  }

  if (apiUrl) {
    try {
      const res = await fetch(`${apiUrl}/quotes?tokenIn=${tokenIn}&tokenOut=${tokenOut}&amountIn=${amountIn}&chainId=${chainId}`)
      if (res.ok) {
        const data = await res.json()
        return NextResponse.json({ ok: true, data })
      }
    } catch {
      // Fall through to demo response.
    }
  }

  return NextResponse.json({ ok: true, data: demoQuotes, demo: true })
}