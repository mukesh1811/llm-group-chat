import { describe, expect, it } from 'vitest'
import { appRoutes, matchAppRoute } from '../../src/lib/routes'

describe('app routes', () => {
  it('builds named chat and buddy routes', () => {
    expect(appRoutes.chatDetail.to('chat-plg')).toBe('/chats/chat-plg')
    expect(appRoutes.newChat.to()).toBe('/chats/new')
    expect(appRoutes.buddyDetail.to('buddy-cto')).toBe('/buddies/buddy-cto')
    expect(appRoutes.editBuddy.to('buddy-cto')).toBe('/buddies/buddy-cto/edit')
    expect(appRoutes.info.to()).toBe('/info')
  })

  it('matches route names before dynamic params', () => {
    expect(matchAppRoute('/chats/new')).toEqual({ name: 'chats.new' })
    expect(matchAppRoute('/buddies/new')).toEqual({ name: 'buddies.new' })
    expect(matchAppRoute('/buddies/buddy-cto/edit')).toEqual({
      name: 'buddies.edit',
      buddyId: 'buddy-cto',
    })
  })

  it('extracts params for detail routes', () => {
    expect(matchAppRoute('/chats/chat-pricing')).toEqual({
      name: 'chats.detail',
      chatId: 'chat-pricing',
    })
    expect(matchAppRoute('/buddies/buddy-pm')).toEqual({
      name: 'buddies.detail',
      buddyId: 'buddy-pm',
    })
  })
})
