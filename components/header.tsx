'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, Bell, User, Settings, LogOut } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  setActiveTab?: (tab: string) => void
}

export function Header({ setActiveTab }: HeaderProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <motion.header
      className="bg-transparent pt-4 px-8 pb-4"
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-md">
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-card px-4 py-2.5 rounded-full border border-border/50 shadow-sm w-64 transition-colors focus-within:border-primary/50">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim()) {
                  setActiveTab?.('members')
                }
              }}
              placeholder="Search members..."
              className="w-full bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
            />
          </div>

          <motion.button
            className="hidden sm:flex bg-foreground text-background hover:bg-foreground/90 font-medium px-5 py-2.5 rounded-full items-center gap-2 text-sm transition-colors shadow-sm"
            whileTap={{ scale: 0.95 }}
          >
            Share +
          </motion.button>

          <div className="relative" ref={dropdownRef}>
            <motion.button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center shadow-sm relative overflow-hidden border-2 border-transparent hover:border-primary transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                boxShadow: isProfileOpen ? '0 0 0 2px var(--background), 0 0 0 4px var(--primary)' : '',
              }}
            >
              <User className="w-5 h-5 text-white mix-blend-overlay" />
            </motion.button>

            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-3 w-56 bg-card border border-border shadow-lg rounded-2xl p-2 z-50 origin-top-right"
                >
                  <div className="flex flex-col gap-1">
                    <button
                      onClick={() => { setActiveTab?.('profile'); setIsProfileOpen(false) }}
                      className="flex items-center gap-3 w-full px-3 py-2 text-sm text-foreground hover:bg-muted rounded-xl transition-colors font-medium"
                    >
                      <User className="w-4 h-4 text-muted-foreground" />
                      Profile
                    </button>
                    <button
                      onClick={() => { setActiveTab?.('settings'); setIsProfileOpen(false) }}
                      className="flex items-center gap-3 w-full px-3 py-2 text-sm text-foreground hover:bg-muted rounded-xl transition-colors font-medium"
                    >
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      Settings
                    </button>
                    <div className="h-px bg-border my-1 mx-2" />
                    <button 
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-3 py-2 text-sm text-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-xl transition-colors font-medium"
                    >
                      <LogOut className="w-4 h-4 text-muted-foreground" />
                      Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.header>
  )
}
