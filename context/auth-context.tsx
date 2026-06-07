'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface UserData {
  uid: string
  email: string
  displayName: string
  role: 'superadmin' | 'admin' | 'staff' | 'user'
  createdAt: number
}

interface AuthContextType {
  user: User | null
  userData: UserData | null
  loading: boolean
  isSuperAdmin: boolean
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  isSuperAdmin: false,
  isAdmin: false,
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        const role = (currentUser.user_metadata?.role as string) || 'admin'
        setUserData({
          uid: currentUser.id,
          email: currentUser.email || '',
          displayName: currentUser.user_metadata?.display_name || currentUser.email?.split('@')[0] || 'User',
          role: role as UserData['role'],
          createdAt: new Date(currentUser.created_at).getTime(),
        })
      } else {
        setUserData(null)
      }

      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const value = {
    user,
    userData,
    loading,
    isSuperAdmin: userData?.role === 'superadmin',
    isAdmin: userData?.role === 'admin' || userData?.role === 'superadmin',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
