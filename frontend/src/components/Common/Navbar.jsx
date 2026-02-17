import React from 'react'
import { Bell, Settings, User, LogOut } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'

function Navbar({ activeTab, setActiveTab }) {
  const { alerts, notifications, addNotification } = useApp()

  const titles = {
    dashboard: 'System Dashboard',
    map: 'Live Accident Map',
    route: 'Route Safety Analysis',
    prediction: 'Risk Prediction & Prevention',
    reports: 'Accident Reports',
    alerts: 'Notification Center',
    'notification-settings': 'Notification Settings',
    prevention: 'Prevention Strategies'
  }

  const descriptions = {
    dashboard: 'Real-time accident analysis and safety intelligence',
    map: 'Interactive map with live accident locations and hotspots',
    route: 'Analyze route safety and get risk predictions',
    prediction: 'AI-powered risk assessment and prevention strategies',
    reports: 'View, manage, and generate detailed accident reports',
    alerts: 'Manage your notifications and alerts',
    'notification-settings': 'Configure notification preferences and settings',
    prevention: 'Safety strategies and prevention recommendations'
  }

  return (
    <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {titles[activeTab] || 'Dashboard'}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {descriptions[activeTab] || 'Real-time accident analysis and safety intelligence'}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button 
            onClick={() => setActiveTab('alerts')}
            className="relative p-2 rounded-lg hover:bg-gray-700 transition"
            title="View Notifications"
          >
            <Bell size={20} className="text-gray-300" />
            {(alerts.length > 0 || notifications.length > 0) && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center font-bold animate-pulse">
                {alerts.length + notifications.length}
              </span>
            )}
          </button>

      
          {/* Settings - removed setActiveTab since it's not in props */}
          <button 
            onClick={() => setActiveTab('notification-settings')}
            className="p-2 rounded-lg hover:bg-gray-700 transition"
            title="Settings"
          >
            <Settings size={20} className="text-gray-300" />
          </button>

          {/* Logout */}
          <button 
            onClick={() => {
              if (addNotification) {
                addNotification('Logged out successfully', 'success')
              }
              // Redirect to login page after short delay
              setTimeout(() => {
                window.location.href = '/login'
              }, 500)
            }}
            className="p-2 rounded-lg hover:bg-red-700/30 transition flex items-center gap-2"
            title="Logout"
          >
            <LogOut size={20} className="text-red-400" />
          </button>
        </div>
      </div>

      {/* Active Notifications Banner */}
      {notifications.length > 0 && (
        <div className="mt-3 space-y-2">
          {notifications.slice(0, 2).map(notification => (
            <div
              key={notification.id}
              className={`px-4 py-2 rounded-lg text-sm flex items-center justify-between ${
                notification.type === 'success' ? 'bg-green-500/20 text-green-300 border border-green-500/30' :
                notification.type === 'error' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                notification.type === 'warning' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
                'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}
            >
              <span>{notification.message}</span>
              {notification.timestamp && (
                <span className="text-xs opacity-70">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </span>
              )}
            </div>
          ))}
          {notifications.length > 2 && (
            <div className="text-xs text-gray-400 text-center">
              +{notifications.length - 2} more notifications
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Navbar