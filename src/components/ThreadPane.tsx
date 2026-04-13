import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { currencyFromMicros, formatClock, formatRelative, initials } from '../lib/format'
import { replaceTrailingMention } from '../lib/conversation'
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

export type ThreadPaneMode =
  | 'chat'
  | 'new-buddy'
  | 'new-chat'
  | 'edit-chat'
  | 'about'
  | 'buddy-detail'
  | 'edit-buddy'

export function ThreadPane(props: {
  mode: ThreadPaneMode
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
  navigation?: ReactNode
  onChangeBuddyDraft: (draft: BuddyDraft) => void
  onChangeChatDraft: (draft: ChatDraft) => void
  onChangeComposer: (value: string) => void
  onCreateBuddy: () => void
  onDeleteBuddy: () => void
  onOpenBuddyEditor: () => void
  onCreateChat: () => void
  onCloseRosterManager: () => void
  onOpenRosterManager: () => void
  onSaveBuddy: () => void
  onSaveChatRoster: () => void
  onCancelComposer: () => void
  onSend: () => void
  onRetry: (message: Message) => void
  onOpenChat: () => void
  onOpenChatEditor: () => void
  onSelectChat: (chatId: string) => void
  onToggleChatRosterBuddy: (buddyId: string) => void
  onDeleteChat?: () => void
  onSaveChat?: () => void
}) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [props.chatMessages])

  if (props.mode === 'buddy-detail') {
    if (!props.activeBuddy) {
      return (
        <section className="thread-pane">
          <div className="empty-state">
            <p className="eyebrow">Buddy details</p>
            <h2>Select a buddy from the roster.</h2>
            <p>Pick a buddy on the left to inspect its role, responsibilities, model choice, and room activity.</p>
          </div>
        </section>
      )
    }

    return (
      <BuddyDetailPane
        buddy={props.activeBuddy}
        isWorking={props.isWorking}
        models={props.models}
        navigation={props.navigation}
        onDeleteBuddy={props.onDeleteBuddy}
        onOpenBuddyEditor={props.onOpenBuddyEditor}
        onSelectChat={props.onSelectChat}
        workspace={props.workspace}
      />
    )
  }

  if (props.mode === 'about') {
    return (
      <section className="thread-pane">
        <PaneHeader
          navigation={props.navigation}
          title="llm-group-chat"
          summary="is a private, local-first multi-llm chat app that lets you converse with multiple LLMs in one room."
        />

        <div className="thread-body about-body">
          <DetailSection title="What it does">
            <p>
              Create AI buddies with distinct roles and prompts, group them into rooms
              around a topic, and run shared conversations where @mentions can narrow
              which buddies respond.
            </p>
            <br></br>
            <p>
              Inspired by Andrej Karpathy&apos;s{' '}
              <a
                href="https://x.com/karpathy/status/1992381094667411768"
                target="_blank"
                rel="noreferrer"
              >
                LLM Council
              </a>
              .
            </p>
            <br></br>
            <ul className="about-list">
              <li>Each AI buddy has a role, responsibilities, prompt, and model selection.</li>
              <li>Group chats bind a topic to a selected roster of buddies and keep all turns in one shared timeline.</li>
              <li>@mentions narrow the responder set; untagged messages fan out to the full room in order.</li>
              <li>Failed buddy replies stay inline and can be retried without leaving the thread.</li>
            </ul>
          </DetailSection>

          <DetailSection title="Architecture">
            <ul className="about-list">
              <li>Runtime: React 18 with Vite, running entirely in the browser with no sign-in flow and no backend.</li>
              <li>Prompt handling: each buddy carries its own system prompt, while each group chat contributes the shared topic and recent transcript used to ground replies.</li>
              <li>Model routing: OpenRouter-backed buddy generation and model catalog loading happen directly from the browser using your key for the current tab.</li>
              <li className="about-link-row">
                More
                <a href="https://github.com/mukesh1811/llm-group-chat" target="_blank" rel="noreferrer">
                  Git Repo
                </a>
                .
                <a href="https://github.com/sponsors/mukesh1811/" target="_blank" rel="noreferrer">
                  Support me here
                </a>
                .
                <a href="https://github.com/mukesh1811/llm-group-chat/issues" target="_blank" rel="noreferrer">
                  Request a feature or report a bug
                </a>
              </li>
            </ul>
            <div className="about-subsection">
              <h4>Privacy</h4>
              <ul className="about-list">
                <li>
                  Browser save for workspace and buddies: *ON*.
                  <br />
                  Buddies, group chats, and message history persist locally in this browser only.
                </li>
                <li>Browser save for your OpenRouter key: *OFF*.
                  <br />
                  The app does NO SAVE AT ALL for the key and keeps it only in memory for the current tab.</li>
              </ul>
            </div>
          </DetailSection>
        </div>
      </section>
    )
  }

  if (props.mode === 'new-buddy') {
    return (
      <BuddyEditorPane
        buddyDraft={props.buddyDraft}
        isWorking={props.isWorking}
        models={props.models}
        mode="create"
        navigation={props.navigation}
        onCancel={props.onCancelComposer}
        onChangeBuddyDraft={props.onChangeBuddyDraft}
        onSubmit={props.onCreateBuddy}
      />
    )
  }

  if (props.mode === 'edit-buddy') {
    if (!props.activeBuddy) {
      return (
        <section className="thread-pane">
          <div className="empty-state">
            <p className="eyebrow">Edit buddy</p>
            <h2>Select a buddy from the roster.</h2>
            <p>Pick a buddy on the left before opening the editor.</p>
          </div>
        </section>
      )
    }

    return (
      <BuddyEditorPane
        buddyDraft={props.buddyDraft}
        isWorking={props.isWorking}
        models={props.models}
        mode="edit"
        navigation={props.navigation}
        onCancel={props.onCancelComposer}
        onChangeBuddyDraft={props.onChangeBuddyDraft}
        onSubmit={props.onSaveBuddy}
      />
    )
  }

  if (props.mode === 'new-chat') {
    const canCreateChat =
      !props.isWorking &&
      props.chatDraft.title.trim().length > 0 &&
      props.chatDraft.topic.trim().length > 0 &&
      props.chatDraft.buddyIds.length > 0

    return (
      <section className="thread-pane">
        <PaneHeader
          navigation={props.navigation}
          title="Start a room around one topic"
          summary="Pick buddies, define the brief, and open it here."
        />

        <div className="thread-body editor-body">
          <div className="editor-grid">
            <label className="editor-field editor-full">
              <span>Title *</span>
              <input
                value={props.chatDraft.title}
                onChange={(event) =>
                  props.onChangeChatDraft({ ...props.chatDraft, title: event.target.value })
                }
              />
            </label>
            <label className="editor-field editor-full">
              <span>Topic *</span>
              <textarea
                rows={6}
                value={props.chatDraft.topic}
                onChange={(event) =>
                  props.onChangeChatDraft({ ...props.chatDraft, topic: event.target.value })
                }
              />
            </label>
            <fieldset className="editor-field editor-full editor-picker">
              <legend>Pick buddies *</legend>
              <div className="editor-choice-list">
                {props.allBuddies.map((buddy) => {
                  const selected = props.chatDraft.buddyIds.includes(buddy.id)
                  return (
                    <label
                      key={buddy.id}
                      className={`buddy-toggle ${selected ? 'selected' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() =>
                          props.onChangeChatDraft({
                            ...props.chatDraft,
                            buddyIds: selected
                              ? props.chatDraft.buddyIds.filter((id) => id !== buddy.id)
                              : [...props.chatDraft.buddyIds, buddy.id],
                          })
                        }
                      />
                      <span className="avatar">{buddy.name.slice(0, 1).toUpperCase()}</span>
                      <div>
                        <strong>{buddy.name}</strong>
                        {" "}
                        <span>{buddy.roleTitle}</span>
                      </div>
                    </label>
                  )
                })}
              </div>
            </fieldset>
          </div>
        </div>

        <footer className="composer-panel editor-footer">
          <div className="composer-actions">
            <p>The room opens here after creation, with the selected buddies attached from the start.</p>
            <div className="editor-actions">
              <button className="ghost-button" onClick={props.onCancelComposer}>
                Cancel
              </button>
              <button className="primary-button" disabled={!canCreateChat} onClick={props.onCreateChat}>
                Create chat
              </button>
            </div>
          </div>
        </footer>
      </section>
    )
  }

  if (props.mode === 'edit-chat') {
    if (!props.activeChat) {
      return (
        <section className="thread-pane">
          <div className="empty-state">
            <p className="eyebrow">Room settings</p>
            <h2>Select a room first.</h2>
          </div>
        </section>
      )
    }

    return (
      <section className="thread-pane create-buddy-pane">
        <PaneHeader
          navigation={props.navigation}
          title={props.activeChat.title}
          summary={props.activeChat.topic.trim() || undefined}
        />

        <ChatRosterDialog
          allBuddies={props.allBuddies}
          currentBuddyIds={props.activeChat.buddyIds}
          draftBuddyIds={props.chatRosterDraft}
          isOpen={props.isManagingRoster}
          isWorking={props.isWorking}
          onClose={props.onCloseRosterManager}
          onSave={props.onSaveChatRoster}
          onToggleBuddy={props.onToggleChatRosterBuddy}
        />

        <div className="thread-body about-body">
          <DetailSection title="Description">
            <p className="detail-pre detail-desc-clamp">{props.activeChat.topic.trim() || 'No topic set.'}</p>
          </DetailSection>

          <DetailSection title="Buddies in this room">
            <div className="detail-room-list">
              {props.chatBuddies.map((buddy) => (
                <div key={buddy.id} className="detail-room-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                    <span className="avatar">{initials(buddy.name)}</span>
                    <div>
                      <strong>{buddy.name}</strong>
                      {' '}
                      <span style={{ opacity: 0.72 }}>{buddy.roleTitle}</span>
                    </div>
                  </div>
                </div>
              ))}
              {props.chatBuddies.length === 0 ? (
                <p className="detail-empty">No buddies in this room yet.</p>
              ) : null}
            </div>
          </DetailSection>
        </div>

        <footer className="composer-panel editor-footer create-buddy-editor-footer">
          <div className="composer-actions create-buddy-composer-actions">
            <p>Manage this room&apos;s buddy roster or remove the room entirely.</p>
            <div className="editor-actions create-buddy-editor-actions">
              <button
                className="ghost-button editor-action-button"
                type="button"
                disabled={props.isWorking}
                onClick={props.onOpenRosterManager}
              >
                Add buddies
              </button>
              <button
                className="ghost-button danger-button editor-action-button"
                type="button"
                disabled={props.isWorking}
                onClick={props.onDeleteChat}
              >
                Delete room
              </button>
            </div>
          </div>
        </footer>
      </section>
    )
  }

  if (!props.activeChat) {
    return (
      <section className="thread-pane">
        <div className="empty-state">
          <p className="eyebrow">No chat selected</p>
          <h2>Start a room around one concrete topic.</h2>
          <button className="primary-button" onClick={props.onOpenChat}>
            Create the first chat
          </button>
        </div>
      </section>
    )
  }

  const messageBuddyMap = new Map(props.allBuddies.map((buddy) => [buddy.id, buddy]))
  const activeChatTopic = props.activeChat.topic.trim()
  const isMissingOpenRouterKey = props.openRouterKeyStatus === 'missing'
  const isCheckingOpenRouterKey = props.openRouterKeyStatus === 'loading'
  const isComposerEnabled = props.openRouterKeyStatus === 'configured'
  const canSend = isComposerEnabled && props.composer.trim().length > 0
  const composerPlaceholder = isMissingOpenRouterKey
    ? 'Set your OpenRouter key in Info to enable the room.'
    : isCheckingOpenRouterKey
      ? 'Checking your OpenRouter key...'
      : 'Ask the room a question. Use @buddy to narrow who responds.'

  return (
    <section className="thread-pane">
      <PaneHeader
        navigation={props.navigation}
        title={props.activeChat.title}
        summary={activeChatTopic || undefined}
        right={
          <div className="header-room-controls">
            <div className="header-summary-pill">
              <div className="header-avatar-stack" aria-hidden="true">
                {props.chatBuddies.slice(0, 3).map((buddy) => (
                  <span key={buddy.id} className="avatar header-stack-avatar">
                    {initials(buddy.name)}
                  </span>
                ))}
              </div>
              <div className="header-summary-copy">
                <strong>{props.chatBuddies.length} buddies</strong>
                <span>in this room</span>
              </div>
            </div>
            <button
              className="ghost-button header-action-button"
              type="button"
              disabled={props.isWorking}
              onClick={props.onOpenRosterManager}
            >
              Add buddies
            </button>
            <button
              className="ghost-button header-action-button"
              type="button"
              onClick={props.onOpenChatEditor}
              aria-label="Room settings"
              title="Room settings"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: '1rem', height: '1rem', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>
          </div>
        }
      />

      <div className="thread-body">
        <AnimatePresence initial={false}>
          {props.chatMessages.map((message) => {
            const buddy = message.buddyId ? messageBuddyMap.get(message.buddyId) : null
            const isUser = message.senderType === 'user'
            const isPending = message.status === 'pending'
            const isError = message.status === 'error'
            const canRetry =
              Boolean(message.buddyId) &&
              props.activeChat?.buddyIds.includes(message.buddyId ?? '') &&
              !isPending

            return (
              <motion.article
                key={message.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className={`message-row ${isUser ? 'user' : 'buddy'}`}
              >
                {!isUser ? <span className="avatar">{initials(buddy?.name ?? 'Buddy')}</span> : null}
                <div
                  className={`message-bubble ${isUser ? 'user' : isError ? 'error' : 'buddy'
                    }`}
                >
                  {!isUser && buddy ? (
                    <div className="bubble-meta">
                      <strong>{buddy.name}</strong>
                      <span>{buddy.roleTitle}</span>
                    </div>
                  ) : null}
                  {isPending ? (
                    <div className="typing-dots" aria-label="Buddy is typing">
                      <span />
                      <span />
                      <span />
                    </div>
                  ) : (
                    <p>{message.content}</p>
                  )}
                  <div className="bubble-footer">
                    <span>{formatClock(message.createdAt)}</span>
                    {isError && canRetry ? (
                      <button className="ghost-inline" onClick={() => props.onRetry(message)}>
                        Retry
                      </button>
                    ) : null}
                  </div>
                </div>
              </motion.article>
            )
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      <ChatRosterDialog
        allBuddies={props.allBuddies}
        currentBuddyIds={props.activeChat.buddyIds}
        draftBuddyIds={props.chatRosterDraft}
        isOpen={props.isManagingRoster}
        isWorking={props.isWorking}
        onClose={props.onCloseRosterManager}
        onSave={props.onSaveChatRoster}
        onToggleBuddy={props.onToggleChatRosterBuddy}
      />

      <footer className="composer-panel">
        {isMissingOpenRouterKey ? (
          <p className="composer-note">
            Chat is disabled until you set an OpenRouter API key in{' '}
            <Link className="inline-link" to={appRoutes.info.to()}>
              Info
            </Link>
            .
          </p>
        ) : null}
        {props.mentionSuggestions.length > 0 ? (
          <div className="mention-menu">
            {props.mentionSuggestions.map((buddy) => (
              <button
                key={buddy.id}
                className="mention-option"
                onClick={() =>
                  props.onChangeComposer(replaceTrailingMention(props.composer, buddy.name))
                }
              >
                <span className="avatar">{initials(buddy.name)}</span>
                <div>
                  <strong>{buddy.name}</strong>
                  <span>{buddy.roleTitle}</span>
                </div>
              </button>
            ))}
          </div>
        ) : null}
        <div className="composer-input-shell">
          <textarea
            value={props.composer}
            onChange={(event) => props.onChangeComposer(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Tab' && props.mentionSuggestions.length > 0) {
                event.preventDefault()
                props.onChangeComposer(
                  replaceTrailingMention(
                    props.composer,
                    props.mentionSuggestions[0].name,
                  ),
                )
                return
              }

              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                if (canSend) {
                  props.onSend()
                }
              }
            }}
            placeholder={composerPlaceholder}
            rows={2}
            disabled={!isComposerEnabled}
          />
          <button
            className="primary-button composer-send-button"
            disabled={!canSend}
            onClick={props.onSend}
            aria-label="Send to room"
            title="Send to room"
            type="button"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M4 19 20 12 4 5l2.9 7L4 19Z" />
            </svg>
          </button>
        </div>
      </footer>
    </section>
  )
}

function ChatRosterDialog(props: {
  allBuddies: Buddy[]
  currentBuddyIds: string[]
  draftBuddyIds: string[]
  isOpen: boolean
  isWorking: boolean
  onClose: () => void
  onSave: () => void
  onToggleBuddy: (buddyId: string) => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const currentBuddySet = new Set(props.currentBuddyIds)
  const draftBuddySet = new Set(props.draftBuddyIds)
  const hasAdditions = props.draftBuddyIds.some(
    (buddyId) => !currentBuddySet.has(buddyId),
  )
  const availableCount = props.allBuddies.filter(
    (buddy) => !currentBuddySet.has(buddy.id),
  ).length

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (props.isOpen) {
      if (!dialog.open) {
        dialog.showModal()
      }
      return
    }

    if (dialog.open) {
      dialog.close()
    }
  }, [props.isOpen])

  return (
    <dialog ref={dialogRef} className="roster-modal" onClose={props.onClose}>
      <strong>Add buddies to this room</strong>
      <p className="roster-modal-copy">
        Existing room buddies are locked in place. You can only attach more buddies here.
      </p>
      <div className="roster-modal-list editor-choice-list">
        {props.allBuddies.map((buddy) => {
          const isExisting = currentBuddySet.has(buddy.id)
          const isSelected = draftBuddySet.has(buddy.id)

          return (
            <label
              key={buddy.id}
              className={`buddy-toggle ${isExisting ? 'selected locked' : isSelected ? 'selected' : ''}`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                disabled={isExisting || props.isWorking}
                onChange={() => props.onToggleBuddy(buddy.id)}
              />
              <span className="avatar">{buddy.name.slice(0, 1).toUpperCase()}</span>
              <div className="roster-modal-card-copy">
                <strong>{buddy.name}</strong>
                <span>{buddy.roleTitle}</span>
                <small className="roster-modal-note">
                  {isExisting ? 'Already in this room' : 'Available to add'}
                </small>
              </div>
            </label>
          )
        })}
      </div>
      {availableCount === 0 ? (
        <p className="roster-modal-copy">Every buddy in your roster is already part of this room.</p>
      ) : null}
      <div className="roster-modal-actions">
        <button className="ghost-button" type="button" onClick={props.onClose}>
          Cancel
        </button>
        <button
          className="primary-button"
          type="button"
          disabled={props.isWorking || !hasAdditions}
          onClick={props.onSave}
        >
          Add selected buddies
        </button>
      </div>
    </dialog>
  )
}

function BuddyEditorPane(props: {
  buddyDraft: BuddyDraft
  isWorking: boolean
  models: ModelOption[]
  mode: 'create' | 'edit'
  navigation?: ReactNode
  onCancel: () => void
  onChangeBuddyDraft: (draft: BuddyDraft) => void
  onSubmit: () => void
}) {
  const isCreate = props.mode === 'create'
  const canChooseModel = props.models.length > 0
  const visibleModelValue = props.buddyDraft.modelId || '__missing_model__'
  const buddyName = isCreate ? props.buddyDraft.name.replace(/\s+/g, '') : props.buddyDraft.name
  const canSubmit = props.isWorking || !buddyName || !props.buddyDraft.roleTitle || !props.buddyDraft.modelId
  const handleNameChange = (value: string) => {
    props.onChangeBuddyDraft({
      ...props.buddyDraft,
      name: isCreate ? value.replace(/\s+/g, '') : value,
    })
  }

  return (
    <section className="thread-pane create-buddy-pane">
      <PaneHeader
        className="create-buddy-header"
        navigation={props.navigation}
        title={isCreate ? 'Create an AI buddy' : 'Edit AI buddy'}
        summary={
          isCreate
            ? 'Define the role, responsibilities, model, and operating prompt inline.'
            : 'Update the role, responsibilities, model, and operating prompt inline.'
        }
      />

      <div className="thread-body editor-body create-buddy-editor-body">
        <div className="editor-grid">
          <label className="editor-field">
            <span>Name *</span>
            <input
              value={props.buddyDraft.name}
              placeholder="e.g. Jarvis. No spaces allowed"
              onChange={(event) => handleNameChange(event.target.value)}
            />
          </label>
          <label className="editor-field">
            <span>Role *</span>
            <input
              value={props.buddyDraft.roleTitle}
              placeholder="e.g. Chief Technology Officer, Chief Design Officer"
              onChange={(event) =>
                props.onChangeBuddyDraft({
                  ...props.buddyDraft,
                  roleTitle: event.target.value,
                })
              }
            />
          </label>
          <label className="editor-field editor-full">
            <span>OpenRouter model</span>
            <div className={`editor-feature-lock ${canChooseModel ? '' : 'locked'}`}>
              <select
                value={visibleModelValue}
                disabled={!canChooseModel}
                onChange={(event) =>
                  props.onChangeBuddyDraft({
                    ...props.buddyDraft,
                    modelId: event.target.value,
                  })
                }
              >
                {canChooseModel ? (
                  <>
                    {!props.buddyDraft.modelId ? (
                      <option value="__missing_model__" disabled>
                        Choose a model
                      </option>
                    ) : null}
                    {props.models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name} ({model.provider})
                      </option>
                    ))}
                  </>
                ) : (
                  <option value={visibleModelValue}>
                    {props.buddyDraft.modelId || 'Model selection locked'}
                  </option>
                )}
              </select>
            </div>
            {!canChooseModel ? (
              <span className="editor-field-note">Model list unavailable right now.</span>
            ) : null}
          </label>
          <label className="editor-field editor-full">
            <span>Responsibilities</span>
            <textarea
              rows={5}
              value={props.buddyDraft.responsibilities}
              placeholder="e.g. Drive technical strategy and architecture decisions&#10;Evaluate and adopt emerging technologies&#10;Align engineering roadmap with business goals"
              onChange={(event) =>
                props.onChangeBuddyDraft({
                  ...props.buddyDraft,
                  responsibilities: event.target.value,
                })
              }
            />
          </label>
          <label className="editor-field editor-full">
            <span>System prompt</span>
            <textarea
              rows={8}
              placeholder="e.g. You are a seasoned CTO. Evaluate proposals through the lens of scalability, security, and engineering velocity. Push back on scope creep and keep discussions grounded in technical feasibility."
              value={props.buddyDraft.systemPrompt}
              onChange={(event) =>
                props.onChangeBuddyDraft({
                  ...props.buddyDraft,
                  systemPrompt: event.target.value,
                })
              }
            />
          </label>
        </div>
      </div>

      <footer className="composer-panel editor-footer create-buddy-editor-footer">
        <div className="composer-actions create-buddy-composer-actions">
          <p>
            {isCreate
              ? 'The new AI buddy will be added to the roster and can join any room immediately.'
              : 'Saved changes apply everywhere this buddy appears, including room rosters and future replies.'}
          </p>
          <div className="editor-actions create-buddy-editor-actions">
            <button className="ghost-button editor-action-button" type="button" onClick={props.onCancel}>
              Cancel
            </button>
            <button
              className="primary-button editor-action-button"
              disabled={canSubmit}
              type="button"
              onClick={props.onSubmit}
            >
              {isCreate ? 'Create buddy' : 'Save changes'}
            </button>
          </div>
        </div>
      </footer>
    </section>
  )
}

function BuddyDetailPane(props: {
  buddy: Buddy
  isWorking: boolean
  models: ModelOption[]
  navigation?: ReactNode
  onDeleteBuddy: () => void
  onOpenBuddyEditor: () => void
  onSelectChat: (chatId: string) => void
  workspace: WorkspaceState
}) {
  const [isDeleteConfirming, setIsDeleteConfirming] = useState(false)
  const deleteDialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    setIsDeleteConfirming(false)
  }, [props.buddy.id])

  useEffect(() => {
    const dialog = deleteDialogRef.current
    if (!dialog) return
    if (isDeleteConfirming) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [isDeleteConfirming])

  const assignedChats = props.workspace.chats.filter((chat) => chat.buddyIds.includes(props.buddy.id))
  const buddyMessages = Object.values(props.workspace.messagesByChat)
    .flat()
    .filter((message) => message.buddyId === props.buddy.id)
  const lastReply = buddyMessages.at(-1)
  const selectedModel = props.models.find((model) => model.id === props.buddy.modelId) ?? null

  return (
    <section className="thread-pane create-buddy-pane">
      <PaneHeader
        className="create-buddy-header"
        navigation={props.navigation}
        title={props.buddy.name}
        summary={props.buddy.roleTitle}
        leading={<span className="avatar buddy-header-avatar">{initials(props.buddy.name)}</span>}
      />

      <dialog ref={deleteDialogRef} className="delete-modal" onClose={() => setIsDeleteConfirming(false)}>
        <strong>Delete {props.buddy.name}?</strong>
        <p>
          This removes the buddy from the roster, detaches it from every room, and preserves past replies as
          unattributed history.
        </p>
        <div className="delete-modal-actions">
          <button
            className="ghost-button"
            type="button"
            disabled={props.isWorking}
            onClick={() => setIsDeleteConfirming(false)}
          >
            Keep buddy
          </button>
          <button
            className="primary-button danger-button-solid"
            type="button"
            disabled={props.isWorking}
            onClick={props.onDeleteBuddy}
          >
            Delete permanently
          </button>
        </div>
      </dialog>

      <div className="thread-body about-body">
        <DetailSection title="Responsibilities">
          <ul className="about-list">
            {props.buddy.responsibilities.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </DetailSection>

        <DetailSection title="Configuration">
          <div className="detail-facts">
            <div className="detail-fact">
              <strong>{props.buddy.modelId}</strong>
              <span>Model id</span>
            </div>
            <div className="detail-fact">
              <strong>{selectedModel ? selectedModel.contextLength.toLocaleString() : 'Unavailable'}</strong>
              <span>Context window</span>
            </div>
            <div className="detail-fact">
              <strong>{selectedModel ? currencyFromMicros(selectedModel.pricingPrompt) : 'Unavailable'}</strong>
              <span>Prompt cost</span>
            </div>
            <div className="detail-fact">
              <strong>{lastReply ? formatRelative(lastReply.createdAt) : 'No replies yet'}</strong>
              <span>Last active</span>
            </div>
          </div>
        </DetailSection>

        <DetailSection title="System prompt">
          <p className="detail-pre">{props.buddy.systemPrompt}</p>
        </DetailSection>

        <DetailSection title="Assigned rooms">
          <div className="detail-room-list">
            {assignedChats.length > 0 ? (
              assignedChats.map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  className="detail-room-card detail-room-link"
                  onClick={() => props.onSelectChat(chat.id)}
                >
                  <strong>{chat.title}</strong>
                  <p>{chat.topic.trim() || 'No topic set yet.'}</p>
                </button>
              ))
            ) : (
              <p className="detail-empty">This buddy has not been added to any room yet.</p>
            )}
          </div>
        </DetailSection>
      </div>

      <footer className="composer-panel editor-footer create-buddy-editor-footer">
        <div className="composer-actions create-buddy-composer-actions">
          <p>
            Update this buddy&apos;s role, model choice, and prompt, or remove it from your roster entirely.
          </p>
          <div className="editor-actions create-buddy-editor-actions">
            <button
              className="ghost-button editor-action-button"
              type="button"
              disabled={props.isWorking}
              onClick={props.onOpenBuddyEditor}
            >
              Edit buddy
            </button>
            <button
              className="ghost-button danger-button editor-action-button"
              type="button"
              disabled={props.isWorking}
              onClick={() => setIsDeleteConfirming(true)}
            >
              Delete buddy
            </button>
          </div>
        </div>
      </footer>
    </section>
  )
}

function DetailSection(props: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="about-section detail-section">
      <div className="detail-section-title">
        <div className="about-section-head">
          <h3>{props.title}</h3>
        </div>
      </div>
      <div className="detail-section-content">{props.children}</div>
    </section>
  )
}

function PaneHeader(props: {
  className?: string
  navigation?: ReactNode
  title: string
  summary?: string
  leading?: ReactNode
  right?: ReactNode
}) {
  return (
    <header className={`thread-header compact-header ${props.className ?? ''}`.trim()}>
      {props.navigation ? <div className="thread-header-navigation">{props.navigation}</div> : null}
      <div className="thread-header-main">
        {props.leading ?? null}
        <h2>{props.title}</h2>
        {props.summary ? (
          <p className="thread-header-summary">{props.summary}</p>
        ) : null}
      </div>
      {props.right ? <div className="thread-header-side">{props.right}</div> : null}
    </header>
  )
}
