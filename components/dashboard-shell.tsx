'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { AuthGuard } from './auth-guard'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { useSync } from '@/context/sync-context'
import { Toast } from './toast'

export function DashboardShell({ children, rightSidebar }: { children: React.ReactNode; rightSidebar?: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { lastSync, error } = useSync()
  const [toastMessage, setToastMessage] = useState<{message: string, type: 'success' | 'error'} | null>(null)

  useEffect(() => {
    if (lastSync) {
      setToastMessage({ message: `Python pipeline synced successfully at ${lastSync}`, type: 'success' })
    }
  }, [lastSync])

  useEffect(() => {
    if (error) {
      setToastMessage({ message: `Python sync error: ${error}`, type: 'error' })
    }
  }, [error])

  return (
    <AuthGuard>
      <div className="flex h-screen bg-background overflow-hidden">
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <div className={`fixed lg:static inset-y-0 left-0 z-50 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-200`}>
          <Sidebar onNavigate={() => setMobileMenuOpen(false)} />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <Header onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
          <div className="flex flex-1 overflow-hidden">
            <main className="flex-1 overflow-auto">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="px-4 sm:px-6 lg:px-8 pt-0"
              >
                {children}
              </motion.div>
            </main>
            {rightSidebar && <div className="hidden lg:block">{rightSidebar}</div>}
          </div>
        </div>
      </div>
      {toastMessage && (
        <Toast
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}
    </AuthGuard>
  )
}
