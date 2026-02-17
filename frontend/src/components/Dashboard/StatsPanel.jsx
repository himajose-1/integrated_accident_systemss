import React from 'react'
import { AlertTriangle, Bell, Activity, TrendingUp, Users, MapPin } from 'lucide-react'

function StatsPanel({ accidents = [], alerts = [], nearMissEvents = [] }) {
  
  const severityCounts = {
    Minor: accidents.filter(a => a.severity === 'Minor').length,
    Major: accidents.filter(a => a.severity === 'Major').length,
    Fatal: accidents.filter(a => a.severity === 'Fatal').length
  }

  const stats = [
    {
      title: 'Total Accidents',
      value: accidents.length,
      icon: AlertTriangle,
      color: 'blue',
      bgColor: 'bg-blue-500/20',
      textColor: 'text-blue-500',
      change: '+12%',
      changeType: 'increase'
    },
    {
      title: 'Active Alerts',
      value: alerts.length,
      icon: Bell,
      color: 'orange',
      bgColor: 'bg-orange-500/20',
      textColor: 'text-orange-500',
      change: '+5',
      changeType: 'increase'
    },
    {
      title: 'Fatal Accidents',
      value: severityCounts.Fatal,
      icon: Activity,
      color: 'red',
      bgColor: 'bg-red-500/20',
      textColor: 'text-red-500',
      change: '-2',
      changeType: 'decrease'
    },
    {
      title: 'Near Misses',
      value: nearMissEvents.length,
      icon: MapPin,
      color: 'yellow',
      bgColor: 'bg-yellow-500/20',
      textColor: 'text-yellow-500',
      change: '+8',
      changeType: 'increase'
    },
    {
      title: 'Major Accidents',
      value: severityCounts.Major,
      icon: AlertTriangle,
      color: 'orange',
      bgColor: 'bg-orange-500/20',
      textColor: 'text-orange-500',
      change: '+3',
      changeType: 'increase'
    },
    {
      title: 'System Status',
      value: 'Online',
      icon: TrendingUp,
      color: 'green',
      bgColor: 'bg-green-500/20',
      textColor: 'text-green-500',
      change: '99.9%',
      changeType: 'neutral'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon

        return (
          <div
            key={index}
            className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-gray-600 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <Icon size={24} className={stat.textColor} />
              </div>
              {stat.change && (
                <span className={`text-xs font-semibold ${
                  stat.changeType === 'increase' ? 'text-red-400' :
                  stat.changeType === 'decrease' ? 'text-green-400' :
                  'text-gray-400'
                }`}>
                  {stat.change}
                </span>
              )}
            </div>

            <div className="space-y-1">
              <div className="text-gray-400 text-sm">{stat.title}</div>
              <div className="text-3xl font-bold text-white">
                {stat.value}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default StatsPanel