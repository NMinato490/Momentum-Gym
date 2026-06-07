'use client'

import useSWR from 'swr'
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-react'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function ZoneCapacity() {
  const { data, isLoading } = useSWR('/api/facility/metrics', fetcher, {
    refreshInterval: 30000,
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-48 bg-card rounded-2xl animate-pulse border border-border"></div>
        ))}
      </div>
    )
  }

  const zones = data?.data?.summary || []

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Critical':
        return <AlertTriangle className="w-5 h-5 text-red-500" />
      case 'Warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      default:
        return <CheckCircle className="w-5 h-5 text-primary" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Critical':
        return 'bg-red-500/10 border-red-500/20'
      case 'Warning':
        return 'bg-yellow-500/10 border-yellow-500/20'
      default:
        return 'bg-primary/10 border-primary/20'
    }
  }

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'Critical':
        return 'bg-red-500'
      case 'Warning':
        return 'bg-yellow-500'
      default:
        return 'bg-primary'
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-6">Zone Capacity Monitor</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {zones.map((zone: any) => (
          <div
            key={zone.zone_id}
            className={`rounded-2xl p-6 border ${getStatusColor(zone.density_status)}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-foreground mb-1">{zone.zone_name}</h3>
                <p className="text-sm text-muted-foreground">
                  {zone.active_members}/{zone.capacity} members
                </p>
              </div>
              {getStatusIcon(zone.density_status)}
            </div>

            <div className="mb-4">
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${getProgressColor(zone.density_status)}`}
                  style={{ width: `${zone.occupancy_percentage}%` }}
                ></div>
              </div>
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-foreground">
                {zone.occupancy_percentage}%
              </span>
              <span className="text-xs font-medium text-muted-foreground uppercase">
                {zone.density_status}
              </span>
            </div>

            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {zone.equipment_in_use}/{zone.total_equipment} equipment in use
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
