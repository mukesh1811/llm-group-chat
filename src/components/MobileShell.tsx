import { AnimatePresence, motion } from 'framer-motion'
import { appRoutes } from '../lib/routes'
import type {
  Buddy,
  BuddyDraft,
  Chat,
  ChatDraft,
  Message,
  ModelOption,
  WorkspaceState,
} from '../types'
import {
  BuddyPane,
  ChatPane,
  InfoIcon,
  InfoPane,
  PlusIcon,
  type SidebarMode,
} from './Sidebar'
import { ThreadPane, type ThreadPaneMode } from './ThreadPane'

export function MobileShell(props: {
  routeName?: string
  tab: SidebarMode
  threadPaneMode: ThreadPaneMode
  workspace: WorkspaceState
  activeChat: Chat | null
  activeBuddy: Buddy | null
  allBuddies: Buddy[]
  chatBuddies: Buddy[]
  chatMessages: Message[]
  buddyDraft: BuddyDraft
  chatDraft: ChatDraft
  chatRosterDraft: string[]
  isManagingRoster: boolean
  models: ModelOption[]
  isWorking: boolean
  composer: string
  openRouterKeyStatus: 'loading' | 'configured' | 'missing'
  mentionSuggestions: Buddy[]
  onChangeTab: (mode: SidebarMode) => void
  onBack: () => void
  onOpenAbout: () => void
  onChangeBuddyDraft: (draft: BuddyDraft) => void
  onChangeChatDraft: (draft: ChatDraft) => void
  onChangeComposer: (value: string) => void
  onCreateBuddy: () => void
  onDeleteBuddy: () => void
  onOpenBuddyEditor: () => void
  onDeleteChat: () => void
  onCreateChat: () => void
  onCloseRosterManager: () => void
  onOpenRosterManager: () => void
  onSaveBuddy: () => void
  onSaveChatRoster: () => void
  onCancelComposer: () => void
  onSend: () => void
  onRetry: (message: Message) => void
  onOpenChat: () => void
  onOpenBuddy: () => void
  onSelectChat: (chatId: string) => void
  onSelectBuddy: (buddyId: string) => void
  onOpenChatEditor: () => void
  onSaveChat: () => void
  onClearOpenRouterApiKey: () => Promise<void>
  onSaveOpenRouterApiKey: (value: string) => Promise<void>
  onResetWorkspace: () => void
  onToggleChatRosterBuddy: (buddyId: string) => void
  isSavingOpenRouterKey: boolean
}) {
  const isBuddyListRoute = props.routeName === appRoutes.buddies.name
  const isChatListRoute = props.routeName === appRoutes.chats.name
  const isInfoRoute = props.routeName === appRoutes.info.name
  const showsListOrProfile = isBuddyListRoute || isChatListRoute || isInfoRoute
  const action =
    props.routeName === appRoutes.buddies.name
      ? {
        label: 'Create buddy',
        icon: <PlusIcon />,
        onClick: props.onOpenBuddy,
      }
      : props.routeName === appRoutes.chats.name
        ? {
          label: 'Create room',
          icon: <PlusIcon />,
          onClick: props.onOpenChat,
        }
        : props.routeName === appRoutes.info.name
          ? {
            label: 'About',
            icon: <InfoIcon />,
            onClick: props.onOpenAbout,
          }
          : null
  const showsHeaderBackButton = !showsListOrProfile
  const navigation = !showsHeaderBackButton ? null : (
    <button className="ghost-button compact-nav-button" type="button" onClick={props.onBack}>
      <BackIcon />
      <span>Back</span>
    </button>
  )

  return (
    <main className="mobile-shell">
      {showsListOrProfile ? (
        <header className="mobile-topbar">
          <nav className="mobile-tablist" aria-label="Mobile navigation">
            <MobileTab
              active={props.tab === 'buddies'}
              label="Buddy"
              onClick={() => props.onChangeTab('buddies')}
            />
            <MobileTab
              active={props.tab === 'chats'}
              label="Rooms"
              onClick={() => props.onChangeTab('chats')}
            />
            <MobileTab
              active={props.tab === 'info'}
              label="Info"
              onClick={() => props.onChangeTab('info')}
            />
          </nav>
        </header>
      ) : null}

      <AnimatePresence initial={false} mode="wait">
        <motion.section
          key={`${props.tab}-${props.routeName ?? 'root'}`}
          className={`mobile-content ${action ? 'has-mobile-fab' : ''}`.trim()}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -18 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          {isBuddyListRoute ? (
            <BuddyPane
              buddies={props.workspace.buddies}
              activeBuddyId=""
              title="Buddies"
              copy="Pick a buddy to inspect the role, configuration, and assigned rooms or create a new buddy."
              showTitle={false}
              showCreateButton={false}
              onOpenBuddy={props.onOpenBuddy}
              onSelectBuddy={props.onSelectBuddy}
            />
          ) : null}

          {isChatListRoute ? (
            <ChatPane
              chats={props.workspace.chats}
              activeChatId=""
              title="Rooms"
              copy="Open a room, continue the thread, or start a fresh conversation."
              showTitle={false}
              showCreateButton={false}
              onOpenChat={props.onOpenChat}
              onSelectChat={props.onSelectChat}
            />
          ) : null}

          {isInfoRoute ? (
            <InfoPane
              isSavingOpenRouterKey={props.isSavingOpenRouterKey}
              openRouterKeyStatus={props.openRouterKeyStatus}
              showTitle={false}
              workspace={props.workspace}
              onClearOpenRouterApiKey={props.onClearOpenRouterApiKey}
              onSaveOpenRouterApiKey={props.onSaveOpenRouterApiKey}
              onResetWorkspace={props.onResetWorkspace}
            />
          ) : null}

          {!showsListOrProfile ? (
            <ThreadPane
              mode={props.threadPaneMode}
              workspace={props.workspace}
              activeChat={props.activeChat}
              activeBuddy={props.activeBuddy}
              allBuddies={props.allBuddies}
              chatBuddies={props.chatBuddies}
              chatMessages={props.chatMessages}
              buddyDraft={props.buddyDraft}
              chatDraft={props.chatDraft}
              chatRosterDraft={props.chatRosterDraft}
              isManagingRoster={props.isManagingRoster}
              models={props.models}
              isWorking={props.isWorking}
              composer={props.composer}
              openRouterKeyStatus={props.openRouterKeyStatus}
              mentionSuggestions={props.mentionSuggestions}
              navigation={navigation}
              onChangeBuddyDraft={props.onChangeBuddyDraft}
              onChangeChatDraft={props.onChangeChatDraft}
              onChangeComposer={props.onChangeComposer}
              onCreateBuddy={props.onCreateBuddy}
              onDeleteBuddy={props.onDeleteBuddy}
              onOpenBuddyEditor={props.onOpenBuddyEditor}
              onDeleteChat={props.onDeleteChat}
              onCreateChat={props.onCreateChat}
              onCloseRosterManager={props.onCloseRosterManager}
              onOpenRosterManager={props.onOpenRosterManager}
              onSaveBuddy={props.onSaveBuddy}
              onSaveChatRoster={props.onSaveChatRoster}
              onCancelComposer={props.onCancelComposer}
              onSend={props.onSend}
              onRetry={props.onRetry}
              onOpenChat={props.onOpenChat}
              onSelectChat={props.onSelectChat}
              onToggleChatRosterBuddy={props.onToggleChatRosterBuddy}
              onOpenChatEditor={props.onOpenChatEditor}
              onSaveChat={props.onSaveChat}
            />
          ) : null}
        </motion.section>
      </AnimatePresence>

      {action ? (
        <div className="mobile-action-bar">
          <button
            className="mobile-fab"
            type="button"
            aria-label={action.label}
            title={action.label}
            onClick={action.onClick}
          >
            {action.icon}
            <span>{action.label}</span>
          </button>
        </div>
      ) : null}
    </main>
  )
}

function MobileTab(props: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      className={`mobile-tab ${props.active ? 'active' : ''}`}
      type="button"
      aria-pressed={props.active}
      onClick={props.onClick}
    >
      {props.label}
    </button>
  )
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15 18 9 12l6-6" />
    </svg>
  )
}
