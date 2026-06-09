'use client'

import { useState, useEffect, useRef } from 'react'
import { FileSpreadsheet, RefreshCw, Upload, ExternalLink, ChevronDown, ChevronRight, Code, Terminal, Play, ToggleLeft, ToggleRight, Clock } from 'lucide-react'
import { Toast } from '@/components/toast'
import { useSync } from '@/context/sync-context'

export function PythonSyncPipeline() {
  const {
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
  } = useSync()

  const [showCode, setShowCode] = useState(false)
  const [pythonCode, setPythonCode] = useState('')
  const logEndRef = useRef<HTMLDivElement>(null)

  const isLocal = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')

  useEffect(() => {
    fetch('/api/export/sheets/python/code')
      .then(r => r.ok ? r.text() : '')
      .then(setPythonCode)
      .catch(() => {})
  }, [])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [log])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-purple-500" />
          <span className="text-sm font-medium text-foreground">MySQL &#8594; Google Sheets (Python)</span>
          {autoSyncEnabled && (
            <span className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-600 border border-purple-500/20">
              <Clock className="w-3 h-3" />
              Auto every {autoSyncInterval}m
            </span>
          )}
        </div>
        <button
          onClick={runPipeline}
          disabled={running}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-purple-600 text-white hover:bg-purple-500 transition-colors disabled:opacity-50"
        >
          {running ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {running ? 'Running...' : 'Run Pipeline'}
        </button>
      </div>

      {error && (
        <p className="text-xs text-red-500 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
      )}

      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-500 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Open Spreadsheet
        </a>
      )}

      <div className="rounded-xl border border-border overflow-hidden">
        <button
          onClick={() => setShowCode(true)}
          className="flex items-center justify-between w-full px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">View Python Code</span>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {showCode && pythonCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowCode(false)} />
          <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-in zoom-in-95 fade-in duration-200 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10">
                  <Code className="w-4 h-4 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">Python Sync Script</h3>
              </div>
              <button onClick={() => setShowCode(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto bg-[#1e1e1e] p-4 text-gray-300">
              <pre className="text-xs font-mono leading-relaxed overflow-x-auto">
                <code>{pythonCode}</code>
              </pre>
            </div>
            <div className="p-4 border-t border-border bg-muted/30 flex justify-end">
              <button
                onClick={() => setShowCode(false)}
                className="px-4 py-2 rounded-xl border border-border bg-card text-foreground text-sm font-medium hover:bg-muted transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isLocal && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-purple-500" />
            <div>
              <p className="text-sm font-medium text-foreground">Auto-Sync</p>
              <p className="text-xs text-muted-foreground">
                {autoSyncEnabled
                  ? `Running every ${autoSyncInterval} min${lastSync ? ` · Last: ${lastSync}` : ''}`
                  : 'Automatically run pipeline on an interval'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              value={autoSyncInterval}
              onChange={e => {
                const v = parseInt(e.target.value, 10)
                if (!isNaN(v) && v > 0) setAutoSyncInterval(v)
              }}
              className="w-14 px-2 py-1.5 text-sm text-center font-mono rounded-lg border border-border bg-background text-foreground"
            />
            <span className="text-xs text-muted-foreground">min</span>
            <button
              onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                autoSyncEnabled
                  ? 'bg-purple-600 text-white'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {autoSyncEnabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
              {autoSyncEnabled ? 'On' : 'Off'}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-border bg-background">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/20">
          <Terminal className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Pipeline Output</span>
        </div>
        <div className="p-4 font-mono text-xs leading-relaxed text-foreground max-h-64 overflow-y-auto">
          {log.length === 0 && !running ? (
            <span className="text-muted-foreground">Run the pipeline to see output...</span>
          ) : (
            log.map((line, i) => (
              <div key={i} className={line.startsWith('ERROR') ? 'text-red-500' : line.startsWith('Done') ? 'text-green-500 font-semibold' : ''}>
                {line}
              </div>
            ))
          )}
          {running && (
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              Pipeline running...
            </div>
          )}
          <div ref={logEndRef} />
        </div>
      </div>
    </div>
  )
}
