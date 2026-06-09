'use client'

import { DashboardShell } from '@/components/dashboard-shell'
import { OverviewMetrics } from '@/components/overview-metrics'
import { CheckinTrends } from '@/components/checkin-trends'
import { ZoneCapacity } from '@/components/zone-capacity'
import { RightSidebar } from '@/components/right-sidebar'
import { MembershipDistribution } from '@/components/membership-distribution'

export function OverviewPage() {
  return (
    <DashboardShell rightSidebar={<RightSidebar />}>
      <div className="space-y-8">
        <OverviewMetrics />
        <CheckinTrends />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mt-8">
          <MembershipDistribution />
          <ZoneCapacity />
        </div>
      </div>
    </DashboardShell>
  )
}
