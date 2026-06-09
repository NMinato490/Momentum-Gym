'use client'

import useSWR from 'swr'
import { Trash2, Plus, Search, ChevronLeft, ChevronRight, Pencil, RotateCcw, X, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { getInitials, getAvatarColor } from '@/lib/utils'
import { useState, useRef, useCallback, useEffect } from 'react'
import { Toast } from '@/components/toast'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const PAGE_SIZE = 20

// ─── Confirmation Modal ──────────────────────────────────────────────────────
function ConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  confirmVariant?: 'danger' | 'primary'
  onConfirm: () => void
  onCancel: () => void
  loading?: boolean
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onCancel} />
      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 fade-in duration-200 overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className={`p-2.5 rounded-xl flex-shrink-0 ${confirmVariant === 'danger' ? 'bg-destructive/10' : 'bg-primary/10'}`}>
              {confirmVariant === 'danger' ? (
                <AlertTriangle className="w-5 h-5 text-destructive" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-primary" />
              )}
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-semibold text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 border-t border-border bg-muted/30">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 ${
              confirmVariant === 'danger'
                ? 'bg-destructive hover:bg-destructive/90 text-white'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                Processing...
              </span>
            ) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Edit Member Modal ───────────────────────────────────────────────────────
function EditMemberModal({
  open,
  member,
  onSave,
  onCancel,
  loading,
}: {
  open: boolean
  member: any
  onSave: (data: any) => void
  onCancel: () => void
  loading?: boolean
}) {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    membership_type: 'basic',
  })

  useEffect(() => {
    if (member) {
      setForm({
        first_name: member.first_name || '',
        last_name: member.last_name || '',
        email: member.email || '',
        phone: member.phone || '',
        membership_type: member.membership_type || 'basic',
      })
    }
  }, [member])

  if (!open || !member) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onCancel} />
      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 fade-in duration-200 overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Pencil className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Edit Member</h3>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">First Name</label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-input bg-background text-foreground rounded-xl focus:ring-2 focus:ring-primary/40 outline-none text-sm transition-shadow"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Name</label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                required
                className="w-full px-4 py-2.5 border border-input bg-background text-foreground rounded-xl focus:ring-2 focus:ring-primary/40 outline-none text-sm transition-shadow"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2.5 border border-input bg-background text-foreground rounded-xl focus:ring-2 focus:ring-primary/40 outline-none text-sm transition-shadow"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-2.5 border border-input bg-background text-foreground rounded-xl focus:ring-2 focus:ring-primary/40 outline-none text-sm transition-shadow"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Membership Type</label>
            <select
              value={form.membership_type}
              onChange={(e) => setForm({ ...form, membership_type: e.target.value })}
              className="w-full px-4 py-2.5 border border-input bg-background text-foreground rounded-xl focus:ring-2 focus:ring-primary/40 outline-none text-sm transition-shadow"
            >
              <option value="basic">Basic</option>
              <option value="premium">Premium</option>
              <option value="vip">VIP</option>
            </select>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  Saving...
                </span>
              ) : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Members Table ───────────────────────────────────────────────────────────
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

  // Modal state
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [restoreTarget, setRestoreTarget] = useState<any>(null)
  const [editTarget, setEditTarget] = useState<any>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null)

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type })
  }, [])

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
        showToast('Member added successfully', 'success')
      } else {
        showToast('Failed to add member', 'error')
      }
    } catch (error) {
      console.log('[v0] Error adding member:', error)
      showToast('Failed to add member', 'error')
    }
  }

  // Delete (deactivate) with confirmation
  const handleDeactivateConfirm = async () => {
    if (!deleteTarget) return
    setActionLoading(true)
    try {
      const response = await fetch(`/api/members/${deleteTarget.member_id}`, { method: 'DELETE' })
      if (response.ok) {
        mutate()
        showToast(`${deleteTarget.first_name} ${deleteTarget.last_name} has been deactivated`, 'success')
      } else {
        showToast('Failed to deactivate member', 'error')
      }
    } catch (error) {
      console.log('[v0] Error deactivating member:', error)
      showToast('Failed to deactivate member', 'error')
    } finally {
      setActionLoading(false)
      setDeleteTarget(null)
    }
  }

  // Restore with confirmation
  const handleRestoreConfirm = async () => {
    if (!restoreTarget) return
    setActionLoading(true)
    try {
      const response = await fetch(`/api/members/${restoreTarget.member_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore' }),
      })
      if (response.ok) {
        mutate()
        showToast(`${restoreTarget.first_name} ${restoreTarget.last_name} has been restored`, 'success')
      } else {
        showToast('Failed to restore member', 'error')
      }
    } catch (error) {
      console.log('[v0] Error restoring member:', error)
      showToast('Failed to restore member', 'error')
    } finally {
      setActionLoading(false)
      setRestoreTarget(null)
    }
  }

  // Edit member
  const handleEditSave = async (formValues: any) => {
    if (!editTarget) return
    setActionLoading(true)
    try {
      const response = await fetch(`/api/members/${editTarget.member_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formValues),
      })
      if (response.ok) {
        mutate()
        showToast(`${formValues.first_name} ${formValues.last_name} updated successfully`, 'success')
      } else {
        showToast('Failed to update member', 'error')
      }
    } catch (error) {
      console.log('[v0] Error updating member:', error)
      showToast('Failed to update member', 'error')
    } finally {
      setActionLoading(false)
      setEditTarget(null)
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

  const getMembershipBadge = (type: string) => {
    switch (type) {
      case 'vip': return 'bg-purple-500/10 text-purple-500'
      case 'premium': return 'bg-blue-500/10 text-blue-500'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  if (isLoading && members.length === 0) {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-sm p-8">
        <div className="text-center py-8 text-muted-foreground">Loading members...</div>
      </div>
    )
  }

  return (
    <>
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

        {/* ── Desktop Table (hidden on mobile) ─────────────────────────────── */}
        <div className="hidden lg:block overflow-x-auto">
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
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getMembershipBadge(member.membership_type)}`}>
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
                      <div className="flex items-center gap-1">
                        {/* Edit */}
                        <button
                          onClick={() => setEditTarget(member)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Edit member"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {/* Restore or Delete */}
                        {member.is_active ? (
                          <button
                            onClick={() => setDeleteTarget(member)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            title="Deactivate member"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setRestoreTarget(member)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Restore member"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── Mobile Card Layout (visible on mobile/tablet) ────────────────── */}
        <div className="lg:hidden divide-y divide-border">
          {members.length === 0 ? (
            <div className="px-6 py-8 text-center text-muted-foreground">No members found</div>
          ) : (
            members.map((member: any) => (
              <div key={member.member_id} className="p-4 space-y-3 hover:bg-muted/30 transition-colors">
                {/* Top row: avatar + name + badges */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`w-10 h-10 rounded-full ${getAvatarColor(member.first_name, member.last_name)} flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}>
                      {getInitials(member.first_name, member.last_name)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {member.first_name} {member.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">{member.member_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${getMembershipBadge(member.membership_type)}`}>
                      {member.membership_type}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      member.is_active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {member.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-muted-foreground pl-[52px]">
                  {member.email && (
                    <p className="truncate">
                      <span className="font-medium text-foreground/60">Email:</span> {member.email}
                    </p>
                  )}
                  {member.phone && (
                    <p>
                      <span className="font-medium text-foreground/60">Phone:</span> {member.phone}
                    </p>
                  )}
                  <p>
                    <span className="font-medium text-foreground/60">Joined:</span> {new Date(member.join_date).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pl-[52px]">
                  <button
                    onClick={() => setEditTarget(member)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted border border-border transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  {member.is_active ? (
                    <button
                      onClick={() => setDeleteTarget(member)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-border transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Deactivate
                    </button>
                  ) : (
                    <button
                      onClick={() => setRestoreTarget(member)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 border border-border transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Restore
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
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

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <ConfirmModal
        open={!!deleteTarget}
        title="Deactivate Member"
        description={deleteTarget ? `Are you sure you want to deactivate ${deleteTarget.first_name} ${deleteTarget.last_name}? Their membership will be set to inactive. You can restore it later.` : ''}
        confirmLabel="Deactivate"
        confirmVariant="danger"
        onConfirm={handleDeactivateConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={actionLoading}
      />

      <ConfirmModal
        open={!!restoreTarget}
        title="Restore Member"
        description={restoreTarget ? `Are you sure you want to restore ${restoreTarget.first_name} ${restoreTarget.last_name}'s membership? Their status will be set back to active.` : ''}
        confirmLabel="Restore"
        confirmVariant="primary"
        onConfirm={handleRestoreConfirm}
        onCancel={() => setRestoreTarget(null)}
        loading={actionLoading}
      />

      <EditMemberModal
        open={!!editTarget}
        member={editTarget}
        onSave={handleEditSave}
        onCancel={() => setEditTarget(null)}
        loading={actionLoading}
      />

      {/* ── Toast ───────────────────────────────────────────────────────────── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  )
}
