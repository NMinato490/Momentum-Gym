'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { Database, FileSpreadsheet, RefreshCw, Upload, ExternalLink, ArrowLeft, ToggleLeft, ToggleRight } from 'lucide-react'

export default function SyncPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const [isLocal, setIsLocal] = useState(false)
  const [mysqlConnected, setMysqlConnected] = useState<boolean | null>(null)
  const [mysqlEnabled, setMysqlEnabled] = useState(false)
  const [mysqlPushing, setMysqlPushing] = useState(false)
  const [mysqlMsg, setMysqlMsg] = useState<string | null>(null)

  const [sheetsEnabled, setSheetsEnabled] = useState(false)
  const [sheetsSyncing, setSheetsSyncing] = useState(false)
  const [sheetsUrl, setSheetsUrl] = useState<string | null>(null)
  const [sheetsMsg, setSheetsMsg] = useState<string | null>(null)
  const [sheetsError, setSheetsError] = useState<string | null>(null)

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

  const handlePushToMysql = async () => {
    setMysqlPushing(true)
    setMysqlMsg(null)
    try {
      const res = await fetch('/api/export/mysql', { method: 'POST' })
      const data = await res.json()
      setMysqlMsg(data.message || (data.success ? 'Done' : data.error))
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
      </h3>
      <div className="p-4 rounded-xl bg-muted/30 border border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-medium text-foreground">Google Sheets</p>
              <p className="text-xs text-muted-foreground">Create a new spreadsheet with all data</p>
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
    </div>
  )

  const header = (
    <div className="flex items-center gap-4">
      <button onClick={() => router.push('/')} className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-5 h-5" />
      </button>
      <div>
        <h1 className="text-3xl font-bold text-foreground">Data Sync</h1>
        <p className="text-muted-foreground">Sync your data to MySQL and Google Sheets</p>
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
                <button
                  onClick={() => setMysqlEnabled(!mysqlEnabled)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    mysqlEnabled ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {mysqlEnabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  {mysqlEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {mysqlEnabled && mysqlConnected === true && (
                <div className="space-y-3">
                  <button
                    onClick={handlePushToMysql}
                    disabled={mysqlPushing}
                    className="flex items-center gap-3 w-full p-4 rounded-xl bg-primary/10 border border-primary/30 hover:border-primary/60 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                      {mysqlPushing ? <RefreshCw className="w-5 h-5 text-primary animate-spin" /> : <Upload className="w-5 h-5 text-primary" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">Push All Data to MySQL</p>
                      <p className="text-xs text-muted-foreground">Members, zones, and check-ins to local database</p>
                    </div>
                    {mysqlPushing && <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />}
                  </button>
                  {mysqlMsg && <p className="text-xs text-muted-foreground">{mysqlMsg}</p>}
                </div>
              )}

              {mysqlEnabled && mysqlConnected === false && (
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
