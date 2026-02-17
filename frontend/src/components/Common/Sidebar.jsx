import React from 'react'
import { Activity, MapIcon, Route, AlertTriangle, FileText, Shield, LogOut } from 'lucide-react'

function Sidebar({ activeTab, setActiveTab, wsConnected, onItemClick }) {
  const navItems = [
    { id: 'dashboard', icon: Activity, label: 'Dashboard' },
    { id: 'map', icon: MapIcon, label: 'Live Map' },
    { id: 'route', icon: Route, label: 'Route Analysis' },
    { id: 'prediction', icon: AlertTriangle, label: 'Risk Prediction' },
    { id: 'reports', icon: FileText, label: 'Reports' },
  ]

  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <Shield className="text-blue-500" size={32} />
          <div>
            <h1 className="text-xl font-bold text-white">SafeRoute</h1>
            <p className="text-xs text-gray-400">Accident Analysis</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map(item => {
          const Icon = item.icon
          const isActive = activeTab === item.id

          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id)
                onItemClick && onItemClick()
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          )
        })}
      </nav>

      {/* Status */}
      <div className="p-4 border-t border-gray-700 space-y-3">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-400">
            {wsConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>
    </div>
  )
}

export default Sidebar