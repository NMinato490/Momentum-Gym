'use client'

import { Search, Bell, User, Settings, LogOut, Menu } from 'lucide-react'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function Header({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const router = useRouter()

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
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-muted/50"
          >
            <Menu className="w-5 h-5" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center shadow-sm relative overflow-hidden border-2 border-transparent hover:border-primary transition-all outline-none"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <User className="w-5 h-5 text-white mix-blend-overlay" />
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-2 p-2 rounded-2xl border border-border shadow-lg bg-card">
              <DropdownMenuItem 
                onClick={() => router.push('/profile')}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer text-sm font-medium rounded-xl hover:bg-muted focus:bg-muted transition-colors"
              >
                <User className="w-4 h-4 text-muted-foreground" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => router.push('/settings')}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer text-sm font-medium rounded-xl hover:bg-muted focus:bg-muted transition-colors"
              >
                <Settings className="w-4 h-4 text-muted-foreground" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 mx-2 bg-border" />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer text-sm font-medium rounded-xl hover:bg-red-50 hover:text-red-600 focus:bg-red-50 focus:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:focus:bg-red-900/20 dark:focus:text-red-400 transition-colors"
              >
                <LogOut className="w-4 h-4 text-muted-foreground" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  )
}
