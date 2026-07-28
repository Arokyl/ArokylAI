import test from 'node:test'
import assert from 'node:assert/strict'
import { parseAuthMessage, verifyWalletAuth } from './auth.js'

test('parseAuthMessage parses valid JSON string', () => {
  const msg = parseAuthMessage(JSON.stringify({ address: '0x1234', nonce: 'abc', timestamp: 1000 }))
  assert.strictEqual(msg.address, '0x1234')
  assert.strictEqual(msg.nonce, 'abc')
  assert.strictEqual(msg.timestamp, 1000)
})

test('parseAuthMessage rejects invalid JSON', () => {
  assert.throws(() => parseAuthMessage('not json'), /Malformed authentication message/)
})

test('parseAuthMessage rejects missing fields', () => {
  assert.throws(() => parseAuthMessage(JSON.stringify({ address: '0x1234' })), /Authentication message must include/)
})

test('verifyWalletAuth rejects missing headers', async () => {
  await assert.rejects(verifyWalletAuth('0x1234'), /Missing authentication headers/)
})
