import { generatePath, matchPath } from 'react-router-dom'

export const routePaths = {
  home: '/',
  chats: '/chats',
  chatDetail: '/chats/:chatId',
  newChat: '/chats/new',
  editChat: '/chats/:chatId/edit',
  buddies: '/buddies',
  buddyDetail: '/buddies/:buddyId',
  newBuddy: '/buddies/new',
  editBuddy: '/buddies/:buddyId/edit',
  info: '/info',
  about: '/about',
} as const

export const appRoutes = {
  home: {
    name: 'home',
    path: routePaths.home,
    to: () => routePaths.home,
  },
  chats: {
    name: 'chats.index',
    path: routePaths.chats,
    to: () => routePaths.chats,
  },
  chatDetail: {
    name: 'chats.detail',
    path: routePaths.chatDetail,
    to: (chatId: string) => generatePath(routePaths.chatDetail, { chatId }),
  },
  newChat: {
    name: 'chats.new',
    path: routePaths.newChat,
    to: () => routePaths.newChat,
  },
  editChat: {
    name: 'chats.edit',
    path: routePaths.editChat,
    to: (chatId: string) => generatePath(routePaths.editChat, { chatId }),
  },
  buddies: {
    name: 'buddies.index',
    path: routePaths.buddies,
    to: () => routePaths.buddies,
  },
  buddyDetail: {
    name: 'buddies.detail',
    path: routePaths.buddyDetail,
    to: (buddyId: string) => generatePath(routePaths.buddyDetail, { buddyId }),
  },
  newBuddy: {
    name: 'buddies.new',
    path: routePaths.newBuddy,
    to: () => routePaths.newBuddy,
  },
  editBuddy: {
    name: 'buddies.edit',
    path: routePaths.editBuddy,
    to: (buddyId: string) => generatePath(routePaths.editBuddy, { buddyId }),
  },
  info: {
    name: 'info',
    path: routePaths.info,
    to: () => routePaths.info,
  },
  about: {
    name: 'about',
    path: routePaths.about,
    to: () => routePaths.about,
  },
} as const

export type AppRouteMatch =
  | { name: typeof appRoutes.home.name }
  | { name: typeof appRoutes.chats.name }
  | { name: typeof appRoutes.chatDetail.name; chatId: string }
  | { name: typeof appRoutes.newChat.name }
  | { name: typeof appRoutes.editChat.name; chatId: string }
  | { name: typeof appRoutes.buddies.name }
  | { name: typeof appRoutes.buddyDetail.name; buddyId: string }
  | { name: typeof appRoutes.newBuddy.name }
  | { name: typeof appRoutes.editBuddy.name; buddyId: string }
  | { name: typeof appRoutes.info.name }
  | { name: typeof appRoutes.about.name }

export function matchAppRoute(pathname: string): AppRouteMatch | null {
  if (matchPath({ path: appRoutes.home.path, end: true }, pathname)) {
    return { name: appRoutes.home.name }
  }

  if (matchPath({ path: appRoutes.newChat.path, end: true }, pathname)) {
    return { name: appRoutes.newChat.name }
  }

  const chatDetailMatch = matchPath({ path: appRoutes.chatDetail.path, end: true }, pathname)
  if (chatDetailMatch?.params.chatId) {
    return {
      name: appRoutes.chatDetail.name,
      chatId: chatDetailMatch.params.chatId,
    }
  }

  const editChatMatch = matchPath({ path: appRoutes.editChat.path, end: true }, pathname)
  if (editChatMatch?.params.chatId) {
    return {
      name: appRoutes.editChat.name,
      chatId: editChatMatch.params.chatId,
    }
  }

  if (matchPath({ path: appRoutes.chats.path, end: true }, pathname)) {
    return { name: appRoutes.chats.name }
  }

  if (matchPath({ path: appRoutes.newBuddy.path, end: true }, pathname)) {
    return { name: appRoutes.newBuddy.name }
  }

  const editBuddyMatch = matchPath({ path: appRoutes.editBuddy.path, end: true }, pathname)
  if (editBuddyMatch?.params.buddyId) {
    return {
      name: appRoutes.editBuddy.name,
      buddyId: editBuddyMatch.params.buddyId,
    }
  }

  const buddyDetailMatch = matchPath({ path: appRoutes.buddyDetail.path, end: true }, pathname)
  if (buddyDetailMatch?.params.buddyId) {
    return {
      name: appRoutes.buddyDetail.name,
      buddyId: buddyDetailMatch.params.buddyId,
    }
  }

  if (matchPath({ path: appRoutes.buddies.path, end: true }, pathname)) {
    return { name: appRoutes.buddies.name }
  }

  if (matchPath({ path: appRoutes.info.path, end: true }, pathname)) {
    return { name: appRoutes.info.name }
  }

  if (matchPath({ path: appRoutes.about.path, end: true }, pathname)) {
    return { name: appRoutes.about.name }
  }

  return null
}

export function isChatRoute(routeMatch: AppRouteMatch | null) {
  return (
    routeMatch?.name === appRoutes.chats.name ||
    routeMatch?.name === appRoutes.chatDetail.name ||
    routeMatch?.name === appRoutes.newChat.name ||
    routeMatch?.name === appRoutes.editChat.name
  )
}

export function isBuddyRoute(routeMatch: AppRouteMatch | null) {
  return (
    routeMatch?.name === appRoutes.buddies.name ||
    routeMatch?.name === appRoutes.buddyDetail.name ||
    routeMatch?.name === appRoutes.newBuddy.name ||
    routeMatch?.name === appRoutes.editBuddy.name
  )
}
