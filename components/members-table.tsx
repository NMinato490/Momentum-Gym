'use client'

import useSWR from 'swr'
import { Trash2, Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { getInitials, getAvatarColor } from '@/lib/utils'
import { useState, useRef } from 'react'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const PAGE_SIZE = 20

export function MembersTable() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [membershipFilter, setMembershipFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('join_date')
  const [sortOrder, setSortOrder] = useState('desc')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '', last_name: '', email: '', phone: '', membership_type: 'basic',
  })

  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('limit', String(PAGE_SIZE))
  if (debouncedSearch) params.set('search', debouncedSearch)
  if (membershipFilter) params.set('membership_type', membershipFilter)
  if (statusFilter) params.set('status', statusFilter)
  params.set('sort_by', sortBy)
  params.set('sort_order', sortOrder)

  const { data, isLoading, mutate } = useSWR(`/api/members?${params}`, fetcher, {
    refreshInterval: 30000,
  })

  const members = data?.data || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => setDebouncedSearch(value), 300)
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (response.ok) {
        setFormData({ first_name: '', last_name: '', email: '', phone: '', membership_type: 'basic' })
        setShowForm(false)
        mutate()
      }
    } catch (error) {
      console.log('[v0] Error adding member:', error)
    }
  }

  const handleDeactivate = async (memberId: string) => {
    try {
      const response = await fetch(`/api/members/${memberId}`, { method: 'DELETE' })
      if (response.ok) mutate()
    } catch (error) {
      console.log('[v0] Error deactivating member:', error)
    }
  }

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const sortIndicator = (field: string) => {
    if (sortBy !== field) return ''
    return sortOrder === 'asc' ? ' ▲' : ' ▼'
  }

  if (isLoading && members.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm p-8">
        <div className="text-center py-8 text-muted-foreground">Loading members...</div>
      </div>
    )
  }

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-border space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-foreground">
            Members
            <span className="text-sm font-normal text-muted-foreground ml-2">({total})</span>
          </h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 px-4 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Member
          </button>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
            />
          </div>
          <select
            value={membershipFilter}
            onChange={(e) => { setMembershipFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 rounded-xl bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">All Types</option>
            <option value="basic">Basic</option>
            <option value="premium">Premium</option>
            <option value="vip">VIP</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
            className="px-3 py-2 rounded-xl bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Add Member Form */}
      {showForm && (
        <div className="p-6 bg-muted/30 border-b border-border">
          <form onSubmit={handleAddMember} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="text" placeholder="First Name" value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} required
              className="px-4 py-2 border border-input bg-card text-foreground rounded-xl focus:ring-2 focus:ring-primary outline-none" />
            <input type="text" placeholder="Last Name" value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} required
              className="px-4 py-2 border border-input bg-card text-foreground rounded-xl focus:ring-2 focus:ring-primary outline-none" />
            <input type="email" placeholder="Email" value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="px-4 py-2 border border-input bg-card text-foreground rounded-xl focus:ring-2 focus:ring-primary outline-none" />
            <input type="tel" placeholder="Phone" value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="px-4 py-2 border border-input bg-card text-foreground rounded-xl focus:ring-2 focus:ring-primary outline-none" />
            <select value={formData.membership_type}
              onChange={(e) => setFormData({ ...formData, membership_type: e.target.value })}
              className="px-4 py-2 border border-input bg-card text-foreground rounded-xl focus:ring-2 focus:ring-primary outline-none">
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="vip">VIP</option>
            </select>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-2 rounded-xl transition-colors">Save</button>
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-medium py-2 rounded-xl transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase cursor-pointer select-none" onClick={() => toggleSort('member_id')}>
                ID{sortIndicator('member_id')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase cursor-pointer select-none" onClick={() => toggleSort('first_name')}>
                Name{sortIndicator('first_name')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase cursor-pointer select-none" onClick={() => toggleSort('membership_type')}>
                Type{sortIndicator('membership_type')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase cursor-pointer select-none" onClick={() => toggleSort('is_active')}>
                Status{sortIndicator('is_active')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase cursor-pointer select-none" onClick={() => toggleSort('join_date')}>
                Joined{sortIndicator('join_date')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td className="px-6 py-8 text-center text-muted-foreground" colSpan={8}>No members found</td>
              </tr>
            ) : (
              members.map((member: any) => (
                <tr key={member.member_id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 text-sm text-muted-foreground font-mono">{member.member_id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-foreground">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full ${getAvatarColor(member.first_name, member.last_name)} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
                        {getInitials(member.first_name, member.last_name)}
                      </span>
                      {member.first_name} {member.last_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{member.email}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{member.phone}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      member.membership_type === 'vip' ? 'bg-purple-500/10 text-purple-500'
                      : member.membership_type === 'premium' ? 'bg-blue-500/10 text-blue-500'
                      : 'bg-muted text-muted-foreground'
                    }`}>
                      {member.membership_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      member.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {member.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(member.join_date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {member.is_active && (
                      <button onClick={() => handleDeactivate(member.member_id)}
                        className="text-destructive hover:text-destructive/80 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
            <span className="ml-2">({total} total members)</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4))
              const p = start + i
              if (p > totalPages) return null
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-xl text-sm font-medium transition-colors ${
                    p === page ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {p}
                </button>
              )
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
