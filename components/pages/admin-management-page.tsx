'use client'

import { DashboardShell } from '@/components/dashboard-shell'
import { AdminManagement } from '@/components/admin-management'

export function AdminManagementPage() {
  return (
    <DashboardShell>
      <AdminManagement />
    </DashboardShell>
  )
}
