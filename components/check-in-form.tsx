'use client'

import { useState, useEffect, useRef } from 'react'
import useSWR, { mutate } from 'swr'
import { Button } from '@/components/ui/button'
import { LogIn, LogOut, Search, X, Check } from 'lucide-react'
import { getInitials, getAvatarColor } from '@/lib/utils'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function MemberSearchInput({ value, onChange, action }: { value: string; onChange: (memberId: string, label: string) => void; action?: string }) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<{ id: string; label: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const isCheckOut = action === 'check_out'
  const { data: membersData } = useSWR(isCheckOut ? '/api/check-in?active_only=true&limit=1000' : '/api/members', fetcher)
  const members: any[] = isCheckOut ? (membersData?.data || []) : (membersData?.data || [])

  const filtered = query.trim()
    ? members.filter((m: any) =>
        (m.first_name || '').toLowerCase().includes(query.toLowerCase()) ||
        (m.last_name || '').toLowerCase().includes(query.toLowerCase()) ||
        (m.email || '').toLowerCase().includes(query.toLowerCase()) ||
        (m.zone_name || '').toLowerCase().includes(query.toLowerCase())
      ).slice(0, 50)
    : members

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (member: any) => {
    const label = `${member.first_name} ${member.last_name}`
    setSelected({ id: member.member_id, label })
    setQuery('')
    setOpen(false)
    onChange(member.member_id, label)
  }

  const zoneBadge = (member: any) => {
    if (!isCheckOut || !member.zone_name) return null
    return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 ml-2">{member.zone_name}</span>
  }

  const handleClear = () => {
    setSelected(null)
    setQuery('')
    onChange('', '')
    inputRef.current?.focus()
  }

  if (selected) {
    const [firstName, ...rest] = selected.label.split(' ')
    const lastName = rest.join(' ')
    return (
      <div className="flex items-center gap-3 w-full px-4 py-2 border border-primary/50 bg-primary/5 text-foreground rounded-xl">
        <span className={`w-8 h-8 rounded-full ${getAvatarColor(firstName, lastName)} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
          {getInitials(firstName, lastName)}
        </span>
        <span className="flex-1 text-sm truncate">{selected.label}</span>
        <button type="button" onClick={handleClear} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={isCheckOut ? 'Search active check-ins...' : 'Type to search or browse members...'}
          className="w-full pl-10 pr-4 py-2 border border-input bg-card text-foreground rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors"
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {filtered.map((member: any) => (
            <button
              key={member.member_id}
              type="button"
              onClick={() => handleSelect(member)}
              className="w-full px-4 py-3 text-left text-sm hover:bg-muted transition-colors border-b border-border last:border-b-0 flex items-center gap-3"
            >
              <span className={`w-8 h-8 rounded-full ${getAvatarColor(member.first_name, member.last_name)} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
                {getInitials(member.first_name, member.last_name)}
              </span>
              <div className="min-w-0 flex items-center">
                <span className="font-medium text-foreground">{member.first_name} {member.last_name}</span>
                {zoneBadge(member)}
              </div>
            </button>
          ))}
        </div>
      )}
      {open && !filtered.length && (
        <div className="absolute z-50 mt-1 w-full bg-card border border-border rounded-xl shadow-lg p-4 text-center text-sm text-muted-foreground">
          {query ? 'No members found' : 'No members available'}
        </div>
      )}
    </div>
  )
}

export function CheckInForm() {
  const [memberId, setMemberId] = useState('')
  const [memberLabel, setMemberLabel] = useState('')
  const [zoneName, setZoneName] = useState('')
  const [action, setAction] = useState<'check_in' | 'check_out'>('check_in')
  const [feedback, setFeedback] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)

  const { data: zonesData } = useSWR('/api/zones', fetcher)

  const zones = zonesData?.data || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!memberId || !zoneName) {
      setFeedback('Please fill all fields')
      return
    }

    setIsLoading(true)
    try {
      const [firstName, ...rest] = memberLabel.split(' ')
      const lastName = rest.join(' ') || 'User'
      const response = await fetch('/api/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: memberId,
          zone_id: zoneName,
          first_name: firstName,
          last_name: lastName,
          action,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setFeedback(`✓ ${data.message}`)
        setMemberId('')
        setMemberLabel('')
        setZoneName('')
        mutate('/api/check-in')
        mutate('/api/facility/metrics')
        setTimeout(() => setFeedback(''), 3000)
      } else {
        setFeedback(`✗ ${data.error}`)
      }
    } catch (error: any) {
      setFeedback(`✗ ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-card border border-border shadow-sm rounded-2xl p-8 sticky top-24">
      <h3 className="text-xl font-bold text-foreground mb-6">Member Check-In</h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Search Member
          </label>
          <MemberSearchInput
            value={memberId}
            action={action}
            onChange={(id, label) => { setMemberId(id); setMemberLabel(label) }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Zone
          </label>
          <select
            value={zoneName}
            onChange={(e) => setZoneName(e.target.value)}
            required
            className="w-full px-4 py-2 border border-input bg-card text-foreground rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors"
          >
            <option value="">Select zone...</option>
            {zones.map((zone: any) => (
              <option key={zone.zone_id} value={zone.zone_name}>
                {zone.zone_name} ({zone.active_count}/{zone.capacity})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Action
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setAction('check_in')}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                action === 'check_in'
                  ? 'bg-primary/20 text-primary border-2 border-primary/50'
                  : 'bg-muted text-foreground border border-input'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Check In
            </button>
            <button
              type="button"
              onClick={() => setAction('check_out')}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                action === 'check_out'
                  ? 'bg-destructive/20 text-destructive border-2 border-destructive/50'
                  : 'bg-muted text-foreground border border-input'
              }`}
            >
              <LogOut className="w-4 h-4" />
              Check Out
            </button>
          </div>
        </div>

        {feedback && (
          <div
            className={`p-3 rounded-xl text-sm font-medium ${
              feedback.startsWith('✓')
                ? 'bg-primary/10 text-primary'
                : 'bg-destructive/10 text-destructive'
            }`}
          >
            {feedback}
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading || !memberId || !zoneName}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : action === 'check_in' ? 'Check In' : 'Check Out'}
        </Button>
      </form>
    </div>
  )
}
