import OpenAI from 'openai'
import type { WalletActivityEvent, WalletRemark } from '@somnia-agent/shared'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
})
const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini'

export class RemarkEngine {
  private remarks: WalletRemark[] = []
  private maxRemarks = 100

  async generateRemark(event: WalletActivityEvent): Promise<WalletRemark> {
    const analysis = this.classifyEvent(event)
    const prompt = this.buildPrompt(event, analysis)

    const completion = await openai.chat.completions.create({
      model: openaiModel,
      messages: [
        {
          role: 'system',
          content:
            'You are ArokylAI, a custodial wallet companion agent. Your job is to provide real-time, contextual remarks about a user\'s wallet activity. Be concise (1-3 sentences), empathetic, and actionable. When the user makes a profit, commend them warmly. When they take a loss, analyze the situation, encourage them, and give concrete advice. Never be harsh or dismissive.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 300,
    })

    const body = completion.choices[0]?.message?.content?.trim() ?? analysis.remark

    const remark: WalletRemark = {
      id: `remark_${event.walletAddress}_${Date.now()}`,
      walletAddress: event.walletAddress,
      chainId: event.chainId,
      type: analysis.type,
      title: this.getTitle(analysis.type),
      body,
      confidence: analysis.confidence,
      triggeredBy: event.type,
      metadata: {
        profitLossUsd: event.profitLossUsd,
        tokenIn: event.tokenIn,
        tokenOut: event.tokenOut,
        amountIn: event.amountIn,
        amountOut: event.amountOut,
      },
      createdAt: new Date().toISOString(),
      acknowledged: false,
    }

    this.remarks.unshift(remark)
    if (this.remarks.length > this.maxRemarks) {
      this.remarks = this.remarks.slice(0, this.maxRemarks)
    }

    return remark
  }

  getRemarks(walletAddress?: string, limit = 20): WalletRemark[] {
    if (walletAddress) {
      return this.remarks
        .filter((r) => r.walletAddress.toLowerCase() === walletAddress.toLowerCase())
        .slice(0, limit)
    }
    return this.remarks.slice(0, limit)
  }

  acknowledgeRemark(remarkId: string): boolean {
    const remark = this.remarks.find((r) => r.id === remarkId)
    if (remark) {
      remark.acknowledged = true
      return true
    }
    return false
  }

  getUnacknowledged(walletAddress?: string): WalletRemark[] {
    return this.remarks.filter((r) => !r.acknowledged && (!walletAddress || r.walletAddress.toLowerCase() === walletAddress.toLowerCase()))
  }

  private classifyEvent(event: WalletActivityEvent): { type: 'profit' | 'loss' | 'analysis' | 'encouragement' | 'info'; remark: string; confidence: number } {
    if (event.profitLossUsd !== undefined && event.profitLossUsd > 0) {
      return {
        type: 'profit',
        remark: `Profit of $${event.profitLossUsd.toFixed(2)} detected.`,
        confidence: 0.9,
      }
    }
    if (event.profitLossUsd !== undefined && event.profitLossUsd < 0) {
      return {
        type: 'loss',
        remark: `Loss of $${Math.abs(event.profitLossUsd).toFixed(2)} recorded.`,
        confidence: 0.9,
      }
    }
    return {
      type: 'info',
      remark: 'Wallet activity detected.',
      confidence: 0.7,
    }
  }

  private buildPrompt(event: WalletActivityEvent, analysis: { type: string; remark: string; confidence: number }): string {
    const parts = [
      `Wallet event: ${event.type}`,
      `Chain ID: ${event.chainId}`,
      `Wallet: ${event.walletAddress}`,
      `Timestamp: ${event.timestamp}`,
    ]

    if (event.profitLossUsd !== undefined) {
      parts.push(`Profit/Loss: $${event.profitLossUsd.toFixed(2)}`)
    }
    if (event.tokenIn) parts.push(`Token In: ${event.tokenIn}`)
    if (event.tokenOut) parts.push(`Token Out: ${event.tokenOut}`)
    if (event.amountIn) parts.push(`Amount In: ${event.amountIn}`)
    if (event.amountOut) parts.push(`Amount Out: ${event.amountOut}`)
    if (event.priceImpact !== undefined) parts.push(`Price Impact: ${event.priceImpact}%`)

    parts.push(
      `Classification: ${analysis.type}`,
      `Pre-written note: ${analysis.remark}`,
      '',
      'Write a brief, warm remark for the user based on this event. Keep it under 3 sentences. Be encouraging on profits and supportive on losses.',
    )

    return parts.join('\n')
  }

  private getTitle(type: string): string {
    const titles: Record<string, string> = {
      profit: 'Profit Detected',
      loss: 'Loss Analysis',
      analysis: 'Wallet Analysis',
      encouragement: 'Keep Going',
      info: 'Wallet Update',
    }
    return titles[type] ?? 'Wallet Update'
  }
}

export const remarkEngine = new RemarkEngine()