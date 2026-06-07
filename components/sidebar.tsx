'use client'

import { useState, useEffect } from 'react'

import { BarChart3, Users, LogIn, LogOut, Moon, Sun, Plus, Shield, Database, RefreshCw } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/context/auth-context'
import { createClient } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'

export function Sidebar() {
  const { userData } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const activeTab = pathname === '/' ? 'overview' : pathname.replace('/', '')
  const { theme, setTheme } = useTheme()
  const [activeCount, setActiveCount] = useState<number | null>(null)
  const [mysqlConnected, setMysqlConnected] = useState<boolean | null>(null)
  const [isLocal] = useState(() => 
    typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  )

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

  useEffect(() => {
    if (!isLocal) return
    const checkMysql = async () => {
      try {
        const res = await fetch('/api/mysql/status')
        const data = await res.json()
        setMysqlConnected(data.connected)
      } catch {
        setMysqlConnected(false)
      }
    }
    checkMysql()
    const interval = setInterval(checkMysql, 10000)
    return () => clearInterval(interval)
  }, [isLocal])

  const menuItems = [
    { id: 'overview', label: 'Dashboard', icon: BarChart3, path: '/', badge: null },
    { id: 'check-in', label: 'Check-In', icon: LogIn, path: '/check-in', badge: activeCount !== null ? String(activeCount) : null },
    { id: 'members', label: 'Customers', icon: Users, path: '/members', badge: null },
    { id: 'sync', label: 'Data Sync', icon: RefreshCw, path: '/sync', badge: null },
    ...(userData?.role === 'superadmin' ? [{ id: 'admin-management', label: 'Admin Mgmt', icon: Shield, path: '/admin-management', badge: null as string | null }] : []),
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
          <svg viewBox="0 0 2048 2048" className="w-10 h-10 text-foreground" fill="currentColor">
            <path fillRule="evenodd" d="M1207.2,892.8l-175.6-178.3-375.9-2.5s209.8,148.4,222.7,155.1c-150.6,19.2-303.4,36.9-454.7,51.4.3,1.8,431,21,431,21l-16.5,62.2-558.7,39.8,538.8,30-10.9,47.7-474.6,31,455.7,53.1-34,134.2,186.5-2.5,79.2-333.7,132.2,113,106.6-60.2s163.3-91,164.3-91.8c25-19.3,80.4-23.5,80.4-23.5l201.2-.6s63.4-228.3,63.3-230.3M1262.2,1127l227.7.9s-14.6,61.7-16.3,61.5c-7.5,21,11.9,8.9-161.2,15.1-106.7-1.2-156.3,1.8-158.7-2.5-29-23.7-91.5-76.5-91.5-76.5l-15,59s-14.6,52-9.1,78.5c1.5,7.1,5.9,27.3,35.6,50.7,50.8,38.7,77,23.8,289.6,23.8s219.4,20,276.1-145.5,50.7-189.3,50.7-189.3h-241.5"/>
          </svg>
          <div>
            <h1 className="text-lg font-bold text-foreground">Momentum Gym</h1>
          </div>
        </div>
      </div>

      <nav className="space-y-1 flex-1">
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-4">
          Product
        </div>
        {menuItems.map(({ id, label, icon: Icon, path, badge }) => (
          <motion.button
            key={id}
            onClick={() => router.push(path)}
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
        {isLocal && mysqlConnected !== null && (
          <a
            href="http://127.0.0.1/phpmyadmin/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-2 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-muted/50"
          >
            <Database className="w-4 h-4" />
            <span>{mysqlConnected ? 'MySQL Connected' : 'MySQL Disconnected'}</span>
            <span className={`w-2 h-2 rounded-full ml-auto ${mysqlConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          </a>
        )}
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
