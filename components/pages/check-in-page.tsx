'use client'

import { DashboardShell } from '@/components/dashboard-shell'
import { CheckInForm } from '@/components/check-in-form'
import { CheckInLogs } from '@/components/check-in-logs'

export function CheckInPage() {
  return (
    <DashboardShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Check-In / Check-Out</h1>
          <p className="text-muted-foreground">Record member facility usage</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <CheckInForm />
          </div>
          <div className="lg:col-span-2">
            <CheckInLogs />
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
