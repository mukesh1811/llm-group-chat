import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { MobileShell } from './components/MobileShell'
import { Sidebar, type SidebarMode } from './components/Sidebar'
import { ThreadPane, type ThreadPaneMode } from './components/ThreadPane'
import {
  extractMentionQuery,
  mergeBuddyIdsPreservingOrder,
  parseMentionBuddyIds,
  selectResponderIds,
} from './lib/conversation'
import { createLocalWorkspace, clearLocalWorkspace, loadLocalWorkspace, saveLocalWorkspace } from './lib/local-workspace'
import {
  fetchOpenRouterModelCatalog,
  generateOpenRouterBuddyReply,
  normalizeOpenRouterApiKey,
} from './lib/openrouter'
import { appRoutes, isBuddyRoute, isChatRoute, matchAppRoute } from './lib/routes'
import type {
  Buddy,
  BuddyDraft,
  Chat,
  ChatDraft,
  Message,
  ModelOption,
  WorkspaceState,
} from './types'
import './index.css'

type OpenRouterKeyState = 'loading' | 'configured' | 'missing'
const mobileLayoutBreakpoint = '(max-width: 900px)'

const defaultBuddyDraft: BuddyDraft = {
  name: '',
  roleTitle: '',
  responsibilities: '',
  systemPrompt: '',
  modelId: '',
}

const defaultChatDraft: ChatDraft = {
  title: '',
  topic: '',
  buddyIds: [],
}

function draftFromBuddy(buddy: Buddy): BuddyDraft {
  return {
    name: buddy.name,
    roleTitle: buddy.roleTitle,
    responsibilities: buddy.responsibilities.join('\n'),
    systemPrompt: buddy.systemPrompt,
    modelId: buddy.modelId,
  }
}

function sortChats(chats: WorkspaceState['chats']) {
  return [...chats].sort(
    (left, right) =>
      new Date(right.lastMessageAt).getTime() - new Date(left.lastMessageAt).getTime(),
  )
}

function resolveEntityId<T extends { id: string }>(items: T[], preferredId: string) {
  if (preferredId && items.some((item) => item.id === preferredId)) {
    return preferredId
  }

  return items[0]?.id ?? ''
}

function routeToThreadPaneMode(routeName: string | undefined): ThreadPaneMode {
  switch (routeName) {
    case appRoutes.newBuddy.name:
      return 'new-buddy'
    case appRoutes.editBuddy.name:
      return 'edit-buddy'
    case appRoutes.buddies.name:
    case appRoutes.buddyDetail.name:
      return 'buddy-detail'
    case appRoutes.newChat.name:
      return 'new-chat'
    case appRoutes.editChat.name:
      return 'edit-chat'
    case appRoutes.info.name:
    case appRoutes.about.name:
      return 'about'
    default:
      return 'chat'
  }
}

function routeToSidebarMode(routeName: string | undefined): SidebarMode {
  if (routeName === appRoutes.info.name || routeName === appRoutes.about.name) {
    return 'info'
  }

  if (
    routeName === appRoutes.buddies.name ||
    routeName === appRoutes.buddyDetail.name ||
    routeName === appRoutes.newBuddy.name ||
    routeName === appRoutes.editBuddy.name
  ) {
    return 'buddies'
  }

  return 'chats'
}

function useIsMobileLayout() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(mobileLayoutBreakpoint).matches,
  )

  useEffect(() => {
    const mql = window.matchMedia(mobileLayoutBreakpoint)
    const handler = (event: MediaQueryListEvent) => setIsMobile(event.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return isMobile
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const isMobileLayout = useIsMobileLayout()
  const [workspace, setWorkspace] = useState<WorkspaceState>(() => loadLocalWorkspace())
  const [openRouterApiKey, setOpenRouterApiKey] = useState('')
  const [openRouterKeyState, setOpenRouterKeyState] =
    useState<OpenRouterKeyState>('missing')
  const [lastVisitedChatId, setLastVisitedChatId] = useState('')
  const [lastVisitedBuddyId, setLastVisitedBuddyId] = useState('')
  const [models, setModels] = useState<ModelOption[]>([])
  const [composer, setComposer] = useState('')
  const [buddyDraft, setBuddyDraft] = useState<BuddyDraft>(defaultBuddyDraft)
  const [chatDraft, setChatDraft] = useState<ChatDraft>(defaultChatDraft)
  const [chatRosterDraft, setChatRosterDraft] = useState<string[]>([])
  const [isManagingRoster, setIsManagingRoster] = useState(false)
  const [isSavingOpenRouterKey, setIsSavingOpenRouterKey] = useState(false)
  const [isWorking, setIsWorking] = useState(false)
  const [banner, setBanner] = useState('')

  const routeMatch = useMemo(() => matchAppRoute(location.pathname), [location.pathname])
  const routeName = routeMatch?.name
  const sidebarMode = routeToSidebarMode(routeName)
  const threadPaneMode = routeToThreadPaneMode(routeName)
  const canManageRoster =
    routeMatch?.name === appRoutes.chats.name ||
    routeMatch?.name === appRoutes.chatDetail.name ||
    routeMatch?.name === appRoutes.editChat.name

  const resolvedChatId = useMemo(() => {
    const preferredChatId =
      routeMatch?.name === appRoutes.chatDetail.name ? routeMatch.chatId : lastVisitedChatId

    return resolveEntityId(workspace.chats, preferredChatId)
  }, [lastVisitedChatId, routeMatch, workspace.chats])

  const resolvedBuddyId = useMemo(() => {
    const preferredBuddyId =
      routeMatch?.name === appRoutes.buddyDetail.name ||
      routeMatch?.name === appRoutes.editBuddy.name
        ? routeMatch.buddyId
        : lastVisitedBuddyId

    return resolveEntityId(workspace.buddies, preferredBuddyId)
  }, [lastVisitedBuddyId, routeMatch, workspace.buddies])

  const activeChat = useMemo(
    () => workspace.chats.find((chat) => chat.id === resolvedChatId) ?? null,
    [resolvedChatId, workspace.chats],
  )

  const activeBuddy = useMemo(
    () => workspace.buddies.find((buddy) => buddy.id === resolvedBuddyId) ?? null,
    [resolvedBuddyId, workspace.buddies],
  )

  const chatMessages = activeChat ? workspace.messagesByChat[activeChat.id] ?? [] : []
  const chatBuddies = useMemo(
    () =>
      activeChat
        ? activeChat.buddyIds
            .map((buddyId) => workspace.buddies.find((buddy) => buddy.id === buddyId))
            .filter((value): value is Buddy => Boolean(value))
        : [],
    [activeChat, workspace.buddies],
  )

  const buddyMap = useMemo(
    () => new Map(workspace.buddies.map((buddy) => [buddy.id, buddy])),
    [workspace.buddies],
  )

  const mentionQuery = extractMentionQuery(composer)
  const mentionSuggestions = useMemo(() => {
    if (!mentionQuery) return []

    return chatBuddies.filter((buddy) => {
      const haystack = `${buddy.name} ${buddy.roleTitle}`.toLowerCase()
      return haystack.includes(mentionQuery.toLowerCase())
    })
  }, [chatBuddies, mentionQuery])
  const hasOpenRouterKey = openRouterKeyState === 'configured'
  const defaultChatPath = activeChat
    ? appRoutes.chatDetail.to(activeChat.id)
    : appRoutes.chats.to()
  const defaultBuddyPath = activeBuddy
    ? appRoutes.buddyDetail.to(activeBuddy.id)
    : appRoutes.buddies.to()
  const desktopThreadPaneMode = sidebarMode === 'info' ? 'about' : threadPaneMode

  useEffect(() => {
    saveLocalWorkspace(workspace)
  }, [workspace])

  useEffect(() => {
    if (!banner) return

    const timeoutId = window.setTimeout(() => {
      setBanner('')
    }, 5000)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [banner])

  useEffect(() => {
    let isCancelled = false

    const loadModels = async () => {
      try {
        const catalog = await fetchOpenRouterModelCatalog()
        if (!isCancelled) {
          setModels(catalog.models)
        }
      } catch (error) {
        console.error(error)
        if (!isCancelled) {
          setBanner(
            error instanceof Error
              ? `Model list could not be loaded: ${error.message}`
              : 'Model list could not be loaded.',
          )
        }
      }
    }

    void loadModels()
    return () => {
      isCancelled = true
    }
  }, [])

  useEffect(() => {
    if (!resolvedChatId || !isChatRoute(routeMatch)) return

    setLastVisitedChatId((current) =>
      current === resolvedChatId ? current : resolvedChatId,
    )
  }, [resolvedChatId, routeMatch])

  useEffect(() => {
    if (!resolvedBuddyId || !isBuddyRoute(routeMatch)) return

    setLastVisitedBuddyId((current) =>
      current === resolvedBuddyId ? current : resolvedBuddyId,
    )
  }, [resolvedBuddyId, routeMatch])

  useEffect(() => {
    if (canManageRoster) return

    setIsManagingRoster(false)
    setChatRosterDraft([])
  }, [canManageRoster])

  useEffect(() => {
    if (!isManagingRoster || !activeChat) return
    setChatRosterDraft(activeChat.buddyIds)
  }, [activeChat, isManagingRoster])

  useEffect(() => {
    navigate(appRoutes.info.to(), { replace: true })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!routeMatch || routeMatch.name === appRoutes.home.name) {
      navigate(appRoutes.info.to(), { replace: true })
      return
    }

    if (
      routeMatch.name === appRoutes.chatDetail.name &&
      !workspace.chats.some((chat) => chat.id === routeMatch.chatId)
    ) {
      navigate(appRoutes.chats.to(), { replace: true })
      return
    }

    if (
      (routeMatch.name === appRoutes.buddyDetail.name ||
        routeMatch.name === appRoutes.editBuddy.name) &&
      !workspace.buddies.some((buddy) => buddy.id === routeMatch.buddyId)
    ) {
      navigate(appRoutes.buddies.to(), { replace: true })
    }
  }, [defaultChatPath, isMobileLayout, navigate, routeMatch, workspace.buddies, workspace.chats])

  const updateWorkspace = (updater: (current: WorkspaceState) => WorkspaceState) => {
    setWorkspace((current) => {
      const next = updater(current)
      return {
        ...next,
        chats: sortChats(next.chats),
      }
    })
  }

  const pushMessage = (chatId: string, message: Message) => {
    updateWorkspace((current) => ({
      ...current,
      messagesByChat: {
        ...current.messagesByChat,
        [chatId]: [...(current.messagesByChat[chatId] ?? []), message],
      },
    }))
  }

  const replaceMessage = (chatId: string, messageId: string, nextMessage: Message) => {
    updateWorkspace((current) => ({
      ...current,
      messagesByChat: {
        ...current.messagesByChat,
        [chatId]: (current.messagesByChat[chatId] ?? []).map((message) =>
          message.id === messageId ? nextMessage : message,
        ),
      },
    }))
  }

  const updateChatTimestamp = (chatId: string, lastMessageAt: string) => {
    updateWorkspace((current) => ({
      ...current,
      chats: current.chats.map((chat) =>
        chat.id === chatId ? { ...chat, lastMessageAt } : chat,
      ),
    }))
  }

  async function handleSaveOpenRouterApiKey(nextKey: string) {
    const normalized = normalizeOpenRouterApiKey(nextKey)
    if (!normalized) {
      setBanner('Enter an OpenRouter key before loading it into this session.')
      return
    }

    setIsSavingOpenRouterKey(true)
    setOpenRouterKeyState('loading')

    try {
      const catalog = await fetchOpenRouterModelCatalog(normalized)
      if (catalog.models.length === 0) {
        throw new Error('OpenRouter returned no models')
      }
      setOpenRouterApiKey(normalized)
      setOpenRouterKeyState('configured')
      setModels(catalog.models)
      setBanner(
        'OpenRouter key loaded for this session only. Refresh or close the window and it disappears.',
      )
    } catch (error) {
      console.error(error)
      setOpenRouterApiKey('')
      setOpenRouterKeyState('missing')
      setModels([])
      setBanner(
        error instanceof Error
          ? `OpenRouter key check failed: ${error.message}`
          : 'OpenRouter key check failed.',
      )
    } finally {
      setIsSavingOpenRouterKey(false)
    }
  }

  async function handleClearOpenRouterApiKey() {
    setOpenRouterApiKey('')
    setOpenRouterKeyState('missing')
    setBanner('OpenRouter key forgotten. Nothing is persisted after this tab closes.')
  }

  async function handleSendMessage() {
    if (!activeChat || !composer.trim()) return
    if (openRouterKeyState === 'loading') {
      setBanner('OpenRouter key is still being checked. Try again in a moment.')
      return
    }

    if (!hasOpenRouterKey || !openRouterApiKey) {
      setBanner('Load your OpenRouter key in Info before sending messages.')
      return
    }

    const turnId = crypto.randomUUID()
    const mentionBuddyIds = parseMentionBuddyIds(composer, chatBuddies)
    const responderIds = selectResponderIds(mentionBuddyIds, activeChat.buddyIds)
    const optimisticUserMessage: Message = {
      id: crypto.randomUUID(),
      chatId: activeChat.id,
      senderType: 'user',
      content: composer.trim(),
      mentionBuddyIds,
      turnId,
      status: 'complete',
      createdAt: new Date().toISOString(),
    }
    const roomBuddies = chatBuddies
    let turnMessages = [...chatMessages, optimisticUserMessage]

    setComposer('')
    pushMessage(activeChat.id, optimisticUserMessage)
    updateChatTimestamp(activeChat.id, optimisticUserMessage.createdAt)

    for (const buddyId of responderIds) {
      const buddy = buddyMap.get(buddyId)
      if (!buddy) continue

      const placeholder: Message = {
        id: crypto.randomUUID(),
        chatId: activeChat.id,
        senderType: 'buddy',
        buddyId,
        content: '',
        mentionBuddyIds: [],
        turnId,
        status: 'pending',
        createdAt: new Date().toISOString(),
      }
      pushMessage(activeChat.id, placeholder)

      try {
        const content = await generateOpenRouterBuddyReply({
          apiKey: openRouterApiKey,
          buddy,
          chat: activeChat,
          messages: turnMessages,
          buddies: roomBuddies,
          turnId,
        })
        const completedMessage: Message = {
          ...placeholder,
          content,
          status: 'complete',
          createdAt: new Date().toISOString(),
        }
        replaceMessage(activeChat.id, placeholder.id, completedMessage)
        updateChatTimestamp(activeChat.id, completedMessage.createdAt)
        turnMessages = [...turnMessages, completedMessage]
      } catch (error) {
        console.error(error)
        replaceMessage(activeChat.id, placeholder.id, {
          ...placeholder,
          status: 'error',
          errorCode: 'provider_error',
          content: 'Buddy could not respond. Retry this reply once OpenRouter is healthy.',
        })
        setBanner(
          error instanceof Error
            ? `OpenRouter request failed: ${error.message}`
            : 'OpenRouter request failed.',
        )
      }
    }
  }

  async function retryBuddyReply(message: Message) {
    if (!message.buddyId || !activeChat) return
    if (openRouterKeyState === 'loading') {
      setBanner('OpenRouter key is still being checked. Try again in a moment.')
      return
    }

    if (!hasOpenRouterKey || !openRouterApiKey) {
      setBanner('Load your OpenRouter key in Info before retrying buddy replies.')
      return
    }

    const buddy = buddyMap.get(message.buddyId)
    if (!buddy) {
      setBanner('That buddy no longer exists in the local roster.')
      return
    }

    replaceMessage(activeChat.id, message.id, {
      ...message,
      status: 'pending',
      content: '',
      errorCode: undefined,
    })

    try {
      const content = await generateOpenRouterBuddyReply({
        apiKey: openRouterApiKey,
        buddy,
        chat: activeChat,
        messages: chatMessages.filter((item) => item.id !== message.id),
        buddies: chatBuddies,
        turnId: message.turnId,
      })
      replaceMessage(activeChat.id, message.id, {
        ...message,
        status: 'complete',
        errorCode: undefined,
        content,
        createdAt: new Date().toISOString(),
      })
      updateChatTimestamp(activeChat.id, new Date().toISOString())
    } catch (error) {
      console.error(error)
      replaceMessage(activeChat.id, message.id, {
        ...message,
        status: 'error',
        errorCode: 'provider_error',
        content: 'Buddy could not respond. Retry this reply once OpenRouter is healthy.',
      })
      setBanner(
        error instanceof Error
          ? `OpenRouter request failed: ${error.message}`
          : 'OpenRouter request failed.',
      )
    }
  }

  async function handleCreateBuddy() {
    const normalizedName = buddyDraft.name.replace(/\s+/g, '')
    if (!normalizedName) return

    setIsWorking(true)
    try {
      const created: Buddy = {
        id: crypto.randomUUID(),
        name: normalizedName,
        roleTitle: buddyDraft.roleTitle,
        responsibilities: buddyDraft.responsibilities
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
        systemPrompt: buddyDraft.systemPrompt,
        modelId: buddyDraft.modelId,
      }

      updateWorkspace((current) => ({
        ...current,
        buddies: [...current.buddies, created],
      }))
      setBuddyDraft(defaultBuddyDraft)
      navigate(appRoutes.buddyDetail.to(created.id))
    } finally {
      setIsWorking(false)
    }
  }

  async function handleUpdateBuddy() {
    if (!activeBuddy) return
    setIsWorking(true)

    try {
      const updated: Buddy = {
        ...activeBuddy,
        name: buddyDraft.name,
        roleTitle: buddyDraft.roleTitle,
        responsibilities: buddyDraft.responsibilities
          .split('\n')
          .map((item) => item.trim())
          .filter(Boolean),
        systemPrompt: buddyDraft.systemPrompt,
        modelId: buddyDraft.modelId,
      }

      updateWorkspace((current) => ({
        ...current,
        buddies: current.buddies.map((buddy) =>
          buddy.id === updated.id ? updated : buddy,
        ),
      }))
      navigate(appRoutes.buddyDetail.to(updated.id))
    } finally {
      setIsWorking(false)
    }
  }

  async function handleDeleteBuddy() {
    if (!activeBuddy) return
    setIsWorking(true)

    const buddyId = activeBuddy.id
    const nextBuddyId = workspace.buddies.find((buddy) => buddy.id !== buddyId)?.id ?? ''

    try {
      updateWorkspace((current) => {
        const messagesByChat = Object.fromEntries(
          Object.entries(current.messagesByChat).map(([chatId, messages]) => [
            chatId,
            messages.map((message) => ({
              ...message,
              buddyId: message.buddyId === buddyId ? undefined : message.buddyId,
              mentionBuddyIds: message.mentionBuddyIds.filter((id) => id !== buddyId),
            })),
          ]),
        )

        return {
          ...current,
          buddies: current.buddies.filter((buddy) => buddy.id !== buddyId),
          chats: current.chats.map((chat) => ({
            ...chat,
            buddyIds: chat.buddyIds.filter((id) => id !== buddyId),
          })),
          messagesByChat,
        }
      })

      navigate(nextBuddyId ? appRoutes.buddyDetail.to(nextBuddyId) : appRoutes.buddies.to())
    } finally {
      setIsWorking(false)
    }
  }

  async function handleCreateChat() {
    if (!chatDraft.title.trim() || !chatDraft.topic.trim() || chatDraft.buddyIds.length === 0) {
      navigate(appRoutes.newChat.to())
      return
    }

    setIsWorking(true)
    try {
      const created: Chat = {
        id: crypto.randomUUID(),
        title: chatDraft.title,
        topic: chatDraft.topic,
        buddyIds: chatDraft.buddyIds,
        lastMessageAt: new Date().toISOString(),
      }

      updateWorkspace((current) => ({
        ...current,
        chats: [created, ...current.chats],
        messagesByChat: {
          ...current.messagesByChat,
          [created.id]: [],
        },
      }))
      setChatDraft(defaultChatDraft)
      navigate(appRoutes.chatDetail.to(created.id))
    } finally {
      setIsWorking(false)
    }
  }

  async function handleUpdateChat() {
    if (!activeChat || !chatDraft.title.trim() || !chatDraft.topic.trim() || chatDraft.buddyIds.length === 0) {
      return
    }

    setIsWorking(true)
    try {
      const orderedBuddyIds = mergeBuddyIdsPreservingOrder(
        activeChat.buddyIds,
        chatDraft.buddyIds,
        workspace.buddies.map((buddy) => buddy.id),
      )

      const updated: Chat = {
        ...activeChat,
        title: chatDraft.title,
        topic: chatDraft.topic,
        buddyIds: orderedBuddyIds,
      }

      updateWorkspace((current) => ({
        ...current,
        chats: current.chats.map((chat) => (chat.id === updated.id ? updated : chat)),
      }))
      setChatDraft(defaultChatDraft)
      navigate(appRoutes.chatDetail.to(updated.id))
    } finally {
      setIsWorking(false)
    }
  }

  async function handleSaveChatRoster() {
    if (!activeChat) return

    const orderedBuddyIds = mergeBuddyIdsPreservingOrder(
      activeChat.buddyIds,
      chatRosterDraft,
      workspace.buddies.map((buddy) => buddy.id),
    )
    const additions = orderedBuddyIds.filter(
      (buddyId) => !activeChat.buddyIds.includes(buddyId),
    )

    if (additions.length === 0) {
      closeRosterManager()
      return
    }

    setIsWorking(true)

    try {
      updateWorkspace((current) => ({
        ...current,
        chats: current.chats.map((chat) =>
          chat.id === activeChat.id ? { ...chat, buddyIds: orderedBuddyIds } : chat,
        ),
      }))
      setChatRosterDraft(orderedBuddyIds)
      setIsManagingRoster(false)
      setBanner(
        `Added ${additions.length} ${additions.length === 1 ? 'buddy' : 'buddies'} to this room.`,
      )
    } finally {
      setIsWorking(false)
    }
  }

  function handleDeleteChat() {
    if (!activeChat) return
    const confirmed = window.confirm(
      `Delete "${activeChat.title}"? This removes the room and all its messages.`,
    )
    if (!confirmed) return

    const chatId = activeChat.id
    const nextChatId = workspace.chats.find((chat) => chat.id !== chatId)?.id ?? ''

    updateWorkspace((current) => {
      const { [chatId]: _, ...remainingMessages } = current.messagesByChat
      return {
        ...current,
        chats: current.chats.filter((chat) => chat.id !== chatId),
        messagesByChat: remainingMessages,
      }
    })

    navigate(nextChatId ? appRoutes.chatDetail.to(nextChatId) : appRoutes.chats.to())
  }

  function handleResetWorkspace() {
    const confirmed = window.confirm(
      'Reset the local workspace back to the starter data? This only clears what is stored in this browser.',
    )
    if (!confirmed) return

    clearLocalWorkspace()
    const nextWorkspace = createLocalWorkspace()
    setWorkspace(nextWorkspace)
    setLastVisitedChatId(nextWorkspace.chats[0]?.id ?? '')
    setLastVisitedBuddyId(nextWorkspace.buddies[0]?.id ?? '')
    setBanner('Local workspace reset in this browser.')
    navigate(
      nextWorkspace.chats[0]
        ? appRoutes.chatDetail.to(nextWorkspace.chats[0].id)
        : appRoutes.chats.to(),
    )
  }

  function openBuddyComposer() {
    closeRosterManager()
    setBuddyDraft({
      ...defaultBuddyDraft,
      modelId: models[0]?.id ?? '',
    })
    navigate(appRoutes.newBuddy.to())
  }

  function openBuddyEditor() {
    if (!activeBuddy) return
    closeRosterManager()
    setBuddyDraft(draftFromBuddy(activeBuddy))
    navigate(appRoutes.editBuddy.to(activeBuddy.id))
  }

  function openBuddyDetail(buddyId: string) {
    closeRosterManager()
    navigate(appRoutes.buddyDetail.to(buddyId))
  }

  function openChat(chatId: string) {
    closeRosterManager()
    navigate(appRoutes.chatDetail.to(chatId))
  }

  function openChatComposer() {
    closeRosterManager()
    setChatDraft({
      ...defaultChatDraft,
      buddyIds: workspace.buddies.slice(0, 2).map((buddy) => buddy.id),
    })
    navigate(appRoutes.newChat.to())
  }

  function openChatEditor() {
    if (!activeChat) return
    closeRosterManager()
    setChatDraft({
      title: activeChat.title,
      topic: activeChat.topic,
      buddyIds: activeChat.buddyIds,
    })
    navigate(appRoutes.editChat.to(activeChat.id))
  }

  function changeSidebarMode(mode: SidebarMode) {
    closeRosterManager()

    if (mode === 'info') {
      navigate(appRoutes.info.to())
      return
    }

    if (mode === 'buddies') {
      navigate(defaultBuddyPath)
      return
    }

    navigate(defaultChatPath)
  }

  function closeComposer() {
    if (isBuddyRoute(routeMatch)) {
      navigate(defaultBuddyPath)
      return
    }

    navigate(defaultChatPath)
  }

  function openRosterManager() {
    if (!activeChat) return
    setChatRosterDraft(activeChat.buddyIds)
    setIsManagingRoster(true)
  }

  function closeRosterManager() {
    setIsManagingRoster(false)
    setChatRosterDraft([])
  }

  function toggleChatRosterBuddy(buddyId: string) {
    if (!activeChat || activeChat.buddyIds.includes(buddyId)) return

    setChatRosterDraft((current) =>
      current.includes(buddyId)
        ? current.filter((id) => id !== buddyId)
        : [...current, buddyId],
    )
  }

  function changeMobileTab(mode: SidebarMode) {
    closeRosterManager()

    if (mode === 'info') {
      navigate(appRoutes.info.to())
      return
    }

    if (mode === 'buddies') {
      navigate(appRoutes.buddies.to())
      return
    }

    navigate(appRoutes.chats.to())
  }

  function navigateMobileBack() {
    closeRosterManager()

    switch (routeName) {
      case appRoutes.buddyDetail.name:
      case appRoutes.newBuddy.name:
        navigate(appRoutes.buddies.to())
        return
      case appRoutes.editBuddy.name:
        navigate(activeBuddy ? appRoutes.buddyDetail.to(activeBuddy.id) : appRoutes.buddies.to())
        return
      case appRoutes.chatDetail.name:
      case appRoutes.newChat.name:
        navigate(appRoutes.chats.to())
        return
      case appRoutes.editChat.name:
        navigate(activeChat ? appRoutes.chatDetail.to(activeChat.id) : appRoutes.chats.to())
        return
      case appRoutes.about.name:
        navigate(appRoutes.info.to())
        return
      default:
        changeMobileTab(sidebarMode)
    }
  }

  function openAboutView() {
    closeRosterManager()
    navigate(appRoutes.about.to())
  }

  return (
    <>
      {banner ? <div className="app-banner">{banner}</div> : null}
      {isMobileLayout ? (
        <MobileShell
          routeName={routeName}
          tab={sidebarMode}
          threadPaneMode={threadPaneMode}
          workspace={workspace}
          activeChat={activeChat}
          activeBuddy={activeBuddy}
          allBuddies={workspace.buddies}
          chatBuddies={chatBuddies}
          chatMessages={chatMessages}
          buddyDraft={buddyDraft}
          chatDraft={chatDraft}
          chatRosterDraft={chatRosterDraft}
          isManagingRoster={isManagingRoster}
          models={models}
          isWorking={isWorking}
          composer={composer}
          openRouterKeyStatus={openRouterKeyState}
          mentionSuggestions={mentionSuggestions}
          isSavingOpenRouterKey={isSavingOpenRouterKey}
          onChangeTab={changeMobileTab}
          onBack={navigateMobileBack}
          onOpenAbout={openAboutView}
          onChangeBuddyDraft={setBuddyDraft}
          onChangeChatDraft={setChatDraft}
          onChangeComposer={setComposer}
          onCreateBuddy={() => void handleCreateBuddy()}
          onDeleteBuddy={() => void handleDeleteBuddy()}
          onOpenBuddyEditor={openBuddyEditor}
          onCreateChat={() => void handleCreateChat()}
          onCloseRosterManager={closeRosterManager}
          onOpenRosterManager={openRosterManager}
          onSaveBuddy={() => void handleUpdateBuddy()}
          onSaveChatRoster={() => void handleSaveChatRoster()}
          onCancelComposer={navigateMobileBack}
          onSend={() => void handleSendMessage()}
          onRetry={(message) => void retryBuddyReply(message)}
          onOpenChat={openChatComposer}
          onDeleteChat={handleDeleteChat}
          onOpenChatEditor={openChatEditor}
          onSaveChat={() => void handleUpdateChat()}
          onOpenBuddy={openBuddyComposer}
          onSelectChat={openChat}
          onSelectBuddy={openBuddyDetail}
          onClearOpenRouterApiKey={handleClearOpenRouterApiKey}
          onSaveOpenRouterApiKey={handleSaveOpenRouterApiKey}
          onResetWorkspace={handleResetWorkspace}
          onToggleChatRosterBuddy={toggleChatRosterBuddy}
        />
      ) : (
        <main className="app-shell">
          <Sidebar
            mode={sidebarMode}
            workspace={workspace}
            activeChatId={activeChat?.id ?? ''}
            activeBuddyId={activeBuddy?.id ?? ''}
            openRouterKeyStatus={openRouterKeyState}
            isSavingOpenRouterKey={isSavingOpenRouterKey}
            onChangeMode={changeSidebarMode}
            onClearOpenRouterApiKey={handleClearOpenRouterApiKey}
            onSaveOpenRouterApiKey={handleSaveOpenRouterApiKey}
            onResetWorkspace={handleResetWorkspace}
            onSelectBuddy={openBuddyDetail}
            onSelectChat={openChat}
            onOpenChat={openChatComposer}
            onOpenBuddy={openBuddyComposer}
          />
          <ThreadPane
            mode={desktopThreadPaneMode}
            workspace={workspace}
            activeChat={activeChat}
            activeBuddy={activeBuddy}
            allBuddies={workspace.buddies}
            chatBuddies={chatBuddies}
            chatMessages={chatMessages}
            buddyDraft={buddyDraft}
            chatDraft={chatDraft}
            chatRosterDraft={chatRosterDraft}
            isManagingRoster={isManagingRoster}
            models={models}
            isWorking={isWorking}
            composer={composer}
            openRouterKeyStatus={openRouterKeyState}
            mentionSuggestions={mentionSuggestions}
            onChangeBuddyDraft={setBuddyDraft}
            onChangeChatDraft={setChatDraft}
            onChangeComposer={setComposer}
            onCreateBuddy={() => void handleCreateBuddy()}
            onDeleteBuddy={() => void handleDeleteBuddy()}
            onOpenBuddyEditor={openBuddyEditor}
            onCreateChat={() => void handleCreateChat()}
            onCloseRosterManager={closeRosterManager}
            onOpenRosterManager={openRosterManager}
            onSaveBuddy={() => void handleUpdateBuddy()}
            onSaveChatRoster={() => void handleSaveChatRoster()}
            onCancelComposer={closeComposer}
            onSend={() => void handleSendMessage()}
            onRetry={(message) => void retryBuddyReply(message)}
            onOpenChat={openChatComposer}
            onDeleteChat={handleDeleteChat}
            onOpenChatEditor={openChatEditor}
            onSelectChat={openChat}
            onToggleChatRosterBuddy={toggleChatRosterBuddy}
            onSaveChat={() => void handleUpdateChat()}
          />
        </main>
      )}
    </>
  )
}

export default App
