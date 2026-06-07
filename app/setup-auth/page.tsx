'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle, Loader } from 'lucide-react'

export default function SetupAuthPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [results, setResults] = useState<any[]>([])

  const handleSetupAccounts = async () => {
    setIsLoading(true)
    setStatus('loading')
    setMessage('Creating Firebase Auth accounts...')

    try {
      const response = await fetch('/api/auth/setup-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (data.success) {
        setStatus('success')
        setMessage('Firebase Auth accounts created successfully!')
        setResults(data.accounts || [])
      } else {
        setStatus('error')
        setMessage(data.error || 'Failed to create accounts')
        setResults(data.accounts || [])
      }
    } catch (error: any) {
      setStatus('error')
      setMessage(error.message || 'An error occurred')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center px-4 py-12">
      <motion.div
        className="w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo */}
        <motion.div className="flex justify-center mb-8" variants={itemVariants} custom={0}>
          <Image
            src="/logo.png"
            alt="Momentum Gym"
            width={64}
            height={64}
            priority
            className="rounded-lg"
          />
        </motion.div>

        {/* Card */}
        <motion.div className="bg-white rounded-2xl shadow-lg p-8" variants={itemVariants} custom={1}>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Setup Auth</h1>
            <p className="text-gray-600 mt-2">Create demo accounts</p>
          </div>

          <motion.div
            className="space-y-6"
            variants={itemVariants}
            custom={2}
          >
            {status === 'idle' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-6">
                  Click the button below to create the superadmin and admin accounts.
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <p className="text-xs font-semibold text-blue-900 mb-2">Accounts to be created:</p>
                  <div className="space-y-2 text-xs text-blue-800">
                    <div>
                      <strong>Superadmin:</strong> superadmin@momentumgym.com
                    </div>
                    <div>
                      <strong>Admin:</strong> admin@momentumgym.com
                    </div>
                  </div>
                </div>

                <motion.button
                  onClick={handleSetupAccounts}
                  disabled={isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-lg transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Create Accounts
                </motion.button>
              </div>
            )}

            {status === 'loading' && (
              <div className="flex flex-col items-center justify-center space-y-4">
                <Loader className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="text-gray-600">{message}</p>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-4">
                <motion.div
                  className="flex items-center gap-3 text-green-700 bg-green-50 border border-green-200 rounded-lg p-4"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                >
                  <CheckCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{message}</p>
                </motion.div>

                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-3">Accounts Created:</p>
                  <div className="space-y-2">
                    {results.map((result, index) => (
                      <motion.div
                        key={index}
                        className="text-xs text-gray-600 flex items-center gap-2"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <div>
                          <p className="font-medium">{result.email}</p>
                          <p className="text-gray-500">Role: {result.role}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <motion.a
                  href="/login"
                  className="block text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Go to Login
                </motion.a>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-4">
                <motion.div
                  className="flex items-center gap-3 text-red-700 bg-red-50 border border-red-200 rounded-lg p-4"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{message}</p>
                </motion.div>

                {results.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-3">Results:</p>
                    <div className="space-y-2">
                      {results.map((result, index) => (
                        <motion.div
                          key={index}
                          className="text-xs text-gray-600"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <p className="font-medium">{result.email}</p>
                          {result.success ? (
                            <p className="text-green-600">✓ {result.status}</p>
                          ) : (
                            <p className="text-red-600">✗ {result.error}</p>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                <motion.button
                  onClick={handleSetupAccounts}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Try Again
                </motion.button>
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.p className="text-center text-gray-500 text-sm mt-8" variants={itemVariants} custom={3}>
          © 2024 Momentum Gym. All rights reserved.
        </motion.p>
      </motion.div>
    </div>
  )
}
