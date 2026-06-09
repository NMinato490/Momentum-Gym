import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const AVATAR_COLORS = [
  'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-purple-500',
  'bg-orange-500', 'bg-teal-500', 'bg-pink-500', 'bg-indigo-500',
  'bg-cyan-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-500',
]

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

export function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.[0] || ''
  const last = lastName?.[0] || ''
  return (first + last).toUpperCase() || '?'
}

export function getAvatarColor(firstName?: string, lastName?: string): string {
  const key = `${firstName || ''}${lastName || ''}`
  const index = hashString(key) % AVATAR_COLORS.length
  return AVATAR_COLORS[index]
}

export function formatDateTime(date: Date = new Date()): string {
  const y = date.getFullYear()
  const M = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${y}-${M}-${d} ${h}:${m}:${s}`
}
