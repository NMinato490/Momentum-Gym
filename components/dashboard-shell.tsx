'use client'

import { AuthGuard } from './auth-guard'
import { Sidebar } from './sidebar'
import { Header } from './header'

export function DashboardShell({ children, rightSidebar }: { children: React.ReactNode; rightSidebar?: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header />
          <div className="flex flex-1 overflow-hidden">
            <main className="flex-1 overflow-auto pr-2">
              <div className="p-8 pt-0">
                {children}
              </div>
            </main>
            {rightSidebar}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
