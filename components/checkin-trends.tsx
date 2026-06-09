'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { motion } from 'framer-motion'
import { MoreHorizontal } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const rangeLabels: Record<string, string> = {
  '7d': 'Last 7 days',
  'month': 'This month',
}

export function CheckinTrends() {
  const [dateRange, setDateRange] = useState('7d')
  const { data, isLoading } = useSWR(`/api/facility/metrics?range=${dateRange}`, fetcher, {
    refreshInterval: 10000,
  })

  if (isLoading) {
    return <div className="h-64 bg-card rounded-3xl animate-pulse border border-border mt-6"></div>
  }

  const trendData = data?.data?.trendData || []
  const totalCheckIns = data?.data?.totalCheckIns || 0
  const maxCheckIns = Math.max(...trendData.map((p: any) => p.check_ins), 1)
  const allZero = totalCheckIns === 0

  return (
    <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-foreground">Check-in Trends</h2>
          <p className="text-sm font-medium text-muted-foreground mt-1">{rangeLabels[dateRange]}</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            className="bg-transparent border border-border text-muted-foreground text-sm rounded-full px-4 py-1.5 outline-none focus:border-primary"
          >
            <option value="7d">Last 7 days</option>
            <option value="month">This month</option>
          </select>
          <button className="w-8 h-8 rounded-full border border-border flex items-center justify-center bg-card hover:bg-muted text-muted-foreground transition-colors shadow-sm">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {allZero ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          No check-in data for this period
        </div>
      ) : (
        <div className="flex items-end justify-between h-48 gap-1 sm:gap-2 relative">
          <div className="absolute left-0 bottom-0 text-3xl font-bold text-foreground/20 select-none">
            {totalCheckIns >= 1000 ? Math.floor(totalCheckIns / 100) / 10 + 'k' : totalCheckIns} total
          </div>

          {trendData.map((dataPoint: any, index: number) => {
            const heightPercentage = (dataPoint.check_ins / maxCheckIns) * 100
            const isHighest = heightPercentage >= 100 && !allZero

            return (
              <div key={index} className="flex flex-col justify-end items-center flex-1 h-full z-10 group cursor-pointer relative">
                {isHighest && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-10 bg-foreground text-background text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1 shadow-md whitespace-nowrap"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    {dataPoint.check_ins}
                  </motion.div>
                )}
                <motion.div
                  className={`w-full max-w-[40px] rounded-t-xl transition-all ${
                    isHighest ? 'bg-primary' : 'bg-muted hover:bg-border'
                  }`}
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPercentage}%` }}
                  transition={{ delay: index * 0.02, duration: 0.5, type: 'spring' }}
                />
                <span className="text-[10px] text-muted-foreground mt-2 truncate max-w-full px-0.5">{dataPoint.label}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
