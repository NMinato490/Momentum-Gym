'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Clock, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { getInitials, getAvatarColor } from '@/lib/utils'

export function CheckInLogs() {
  const [search, setSearch] = useState('')
  const [logs, setLogs] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const limit = 10
  const totalPages = Math.ceil(total / limit)
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const fetchLogs = useCallback(async (q: string, p: number) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (q.trim()) params.set('search', q.trim())
      params.set('page', String(p))
      params.set('limit', String(limit))
      const res = await fetch(`/api/check-in?${params.toString()}`)
      const data = await res.json()
      setLogs(data.data || [])
      setTotal(data.total || 0)
    } catch {
      setLogs([])
      setTotal(0)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const timer = setTimeout(() => { setPage(1); fetchLogs(search, 1) }, 300)
    return () => clearTimeout(timer)
  }, [search, fetchLogs])

  useEffect(() => {
    fetchLogs(search, page)
  }, [page])

  useEffect(() => {
    fetchLogs('', 1)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => fetchLogs(search, page), 15000)
    return () => clearInterval(interval)
  }, [search, page, fetchLogs])

  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm">
      <div className="p-6 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-foreground">Check-In Logs</h2>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by member name..."
              className="w-full pl-10 pr-4 py-2 border border-input bg-card text-foreground rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-colors text-sm"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                Member
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                Zone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                Check In
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                Check Out
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                Duration
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                  Loading logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                  {search ? 'No matching check-in records found' : 'No check-in records yet'}
                </td>
              </tr>
            ) : (
              logs.map((log: any) => (
                <tr
                  key={log.log_id}
                  className="border-b border-border hover:bg-muted/50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm font-medium text-foreground">
                    <div className="flex items-center gap-3">
                      <span className={`w-8 h-8 rounded-full ${getAvatarColor(log.first_name, log.last_name)} flex items-center justify-center text-white text-xs font-semibold flex-shrink-0`}>
                        {getInitials(log.first_name, log.last_name)}
                      </span>
                      {log.first_name} {log.last_name}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">
                      {log.zone_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {new Date(log.check_in_time).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {log.check_out_time
                      ? new Date(log.check_out_time).toLocaleString()
                      : '-'}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {log.duration_minutes ? (
                      <span className="inline-flex items-center gap-1 text-foreground font-medium">
                        <Clock className="w-4 h-4" />
                        {log.duration_minutes} min
                      </span>
                    ) : (
                      <span className="text-yellow-500 font-medium">In Progress</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-border">
          <span className="text-sm text-muted-foreground">
            {total} total records
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-xl hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, idx, arr) => (
                <span key={p} className="flex items-center gap-1">
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-muted-foreground px-1">...</span>}
                  <button
                    onClick={() => setPage(p)}
                    className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
                      p === page
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    {p}
                  </button>
                </span>
              ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-xl hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
