'use client'

import { DashboardShell } from '@/components/dashboard-shell'
import { MembersTable } from '@/components/members-table'

export function MembersPage() {
  return (
    <DashboardShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Members</h1>
          <p className="text-muted-foreground">Manage gym membership database</p>
        </div>
        <MembersTable />
      </div>
    </DashboardShell>
  )
}
