'use client'

import { DashboardShell } from '@/components/dashboard-shell'
import { ProfileTab } from '@/components/profile-tab'

export function ProfilePage() {
  return (
    <DashboardShell>
      <ProfileTab />
    </DashboardShell>
  )
}
