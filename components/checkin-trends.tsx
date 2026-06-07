'use client'

import useSWR from 'swr'
import { motion } from 'framer-motion'
import { MoreHorizontal } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function CheckinTrends() {
  const { data, isLoading } = useSWR('/api/facility/metrics', fetcher, {
    refreshInterval: 10000,
  })

  if (isLoading) {
    return <div className="h-64 bg-card rounded-3xl animate-pulse border border-border mt-6"></div>
  }

  const peakHours = data?.data?.peakHours || []
  const maxCheckIns = Math.max(...peakHours.map((p: any) => p.check_ins), 1)
  const allZero = peakHours.every((p: any) => p.check_ins === 0)

  return (
    <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-foreground">Check-in Trends</h2>
          <p className="text-sm font-medium text-muted-foreground mt-1">Today vs Yesterday</p>
        </div>
        <div className="flex items-center gap-4">
          <select className="bg-transparent border border-border text-muted-foreground text-sm rounded-full px-4 py-1.5 outline-none focus:border-primary">
            <option>Last 7 days</option>
            <option>This month</option>
          </select>
          <button className="w-8 h-8 rounded-full border border-border flex items-center justify-center bg-card hover:bg-muted text-muted-foreground transition-colors shadow-sm">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {allZero ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
          No check-in data for today yet
        </div>
      ) : (
        <div className="flex items-end justify-between h-48 gap-2 relative">
          <div className="absolute left-0 bottom-0 text-3xl font-bold text-muted-foreground/30 select-none">
            {maxCheckIns >= 1000 ? Math.floor(maxCheckIns / 100) / 10 + 'k' : maxCheckIns}
          </div>

          {peakHours.map((hourData: any, index: number) => {
            const heightPercentage = (hourData.check_ins / maxCheckIns) * 100
            const isHighest = heightPercentage >= 100 && !allZero

            return (
              <div key={hourData.hour} className="flex flex-col items-center flex-1 z-10 group cursor-pointer">
                {isHighest && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-foreground text-background text-xs font-bold px-2 py-1 rounded-md mb-2 flex items-center gap-1 shadow-md"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    {hourData.check_ins}
                  </motion.div>
                )}
                <motion.div
                  className={`w-full max-w-[40px] rounded-t-xl transition-all ${
                    isHighest ? 'bg-primary' : 'bg-muted hover:bg-border'
                  }`}
                  initial={{ height: 0 }}
                  animate={{ height: `${heightPercentage}%` }}
                  transition={{ delay: index * 0.05, duration: 0.5, type: 'spring' }}
                />
                <span className="text-[10px] text-muted-foreground mt-2">{hourData.hour}:00</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
