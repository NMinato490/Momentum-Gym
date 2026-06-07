'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { BarChart3, Users, LogIn, LogOut, Moon, Sun, Plus, Shield } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/auth-context'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

export function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { userData } = useAuth()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [activeCount, setActiveCount] = useState<number | null>(null)

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/facility/metrics')
        const data = await res.json()
        if (data.success) setActiveCount(data.data.activeCheckIns)
      } catch {
        // ignore
      }
    }
    fetchCount()
    const interval = setInterval(fetchCount, 10000)
    return () => clearInterval(interval)
  }, [])

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: BarChart3, badge: null },
    { id: 'check-in', label: 'Check-In', icon: LogIn, badge: activeCount !== null ? String(activeCount) : null },
    { id: 'members', label: 'Customers', icon: Users, badge: null },
    ...(userData?.role === 'superadmin' ? [{ id: 'admin-management', label: 'Admin Mgmt', icon: Shield, badge: null as string | null }] : []),
  ]

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-64 bg-card border-r border-border p-6 flex flex-col m-4 rounded-3xl h-[calc(100vh-2rem)] shadow-lg">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-8">
          <Image 
            src="/logo.png" 
            alt="Logo" 
            width={40} 
            height={40} 
            className="rounded-full bg-card shadow-sm object-contain"
          />
          <div>
            <h1 className="text-lg font-bold text-foreground">Dashboard</h1>
          </div>
        </div>
      </div>

      <nav className="space-y-1 flex-1">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-4">
          Product
        </div>
        {menuItems.map(({ id, label, icon: Icon, badge }) => (
          <motion.button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-colors ${
              activeTab === id
                ? 'bg-muted text-foreground font-medium'
                : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
            }`}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </div>
            {badge !== null && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${activeTab === id ? 'bg-primary text-primary-foreground' : 'bg-muted-foreground/20 text-muted-foreground'}`}>
                {badge}
              </span>
            )}
          </motion.button>
        ))}
      </nav>

      <div className="pt-6 mt-6 border-t border-border space-y-4">
        {userData && (
          <div className="flex items-center gap-3 px-2 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex-shrink-0" />
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-foreground truncate">{userData.displayName}</p>
              <p className="text-xs text-muted-foreground truncate capitalize">{userData.role}</p>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setTheme('light')}
              className={`p-2 rounded-full transition-colors ${theme === 'light' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Sun className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setTheme('dark')}
              className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <Moon className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={handleLogout}
            className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-full"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
