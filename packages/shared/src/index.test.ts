import test from 'node:test'
import assert from 'node:assert/strict'
import { isNativeToken } from '@somnia-agent/shared'

test('isNativeToken returns true for zero address', () => {
  assert.strictEqual(isNativeToken('0x0000000000000000000000000000000000000000'), true)
})

test('isNativeToken returns true for known symbols', () => {
  assert.strictEqual(isNativeToken('eth'), true)
  assert.strictEqual(isNativeToken('ETH'), true)
  assert.strictEqual(isNativeToken('mon'), true)
  assert.strictEqual(isNativeToken('native'), true)
})

test('isNativeToken returns false for non-native addresses', () => {
  assert.strictEqual(isNativeToken('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'), false)
  assert.strictEqual(isNativeToken(''), false)
  assert.strictEqual(isNativeToken(undefined), false)
})
