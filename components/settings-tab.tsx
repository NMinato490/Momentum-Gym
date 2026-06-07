'use client'

import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState } from 'react'

export function SettingsTab() {
  const { theme, setTheme } = useTheme()
  const [copied, setCopied] = useState(false)

  const handleCopyUid = async () => {
    try {
      await navigator.clipboard.writeText(window.location.origin)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
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
      </div>
    </div>
  )
}
