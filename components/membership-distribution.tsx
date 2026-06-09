'use client'

import useSWR from 'swr'
import { motion } from 'framer-motion'
import { PieChart } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function MembershipDistribution() {
  const { data, isLoading } = useSWR('/api/members?limit=2000', fetcher, {
    refreshInterval: 60000,
  })

  if (isLoading) {
    return <div className="h-64 bg-card rounded-3xl animate-pulse border border-border"></div>
  }

  const members = data?.data || []
  
  const distribution = members.reduce((acc: any, member: any) => {
    const type = member.membership_type || 'basic'
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {})

  const total = members.length || 1

  const items = [
    { label: 'Basic', value: distribution.basic || 0, color: 'bg-emerald-500' },
    { label: 'Premium', value: distribution.premium || 0, color: 'bg-blue-500' },
    { label: 'VIP', value: distribution.vip || 0, color: 'bg-purple-500' }
  ].sort((a, b) => b.value - a.value)

  return (
    <div className="bg-card p-6 rounded-3xl border border-border shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <PieChart className="w-5 h-5 text-primary" />
          Membership Distribution
        </h2>
      </div>

      {members.length === 0 ? (
        <div className="flex items-center justify-center flex-1 text-muted-foreground text-sm">
          No membership data
        </div>
      ) : (
        <div className="flex flex-col gap-6 flex-1 justify-center">
          <div className="space-y-4">
            {items.map((item, i) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-foreground">{item.label}</span>
                  <span className="text-muted-foreground">{item.value} ({Math.round((item.value / total) * 100)}%)</span>
                </div>
                <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.value / total) * 100}%` }}
                    transition={{ delay: i * 0.1, duration: 0.6, type: 'spring' }}
                    className={`h-full rounded-full ${item.color}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
