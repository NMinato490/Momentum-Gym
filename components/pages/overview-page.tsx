'use client'

import { DashboardShell } from '@/components/dashboard-shell'
import { OverviewMetrics } from '@/components/overview-metrics'
import { CheckinTrends } from '@/components/checkin-trends'
import { ZoneCapacity } from '@/components/zone-capacity'
import { RightSidebar } from '@/components/right-sidebar'

export function OverviewPage() {
  return (
    <DashboardShell rightSidebar={<RightSidebar />}>
      <div className="space-y-8">
        <OverviewMetrics />
        <CheckinTrends />
        <div className="mt-8">
          <ZoneCapacity />
        </div>
      </div>
    </DashboardShell>
  )
}
