import './env.js'
import express from 'express'
import cors from 'cors'
import { chatHandler } from './agent/executor.js'
import { conversationMemory } from './agent/memory.js'
import { SUB_AGENT_CATALOG } from './agent/orchestrator.js'
import { WalletMonitor } from './agent/walletMonitor.js'
import { remarkEngine } from './agent/remarkEngine.js'
import { getAllowedOrigins } from './lib/cors.js'

const app = express()
app.use(cors({ origin: getAllowedOrigins() }))
app.use(express.json())

const walletMonitor = new WalletMonitor(30_000)

app.post('/chat', (req, res) => chatHandler(req, res, conversationMemory))
app.get('/subagents', (_, res) => res.json({ subagents: SUB_AGENT_CATALOG }))
app.get('/health', (_, res) => res.json({ ok: true }))

app.get('/wallet/remarks', (req, res) => {
  const wallet = req.query.wallet as string | undefined
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20
  const remarks = remarkEngine.getRemarks(wallet, limit)
  res.json({ remarks, count: remarks.length })
})

app.get('/wallet/remarks/unacknowledged', (req, res) => {
  const wallet = req.query.wallet as string | undefined
  const remarks = remarkEngine.getUnacknowledged(wallet)
  res.json({ remarks, count: remarks.length })
})

app.post('/wallet/remarks/:id/acknowledge', (req, res) => {
  const id = req.params.id
  const ok = remarkEngine.acknowledgeRemark(id)
  res.json({ acknowledged: ok })
})

walletMonitor.onActivity(async (event) => {
  try {
    const analysis = walletMonitor.analyzeProfitLoss(event)
    if (analysis.type === 'profit' || analysis.type === 'loss') {
      const remark = await remarkEngine.generateRemark(event)
      console.log(JSON.stringify({ event: 'remark_generated', type: remark.type, wallet: event.walletAddress, body: remark.body }))
    }
  } catch (err) {
    console.error('Remark generation failed:', err)
  }
})

walletMonitor.start()

const port = parseInt(process.env.PORT || process.env.AGENT_PORT || '3002')
const server = app.listen(port, () => console.log(`Agent service running on port ${port}`))

function shutdown() {
  walletMonitor.stop()
  server.close(() => process.exit(0))
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
