import React, { useState, useEffect } from 'react'
import { useApp } from '../../contexts/AppContext'
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  MapPin,
  TrendingUp,
  Search
} from 'lucide-react'

const NotificationAlertPanel = ({ notifications: propNotifications, alerts: propAlerts, setActiveTab }) => {
  console.log('🔍 NotificationAlertPanel Props:', { 
    propNotifications, 
    propAlerts,
    propNotificationsType: Array.isArray(propNotifications),
    propAlertsType: Array.isArray(propAlerts)
  })

  // Safely get data from props with fallbacks
  const contextNotifications = Array.isArray(propNotifications) ? propNotifications : []
  const contextAlerts = Array.isArray(propAlerts) ? propAlerts : []

  console.log('🔍 Context Data:', {
    contextNotifications: contextNotifications.length,
    contextAlerts: contextAlerts.length
  })

  // Demo notifications data - REMOVED (now showing only real data)

  // Combine real notifications + alerts (demo data removed)
  const getAllNotifications = () => {
    const realNotifications = contextNotifications.map(n => ({
      id: n.id || `notif-${Date.now()}-${Math.random()}`,
      ...n,
      type: n.type || 'notification',
      priority: n.priority || 'normal',
      title: n.title || n.message || 'Notification',
      message: n.message || '',
      location: n.location || '',
      timestamp: n.timestamp || new Date().toISOString(),
      read: n.read !== undefined ? n.read : false
    }))

    const realAlerts = contextAlerts.map(a => ({
      id: a.id || `alert-${Date.now()}-${Math.random()}`,
      ...a,
      type: 'alert',
      priority: a.priority || 'high',
      title: a.message || 'Alert',
      message: a.details || a.description || '',
      location: a.location || '',
      timestamp: a.timestamp || new Date().toISOString(),
      read: false
    }))

    // Combine only real data (no demo data)
    const combined = [...realNotifications, ...realAlerts]
    const seen = new Set()
    const unique = combined.filter(n => {
      if (seen.has(n.id)) return false
      seen.add(n.id)
      return true
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    
    console.log('🔍 getAllNotifications result:', {
      real: realNotifications.length,
      alerts: realAlerts.length,
      total: unique.length
    })
    
    return unique
  }

  // Initialize state with all notifications
  const [notifications, setNotifications] = useState(() => {
    const initial = getAllNotifications()
    console.log('🔍 Initial notifications state:', initial.length)
    return initial
  })
  
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)

  // Update when props change
  useEffect(() => {
    console.log('🔍 useEffect triggered - updating notifications')
    const updated = getAllNotifications()
    setNotifications(updated)
  }, [propNotifications, propAlerts])

  const getNotificationIcon = (type, priority) => {
    const iconClass = priority === 'critical' ? 'text-red-500' : 
                      priority === 'high' ? 'text-orange-500' : 
                      priority === 'medium' ? 'text-yellow-500' : 'text-blue-500'
    
    const iconProps = { className: `w-5 h-5 ${iconClass}` }
    
    switch (type) {
      case 'accident':
        return <AlertTriangle {...iconProps} />
      case 'risk_warning':
        return <TrendingUp {...iconProps} />
      case 'weather_alert':
        return <AlertCircle {...iconProps} />
      case 'near_miss':
        return <AlertCircle {...iconProps} />
      case 'maintenance':
        return <CheckCircle {...iconProps} />
      default:
        return <Bell {...iconProps} />
    }
  }

  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'bg-red-900/20 border-red-700/50 hover:bg-red-900/30',
      high: 'bg-orange-900/20 border-orange-700/50 hover:bg-orange-900/30',
      medium: 'bg-yellow-900/20 border-yellow-700/50 hover:bg-yellow-900/30',
      low: 'bg-blue-900/20 border-blue-700/50 hover:bg-blue-900/30'
    }
    return colors[priority] || colors.low
  }

  const formatContent = (val) => {
    if (val === undefined || val === null) return ''
    if (typeof val === 'string' || typeof val === 'number') return val
    if (Array.isArray(val)) return val.join(', ')
    try {
      return JSON.stringify(val)
    } catch (e) {
      return String(val)
    }
  }

  const filteredNotifications = notifications.filter(notif => {
    const matchesFilter = selectedFilter === 'all' || notif.priority === selectedFilter
    const matchesSearch = (notif.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (notif.message || '').toLowerCase().includes(searchQuery.toLowerCase())
    const matchesReadStatus = !showUnreadOnly || !notif.read
    return matchesFilter && matchesSearch && matchesReadStatus
  })

  console.log('🔍 Render:', {
    total: notifications.length,
    filtered: filteredNotifications.length,
    selectedFilter,
    showUnreadOnly
  })

  const { setSelectedAccident, dismissNotification, updateNotification, clearNotifications, dismissAlert, setAlerts } = useApp()

  const handleMarkAsRead = (id) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n)
    setNotifications(updated)
    // persist to app context
    updateNotification(id, { read: true })
    localStorage.setItem('notificationHistory', JSON.stringify(updated))
    console.log('📌 Marked as read:', id)
  }

  const extractCoords = (notification) => {
    // Try direct lat/lng fields
    const lat = notification.latitude ?? notification.lat ?? notification.location?.latitude
    const lng = notification.longitude ?? notification.lng ?? notification.location?.longitude
    if (lat != null && lng != null) return { lat: Number(lat), lng: Number(lng) }

    // Try parsing a string like 'Lat: x, Lng: y' or 'x,y'
    const loc = notification.location || notification.details || ''
    if (typeof loc === 'string') {
      const coordMatch = loc.match(/(-?\d+\.\d+)[^\d\-]+(-?\d+\.\d+)/)
      if (coordMatch) {
        return { lat: Number(coordMatch[1]), lng: Number(coordMatch[2]) }
      }
      const csvMatch = loc.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/)
      if (csvMatch) return { lat: Number(csvMatch[1]), lng: Number(csvMatch[2]) }
    }

    // Try details object
    if (notification.details && typeof notification.details === 'object') {
      const d = notification.details
      const lat2 = d.latitude ?? d.lat
      const lng2 = d.longitude ?? d.lng
      if (lat2 != null && lng2 != null) return { lat: Number(lat2), lng: Number(lng2) }
    }

    return null
  }

  const viewOnMap = (notification, setActiveTabProp) => {
    try {
      const coords = extractCoords(notification)
      if (coords) {
        // Set selected accident in context (LeafletMap/LiveMapDashboard will use this)
        setSelectedAccident({ latitude: coords.lat, longitude: coords.lng, ...notification })
      }

      // If a parent provided a setter for active tab, navigate to map view
      if (typeof setActiveTabProp === 'function') {
        setActiveTabProp('map')
      }
    } catch (e) {
      console.warn('Failed to view on map:', e)
    }
  }

  const handleMarkAsUnread = (id) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: false } : n)
    setNotifications(updated)
    updateNotification(id, { read: false })
    localStorage.setItem('notificationHistory', JSON.stringify(updated))
    console.log('📌 Marked as unread:', id)
  }

  const handleDelete = (id) => {
    const notif = notifications.find(n => n.id === id)
    const updated = notifications.filter(n => n.id !== id)
    setNotifications(updated)
    // remove from app context as well
    if (notif && notif.type === 'alert') {
      if (typeof dismissAlert === 'function') {
        dismissAlert(id)
      } else if (typeof setAlerts === 'function') {
        setAlerts(prev => prev.filter(a => a.id !== id))
      }
    } else {
      dismissNotification(id)
    }
    localStorage.setItem('notificationHistory', JSON.stringify(updated))
    console.log('📌 Deleted notification:', id)
  }

  const handleClearAll = () => {
    if (window.confirm('Clear all notifications and alerts?')) {
      setNotifications([])
      // clear in app context so they don't come back
      clearNotifications()
      if (typeof setAlerts === 'function') setAlerts([])
      localStorage.setItem('notificationHistory', JSON.stringify([]))
      console.log('📌 Cleared all notifications and alerts')
    }
  }

  const handleMarkAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }))
    setNotifications(updated)
    localStorage.setItem('notificationHistory', JSON.stringify(updated))
    console.log('📌 Marked all as read')
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const formatTime = (timestamp) => {
    try {
      if (!timestamp) return 'Recently'
      
      const now = new Date()
      const date = new Date(timestamp)
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Recently'
      }
      
      const diff = now - date
      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)

      if (minutes < 1) return 'Just now'
      if (minutes < 60) return `${minutes}m ago`
      if (hours < 24) return `${hours}h ago`
      if (days < 7) return `${days}d ago`
      return date.toLocaleDateString()
    } catch (error) {
      console.warn('Error formatting time:', timestamp, error)
      return 'Recently'
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white flex items-center gap-3 mb-2">
          <Bell className="w-8 h-8 text-blue-500" />
          Notifications & Alerts
        </h1>
        <p className="text-gray-400">
          {unreadCount > 0 && <span className="font-semibold">{unreadCount} unread • </span>}
          {notifications.length} total
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {['all', 'critical', 'high', 'medium', 'low'].map(filter => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                selectedFilter === filter ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
          <button
            onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
              showUnreadOnly ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            {showUnreadOnly ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            Unread
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        {unreadCount > 0 && (
          <button onClick={handleMarkAllAsRead} className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">
            Mark all as read
          </button>
        )}
        {notifications.length > 0 && (
          <button onClick={handleClearAll} className="px-4 py-2 text-sm bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/50 rounded-lg transition">
            Clear all
          </button>
        )}
      </div>

      {filteredNotifications.length > 0 ? (
        <div className="space-y-3">
          {filteredNotifications.map(notification => (
            <div
              key={notification.id}
              className={`border rounded-lg p-4 transition cursor-pointer ${notification.read ? 'opacity-75' : 'opacity-100'} ${getPriorityColor(notification.priority)}`}
            >
              <div onClick={() => setExpandedId(expandedId === notification.id ? null : notification.id)} className="flex items-start gap-3">
                <div className="mt-1 flex-shrink-0">
                  {getNotificationIcon(notification.type, notification.priority)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-base">{notification.title}</h3>
                        <p className="text-sm text-gray-300 mt-1">{formatContent(notification.message)}</p>
                    </div>
                    {/* expand/collapse arrow removed per UI request */}
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatTime(notification.timestamp)}</span>
                    </div>
                    {notification.location && String(notification.location).trim() && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{formatContent(notification.location)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                  {notification.read ? (
                    <button onClick={(e) => { e.stopPropagation(); handleMarkAsUnread(notification.id) }} className="p-1 text-gray-400 hover:text-blue-400 transition" title="Mark as unread">
                      <EyeOff className="w-4 h-4" />
                    </button>
                  ) : (
                    <button onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notification.id); viewOnMap(notification, setActiveTab) }} className="p-1 text-gray-400 hover:text-blue-400 transition" title="Mark as read & view on map">
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(notification.id) }} className="p-1 text-gray-400 hover:text-red-400 transition" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {expandedId === notification.id && notification.details && (
                <div className="mt-4 pt-4 border-t border-gray-600/50 pl-8">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {Object.entries(notification.details).map(([key, value]) => (
                      <div key={key}>
                        <span className="text-gray-400 text-xs uppercase">{key.replace(/_/g, ' ')}:</span>
                        <div className="text-white font-medium mt-1">
                          {Array.isArray(value) ? value.join(', ') : String(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
          <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3 opacity-50" />
          <p className="text-gray-400">No notifications found</p>
        </div>
      )}
    </div>
  )
}

export default NotificationAlertPanel