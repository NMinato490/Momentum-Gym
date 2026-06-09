'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Database, FileSpreadsheet, RefreshCw, Upload, ExternalLink, ArrowLeft, ToggleLeft, ToggleRight, Clock, Terminal } from 'lucide-react'
import { PythonSyncPipeline } from '@/components/python-sync-pipeline'

export default function SyncPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [isLocal, setIsLocal] = useState(false)
  const [mysqlConnected, setMysqlConnected] = useState<boolean | null>(null)
  const [mysqlPushing, setMysqlPushing] = useState(false)
  const [mysqlMsg, setMysqlMsg] = useState<string | null>(null)
  const [mysqlLastSync, setMysqlLastSync] = useState<string | null>(null)
  const [autoSyncActive, setAutoSyncActive] = useState(false)

  const [sheetsTab, setSheetsTab] = useState<'supabase' | 'python'>('supabase')
  const [sheetsEnabled, setSheetsEnabled] = useState(false)
  const [sheetsSyncing, setSheetsSyncing] = useState(false)
  const [sheetsUrl, setSheetsUrl] = useState<string | null>(null)
  const [sheetsMsg, setSheetsMsg] = useState<string | null>(null)
  const [sheetsError, setSheetsError] = useState<string | null>(null)
  const [sheetsAutoInterval, setSheetsAutoInterval] = useState(5)
  const [sheetsAutoSyncActive, setSheetsAutoSyncActive] = useState(false)
  const [sheetsLastSync, setSheetsLastSync] = useState<string | null>(null)

  useEffect(() => {
    setIsLocal(
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    )
  }, [])

  useEffect(() => {
    if (!user) return
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
  }, [user])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (!isLocal || mysqlConnected !== true) return

    setAutoSyncActive(true)
    handlePushToMysql()

    const intervalMin = parseInt(process.env.NEXT_PUBLIC_SYNC_INTERVAL || '5', 10)
    const ms = intervalMin * 60 * 1000
    const iv = setInterval(() => {
      handlePushToMysql()
    }, ms)

    return () => {
      setAutoSyncActive(false)
      clearInterval(iv)
    }
  }, [isLocal, mysqlConnected])

  useEffect(() => {
    fetch('/api/admin/config?key=sheets_auto_sync_interval')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data?.length > 0) {
          const val = parseInt(data.data[0].value, 10)
          if (!isNaN(val) && val > 0) setSheetsAutoInterval(val)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!isLocal || !sheetsEnabled) return

    setSheetsAutoSyncActive(true)
    handleSyncSheets()

    const ms = sheetsAutoInterval * 60 * 1000
    const iv = setInterval(() => {
      handleSyncSheets()
    }, ms)

    return () => {
      setSheetsAutoSyncActive(false)
      clearInterval(iv)
    }
  }, [isLocal, sheetsEnabled, sheetsAutoInterval])

  const handlePushToMysql = async () => {
    setMysqlPushing(true)
    setMysqlMsg(null)
    try {
      const res = await fetch('/api/export/mysql', { method: 'POST' })
      const data = await res.json()
      setMysqlMsg(data.message || (data.success ? 'Done' : data.error))
      if (data.success) {
        setMysqlLastSync(new Date().toLocaleTimeString())
      }
    } catch {
      setMysqlMsg('Failed to push data to MySQL')
    } finally {
      setMysqlPushing(false)
    }
  }

  const handleSyncSheets = async () => {
    setSheetsSyncing(true)
    setSheetsError(null)
    setSheetsUrl(null)
    setSheetsMsg(null)
    try {
      const res = await fetch('/api/export/sheets', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setSheetsUrl(data.url)
        setSheetsMsg(data.message)
        setSheetsLastSync(new Date().toLocaleTimeString())
      } else {
        setSheetsError(data.error || 'Sync failed')
      }
    } catch {
      setSheetsError('Failed to sync with Google Sheets')
    } finally {
      setSheetsSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user) return null

  const sheetsSection = (
    <div>
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
        Google Sheets Sync
        {isLocal && sheetsAutoSyncActive && (
          <span className="ml-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <Clock className="w-3 h-3" />
            Auto-sync every {sheetsAutoInterval}m
          </span>
        )}
      </h3>

      <div className="flex border-b border-border mb-4">
        <button
          onClick={() => setSheetsTab('supabase')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            sheetsTab === 'supabase'
              ? 'border-emerald-500 text-emerald-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Upload className="w-4 h-4" />
          Supabase (Direct)
        </button>
        <button
          onClick={() => setSheetsTab('python')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
            sheetsTab === 'python'
              ? 'border-purple-500 text-purple-600'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Terminal className="w-4 h-4" />
          MySQL &#8594; Python Pipeline
        </button>
      </div>

      {sheetsTab === 'supabase' ? (
        <div className="p-4 rounded-xl bg-muted/30 border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">Google Sheets</p>
                <p className="text-xs text-muted-foreground">Push all data to a new spreadsheet</p>
              </div>
            </div>
            <button
              onClick={() => setSheetsEnabled(!sheetsEnabled)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                sheetsEnabled ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {sheetsEnabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
              {sheetsEnabled ? 'Enabled' : 'Disabled'}
            </button>
          </div>

          {sheetsEnabled && (
            <div className="space-y-3">
              <button
                onClick={handleSyncSheets}
                disabled={sheetsSyncing}
                className="flex items-center gap-3 w-full p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/60 transition-colors text-left disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  {sheetsSyncing ? <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin" /> : <Upload className="w-5 h-5 text-emerald-600" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">Sync All Data to Google Sheets</p>
                  <p className="text-xs text-muted-foreground">Creates spreadsheet with Members, Zones, and Check-Ins sheets</p>
                </div>
                {sheetsSyncing && <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />}
              </button>

              {isLocal && sheetsAutoSyncActive && sheetsLastSync && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/20 rounded-lg px-3 py-2">
                  <RefreshCw className="w-3 h-3" />
                  Last auto-sync: {sheetsLastSync} &middot; Next: every {sheetsAutoInterval} min
                </div>
              )}

              {sheetsUrl && (
                <a href={sheetsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-500 transition-colors">
                  <ExternalLink className="w-4 h-4" />
                  Open Spreadsheet
                </a>
              )}
              {sheetsMsg && <p className="text-xs text-muted-foreground">{sheetsMsg}</p>}
              {sheetsError && <p className="text-xs text-red-500">{sheetsError}</p>}
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-muted/30 border border-border">
          <PythonSyncPipeline />
        </div>
      )}
    </div>
  )

  const header = (
    <div className="flex items-center gap-4">
      <button onClick={() => router.push('/')} className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div>
        <h1 className="text-3xl font-bold text-foreground">Data Sync</h1>
        <p className="text-muted-foreground">Automated data pipeline: Supabase → MySQL → Google Sheets</p>
      </div>
    </div>
  )

  if (!isLocal) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-3xl mx-auto p-8 space-y-8">
          {header}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-8 space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                MySQL Integration
              </h3>
              <p className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-xl">MySQL sync is only available on localhost.</p>
            </div>
            <div className="h-px bg-border" />
            {sheetsSection}
          </div>
        </div>
      </div>
    )
  }

  const intervalMin = parseInt(process.env.NEXT_PUBLIC_SYNC_INTERVAL || '5', 10)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-8 space-y-8">
        {header}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-8 space-y-8">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              MySQL Integration
              {autoSyncActive && mysqlConnected === true && (
                <span className="ml-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                  <Clock className="w-3 h-3" />
                  Auto-sync every {intervalMin}m
                </span>
              )}
            </h3>
            <div className="p-4 rounded-xl bg-muted/30 border border-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Local MySQL</p>
                    <p className="text-xs text-muted-foreground">
                      {mysqlConnected === true ? 'Connected' : mysqlConnected === false ? 'Not running' : 'Checking...'}
                    </p>
                  </div>
                  {mysqlConnected === true && <span className="w-2 h-2 rounded-full bg-green-500" />}
                  {mysqlConnected === false && <span className="w-2 h-2 rounded-full bg-red-500" />}
                </div>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-medium bg-primary/10 text-primary">
                  <ToggleRight className="w-4 h-4" />
                  Auto-Enabled
                </span>
              </div>

              {mysqlConnected === true && (
                <div className="space-y-3">
                  {autoSyncActive && mysqlLastSync && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/20 rounded-lg px-3 py-2">
                      <RefreshCw className="w-3 h-3" />
                      Last auto-sync: {mysqlLastSync} &middot; Next sync: every {intervalMin} minute(s)
                    </div>
                  )}

                  <button
                    onClick={handlePushToMysql}
                    disabled={mysqlPushing}
                    className="flex items-center gap-3 w-full p-4 rounded-xl bg-primary/10 border border-primary/30 hover:border-primary/60 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                      {mysqlPushing ? <RefreshCw className="w-5 h-5 text-primary animate-spin" /> : <Upload className="w-5 h-5 text-primary" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">Push All Data to MySQL (Manual Override)</p>
                      <p className="text-xs text-muted-foreground">Members, zones, and check-ins to local database</p>
                    </div>
                    {mysqlPushing && <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
                  </button>
                  {mysqlMsg && <p className="text-xs text-muted-foreground">{mysqlMsg}</p>}
                </div>
              )}

              {mysqlConnected === false && (
                <p className="text-xs text-muted-foreground">Make sure MySQL is running on localhost:3306</p>
              )}
            </div>
          </div>

          <div className="h-px bg-border" />
          {sheetsSection}
        </div>
      </div>
    </div>
  )
}
