'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

interface SyncContextType {
  autoSyncEnabled: boolean
  setAutoSyncEnabled: (val: boolean) => void
  autoSyncInterval: number
  setAutoSyncInterval: (val: number) => void
  running: boolean
  log: string[]
  url: string | null
  error: string | null
  lastSync: string | null
  runPipeline: () => Promise<void>
}

const SyncContext = createContext<SyncContextType | null>(null)

export const SyncProvider = ({ children }: { children: React.ReactNode }) => {
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false)
  const [autoSyncInterval, setAutoSyncInterval] = useState(5)
  const [running, setRunning] = useState(false)
  const [log, setLog] = useState<string[]>([])
  const [url, setUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastSync, setLastSync] = useState<string | null>(null)

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedEnabled = localStorage.getItem('autoSyncEnabled')
    if (savedEnabled) setAutoSyncEnabled(savedEnabled === 'true')
    const savedInterval = localStorage.getItem('autoSyncInterval')
    if (savedInterval) setAutoSyncInterval(parseInt(savedInterval, 10))
  }, [])

  // Save settings on change
  useEffect(() => {
    localStorage.setItem('autoSyncEnabled', String(autoSyncEnabled))
    localStorage.setItem('autoSyncInterval', String(autoSyncInterval))
  }, [autoSyncEnabled, autoSyncInterval])

  const runPipeline = useCallback(async () => {
    if (running) return
    setRunning(true)
    setLog([])
    setUrl(null)
    setError(null)

    try {
      const res = await fetch('/api/export/sheets/python', { method: 'POST' })
      const data = await res.json()

      if (data.log) {
        setLog(data.log.split('\n').filter(Boolean))
      }
      if (data.url) {
        setUrl(data.url)
      }
      if (data.success) {
        setLastSync(new Date().toLocaleTimeString())
      } else {
        setError(data.error || 'Pipeline failed')
      }
    } catch {
      setError('Failed to run pipeline')
    } finally {
      setRunning(false)
    }
  }, [running])

  useEffect(() => {
    const isLocal = typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    
    if (!isLocal || !autoSyncEnabled) return

    // Run immediately when enabled
    if (!running && !lastSync) {
      runPipeline()
    }

    const ms = autoSyncInterval * 60 * 1000
    const iv = setInterval(() => {
      runPipeline()
    }, ms)

    return () => clearInterval(iv)
  }, [autoSyncEnabled, autoSyncInterval, runPipeline, lastSync])

  const value = {
    autoSyncEnabled,
    setAutoSyncEnabled,
    autoSyncInterval,
    setAutoSyncInterval,
    running,
    log,
    url,
    error,
    lastSync,
    runPipeline
  }

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>
}

export const useSync = () => {
  const context = useContext(SyncContext)
  if (!context) {
    throw new Error('useSync must be used within SyncProvider')
  }
  return context
}
