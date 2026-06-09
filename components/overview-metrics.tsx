'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Users, Zap, ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react'
import { motion } from 'framer-motion'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function OverviewMetrics() {
  const [timeRange, setTimeRange] = useState('7d')
  const { data, isLoading } = useSWR(`/api/facility/metrics?range=${timeRange}`, fetcher, {
    refreshInterval: 10000,
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div key={i} className="h-40 bg-card rounded-3xl animate-pulse border border-border" />
        ))}
      </div>
    )
  }

  const { activeMembers = 0, totalCapacity = 0, newToday = 0, trends = {}, recentMembers = [] } = data?.data || {}

  const metrics = [
    {
      label: 'Customers',
      value: activeMembers,
      icon: Users,
      trend: trends.customers || '+0%',
      isPositive: (trends.customers || '').startsWith('+'),
      subtext: 'vs last month',
    },
    {
      label: 'Capacity Used',
      value: totalCapacity,
      icon: Zap,
      trend: trends.capacity || '+0%',
      isPositive: (trends.capacity || '').startsWith('+'),
      subtext: 'vs last month',
    },
  ]

  return (
    <div className="bg-card/50 p-6 rounded-3xl border border-border shadow-sm mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">Overview</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="bg-transparent border border-border text-muted-foreground text-sm rounded-full px-4 py-1.5 outline-none focus:border-primary"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="1y">This Year</option>
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {metrics.map(({ label, value, icon: Icon, trend, isPositive, subtext }, index) => (
          <motion.div
            key={label}
            className="bg-card rounded-[1.5rem] p-6 border border-border shadow-sm flex flex-col justify-between"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
            whileHover={{ y: -2 }}
          >
            <div className="flex items-center gap-2 mb-4 text-muted-foreground">
              <Icon className="w-5 h-5" />
              <span className="font-medium">{label}</span>
            </div>

            <div className="flex items-end gap-4">
              <motion.span
                className="text-5xl font-bold text-foreground"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.2, duration: 0.6 }}
              >
                {value}
              </motion.span>

              <div className="flex flex-col items-start pb-1">
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md ${
                  isPositive ? 'text-primary bg-primary/10' : 'text-destructive bg-destructive/10'
                }`}>
                  {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {trend}
                </div>
                <span className="text-xs text-muted-foreground mt-1">{subtext}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 mb-2 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">
            {newToday > 0 ? `${newToday} new customer${newToday !== 1 ? 's' : ''} today!` : 'No new customers today'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {newToday > 0 ? 'Send a welcome message to all new customers.' : 'Check back later for new signups.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {recentMembers.length > 0 && (
            <div className="flex -space-x-2 mr-2">
              {recentMembers.slice(0, 5).map((name: string, i: number) => (
                <div
                  key={`${name}-${i}`}
                  className="w-10 h-10 rounded-full border-2 border-background flex items-center justify-center text-xs font-bold text-white shadow-sm"
                  style={{
                    background: `linear-gradient(135deg, hsl(${i * 60 + 150}, 80%, 60%), hsl(${i * 60 + 200}, 80%, 40%))`,
                  }}
                >
                  {name[0]}
                </div>
              ))}
            </div>
          )}
          <button className="w-10 h-10 rounded-full border border-border flex items-center justify-center bg-card hover:bg-muted text-muted-foreground transition-colors shadow-sm">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
