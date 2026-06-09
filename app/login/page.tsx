'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { logLoginEvent } from '@/lib/logging'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        logLoginEvent({ email, action: 'login_failed', metadata: { reason: error.message } })
        if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please try again.')
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please confirm your email address.')
        } else {
          setError(error.message)
        }
      } else {
        router.push('/')
      }
    } catch (err: any) {
      logLoginEvent({ email, action: 'login_failed', metadata: { reason: err.message } })
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.4 },
    }),
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center px-4 py-12">
      <motion.div className="w-full max-w-md" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div className="flex justify-center mb-8" variants={itemVariants} custom={0}>
          <svg viewBox="0 0 2048 2048" className="w-16 h-16 text-foreground" fill="currentColor">
            <path fillRule="evenodd" d="M1207.2,892.8l-175.6-178.3-375.9-2.5s209.8,148.4,222.7,155.1c-150.6,19.2-303.4,36.9-454.7,51.4.3,1.8,431,21,431,21l-16.5,62.2-558.7,39.8,538.8,30-10.9,47.7-474.6,31,455.7,53.1-34,134.2,186.5-2.5,79.2-333.7,132.2,113,106.6-60.2s163.3-91,164.3-91.8c25-19.3,80.4-23.5,80.4-23.5l201.2-.6s63.4-228.3,63.3-230.3M1262.2,1127l227.7.9s-14.6,61.7-16.3,61.5c-7.5,21,11.9,8.9-161.2,15.1-106.7-1.2-156.3,1.8-158.7-2.5-29-23.7-91.5-76.5-91.5-76.5l-15,59s-14.6,52-9.1,78.5c1.5,7.1,5.9,27.3,35.6,50.7,50.8,38.7,77,23.8,289.6,23.8s219.4,20,276.1-145.5,50.7-189.3,50.7-189.3h-241.5"/>
          </svg>
        </motion.div>

        <motion.div className="bg-card border border-border rounded-2xl shadow-lg p-8" variants={itemVariants} custom={1}>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground">Momentum Gym</h1>
            <p className="text-muted-foreground mt-2">Management Dashboard</p>
          </div>

          {error && (
            <motion.div
              className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <motion.div variants={itemVariants} custom={2}>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 border border-input bg-card text-foreground placeholder-muted-foreground rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                required
              />
            </motion.div>

            <motion.div variants={itemVariants} custom={3}>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 border border-input bg-card text-foreground placeholder-muted-foreground rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                required
              />
            </motion.div>

            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              variants={itemVariants}
              custom={4}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </motion.button>
          </form>
        </motion.div>

        <motion.p className="text-center text-muted-foreground text-sm mt-8" variants={itemVariants} custom={6}>
          © {new Date().getFullYear()} Momentum Gym. All rights reserved.
        </motion.p>
      </motion.div>
    </div>
  )
}
