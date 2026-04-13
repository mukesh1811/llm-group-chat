import type { Buddy, Chat, Message } from '../types'
import { slugify } from './format'

const mentionPattern = /(^|\s)@([a-z0-9_-]+)$/i

export function extractMentionQuery(input: string): string | null {
  const match = input.match(mentionPattern)
  return match ? match[2] : null
}

export function replaceTrailingMention(
  draft: string,
  buddyName: string,
): string {
  return draft.replace(mentionPattern, (_, prefix) => `${prefix}@${buddyName} `)
}

export function parseMentionBuddyIds(text: string, buddies: Buddy[]): string[] {
  const tokens = Array.from(text.matchAll(/(^|\s)@([a-z0-9_-]+)/gi)).map(
    (match) => match[2].toLowerCase(),
  )

  if (tokens.length === 0) return []

  const buddyByHandle = new Map<string, string>()
  for (const buddy of buddies) {
    buddyByHandle.set(slugify(buddy.name), buddy.id)
    buddyByHandle.set(slugify(buddy.roleTitle), buddy.id)
  }

  return Array.from(
    new Set(
      tokens
        .map((token) => buddyByHandle.get(token))
        .filter((value): value is string => Boolean(value)),
    ),
  )
}

export function selectResponderIds(
  mentionBuddyIds: string[],
  orderedBuddyIds: string[],
): string[] {
  if (mentionBuddyIds.length === 0) return orderedBuddyIds

  const mentionSet = new Set(mentionBuddyIds)
  return orderedBuddyIds.filter((buddyId) => mentionSet.has(buddyId))
}

export function mergeBuddyIdsPreservingOrder(
  currentBuddyIds: string[],
  nextBuddyIds: string[],
  allBuddyIds: string[],
): string[] {
  const currentSet = new Set(currentBuddyIds)
  const nextSet = new Set(nextBuddyIds)

  const retained = currentBuddyIds.filter((buddyId) => nextSet.has(buddyId))
  const appended = allBuddyIds.filter(
    (buddyId) => nextSet.has(buddyId) && !currentSet.has(buddyId),
  )

  return [...retained, ...appended]
}

export function buildPromptContext(args: {
  buddy: Buddy
  chat: Chat
  messages: Message[]
  buddies: Buddy[]
  turnId: string
}): string {
  const buddyMap = new Map(args.buddies.map((buddy) => [buddy.id, buddy]))
  const transcript = args.messages
    .slice(-12)
    .map((message) => {
      if (message.senderType === 'user') {
        return `User: ${message.content}`
      }

      const name = buddyMap.get(message.buddyId ?? '')?.name ?? 'Buddy'
      const prefix =
        message.turnId === args.turnId ? `${name} (earlier this turn)` : name
      return `${prefix}: ${message.content}`
    })
    .join('\n')

  return [
    `Chat topic: ${args.chat.topic}`,
    'Recent transcript:',
    transcript,
  ].join('\n')
}
