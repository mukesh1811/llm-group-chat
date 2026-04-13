import { describe, expect, it } from 'vitest'
import { normalizeModelCatalog } from '../../src/lib/models'

describe('model catalog normalization', () => {
  it('normalizes the OpenRouter model payload shape', () => {
    const normalized = normalizeModelCatalog({
      data: [
        {
          id: 'openai/gpt-4.1-mini',
          name: 'GPT-4.1 Mini',
          context_length: 128000,
          pricing: { prompt: 0.0000004, completion: 0.0000016 },
          top_provider: { name: 'OpenAI' },
        },
      ],
    })

    expect(normalized[0]).toMatchObject({
      id: 'openai/gpt-4.1-mini',
      name: 'GPT-4.1 Mini',
      provider: 'OpenAI',
      contextLength: 128000,
    })
  })

  it('returns an empty list for unsupported payloads', () => {
    expect(normalizeModelCatalog({ nope: true })).toEqual([])
  })
})
