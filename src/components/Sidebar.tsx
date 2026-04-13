import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { initials } from '../lib/format'
import type { Buddy, Chat, WorkspaceState } from '../types'

export type SidebarMode = 'buddies' | 'chats' | 'info'

export function Sidebar(props: {
  mode: SidebarMode
  workspace: WorkspaceState
  activeChatId: string
  activeBuddyId: string
  openRouterKeyStatus: 'loading' | 'configured' | 'missing'
  isSavingOpenRouterKey: boolean
  onChangeMode: (mode: SidebarMode) => void
  onClearOpenRouterApiKey: () => Promise<void>
  onSaveOpenRouterApiKey: (value: string) => Promise<void>
  onResetWorkspace: () => void
  onSelectBuddy: (buddyId: string) => void
  onSelectChat: (chatId: string) => void
  onOpenChat: () => void
  onOpenBuddy: () => void
}) {
  return (
    <aside className="sidebar-shell">
      <nav className="sidebar-rail" aria-label="Workspace navigation">
        <div className="rail-group">
          <RailButton
            active={props.mode === 'buddies'}
            label="Buddies"
            hint="buddy"
            tooltip="View AI buddies and manage each buddy's role and responsibilities"
            onClick={() => props.onChangeMode('buddies')}
          >
            <BuddyIcon />
          </RailButton>
          <RailButton
            active={props.mode === 'chats'}
            label="Group chats"
            hint="room"
            tooltip="Open rooms and switch between group chats"
            onClick={() => props.onChangeMode('chats')}
          >
            <GroupIcon />
          </RailButton>
        </div>

        <RailButton
          active={props.mode === 'info'}
          label="Info"
          hint="info"
          tooltip="View workspace info and account details"
          className="rail-profile"
          onClick={() => props.onChangeMode('info')}
        >
          <UserIcon />
        </RailButton>
      </nav>

      <AnimatePresence initial={false} mode="wait">
        <motion.section
          key={props.mode}
          className="sidebar"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
        >
          {props.mode === 'buddies' ? (
            <BuddyPane
              buddies={props.workspace.buddies}
              activeBuddyId={props.activeBuddyId}
              onOpenBuddy={props.onOpenBuddy}
              onSelectBuddy={props.onSelectBuddy}
            />
          ) : null}

          {props.mode === 'chats' ? (
            <ChatPane
              chats={props.workspace.chats}
              activeChatId={props.activeChatId}
              onSelectChat={props.onSelectChat}
              onOpenChat={props.onOpenChat}
            />
          ) : null}

          {props.mode === 'info' ? (
            <InfoPane
              isSavingOpenRouterKey={props.isSavingOpenRouterKey}
              openRouterKeyStatus={props.openRouterKeyStatus}
              workspace={props.workspace}
              onClearOpenRouterApiKey={props.onClearOpenRouterApiKey}
              onSaveOpenRouterApiKey={props.onSaveOpenRouterApiKey}
              onResetWorkspace={props.onResetWorkspace}
            />
          ) : null}
        </motion.section>
      </AnimatePresence>
    </aside>
  )
}

export function BuddyPane(props: {
  buddies: Buddy[]
  activeBuddyId: string
  onOpenBuddy: () => void
  onSelectBuddy: (buddyId: string) => void
  title?: string
  copy?: string
  showTitle?: boolean
  showCreateButton?: boolean
}) {
  return (
    <div className="sidebar-pane">
      <div className="pane-header">
        <div>
          {props.showTitle === false ? null : (
            <h1 className="pane-title">{props.title ?? 'Buddies'}</h1>
          )}
          <p className="pane-copy">
            {props.copy ?? 'AI buddies with a role and responsibilities that can join any room.'}
          </p>
        </div>
        {props.showCreateButton === false ? null : (
          <button className="ghost-button sidebar-create-button" onClick={props.onOpenBuddy}>
            <PlusIcon />
            <span>New buddy</span>
          </button>
        )}
      </div>

      <div className="pane-list">
        {props.buddies.length > 0 ? (
          props.buddies.map((buddy) => (
            <BuddyCard
              key={buddy.id}
              buddy={buddy}
              active={buddy.id === props.activeBuddyId}
              onSelect={props.onSelectBuddy}
            />
          ))
        ) : (
          <div className="empty-pane">
            <p>No buddies yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function ChatPane(props: {
  chats: Chat[]
  activeChatId: string
  onSelectChat: (chatId: string) => void
  onOpenChat: () => void
  title?: string
  copy?: string
  showTitle?: boolean
  showCreateButton?: boolean
}) {
  return (
    <div className="sidebar-pane">
      <div className="pane-header">
        <div>
          {props.showTitle === false ? null : (
            <h1 className="pane-title">{props.title ?? 'Group chats'}</h1>
          )}
          <p className="pane-copy">{props.copy ?? 'Pick a room and keep the thread in focus.'}</p>
        </div>
        {props.showCreateButton === false ? null : (
          <button className="ghost-button sidebar-create-button" onClick={props.onOpenChat}>
            <PlusIcon />
            <span>New chat</span>
          </button>
        )}
      </div>

      <div className="pane-list">
        {props.chats.length > 0 ? (
          props.chats.map((chat) => (
            <ChatCard
              key={chat.id}
              chat={chat}
              active={chat.id === props.activeChatId}
              onSelect={props.onSelectChat}
            />
          ))
        ) : (
          <div className="empty-pane">
            <p>No group chats yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function InfoPane(props: {
  isSavingOpenRouterKey: boolean
  openRouterKeyStatus: 'loading' | 'configured' | 'missing'
  workspace: WorkspaceState
  onClearOpenRouterApiKey: () => Promise<void>
  onSaveOpenRouterApiKey: (value: string) => Promise<void>
  onResetWorkspace: () => void
  showTitle?: boolean
}) {
  const [openRouterKeyDraft, setOpenRouterKeyDraft] = useState('')
  const openRouterKeyInputRef = useRef<HTMLInputElement>(null)
  const hasOpenRouterApiKey = props.openRouterKeyStatus === 'configured'
  const openRouterStatus =
    props.openRouterKeyStatus === 'loading'
      ? 'Checking OpenRouter'
      : props.openRouterKeyStatus === 'configured'
        ? 'Loaded in memory for this session'
        : 'Not loaded'

  useEffect(() => {
    if (props.openRouterKeyStatus !== 'missing') return

    const input = openRouterKeyInputRef.current
    if (!input) return

    const frameId = window.requestAnimationFrame(() => {
      input.focus()
      const cursorPosition = input.value.length
      input.setSelectionRange(cursorPosition, cursorPosition)
    })

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [props.openRouterKeyStatus])

  return (
    <div className="sidebar-pane">
      <div className="pane-header">
        <div>
          {props.showTitle === false ? null : <h1 className="pane-title">Info</h1>}
          <p className="pane-copy">Your profile, buddies and group chats at a glance.</p>
        </div>
      </div>

      <div className="profile-block">
        <div className="workspace-user">
          <div className="avatar avatar-user">{initials(props.workspace.user.name)}</div>
          <div>
            <strong>{props.workspace.user.name}</strong>
            <span>{props.workspace.user.email}</span>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Buddies" value={String(props.workspace.buddies.length)} />
        <StatCard label="Group chats" value={String(props.workspace.chats.length)} />
      </div>

      <section className="info-settings">
        <div className="info-settings-head">
          <strong>OpenRouter key</strong>
          <span>{openRouterStatus}</span>
        </div>

        <label className="info-settings-field">
          <span>API key</span>
          <input
            ref={openRouterKeyInputRef}
            type="password"
            value={openRouterKeyDraft}
            placeholder={hasOpenRouterApiKey ? 'Replace saved key' : 'sk-or-v1-...'}
            autoComplete="off"
            spellCheck={false}
            onChange={(event) => setOpenRouterKeyDraft(event.target.value)}
          />
        </label>

        <div className="info-settings-copy">
          <p>Key is not saved. If you refresh, it is cleared and must be reentered for the next session.</p>
        </div>

        <div className="info-settings-actions">
          <button
            className="ghost-button"
            type="button"
            disabled={
              props.isSavingOpenRouterKey ||
              props.openRouterKeyStatus === 'loading' ||
              !openRouterKeyDraft.trim()
            }
            onClick={async () => {
              try {
                await props.onSaveOpenRouterApiKey(openRouterKeyDraft)
                setOpenRouterKeyDraft('')
              } catch {}
            }}
          >
            {props.isSavingOpenRouterKey ? 'Checking...' : 'Use key'}
          </button>
          <button
            className="ghost-button"
            type="button"
            disabled={
              props.isSavingOpenRouterKey ||
              props.openRouterKeyStatus === 'loading' ||
              !hasOpenRouterApiKey
            }
            onClick={async () => {
              try {
                await props.onClearOpenRouterApiKey()
                setOpenRouterKeyDraft('')
              } catch {}
            }}
          >
            Clear key
          </button>
          <button className="ghost-button subtle" type="button" onClick={props.onResetWorkspace}>
            Reset local workspace
          </button>
        </div>
      </section>
    </div>
  )
}

function ChatCard(props: {
  chat: Chat
  active: boolean
  onSelect: (chatId: string) => void
}) {
  return (
    <button
      className={`pane-card ${props.active ? 'active' : ''}`}
      onClick={() => props.onSelect(props.chat.id)}
    >
      <div className="pane-card-head">
        <strong>{props.chat.title}</strong>
        <span>{props.chat.buddyIds.length} buddies</span>
      </div>
    </button>
  )
}

function BuddyCard(props: {
  buddy: Buddy
  active: boolean
  onSelect: (buddyId: string) => void
}) {
  return (
    <button
      type="button"
      className={`pane-card buddy-card ${props.active ? 'active' : ''}`}
      onClick={() => props.onSelect(props.buddy.id)}
    >
      <div className="pane-card-head">
        <strong>{props.buddy.name}</strong>
        <span>
          {props.buddy.responsibilities.length}{' '}
          {props.buddy.responsibilities.length === 1 ? 'responsibility' : 'responsibilities'}
        </span>
      </div>
      <p>{props.buddy.roleTitle}</p>
      <small className="pane-card-note">{props.buddy.modelId}</small>
    </button>
  )
}

function StatCard(props: {
  label: string
  value: string
}) {
  return (
    <div className="stat-card">
      <strong className="stat-value">{props.value}</strong>
      <span className="stat-label">{props.label}</span>
    </div>
  )
}

function RailButton(props: {
  active: boolean
  label: string
  hint: string
  tooltip: string
  className?: string
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      className={`rail-button ${props.active ? 'active' : ''} ${props.className ?? ''}`.trim()}
      aria-label={props.label}
      aria-pressed={props.active}
      title={props.tooltip}
      onClick={props.onClick}
    >
      {props.children}
      <span className="rail-button-hint" aria-hidden="true">
        {props.hint}
      </span>
    </button>
  )
}

function BuddyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
    </svg>
  )
}

function GroupIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 11.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M5 18.5a7 7 0 0 1 14 0" />
      <path d="M18 12.5a2.5 2.5 0 1 0 0-5" />
      <path d="M20.5 18.5a4.8 4.8 0 0 0-2.5-4.2" />
      <path d="M6 12.5a2.5 2.5 0 1 1 0-5" />
      <path d="M3.5 18.5A4.8 4.8 0 0 1 6 14.3" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M7.5 18a5 5 0 0 1 9 0" />
    </svg>
  )
}

export function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 6v12" />
      <path d="M6 12h12" />
    </svg>
  )
}

export function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v5" />
      <path d="M12 7.25h.01" />
    </svg>
  )
}
