import type { ModelOption } from '../types'

function toNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export function normalizeModelCatalog(payload: unknown): ModelOption[] {
  const rows = Array.isArray(payload)
    ? payload
    : typeof payload === 'object' &&
        payload !== null &&
        'data' in payload &&
        Array.isArray((payload as { data: unknown[] }).data)
      ? (payload as { data: unknown[] }).data
      : []

  return rows
    .map((row): ModelOption | null => {
      if (typeof row !== 'object' || row === null) return null

      const data = row as Record<string, unknown>
      const id = typeof data.id === 'string' ? data.id : ''
      if (!id) return null

      const pricing =
        typeof data.pricing === 'object' && data.pricing !== null
          ? (data.pricing as Record<string, unknown>)
          : {}

      return {
        id,
        name:
          typeof data.name === 'string'
            ? data.name
            : id.split('/').slice(-1)[0] ?? id,
        provider:
          typeof data.top_provider === 'object' &&
          data.top_provider !== null &&
          typeof (data.top_provider as Record<string, unknown>).name === 'string'
            ? ((data.top_provider as Record<string, unknown>).name as string)
            : id.split('/')[0],
        description:
          typeof data.description === 'string' ? data.description : undefined,
        contextLength: toNumber(data.context_length, 0),
        pricingPrompt: Number(pricing.prompt) || undefined,
        pricingCompletion: Number(pricing.completion) || undefined,
      }
    })
    .filter((value): value is ModelOption => Boolean(value))
    .sort((left, right) => left.name.localeCompare(right.name))
}
