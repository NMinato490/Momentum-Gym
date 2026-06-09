'use client'

import { useState } from 'react'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { RightSidebar } from './right-sidebar'
import { OverviewMetrics } from './overview-metrics'
import { CheckinTrends } from './checkin-trends'
import { MembershipDistribution } from './membership-distribution'
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Mobile overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar: hidden on mobile, shown via toggle */}
        <div className={`fixed lg:static inset-y-0 left-0 z-50 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-200`}>
          <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
          
          <div className="flex flex-1 overflow-hidden">
            <main className="flex-1 overflow-auto">
              <div className="p-4 sm:p-6 lg:p-8 pt-0">
                {activeTab === 'overview' && (
                  <div className="space-y-6 sm:space-y-8">
                    <OverviewMetrics />
                    <CheckinTrends />
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mt-6 sm:mt-8">
                      <MembershipDistribution />
                      <ZoneCapacity />
                    </div>
                  </div>
                )}
                {activeTab === 'check-in' && (
                  <div className="space-y-6 sm:space-y-8">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Check-In / Check-Out</h1>
                      <p className="text-muted-foreground">Record member facility usage</p>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
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
                  <div className="space-y-6 sm:space-y-8">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Members</h1>
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
            
            {activeTab === 'overview' && (
              <div className="hidden lg:block">
                <RightSidebar />
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
