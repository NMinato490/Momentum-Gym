'use client'

import { DashboardShell } from '@/components/dashboard-shell'
import { SettingsTab } from '@/components/settings-tab'

export function SettingsPage() {
  return (
    <DashboardShell>
      <SettingsTab />
    </DashboardShell>
  )
}
