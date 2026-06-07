'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'

interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: 'superadmin' | 'admin'
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
  const { user, userData, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push('/login')
      return
    }

    if (requiredRole) {
      if (requiredRole === 'admin' && !userData?.role?.includes('admin') && userData?.role !== 'superadmin') {
        router.push('/')
        return
      }
      if (requiredRole === 'superadmin' && userData?.role !== 'superadmin') {
        router.push('/')
        return
      }
    }
  }, [user, userData, loading, requiredRole, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}
