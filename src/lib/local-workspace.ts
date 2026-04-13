import type { Buddy, Chat, Message, UserProfile, WorkspaceState } from '../types'
import { createStarterWorkspace } from './starter-data'

const LOCAL_WORKSPACE_STORAGE_KEY = 'llm-group-chat.workspace.v1'

function sortChats(chats: Chat[]) {
  return [...chats].sort(
    (left, right) =>
      new Date(right.lastMessageAt).getTime() - new Date(left.lastMessageAt).getTime(),
  )
}

function mapUserProfile(value: unknown): UserProfile {
  const user = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}

  return {
    id: typeof user.id === 'string' ? user.id : 'private-session',
    name: typeof user.name === 'string' ? user.name : 'Private session',
    email:
      typeof user.email === 'string' && user.email.trim().length > 0
        ? user.email
        : 'Local-only workspace',
    avatarUrl: typeof user.avatarUrl === 'string' ? user.avatarUrl : undefined,
  }
}

function mapBuddy(value: unknown): Buddy | null {
  const buddy = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null
  if (!buddy || typeof buddy.id !== 'string' || typeof buddy.name !== 'string') return null

  return {
    id: buddy.id,
    name: buddy.name,
    roleTitle: typeof buddy.roleTitle === 'string' ? buddy.roleTitle : '',
    responsibilities: Array.isArray(buddy.responsibilities)
      ? buddy.responsibilities.map(String)
      : [],
    systemPrompt: typeof buddy.systemPrompt === 'string' ? buddy.systemPrompt : '',
    modelId:
      typeof buddy.modelId === 'string' && buddy.modelId.trim().length > 0
        ? buddy.modelId
        : 'openai/gpt-4.1-mini',
  }
}

function mapChat(value: unknown): Chat | null {
  const chat = typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null
  if (!chat || typeof chat.id !== 'string' || typeof chat.title !== 'string') return null

  return {
    id: chat.id,
    title: chat.title,
    topic: typeof chat.topic === 'string' ? chat.topic : '',
    buddyIds: Array.isArray(chat.buddyIds) ? chat.buddyIds.map(String) : [],
    lastMessageAt:
      typeof chat.lastMessageAt === 'string' && chat.lastMessageAt.trim().length > 0
        ? chat.lastMessageAt
        : new Date().toISOString(),
  }
}

function mapMessage(value: unknown): Message | null {
  const message =
    typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null
  if (
    !message ||
    typeof message.id !== 'string' ||
    typeof message.chatId !== 'string' ||
    typeof message.senderType !== 'string'
  ) {
    return null
  }

  return {
    id: message.id,
    chatId: message.chatId,
    senderType: message.senderType as Message['senderType'],
    buddyId: typeof message.buddyId === 'string' ? message.buddyId : undefined,
    content: typeof message.content === 'string' ? message.content : '',
    mentionBuddyIds: Array.isArray(message.mentionBuddyIds)
      ? message.mentionBuddyIds.map(String)
      : [],
    turnId:
      typeof message.turnId === 'string' && message.turnId.trim().length > 0
        ? message.turnId
        : crypto.randomUUID(),
    status:
      message.status === 'pending' || message.status === 'error' ? message.status : 'complete',
    errorCode: typeof message.errorCode === 'string' ? message.errorCode : undefined,
    createdAt:
      typeof message.createdAt === 'string' && message.createdAt.trim().length > 0
        ? message.createdAt
        : new Date().toISOString(),
  }
}

function cloneWorkspace(workspace: WorkspaceState): WorkspaceState {
  return {
    user: { ...workspace.user },
    buddies: workspace.buddies.map((buddy) => ({ ...buddy, responsibilities: [...buddy.responsibilities] })),
    chats: sortChats(workspace.chats).map((chat) => ({ ...chat, buddyIds: [...chat.buddyIds] })),
    messagesByChat: Object.fromEntries(
      Object.entries(workspace.messagesByChat).map(([chatId, messages]) => [
        chatId,
        messages.map((message) => ({
          ...message,
          mentionBuddyIds: [...message.mentionBuddyIds],
        })),
      ]),
    ),
  }
}

export function createLocalWorkspace(): WorkspaceState {
  const starter = createStarterWorkspace()
  return cloneWorkspace({
    ...starter,
    user: {
      id: 'private-session',
      name: 'Private session',
      email: 'Local-only workspace',
    },
  })
}

export function loadLocalWorkspace(): WorkspaceState {
  if (typeof window === 'undefined') {
    return createLocalWorkspace()
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_WORKSPACE_STORAGE_KEY)
    if (!raw) {
      return createLocalWorkspace()
    }

    const value = JSON.parse(raw)
    const parsed =
      typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null

    if (!parsed) {
      return createLocalWorkspace()
    }

    const buddies = Array.isArray(parsed.buddies)
      ? parsed.buddies.map(mapBuddy).filter((value): value is Buddy => Boolean(value))
      : []
    const chats = Array.isArray(parsed.chats)
      ? parsed.chats.map(mapChat).filter((value): value is Chat => Boolean(value))
      : []

    const rawMessages =
      typeof parsed.messagesByChat === 'object' && parsed.messagesByChat !== null
        ? (parsed.messagesByChat as Record<string, unknown>)
        : {}

    const messagesByChat = Object.fromEntries(
      Object.entries(rawMessages).map(([chatId, messages]) => [
        chatId,
        Array.isArray(messages)
          ? messages.map(mapMessage).filter((value): value is Message => Boolean(value))
          : [],
      ]),
    )

    return {
      user: mapUserProfile(parsed.user),
      buddies,
      chats: sortChats(chats),
      messagesByChat,
    }
  } catch (error) {
    console.error(error)
    return createLocalWorkspace()
  }
}

export function saveLocalWorkspace(workspace: WorkspaceState) {
  if (typeof window === 'undefined') return

  window.localStorage.setItem(
    LOCAL_WORKSPACE_STORAGE_KEY,
    JSON.stringify(cloneWorkspace(workspace)),
  )
}

export function clearLocalWorkspace() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(LOCAL_WORKSPACE_STORAGE_KEY)
}
