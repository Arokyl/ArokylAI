import { NextRequest, NextResponse } from 'next/server'

const AUTH_HEADERS = ['x-user-address', 'x-message', 'x-signature']

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const address = searchParams.get('address')
  const limit = searchParams.get('limit') ?? '20'
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL

  if (!address) return NextResponse.json({ error: 'Missing address' }, { status: 400 })

  if (apiUrl) {
    try {
      const headers = new Headers()
      for (const header of AUTH_HEADERS) {
        const value = req.headers.get(header)
        if (value) headers.set(header, value)
      }

      const res = await fetch(`${apiUrl}/wallet/remarks?address=${encodeURIComponent(address)}&limit=${limit}`, { headers })
      if (res.ok) {
        const data = await res.json()
        return NextResponse.json({ ok: true, data })
      }
    } catch {
      // Fall through to empty response.
    }
  }

  return NextResponse.json({ ok: true, data: { remarks: [], count: 0 } })
}

export async function POST(req: NextRequest) {
  const { id } = await req.json()
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL

  if (!id) return NextResponse.json({ error: 'Missing remark id' }, { status: 400 })

  if (apiUrl) {
    try {
      const headers = new Headers({ 'Content-Type': 'application/json' })
      for (const header of AUTH_HEADERS) {
        const value = req.headers.get(header)
        if (value) headers.set(header, value)
      }

      const res = await fetch(`${apiUrl}/wallet/remarks/${encodeURIComponent(id)}/acknowledge`, {
        method: 'POST',
        headers,
      })
      if (res.ok) {
        return NextResponse.json(await res.json())
      }
    } catch {
      // Fall through.
    }
  }

  return NextResponse.json({ acknowledged: true })
}