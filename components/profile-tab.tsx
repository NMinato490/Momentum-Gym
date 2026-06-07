'use client'

import { useAuth } from '@/context/auth-context'
import { Calendar, Mail, Shield, User } from 'lucide-react'
import { getInitials, getAvatarColor } from '@/lib/utils'

export function ProfileTab() {
  const { user, userData } = useAuth()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Profile</h1>
        <p className="text-muted-foreground">Your account information</p>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm p-8">
        <div className="flex items-center gap-6 mb-8">
          <span className={`w-20 h-20 rounded-full ${getAvatarColor(userData?.displayName, '')} flex items-center justify-center text-white text-2xl font-bold flex-shrink-0`}>
            {getInitials(userData?.displayName, '')}
          </span>
          <div>
            <h2 className="text-2xl font-bold text-foreground">{userData?.displayName || 'User'}</h2>
            <span className="inline-flex items-center gap-1.5 mt-1 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
              <Shield className="w-3 h-3" />
              {userData?.role || 'user'}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
            <Mail className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-medium text-foreground">{user?.email || userData?.email || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
            <User className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">User ID</p>
              <p className="text-sm font-medium text-foreground font-mono">{user?.id || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Member Since</p>
              <p className="text-sm font-medium text-foreground">
                {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
