import type { Buddy, Chat, Message, UserProfile, WorkspaceState } from '../types'

export const starterUser: UserProfile = {
  id: 'starter-user',
  name: 'Mukesh',
  email: 'builder@llm-group-chat.local',
}

export const starterBuddies: Buddy[] = [
  {
    id: 'buddy-cto',
    name: 'Ari',
    roleTitle: 'CTO',
    responsibilities: ['platform design', 'technical feasibility', 'sequencing'],
    systemPrompt:
      'Speak like a sharp technical leader. Trade off scope, complexity, and leverage.',
    modelId: 'openai/gpt-4.1-mini',
  },
  {
    id: 'buddy-gtm',
    name: 'Mina',
    roleTitle: 'GTM Lead',
    responsibilities: ['messaging', 'channels', 'launch motion'],
    systemPrompt:
      'Speak like a commercial operator. Focus on distribution, positioning, and demand creation.',
    modelId: 'anthropic/claude-3.7-sonnet',
  },
  {
    id: 'buddy-pm',
    name: 'Niko',
    roleTitle: 'Product Lead',
    responsibilities: ['user flow', 'prioritization', 'product loops'],
    systemPrompt:
      'Speak like a product lead. Keep answers grounded in user behavior and product tradeoffs.',
    modelId: 'google/gemini-2.5-pro',
  },
]

export const starterChats: Chat[] = [
  {
    id: 'chat-plg',
    title: 'PLG Strategy',
    topic: 'How llm-group-chat should launch with a product-led growth motion.',
    buddyIds: ['buddy-cto', 'buddy-gtm', 'buddy-pm'],
    lastMessageAt: new Date(Date.now() - 15 * 60_000).toISOString(),
  },
  {
    id: 'chat-pricing',
    title: 'Pricing Narrative',
    topic: 'How to package free, pro, and team plans without breaking adoption.',
    buddyIds: ['buddy-gtm', 'buddy-pm'],
    lastMessageAt: new Date(Date.now() - 90 * 60_000).toISOString(),
  },
]

export const starterMessagesByChat: Record<string, Message[]> = {
  'chat-plg': [
    {
      id: 'msg-1',
      chatId: 'chat-plg',
      senderType: 'user',
      content:
        'We need a launch idea that makes the group-chat angle feel instantly useful. What would each of you push first?',
      mentionBuddyIds: [],
      turnId: 'turn-a',
      status: 'complete',
      createdAt: new Date(Date.now() - 20 * 60_000).toISOString(),
    },
    {
      id: 'msg-2',
      chatId: 'chat-plg',
      senderType: 'buddy',
      buddyId: 'buddy-cto',
      content:
        'Ship one narrow collaborative workflow first: product strategy rooms. It is easier to explain, easier to tune, and the artifact can be shared after the discussion.',
      mentionBuddyIds: [],
      turnId: 'turn-a',
      status: 'complete',
      createdAt: new Date(Date.now() - 19 * 60_000).toISOString(),
    },
    {
      id: 'msg-3',
      chatId: 'chat-plg',
      senderType: 'buddy',
      buddyId: 'buddy-gtm',
      content:
        'Lead with the promise of cross-functional clarity. “Bring your CTO, PM, and GTM lead into one room” is more concrete than “multi-agent chat.”',
      mentionBuddyIds: [],
      turnId: 'turn-a',
      status: 'complete',
      createdAt: new Date(Date.now() - 18 * 60_000).toISOString(),
    },
    {
      id: 'msg-4',
      chatId: 'chat-plg',
      senderType: 'buddy',
      buddyId: 'buddy-pm',
      content:
        'Make the first aha moment happen in under a minute: create buddies from templates, start one preset topic, and pre-seed the first user message.',
      mentionBuddyIds: [],
      turnId: 'turn-a',
      status: 'complete',
      createdAt: new Date(Date.now() - 17 * 60_000).toISOString(),
    },
  ],
  'chat-pricing': [
    {
      id: 'msg-5',
      chatId: 'chat-pricing',
      senderType: 'user',
      content:
        '@Mina free should be generous enough to go viral but not enough to replace a paid plan. Draft the principle.',
      mentionBuddyIds: ['buddy-gtm'],
      turnId: 'turn-b',
      status: 'complete',
      createdAt: new Date(Date.now() - 95 * 60_000).toISOString(),
    },
    {
      id: 'msg-6',
      chatId: 'chat-pricing',
      senderType: 'buddy',
      buddyId: 'buddy-gtm',
      content:
        'Free should let a solo user feel the product loop, but paid should unlock durable team workflows: saved rooms, premium models, and reusable buddy sets.',
      mentionBuddyIds: [],
      turnId: 'turn-b',
      status: 'complete',
      createdAt: new Date(Date.now() - 94 * 60_000).toISOString(),
    },
  ],
}

export function createStarterWorkspace(): WorkspaceState {
  return {
    user: starterUser,
    buddies: starterBuddies,
    chats: starterChats,
    messagesByChat: starterMessagesByChat,
  }
}
