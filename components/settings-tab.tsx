'use client'

import { Moon, Sun, Monitor, Database, Download } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState } from 'react'

export function SettingsTab() {
  const { theme, setTheme } = useTheme()
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState<'sql' | 'csv-members' | 'csv-checkins' | 'csv-zones' | null>(null)

  const handleCopyUid = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
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

        <div className="h-px bg-border" />

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

        <div className="h-px bg-border" />

        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Data Export
          </h3>
          <p className="text-sm text-muted-foreground mb-4">Export all data to import into MySQL.</p>
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
          </div>
        </div>
      </div>
    </div>
  )
}
