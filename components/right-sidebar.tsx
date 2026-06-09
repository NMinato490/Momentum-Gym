'use client'

import useSWR from 'swr'
import { motion } from 'framer-motion'
import { MoreHorizontal, Users } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export function RightSidebar() {
  const { data, isLoading } = useSWR('/api/facility/metrics', fetcher, { refreshInterval: 10000 })
  const { data: checkinData } = useSWR('/api/check-in?page=1&limit=5', fetcher, { refreshInterval: 10000 })

  const summary = data?.data?.summary || []
  const recentLogs = checkinData?.data || []

  const popularZones = [...summary]
    .sort((a: any, b: any) => b.active_members - a.active_members)
    .slice(0, 5)

  const zoneColors = [
    { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400' },
    { bg: 'bg-purple-100 dark:bg-purple-500/20', text: 'text-purple-700 dark:text-purple-400' },
    { bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-400' },
    { bg: 'bg-orange-100 dark:bg-orange-500/20', text: 'text-orange-700 dark:text-orange-400' },
    { bg: 'bg-pink-100 dark:bg-pink-500/20', text: 'text-pink-700 dark:text-pink-400' },
  ]

  return (
    <aside className="w-80 bg-background border-l border-border flex flex-col h-[calc(100vh-6rem)] overflow-y-auto pb-8 px-8">
      {/* Popular Zones */}
      <div className="bg-card rounded-3xl p-6 border border-border shadow-sm mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground">Popular Zones</h2>
          <button className="w-8 h-8 rounded-full border border-border flex items-center justify-center bg-card hover:bg-muted text-muted-foreground transition-colors shadow-sm">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-14 bg-muted rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {popularZones.map((zone: any, index: number) => {
              const color = zoneColors[index % zoneColors.length]
              const trend = zone.active_members > 0 ? `+${zone.active_members}` : '0'
              const trendUp = zone.active_members > 0
              return (
                <motion.div
                  key={zone.zone_name}
                  className="flex items-center justify-between group cursor-pointer"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${color.bg} ${color.text}`}>
                      {zone.zone_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{zone.zone_name}</h3>
                      <p className="text-xs text-muted-foreground font-medium">
                        {zone.occupancy_percentage}% occupied
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{zone.active_members}</p>
                    <p className={`text-xs font-bold ${trendUp ? 'text-primary' : 'text-muted-foreground'}`}>
                      {trend} active
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent Check-ins / Activity */}
      <div className="bg-card rounded-3xl p-6 border border-border shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Recent Activity
          </h2>
          <button className="w-8 h-8 rounded-full border border-border flex items-center justify-center bg-card hover:bg-muted text-muted-foreground transition-colors shadow-sm">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {recentLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
          ) : (
            recentLogs.map((log: any, i: number) => {
              const time = log.check_in_time ? new Date(log.check_in_time).toLocaleTimeString('en-US', {
                hour: '2-digit', minute: '2-digit',
              }) : ''
              const isCheckIn = !log.check_out_time
              return (
                <div key={log.log_id || i} className="flex gap-3">
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white ${
                    isCheckIn ? 'bg-emerald-500' : 'bg-orange-500'
                  }`}>
                    {((log.first_name?.[0] || '') + (log.last_name?.[0] || '')).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-foreground truncate">
                        {log.first_name} {log.last_name}
                      </h3>
                      <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">{time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {isCheckIn ? `Checked in to ` : `Checked out from `}
                      <span className="text-primary">{log.zone_name}</span>
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </aside>
  )
}
