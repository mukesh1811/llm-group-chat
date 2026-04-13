import { describe, expect, it } from 'vitest'
import {
  buildPromptContext,
  extractMentionQuery,
  mergeBuddyIdsPreservingOrder,
  parseMentionBuddyIds,
  replaceTrailingMention,
  selectResponderIds,
} from '../../src/lib/conversation'
import {
  starterBuddies,
  starterChats,
  starterMessagesByChat,
} from '../../src/lib/starter-data'

describe('conversation helpers', () => {
  it('extracts the trailing mention query', () => {
    expect(extractMentionQuery('Need a take from @ct')).toBe('ct')
    expect(extractMentionQuery('No mention here')).toBeNull()
  })

  it('replaces the trailing mention with the full buddy name', () => {
    expect(replaceTrailingMention('Ask @ct', 'Ari')).toBe('Ask @Ari ')
  })

  it('maps mentions to ordered buddy ids', () => {
    const ids = parseMentionBuddyIds('@Ari and @gtm-lead should reply', starterBuddies)
    expect(ids).toEqual(['buddy-cto', 'buddy-gtm'])
  })

  it('returns all chat buddies when there are no mentions', () => {
    expect(selectResponderIds([], starterChats[0].buddyIds)).toEqual(
      starterChats[0].buddyIds,
    )
  })

  it('preserves current room order and appends new buddies in workspace order', () => {
    expect(
      mergeBuddyIdsPreservingOrder(
        ['buddy-pm', 'buddy-gtm'],
        ['buddy-pm', 'buddy-gtm', 'buddy-cto'],
        starterBuddies.map((buddy) => buddy.id),
      ),
    ).toEqual(['buddy-pm', 'buddy-gtm', 'buddy-cto'])
  })

  it('builds prompt context with earlier same-turn buddy replies called out', () => {
    const context = buildPromptContext({
      buddy: starterBuddies[1],
      chat: starterChats[0],
      messages: starterMessagesByChat['chat-plg'],
      buddies: starterBuddies,
      turnId: 'turn-a',
    })

    expect(context).toContain('Chat topic:')
    expect(context).toContain('earlier this turn')
    expect(context).toContain('Responsibilities:')
  })
})
