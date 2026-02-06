import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// =============================================
// Lima Timezone Utilities (UTC-5)
// =============================================
const LIMA_TZ = 'America/Lima'

/**
 * Get the current date/time in Lima timezone as a Date object.
 * Uses the browser's Intl API (always accurate with system clock).
 */
export function nowLima(): Date {
  const now = new Date()
  // Format in Lima timezone parts and reconstruct
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: LIMA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now)

  const get = (type: string) => parts.find(p => p.type === type)?.value || '00'
  const isoStr = `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}`
  return new Date(isoStr + '-05:00') // Lima is always UTC-5 (no daylight saving)
}

/**
 * Format a date string or Date in Lima timezone for display.
 */
export function formatLima(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: LIMA_TZ,
    ...options,
  }).format(d)
}

/**
 * Format date in Lima TZ as "dd/MM/yyyy HH:mm"
 */
export function formatLimaDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('es-PE', {
    timeZone: LIMA_TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d)
}

/**
 * Get Lima timezone date parts (for form defaults).
 * Returns { date: 'YYYY-MM-DD', time: 'HH:MM' }
 */
export function getLimaDateParts(date?: string | Date): { date: string; time: string } {
  const d = date ? (typeof date === 'string' ? new Date(date) : date) : new Date()
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: LIMA_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d)

  const get = (type: string) => parts.find(p => p.type === type)?.value || '00'
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
  }
}

/**
 * Build an ISO string from date + time inputs, anchored to Lima timezone.
 */
export function toLimaISO(dateStr: string, timeStr: string): string {
  return `${dateStr}T${timeStr}:00-05:00`
}

/**
 * Calculate countdown from now to a target date.
 * Returns { days, hours, minutes, isPast, label }
 */
export function getCountdown(targetDate: string | Date): {
  days: number
  hours: number
  minutes: number
  totalMs: number
  isPast: boolean
  label: string
} {
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate
  const now = new Date()
  const diff = target.getTime() - now.getTime()
  const isPast = diff < 0
  const absDiff = Math.abs(diff)
  
  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60))

  let label = ''
  if (isPast) {
    if (days > 0) label = `Hace ${days}d ${hours}h`
    else if (hours > 0) label = `Hace ${hours}h ${minutes}m`
    else label = `Hace ${minutes}m`
  } else {
    if (days > 0) label = `${days}d ${hours}h`
    else if (hours > 0) label = `${hours}h ${minutes}m`
    else label = `${minutes}m`
  }

  return { days, hours, minutes, totalMs: diff, isPast, label }
}
