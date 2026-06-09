'use client'

import { useState, useEffect, useCallback } from 'react'
import { Shield, Plus, User, Mail, Key, Loader2, RefreshCw, MapPin, Trash2, Pencil, X } from 'lucide-react'
import { useAuth } from '@/context/auth-context'

interface CreatedAccount {
  email: string
  displayName: string
  role: string
  password: string
}

interface AdminEntry {
  id: string
  email: string
  displayName: string
  role: string
  createdAt: string
  confirmed: boolean
}

export function AdminManagement() {
  const { isSuperAdmin } = useAuth()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState<CreatedAccount | null>(null)
  const [error, setError] = useState('')
  const [admins, setAdmins] = useState<AdminEntry[]>([])
  const [loadingList, setLoadingList] = useState(true)

  const [zoneName, setZoneName] = useState('')
  const [zoneCapacity, setZoneCapacity] = useState('')
  const [zoneDescription, setZoneDescription] = useState('')
  const [zoneLoading, setZoneLoading] = useState(false)
  const [zonesList, setZonesList] = useState<any[]>([])
  const [zonesLoading, setZonesLoading] = useState(true)
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null)

  const fetchAdmins = useCallback(async () => {
    try {
      setLoadingList(true)
      const res = await fetch('/api/auth/list-admins')
      const data = await res.json()
      if (data.success) setAdmins(data.admins)
    } catch {
      // ignore
    } finally {
      setLoadingList(false)
    }
  }, [])

  const fetchZones = useCallback(async () => {
    try {
      setZonesLoading(true)
      const res = await fetch('/api/zones')
      const data = await res.json()
      if (data.success) setZonesList(data.data)
    } catch {
      // ignore
    } finally {
      setZonesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAdmins()
      fetchZones()
    }
  }, [isSuperAdmin, fetchAdmins, fetchZones])

  if (!isSuperAdmin) return null

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setCreated(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, first_name: firstName, last_name: lastName, role: 'admin' }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error)
      } else {
        setCreated(data.account)
        setFirstName('')
        setLastName('')
        setEmail('')
        fetchAdmins()
      }
    } catch {
      setError('Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  const handleAddZone = async (e: React.FormEvent) => {
    e.preventDefault()
    setZoneLoading(true)
    try {
      if (editingZoneId) {
        await fetch('/api/zones/manage', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ zone_id: editingZoneId, zone_name: zoneName, capacity: zoneCapacity, description: zoneDescription }),
        })
      } else {
        await fetch('/api/zones/manage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ zone_name: zoneName, capacity: zoneCapacity, description: zoneDescription }),
        })
      }
      setZoneName('')
      setZoneCapacity('')
      setZoneDescription('')
      setEditingZoneId(null)
      fetchZones()
    } catch {
      // ignore
    } finally {
      setZoneLoading(false)
    }
  }

  const handleEditZone = (zone: any) => {
    setEditingZoneId(zone.zone_id)
    setZoneName(zone.zone_name)
    setZoneCapacity(String(zone.capacity))
    setZoneDescription(zone.description || '')
  }

  const handleCancelEdit = () => {
    setEditingZoneId(null)
    setZoneName('')
    setZoneCapacity('')
    setZoneDescription('')
  }

  const handleDeleteZone = async (name: string) => {
    if (!confirm(`Delete zone "${name}"?`)) return
    try {
      await fetch('/api/zones/manage', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zone_name: name }),
      })
      fetchZones()
    } catch {
      // ignore
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Admin Management</h1>
        <p className="text-muted-foreground">Create and manage admin accounts</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary" />
          Create New Admin
        </h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">First Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="John"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Last Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  placeholder="Doe"
                />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="admin@gym.com"
                required
              />
            </div>
          </div>
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-4 py-2 rounded-xl">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 font-medium"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Shield className="w-4 h-4" />
            )}
            {loading ? 'Creating...' : 'Create Admin'}
          </button>
        </form>

        {created && (
          <div className="mt-6 p-4 bg-background border border-border rounded-xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <p className="font-semibold text-foreground">Account Created Successfully</p>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground"><span className="text-foreground font-medium">Name:</span> {created.displayName}</p>
              <p className="text-muted-foreground"><span className="text-foreground font-medium">Email:</span> {created.email}</p>
              <p className="text-muted-foreground"><span className="text-foreground font-medium">Role:</span> {created.role}</p>
              <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg mt-2">
                <Key className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <div>
                  <p className="text-amber-500 font-medium text-xs uppercase tracking-wider">Temporary Password</p>
                  <code className="text-foreground font-mono text-sm">{created.password}</code>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Current Admins
          </h2>
          <button
            onClick={fetchAdmins}
            className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted/50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loadingList ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Name</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Email</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Role</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {loadingList ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">No admin accounts found</td>
                </tr>
              ) : (
                admins.map((admin, i) => (
                  <tr key={admin.id} className={`${i < admins.length - 1 ? 'border-b border-border/50' : ''} hover:bg-muted/30 transition-colors`}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                          {admin.displayName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-foreground font-medium">{admin.displayName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{admin.email}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                        admin.role === 'superadmin'
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                      }`}>
                        <Shield className="w-3 h-3" />
                        {admin.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        admin.confirmed
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}>
                        {admin.confirmed ? 'Confirmed' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {new Date(admin.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Zone Management
        </h2>
        <form onSubmit={handleAddZone} className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Zone Name</label>
            <input
              type="text"
              value={zoneName}
              onChange={(e) => setZoneName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
              placeholder="e.g. Yoga Room"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Capacity</label>
            <input
              type="number"
              value={zoneCapacity}
              onChange={(e) => setZoneCapacity(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
              placeholder="30"
              min="1"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
            <input
              type="text"
              value={zoneDescription}
              onChange={(e) => setZoneDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-background border border-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
              placeholder="Optional"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={zoneLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 font-medium text-sm"
            >
              {zoneLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingZoneId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />)}
              {editingZoneId ? 'Save' : 'Add Zone'}
            </button>
            {editingZoneId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={zoneLoading}
                className="p-2 bg-muted text-muted-foreground rounded-xl hover:text-foreground transition-colors disabled:opacity-50"
                title="Cancel Edit"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Zone</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Description</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Capacity</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Active</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {zonesLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : zonesList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">No zones found</td>
                </tr>
              ) : (
                zonesList.map((zone: any, i: number) => (
                  <tr key={zone.zone_id} className={`${i < zonesList.length - 1 ? 'border-b border-border/50' : ''} hover:bg-muted/30 transition-colors`}>
                    <td className="py-3 px-4">
                      <span className="text-foreground font-medium">{zone.zone_name}</span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{zone.description || '-'}</td>
                    <td className="py-3 px-4 text-muted-foreground">{zone.capacity}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (zone.active_count || 0) > 0
                          ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {zone.active_count || 0} members
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEditZone(zone)}
                          className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
                          title="Edit zone"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteZone(zone.zone_name)}
                          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/10"
                          title="Delete zone"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
