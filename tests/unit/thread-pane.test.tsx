import { useState } from 'react'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { ThreadPane } from '../../src/components/ThreadPane'
import {
  starterBuddies,
  starterChats,
  starterMessagesByChat,
  createStarterWorkspace,
} from '../../src/lib/starter-data'
import { extractMentionQuery, mergeBuddyIdsPreservingOrder } from '../../src/lib/conversation'
import type { Buddy, BuddyDraft, Chat, Message, WorkspaceState } from '../../src/types'

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute('open', '')
  }

  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute('open')
  }

  Element.prototype.scrollIntoView = function scrollIntoView() {
    return undefined
  }
})

function ThreadPaneHarness(props?: {
  openRouterKeyStatus?: 'loading' | 'configured' | 'missing'
}) {
  const [activeChat, setActiveChat] = useState<Chat>({
    ...starterChats[1],
    buddyIds: [...starterChats[1].buddyIds],
  })
  const [chatRosterDraft, setChatRosterDraft] = useState<string[]>(activeChat.buddyIds)
  const [isManagingRoster, setIsManagingRoster] = useState(false)
  const workspace = createStarterWorkspace()

  const openRosterManager = () => {
    setChatRosterDraft(activeChat.buddyIds)
    setIsManagingRoster(true)
  }

  const closeRosterManager = () => {
    setChatRosterDraft(activeChat.buddyIds)
    setIsManagingRoster(false)
  }

  const toggleChatRosterBuddy = (buddyId: string) => {
    if (activeChat.buddyIds.includes(buddyId)) return

    setChatRosterDraft((current) =>
      current.includes(buddyId)
        ? current.filter((id) => id !== buddyId)
        : [...current, buddyId],
    )
  }

  const saveChatRoster = () => {
    const nextBuddyIds = mergeBuddyIdsPreservingOrder(
      activeChat.buddyIds,
      chatRosterDraft,
      starterBuddies.map((buddy) => buddy.id),
    )

    setActiveChat((current) => ({ ...current, buddyIds: nextBuddyIds }))
    setChatRosterDraft(nextBuddyIds)
    setIsManagingRoster(false)
  }

  return (
    <MemoryRouter>
      <ThreadPane
        mode="chat"
        workspace={workspace}
        activeChat={activeChat}
        activeBuddy={null}
        allBuddies={starterBuddies}
        chatBuddies={starterBuddies.filter((buddy) => activeChat.buddyIds.includes(buddy.id))}
        chatMessages={starterMessagesByChat[activeChat.id] ?? []}
        buddyDraft={{
          name: '',
          roleTitle: '',
          responsibilities: '',
          systemPrompt: '',
          modelId: '',
        }}
        chatDraft={{ title: '', topic: '', buddyIds: [] }}
        chatRosterDraft={chatRosterDraft}
        isManagingRoster={isManagingRoster}
        models={[]}
        isWorking={false}
        composer=""
        openRouterKeyStatus={props?.openRouterKeyStatus ?? 'configured'}
        mentionSuggestions={[]}
        onChangeBuddyDraft={() => undefined}
        onChangeChatDraft={() => undefined}
        onChangeComposer={() => undefined}
        onCreateBuddy={() => undefined}
        onDeleteBuddy={() => undefined}
        onOpenBuddyEditor={() => undefined}
        onCreateChat={() => undefined}
        onCloseRosterManager={closeRosterManager}
        onOpenRosterManager={openRosterManager}
        onSaveBuddy={() => undefined}
        onSaveChatRoster={saveChatRoster}
        onCancelComposer={() => undefined}
        onSend={() => undefined}
        onRetry={(_: Message) => undefined}
        onOpenChat={() => undefined}
        onOpenChatEditor={() => undefined}
        onSelectChat={() => undefined}
        onToggleChatRosterBuddy={toggleChatRosterBuddy}
      />
    </MemoryRouter>
  )
}

function BuddyEditorHarness(props: {
  mode: 'create' | 'edit'
  initialDraft?: Partial<BuddyDraft>
}) {
  const [buddyDraft, setBuddyDraft] = useState<BuddyDraft>({
    name: props.initialDraft?.name ?? '',
    roleTitle: props.initialDraft?.roleTitle ?? 'Chief Technology Officer',
    responsibilities: props.initialDraft?.responsibilities ?? '',
    systemPrompt: props.initialDraft?.systemPrompt ?? '',
    modelId: props.initialDraft?.modelId ?? 'model-1',
  })

  return (
    <MemoryRouter>
      <ThreadPane
        mode={props.mode === 'create' ? 'new-buddy' : 'edit-buddy'}
        workspace={createStarterWorkspace()}
        activeChat={null}
        activeBuddy={props.mode === 'edit' ? starterBuddies[0] : null}
        allBuddies={starterBuddies}
        chatBuddies={[]}
        chatMessages={[]}
        buddyDraft={buddyDraft}
        chatDraft={{ title: '', topic: '', buddyIds: [] }}
        chatRosterDraft={[]}
        isManagingRoster={false}
        models={[
          {
            id: 'model-1',
            name: 'Model One',
            provider: 'OpenRouter',
            contextLength: 8192,
          },
        ]}
        isWorking={false}
        composer=""
        openRouterKeyStatus="configured"
        mentionSuggestions={[]}
        onChangeBuddyDraft={setBuddyDraft}
        onChangeChatDraft={() => undefined}
        onChangeComposer={() => undefined}
        onCreateBuddy={() => undefined}
        onDeleteBuddy={() => undefined}
        onOpenBuddyEditor={() => undefined}
        onCreateChat={() => undefined}
        onCloseRosterManager={() => undefined}
        onOpenRosterManager={() => undefined}
        onSaveBuddy={() => undefined}
        onSaveChatRoster={() => undefined}
        onCancelComposer={() => undefined}
        onSend={() => undefined}
        onRetry={(_: Message) => undefined}
        onOpenChat={() => undefined}
        onOpenChatEditor={() => undefined}
        onSelectChat={() => undefined}
        onToggleChatRosterBuddy={() => undefined}
      />
    </MemoryRouter>
  )
}

function ComposerHarness(props: { onSend: () => void }) {
  const [composer, setComposer] = useState('@ja')
  const workspace: WorkspaceState = {
    ...createStarterWorkspace(),
    buddies: [
      {
        id: 'buddy-jarvis',
        name: 'Jarvis',
        roleTitle: 'Chief Operator',
        responsibilities: ['draft replies', 'route requests'],
        systemPrompt: 'Reply with concise operational guidance.',
        modelId: 'model-1',
      },
      {
        id: 'buddy-jade',
        name: 'Jade',
        roleTitle: 'Product Lead',
        responsibilities: ['shape product flow', 'reduce friction'],
        systemPrompt: 'Keep responses grounded in user behavior.',
        modelId: 'model-2',
      },
      ...starterBuddies,
    ],
    chats: [
      {
        id: 'chat-composer',
        title: 'Composer mention test',
        topic: 'Exercise mention autocomplete in the thread composer.',
        buddyIds: ['buddy-jarvis', 'buddy-jade'],
        lastMessageAt: new Date().toISOString(),
      },
    ],
    messagesByChat: {
      'chat-composer': [],
    },
  }

  const activeChat = workspace.chats[0]
  const chatBuddies = workspace.buddies.filter((buddy) => activeChat.buddyIds.includes(buddy.id))
  const mentionQuery = extractMentionQuery(composer)
  const mentionSuggestions = mentionQuery
    ? chatBuddies.filter((buddy) =>
        `${buddy.name} ${buddy.roleTitle}`.toLowerCase().includes(mentionQuery.toLowerCase()),
      )
    : []

  return (
    <MemoryRouter>
      <ThreadPane
        mode="chat"
        workspace={workspace}
        activeChat={activeChat}
        activeBuddy={null}
        allBuddies={workspace.buddies}
        chatBuddies={chatBuddies}
        chatMessages={[]}
        buddyDraft={{
          name: '',
          roleTitle: '',
          responsibilities: '',
          systemPrompt: '',
          modelId: '',
        }}
        chatDraft={{ title: '', topic: '', buddyIds: [] }}
        chatRosterDraft={[]}
        isManagingRoster={false}
        models={[]}
        isWorking={false}
        composer={composer}
        openRouterKeyStatus="configured"
        mentionSuggestions={mentionSuggestions}
        onChangeBuddyDraft={() => undefined}
        onChangeChatDraft={() => undefined}
        onChangeComposer={setComposer}
        onCreateBuddy={() => undefined}
        onDeleteBuddy={() => undefined}
        onOpenBuddyEditor={() => undefined}
        onCreateChat={() => undefined}
        onCloseRosterManager={() => undefined}
        onOpenRosterManager={() => undefined}
        onSaveBuddy={() => undefined}
        onSaveChatRoster={() => undefined}
        onCancelComposer={() => undefined}
        onSend={props.onSend}
        onRetry={(_: Message) => undefined}
        onOpenChat={() => undefined}
        onOpenChatEditor={() => undefined}
        onSelectChat={() => undefined}
        onToggleChatRosterBuddy={() => undefined}
      />
    </MemoryRouter>
  )
}

describe('ThreadPane roster manager', () => {
  it('locks existing room buddies and allows adding a new buddy', async () => {
    const user = userEvent.setup()
    render(<ThreadPaneHarness />)

    expect(screen.getByText('2 buddies')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Add buddies' }))

    const dialog = screen.getByRole('dialog', { hidden: true })
    const ariCheckbox = within(dialog).getByRole('checkbox', { name: /Ari/i })
    const minaCheckbox = within(dialog).getByRole('checkbox', { name: /Mina/i })
    const nikoCheckbox = within(dialog).getByRole('checkbox', { name: /Niko/i })
    const saveButton = within(dialog).getByRole('button', { name: 'Add selected buddies' })

    expect(ariCheckbox).not.toBeChecked()
    expect(ariCheckbox).toBeEnabled()
    expect(minaCheckbox).toBeChecked()
    expect(minaCheckbox).toBeDisabled()
    expect(nikoCheckbox).toBeChecked()
    expect(nikoCheckbox).toBeDisabled()
    expect(saveButton).toBeDisabled()

    await user.click(ariCheckbox)
    expect(saveButton).toBeEnabled()

    await user.click(saveButton)

    expect(screen.getByText('3 buddies')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Add buddies' }))
    const reopenedDialog = screen.getByRole('dialog', { hidden: true })
    const lockedAriCheckbox = within(reopenedDialog).getByRole('checkbox', { name: /Ari/i })

    expect(lockedAriCheckbox).toBeChecked()
    expect(lockedAriCheckbox).toBeDisabled()
  })

  it('discards unsaved additions when the dialog is cancelled', async () => {
    const user = userEvent.setup()
    render(<ThreadPaneHarness />)

    await user.click(screen.getByRole('button', { name: 'Add buddies' }))

    const dialog = screen.getByRole('dialog', { hidden: true })
    const ariCheckbox = within(dialog).getByRole('checkbox', { name: /Ari/i })

    await user.click(ariCheckbox)
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    await user.click(screen.getByRole('button', { name: 'Add buddies' }))
    const reopenedDialog = screen.getByRole('dialog', { hidden: true })
    const resetAriCheckbox = within(reopenedDialog).getByRole('checkbox', { name: /Ari/i })

    expect(resetAriCheckbox).not.toBeChecked()
    expect(resetAriCheckbox).toBeEnabled()
  })

  it('disables the composer and shows the Info link when no key is loaded', () => {
    render(<ThreadPaneHarness openRouterKeyStatus="missing" />)

    expect(
      screen.getByText(/Chat is disabled until you set an OpenRouter API key in/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Info' })).toHaveAttribute('href', '/info')
    expect(
      screen.getByPlaceholderText('Set your OpenRouter key in Info to enable the room.'),
    ).toBeDisabled()
  })

  it('autocomplete a partial mention with Tab and keeps Enter-to-send behavior intact', async () => {
    const user = userEvent.setup()
    const onSend = vi.fn()
    render(<ComposerHarness onSend={onSend} />)

    const composer = screen.getByRole('textbox')

    expect(composer).toHaveValue('@ja')

    await user.click(composer)
    await user.keyboard('{Tab}')

    expect(composer).toHaveValue('@Jarvis ')
    expect(onSend).not.toHaveBeenCalled()

    await user.keyboard('hello{Enter}')

    expect(composer).toHaveValue('@Jarvis hello')
    expect(onSend).toHaveBeenCalledTimes(1)
  })
})

describe('BuddyEditorPane create flow', () => {
  it('strips spaces from a new buddy name while creating', async () => {
    const user = userEvent.setup()
    render(<BuddyEditorHarness mode="create" />)

    const nameInput = screen.getByPlaceholderText('e.g. Jarvis. No spaces allowed')
    const createButton = screen.getByRole('button', { name: 'Create buddy' })

    expect(createButton).toBeDisabled()

    await user.type(nameInput, 'Ari Smith')

    expect(nameInput).toHaveValue('AriSmith')
    expect(createButton).toBeEnabled()
  })

  it('keeps spaces available when editing an existing buddy', async () => {
    const user = userEvent.setup()
    render(<BuddyEditorHarness mode="edit" initialDraft={{ name: 'Ari' }} />)

    const nameInput = screen.getByPlaceholderText('e.g. Jarvis. No spaces allowed')

    await user.type(nameInput, ' Smith')

    expect(nameInput).toHaveValue('Ari Smith')
  })
})
