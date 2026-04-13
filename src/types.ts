export type SenderType = 'user' | 'buddy' | 'system'
export type MessageStatus = 'complete' | 'pending' | 'error'

export interface UserProfile {
  id: string
  name: string
  email: string
  avatarUrl?: string
}

export interface Buddy {
  id: string
  name: string
  roleTitle: string
  responsibilities: string[]
  systemPrompt: string
  modelId: string
}

export interface Chat {
  id: string
  title: string
  topic: string
  buddyIds: string[]
  lastMessageAt: string
}

export interface Message {
  id: string
  chatId: string
  senderType: SenderType
  buddyId?: string
  content: string
  mentionBuddyIds: string[]
  turnId: string
  status: MessageStatus
  errorCode?: string
  createdAt: string
}

export interface ModelOption {
  id: string
  name: string
  provider?: string
  description?: string
  contextLength: number
  pricingPrompt?: number
  pricingCompletion?: number
}

export interface WorkspaceState {
  user: UserProfile
  buddies: Buddy[]
  chats: Chat[]
  messagesByChat: Record<string, Message[]>
}

export interface BuddyDraft {
  name: string
  roleTitle: string
  responsibilities: string
  systemPrompt: string
  modelId: string
}

export interface ChatDraft {
  title: string
  topic: string
  buddyIds: string[]
}

export interface ModelCatalogResult {
  models: ModelOption[]
}
