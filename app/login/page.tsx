'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import Image from 'next/image'
import { motion } from 'framer-motion'

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
          <div className="relative w-16 h-16">
            <Image
              src="/logo.png"
              alt="Momentum Gym"
              width={64}
              height={64}
              priority
              className="rounded-lg"
            />
          </div>
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

        <motion.p className="text-center text-muted-foreground text-xs mt-4" variants={itemVariants} custom={6}>
          Need to create accounts?{' '}
          <a href="/setup-auth" className="text-primary hover:text-primary/80 font-medium">
            Setup Auth
          </a>
        </motion.p>

        <motion.p className="text-center text-muted-foreground text-sm mt-8" variants={itemVariants} custom={6}>
          © {new Date().getFullYear()} Momentum Gym. All rights reserved.
        </motion.p>
      </motion.div>
    </div>
  )
}
