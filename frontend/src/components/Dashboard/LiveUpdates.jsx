import React, { useState, useEffect } from 'react'
import { Activity, AlertTriangle, Bell, CheckCircle } from 'lucide-react'

function LiveUpdates({ accidents = [], alerts = [], notifications = [] }) {
  const [updates, setUpdates] = useState([])

  useEffect(() => {
    // Combine all updates
    const allUpdates = [
      ...accidents.slice(0, 5).map(acc => ({
        id: `accident-${acc.id}`,
        type: 'accident',
        severity: acc.severity,
        message: `${acc.severity} accident reported`,
        location: `${acc.latitude.toFixed(4)}, ${acc.longitude.toFixed(4)}`,
        timestamp: new Date(acc.reported_at)
      })),
      ...alerts.slice(0, 5).map(alert => ({
        id: `alert-${alert.id}`,
        type: 'alert',
        severity: alert.severity,
        message: alert.message,
        location: `${alert.location.latitude.toFixed(4)}, ${alert.location.longitude.toFixed(4)}`,
        timestamp: new Date(alert.created_at)
      })),
      ...notifications.slice(0, 5).map((notif, idx) => ({
        id: `notification-${idx}`,
        type: notif.type,
        message: notif.message,
        timestamp: notif.timestamp
      }))
    ]

    // Sort by timestamp (newest first)
    allUpdates.sort((a, b) => b.timestamp - a.timestamp)

    setUpdates(allUpdates.slice(0, 10))
  }, [accidents, alerts, notifications])

  const getUpdateIcon = (type) => {
    switch (type) {
      case 'accident':
        return <AlertTriangle size={16} className="text-red-500" />
      case 'alert':
        return <Bell size={16} className="text-orange-500" />
      case 'success':
        return <CheckCircle size={16} className="text-green-500" />
      default:
        return <Activity size={16} className="text-blue-500" />
    }
  }

  const getTimeAgo = (timestamp) => {
    const seconds = Math.floor((new Date() - timestamp) / 1000)

    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <Activity size={24} className="text-blue-500" />
          Live Updates
        </h3>
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-sm text-gray-400">Live</span>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {updates.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Activity size={48} className="mx-auto mb-3 opacity-30" />
            <p>No recent updates</p>
          </div>
        ) : (
          updates.map(update => (
            <div
              key={update.id}
              className="bg-gray-700/50 rounded-lg p-3 hover:bg-gray-700 transition-colors duration-200 animate-fadeIn"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {getUpdateIcon(update.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium mb-1">
                    {update.message}
                  </p>

                  {update.location && (
                    <p className="text-xs text-gray-400 mb-1">
                      📍 {update.location}
                    </p>
                  )}

                  <p className="text-xs text-gray-500">
                    {getTimeAgo(update.timestamp)}
                  </p>
                </div>

                {update.severity && (
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      update.severity === 'Fatal' || update.severity === 'critical'
                        ? 'bg-red-500/20 text-red-400'
                        : update.severity === 'Major' || update.severity === 'high'
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'bg-green-500/20 text-green-400'
                    }`}
                  >
                    {update.severity}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default LiveUpdates