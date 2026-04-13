import { describe, expect, it } from 'vitest'
import { normalizeOpenRouterApiKey } from '../../src/lib/openrouter'

describe('openrouter helpers', () => {
  it('trims user-entered api keys', () => {
    expect(normalizeOpenRouterApiKey('  sk-or-v1-test  ')).toBe('sk-or-v1-test')
  })

  it('preserves empty input as empty after normalization', () => {
    expect(normalizeOpenRouterApiKey('   ')).toBe('')
  })
})
