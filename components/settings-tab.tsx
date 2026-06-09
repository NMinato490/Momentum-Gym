'use client'

import { Moon, Sun, Monitor, Database, Download, Upload, ToggleLeft, ToggleRight, RefreshCw, FileSpreadsheet, ExternalLink, Clock } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { getConfig, setConfig } from '@/lib/logging'

export function SettingsTab() {
  const { theme, setTheme } = useTheme()
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState<'sql' | 'csv-members' | 'csv-checkins' | 'csv-zones' | 'csv-facility-summary' | 'mysql' | null>(null)
  const [mysqlEnabled, setMysqlEnabled] = useState(false)
  const [mysqlConnected, setMysqlConnected] = useState<boolean | null>(null)
  const [mysqlPushing, setMysqlPushing] = useState(false)
  const [sheetsEnabled, setSheetsEnabled] = useState(false)
  const [sheetsSyncing, setSheetsSyncing] = useState(false)
  const [sheetsUrl, setSheetsUrl] = useState<string | null>(null)
  const [sheetsError, setSheetsError] = useState<string | null>(null)
  const [sheetsAutoInterval, setSheetsAutoInterval] = useState('5')
  const [sheetsAutoIntervalInput, setSheetsAutoIntervalInput] = useState('5')
  const [sheetsAutoSaving, setSheetsAutoSaving] = useState(false)
  const [isLocal] = useState(() =>
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  )

  useEffect(() => {
    if (!isLocal || !mysqlEnabled) return
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
  }, [isLocal, mysqlEnabled])

  useEffect(() => {
    getConfig('sheets_auto_sync_interval').then(val => {
      if (val) {
        setSheetsAutoInterval(val)
        setSheetsAutoIntervalInput(val)
      }
    })
  }, [])

  const handleApplySheetsInterval = async () => {
    const mins = parseInt(sheetsAutoIntervalInput, 10)
    if (isNaN(mins) || mins < 1) return
    setSheetsAutoSaving(true)
    await setConfig('sheets_auto_sync_interval', String(mins))
    setSheetsAutoInterval(String(mins))
    setSheetsAutoSaving(false)
  }

  const handleCopyUid = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const handleSyncSheets = async () => {
    setSheetsSyncing(true)
    setSheetsError(null)
    setSheetsUrl(null)
    try {
      const res = await fetch('/api/export/sheets', { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        setSheetsUrl(data.url)
      } else {
        setSheetsError(data.error || 'Sync failed')
      }
    } catch {
      setSheetsError('Failed to sync with Google Sheets')
    } finally {
      setSheetsSyncing(false)
    }
  }

  const handlePushToMysql = async () => {
    setMysqlPushing(true)
    try {
      const res = await fetch('/api/export/mysql', { method: 'POST' })
      const data = await res.json()
      alert(data.message || (data.success ? 'Data pushed to MySQL successfully!' : 'Push failed'))
    } catch {
      alert('Failed to push data to MySQL')
    } finally {
      setMysqlPushing(false)
    }
  }

  const handleExport = async (format: 'sql' | 'csv', table?: string) => {
    const key = format === 'sql' ? 'sql' : `csv-${table}` as any
    setExporting(key)
    try {
      const params = format === 'sql' ? 'format=sql' : `format=csv&table=${table}`
      const res = await fetch(`/api/export?${params}`)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      if (format === 'sql') {
        a.download = `momentum-gym-export-${Date.now()}.sql`
      } else {
        a.download = `${table}-${Date.now()}.csv`
      }
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Export failed:', err)
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your preferences</p>
      </div>

      <div className="bg-card rounded-2xl border border-border shadow-sm p-8 space-y-8">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Appearance</h3>
          <div className="flex gap-3">
            {[
              { key: 'light', icon: Sun, label: 'Light' },
              { key: 'dark', icon: Moon, label: 'Dark' },
              { key: 'system', icon: Monitor, label: 'System' },
            ].map(({ key, icon: Icon, label }) => (
              <button
                key={key}
                onClick={() => setTheme(key)}
                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-colors ${
                  theme === key
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-input hover:border-muted-foreground/30 text-muted-foreground'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {isLocal && <div className="h-px bg-border" />}

        {isLocal && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Application</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-foreground">Dashboard URL</p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">{typeof window !== 'undefined' ? window.location.origin : '—'}</p>
                </div>
                <button
                  onClick={handleCopyUid}
                  className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-foreground">Version</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {isLocal && <div className="h-px bg-border" />}

        {isLocal && (
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">System Config</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-foreground">Auto-Sync Interval</p>
                  <p className="text-xs text-muted-foreground">Supabase → MySQL sync frequency (env: SYNC_INTERVAL_MINUTES)</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-foreground bg-background px-3 py-1 rounded-lg border border-border">
                    {process.env.NEXT_PUBLIC_SYNC_INTERVAL || '5'} min
                  </span>
                </div>
              </div>
              <a
                href="/sync"
                className="flex items-center justify-between p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">Sync Dashboard</p>
                  <p className="text-xs text-muted-foreground">View auto-sync status and manual override</p>
                </div>
                <RefreshCw className="w-4 h-4 text-muted-foreground" />
              </a>
            </div>
          </div>
        )}

        {isLocal && <div className="h-px bg-border" />}

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Data Export
          </h3>
          <p className="text-sm text-muted-foreground mb-4">Export all data to import into MySQL.</p>

          {isLocal && (
            <div className="mb-4 p-4 rounded-xl bg-muted/30 border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Database className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">MySQL Integration</p>
                    <p className="text-xs text-muted-foreground">
                      {mysqlConnected === true ? 'Connected to local MySQL' : mysqlConnected === false ? 'MySQL not running' : 'Checking...'}
                    </p>
                  </div>
                  {mysqlConnected === true && <span className="w-2 h-2 rounded-full bg-green-500" />}
                  {mysqlConnected === false && <span className="w-2 h-2 rounded-full bg-red-500" />}
                </div>
                <button
                  onClick={() => setMysqlEnabled(!mysqlEnabled)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    mysqlEnabled
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {mysqlEnabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  {mysqlEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {mysqlEnabled && mysqlConnected === true && (
                <div className="mt-3 pt-3 border-t border-border">
                  <button
                    onClick={handlePushToMysql}
                    disabled={mysqlPushing}
                    className="flex items-center gap-3 w-full p-4 rounded-xl bg-primary/10 border border-primary/30 hover:border-primary/60 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                      {mysqlPushing ? (
                        <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">Push All Data to MySQL</p>
                      <p className="text-xs text-muted-foreground">Export members, check-ins, and zones to local database</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="mb-4 p-4 rounded-xl bg-muted/30 border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Google Sheets Sync</p>
                    <p className="text-xs text-muted-foreground">Sync data to a Google Sheet</p>
                  </div>
                </div>
                <button
                  onClick={() => setSheetsEnabled(!sheetsEnabled)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    sheetsEnabled
                      ? 'bg-emerald-600 text-white'
                      : 'bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {sheetsEnabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  {sheetsEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>

              {sheetsEnabled && (
                <div className="mt-3 pt-3 border-t border-border space-y-3">
                  <button
                    onClick={handleSyncSheets}
                    disabled={sheetsSyncing}
                    className="flex items-center gap-3 w-full p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500/60 transition-colors text-left disabled:opacity-50"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      {sheetsSyncing ? (
                        <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5 text-emerald-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">Sync All Data to Google Sheets</p>
                      <p className="text-xs text-muted-foreground">Creates a new spreadsheet with members, zones, and check-ins</p>
                    </div>
                    {sheetsSyncing && (
                      <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    )}
                  </button>

                  {sheetsUrl && (
                    <a
                      href={sheetsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-500 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Spreadsheet
                    </a>
                  )}

                  {sheetsError && (
                    <p className="text-xs text-red-500">{sheetsError}</p>
                  )}
                </div>
              )}

              {isLocal && sheetsEnabled && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-emerald-500" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Auto-Sync Interval</p>
                        <p className="text-xs text-muted-foreground">Automatically sync to Google Sheets every N minutes</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={sheetsAutoIntervalInput}
                        onChange={e => setSheetsAutoIntervalInput(e.target.value)}
                        className="w-16 px-2 py-1.5 text-sm text-center font-mono rounded-lg border border-border bg-background text-foreground"
                      />
                      <span className="text-sm text-muted-foreground">min</span>
                      <button
                        onClick={handleApplySheetsInterval}
                        disabled={sheetsAutoSaving}
                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
                      >
                        {sheetsAutoSaving ? 'Saving...' : 'Apply'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => handleExport('sql')}
              disabled={exporting !== null}
              className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border hover:border-primary/40 transition-colors text-left disabled:opacity-50"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">SQL Dump</p>
                <p className="text-xs text-muted-foreground truncate">Single .sql file with all tables</p>
              </div>
              {exporting === 'sql' ? (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin ml-auto" />
              ) : (
                <Download className="w-5 h-5 text-muted-foreground ml-auto flex-shrink-0" />
              )}
            </button>
            <button
              onClick={() => handleExport('csv', 'members')}
              disabled={exporting !== null}
              className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border hover:border-primary/40 transition-colors text-left disabled:opacity-50"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5 text-blue-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Members CSV</p>
                <p className="text-xs text-muted-foreground truncate">members table as CSV</p>
              </div>
              {exporting === 'csv-members' ? (
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin ml-auto" />
              ) : (
                <Download className="w-5 h-5 text-muted-foreground ml-auto flex-shrink-0" />
              )}
            </button>
            <button
              onClick={() => handleExport('csv', 'check_ins')}
              disabled={exporting !== null}
              className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border hover:border-primary/40 transition-colors text-left disabled:opacity-50"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Check-ins CSV</p>
                <p className="text-xs text-muted-foreground truncate">check_ins table as CSV</p>
              </div>
              {exporting === 'csv-checkins' ? (
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin ml-auto" />
              ) : (
                <Download className="w-5 h-5 text-muted-foreground ml-auto flex-shrink-0" />
              )}
            </button>
            <button
              onClick={() => handleExport('csv', 'zones')}
              disabled={exporting !== null}
              className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border hover:border-primary/40 transition-colors text-left disabled:opacity-50"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5 text-orange-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Zones CSV</p>
                <p className="text-xs text-muted-foreground truncate">zones table as CSV</p>
              </div>
              {exporting === 'csv-zones' ? (
                <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin ml-auto" />
              ) : (
                <Download className="w-5 h-5 text-muted-foreground ml-auto flex-shrink-0" />
              )}
            </button>
            <button
              onClick={() => handleExport('csv', 'facility-summary')}
              disabled={exporting !== null}
              className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 border border-border hover:border-primary/40 transition-colors text-left disabled:opacity-50"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5 text-purple-500" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Facility Summary CSV</p>
                <p className="text-xs text-muted-foreground truncate">zone occupancy summary as CSV</p>
              </div>
              {exporting === 'csv-facility-summary' ? (
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin ml-auto" />
              ) : (
                <Download className="w-5 h-5 text-muted-foreground ml-auto flex-shrink-0" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
