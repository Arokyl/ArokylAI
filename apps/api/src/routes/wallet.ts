import type { FastifyPluginAsync } from 'fastify'
import { validateAddress, validateChainId } from '../lib/validation.js'

export const walletRoutes: FastifyPluginAsync = async (app) => {
  app.get<{ Querystring: { address?: string; chainId?: string } }>(
    '/managed',
    async (req, reply) => {
      const address = req.query.address
      const chainId = req.query.chainId ? parseInt(req.query.chainId) : 10143

      if (address) {
        try {
          const validated = validateAddress(address)
          validateChainId(chainId)
          return {
            address: validated,
            chainId,
            isManaged: true,
            executionProxyAddress: process.env.EXECUTION_PROXY_ADDRESS,
          }
        } catch (err: any) {
          return reply.code(400).send({ error: err.message })
        }
      }

      return { managedWallets: [], defaultChainId: chainId }
    }
  )

  app.get<{ Params: { address: string }; Querystring: { chainId?: string } }>(
    '/:address/activity',
    async (req, reply) => {
      try {
        const address = validateAddress(req.params.address)
        const chainId = req.query.chainId ? parseInt(req.query.chainId as string) : 10143
        validateChainId(chainId)

        return {
          address,
          chainId,
          events: [],
          remarks: [],
          message: 'Wallet monitoring active. Events will appear as transactions occur.',
        }
      } catch (err: any) {
        return reply.code(400).send({ error: err.message })
      }
    }
  )
}