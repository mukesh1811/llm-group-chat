export function initials(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function formatClock(isoDate: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(isoDate))
}

export function formatRelative(isoDate: string): string {
  const then = new Date(isoDate).getTime()
  const diffMs = Date.now() - then
  const diffMin = Math.round(diffMs / 60_000)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`

  const diffHours = Math.round(diffMin / 60)
  if (diffHours < 24) return `${diffHours}h ago`

  const diffDays = Math.round(diffHours / 24)
  return `${diffDays}d ago`
}

export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function currencyFromMicros(value?: number): string {
  if (!value) return 'free'
  const perMillion = (value * 1_000_000).toFixed(2)
  return `$${perMillion}/1M`
}
