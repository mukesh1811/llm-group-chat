import { buildPromptContext } from './conversation'
import { normalizeModelCatalog } from './models'
import type { Buddy, Chat, Message, ModelCatalogResult } from '../types'

const OPENROUTER_API_ROOT = 'https://openrouter.ai/api/v1'

function buildHeaders(apiKey?: string, hasBody = false): HeadersInit {
  const headers: HeadersInit = {
    'X-Title': 'llm-group-chat',
  }

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`
  }

  if (hasBody) {
    headers['Content-Type'] = 'application/json'
  }

  if (typeof window !== 'undefined' && window.location.origin) {
    headers['HTTP-Referer'] = window.location.origin
  }

  return headers
}

async function parseError(response: Response) {
  try {
    const payload = (await response.json()) as {
      error?: { message?: string }
      message?: string
    }
    return payload.error?.message ?? payload.message ?? `OpenRouter request failed with ${response.status}`
  } catch {
    return `OpenRouter request failed with ${response.status}`
  }
}

async function requestOpenRouter<T>(
  apiKey: string | undefined,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${OPENROUTER_API_ROOT}${path}`, {
    ...init,
    headers: {
      ...buildHeaders(apiKey, Boolean(init.body)),
      ...(init.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new Error(await parseError(response))
  }

  return (await response.json()) as T
}

function extractAssistantText(value: unknown): string {
  if (typeof value === 'string') return value

  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === 'object' &&
        item !== null &&
        'text' in item &&
        typeof (item as { text?: unknown }).text === 'string'
          ? ((item as { text: string }).text as string)
          : '',
      )
      .filter(Boolean)
      .join('\n')
  }

  return ''
}

export function normalizeOpenRouterApiKey(value: string) {
  return value.trim()
}

export async function fetchOpenRouterModelCatalog(
  apiKey?: string,
): Promise<ModelCatalogResult> {
  const payload = await requestOpenRouter<unknown>(apiKey, '/models')
  return {
    models: normalizeModelCatalog(payload),
  }
}

export async function generateOpenRouterBuddyReply(args: {
  apiKey: string
  buddy: Buddy
  chat: Chat
  messages: Message[]
  buddies: Buddy[]
  turnId: string
}): Promise<string> {
  const systemPrompt = [
    `You are ${args.buddy.name}, the ${args.buddy.roleTitle}.`,
    `Your responsibilities are: ${args.buddy.responsibilities.join(', ') || 'stay aligned with your role'}.`,
    args.buddy.systemPrompt
      ? `Operating brief: ${args.buddy.systemPrompt}`
      : 'Operating brief: Stay in role and be concrete.',
    'Respond in 2-4 concise sentences.',
    buildPromptContext(args),
  ].join('\n')

  const completion = await requestOpenRouter<{
    choices?: Array<{
      message?: {
        content?: unknown
      }
    }>
  }>(args.apiKey, '/chat/completions', {
    method: 'POST',
    body: JSON.stringify({
      model: args.buddy.modelId,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content:
            'Reply with your point of view for the group chat. Be concrete and decision-oriented.',
        },
      ],
    }),
  })

  const content = extractAssistantText(completion.choices?.[0]?.message?.content)
  return content || 'I do not have a reply right now.'
}
