import { describe, expect, it } from 'vitest'
import { starterBuddies } from '../../src/lib/starter-data'

describe('buddy records', () => {
  it('do not expose a temperature field', () => {
    for (const buddy of starterBuddies) {
      expect(buddy).not.toHaveProperty('temperature')
    }
  })
})
