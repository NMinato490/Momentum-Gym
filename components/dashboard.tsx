'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { RightSidebar } from './right-sidebar'
import { OverviewMetrics } from './overview-metrics'
import { CheckinTrends } from './checkin-trends'
import { ZoneCapacity } from './zone-capacity'
import { CheckInForm } from './check-in-form'
import { MembersTable } from './members-table'
import { CheckInLogs } from './check-in-logs'
import { AuthGuard } from './auth-guard'
import { ProfileTab } from './profile-tab'
import { SettingsTab } from './settings-tab'
import { AdminManagement } from './admin-management'

export function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header setActiveTab={setActiveTab} />
          
          <div className="flex flex-1 overflow-hidden">
            <main className="flex-1 overflow-auto pr-2">
              <div className="p-8 pt-0">
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    <OverviewMetrics />
                    <CheckinTrends />
                    <div className="mt-8">
                      <ZoneCapacity />
                    </div>
                  </div>
                )}
                {activeTab === 'check-in' && (
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
                )}
                {activeTab === 'members' && (
                  <div className="space-y-8">
                    <div>
                      <h1 className="text-3xl font-bold text-foreground mb-2">Members</h1>
                      <p className="text-muted-foreground">Manage gym membership database</p>
                    </div>
                    <MembersTable />
                  </div>
                )}
                {activeTab === 'profile' && <ProfileTab />}
                {activeTab === 'settings' && <SettingsTab />}
                {activeTab === 'admin-management' && <AdminManagement />}
              </div>
            </main>
            
            {/* Show right sidebar only on overview tab to match mockup layout precisely */}
            {activeTab === 'overview' && <RightSidebar />}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
