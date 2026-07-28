import test from 'node:test'
import assert from 'node:assert/strict'
import { expandUrl, normalizeItems, numberEnv } from './dataSources.js'

test('expandUrl replaces all placeholders', () => {
  const result = expandUrl('https://example.com/{address}/{chainId}/{query}/{apiKey}', {
    address: '0x123',
    chainId: 1,
    query: 'test',
  }, 'secret')
  assert.strictEqual(result, 'https://example.com/0x123/1/test/secret')
})

test('expandUrl handles missing context', () => {
  const result = expandUrl('https://example.com/{address}/{chainHex}', {})
  assert.strictEqual(result, 'https://example.com//')
})

test('normalizeItems extracts strings from array', () => {
  const result = normalizeItems(['a', 'b', 'c'], 'test')
  assert.deepEqual(result, ['a', 'b', 'c'])
})

test('normalizeItems extracts items from response objects', () => {
  const data = { items: [{ title: 'One' }, { title: 'Two' }] }
  const result = normalizeItems(data, 'test')
  assert.deepEqual(result, ['One', 'Two'])
})

test('normalizeItems limits to 5 items', () => {
  const data = ['1', '2', '3', '4', '5', '6']
  const result = normalizeItems(data, 'test')
  assert.strictEqual(result.length, 5)
})

test('normalizeItems uses fallback label when no identifiable fields found', () => {
  const data = [{ unknown: 'x' }]
  const result = normalizeItems(data, 'feed')
  assert.deepEqual(result, ['feed item'])
})

test('numberEnv returns fallback when env is missing', () => {
  assert.strictEqual(numberEnv('MISSING_ENV_VAR_12345', 42), 42)
})

test('numberEnv returns parsed number when env is valid', () => {
  process.env.TEST_ENV_NUMBER = '15'
  assert.strictEqual(numberEnv('TEST_ENV_NUMBER', 42), 15)
  delete process.env.TEST_ENV_NUMBER
})
