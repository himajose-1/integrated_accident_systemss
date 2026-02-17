import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { connectWebSocket, closeWebSocket } from "../services/websocket";
import api from "../services/api";


const AppContext = createContext()

export const useApp = () => {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

export const AppProvider = ({ children }) => {
  // State
  const [accidents, setAccidents] = useState([])
  const [alerts, setAlerts] = useState([])
  const [nearMissEvents, setNearMissEvents] = useState([])
  const [wsConnected, setWsConnected] = useState(false)
  const [selectedAccident, setSelectedAccident] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [clearedNotificationFingerprints, setClearedNotificationFingerprints] = useState(() => new Set())
  const [loading, setLoading] = useState(false)

  // WebSocket message handler
  const handleWebSocketMessage = useCallback((data) => {
    console.log('📩 WebSocket message:', data)

    switch (data.event) {
      case 'new_accident':
        setAccidents(prev => [data.data, ...prev])
        addNotification(
          `New ${data.data.severity} accident reported`,
          'warning',
          {
            title: '🚨 Accident Alert',
            details: `${data.data.location || 'Unknown location'} - ${data.data.description || 'No description'}`,
            priority: data.data.severity === 'critical' ? 'high' : 'normal',
            actions: [
              {
                label: 'View Details',
                onClick: () => setSelectedAccident(data.data),
                dismissAfter: true
              }
            ]
          }
        )
        break

      case 'new_alert':
        setAlerts(prev => [data.data, ...prev])
        addNotification(
          data.data.message,
          'alert',
          {
            title: '📢 New Alert',
            details: `Priority: ${data.data.priority || 'Normal'}`,
            priority: data.data.priority === 'high' ? 'high' : 'normal',
            persistent: data.data.priority === 'high'
          }
        )
        break

      case 'alert_dismissed':
        setAlerts(prev => prev.filter(a => a.id !== data.alert_id))
        break

      case 'alert_created':
        addNotification('New alert created in your area', 'info')
        break

      case 'system_update':
        addNotification(`System update: ${data.type}`, 'info')
        break

      default:
        console.log('Unknown event:', data.event)
    }
  }, [])

  // Initialize WebSocket
  useEffect(() => {
    const ws = connectWebSocket({
      onOpen: () => {
        console.log('✅ WebSocket connected')
        setWsConnected(true)
        addNotification('Connected to real-time updates', 'success', {
          title: '🔗 Connected',
          details: 'Real-time accident monitoring is active',
          duration: 3000
        })
      },
     
      onMessage: handleWebSocketMessage,
      onError: (error) => {
        console.error('WebSocket error:', error)
        setWsConnected(false)
      }
    })

    return () => {
      closeWebSocket()
    }
  }, [handleWebSocketMessage])

  // Helpers: compute stable fingerprint for a notification (message+details+coords)
  const extractCoordsFromNotification = (n) => {
    if (!n) return null
    const lat = n.latitude ?? n.lat ?? n.location?.latitude
    const lng = n.longitude ?? n.lng ?? n.location?.longitude
    if (lat != null && lng != null) return { lat: Number(lat), lng: Number(lng) }
    // try parsing location string like '{"latitude":...,"longitude":...}' or 'Lat: x, Lng: y' or 'x,y'
    const loc = n.location || n.details || ''
    if (typeof loc === 'string') {
      try {
        const parsed = JSON.parse(loc)
        if (parsed && (parsed.latitude || parsed.lat) && (parsed.longitude || parsed.lng)) {
          return { lat: Number(parsed.latitude ?? parsed.lat), lng: Number(parsed.longitude ?? parsed.lng) }
        }
      } catch (e) {}
      const coordMatch = String(loc).match(/(-?\d+\.\d+)[^\d\-]+(-?\d+\.\d+)/)
      if (coordMatch) return { lat: Number(coordMatch[1]), lng: Number(coordMatch[2]) }
      const csvMatch = String(loc).match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/)
      if (csvMatch) return { lat: Number(csvMatch[1]), lng: Number(csvMatch[2]) }
    }
    return null
  }

  const fingerprintFor = (n) => {
    try {
      const type = n.type || ''
      const msg = (n.message || n.title || '').toString().trim()
      const details = typeof n.details === 'string' ? n.details : JSON.stringify(n.details || '')
      const coords = extractCoordsFromNotification(n)
      const coordPart = coords ? `${coords.lat.toFixed(6)},${coords.lng.toFixed(6)}` : ''
      return `${type}|${msg}|${details}|${coordPart}`
    } catch (e) {
      return JSON.stringify(n)
    }
  }

  // Load cleared notification fingerprints from localStorage so cleared items persist across sessions
  useEffect(() => {
    try {
      const raw = localStorage.getItem('clearedNotificationFingerprints')
      if (raw) {
        const arr = JSON.parse(raw)
        if (Array.isArray(arr)) {
          setClearedNotificationFingerprints(new Set(arr))
        }
      }
    } catch (e) {
      console.warn('Failed to load clearedNotificationFingerprints from localStorage', e)
    }
  }, [])

  const persistClearedFingerprints = (setIds) => {
    try {
      const arr = Array.from(setIds)
      localStorage.setItem('clearedNotificationFingerprints', JSON.stringify(arr))
    } catch (e) {
      console.warn('Failed to persist clearedNotificationFingerprints', e)
    }
  }

  // Load initial data
  useEffect(() => {
    loadAccidents()
    loadAlerts()
  }, [])

  // API Functions
  const loadAccidents = async () => {
    try {
      setLoading(true)
      const data = await api.getAccidentReports()
      setAccidents(data.reports || [])
    } catch (error) {
      console.error('Failed to load accidents:', error)
      addNotification('Failed to load accident data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const loadAlerts = async () => {
    try {
      const data = await api.getAlerts()
      setAlerts(data.alerts || [])
    } catch (error) {
      console.error('Failed to load alerts:', error)
    }
  }

  const addNotification = (message, type = 'info', options = {}) => {
    const notification = {
      id: Date.now() + Math.random(),
      message,
      type,
      timestamp: new Date(),
      title: options.title,
      details: options.details,
      actions: options.actions || [],
      persistent: options.persistent || false,
      duration: options.duration || 5000,
      priority: options.priority || 'normal',
      progress: options.progress,
      soundPlayed: false,
      ...options
    }

    // Don't add notifications that have been cleared by the user (match by fingerprint)
    try {
      const fp = fingerprintFor(notification)
      if (fp && clearedNotificationFingerprints.has(fp)) return
    } catch (e) {}

    setNotifications(prev => [notification, ...prev.slice(0, 5)])

    // Auto-remove after specified duration (unless persistent)
    if (!notification.persistent) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id))
      }, notification.duration)
    }
  }

  const updateNotification = (id, updates) => {
    setNotifications(prev => prev.map(notification =>
      notification.id === id ? { ...notification, ...updates } : notification
    ))
  }

  const dismissNotification = (id) => {
    // find notification to fingerprint
    const notif = notifications.find(n => n.id === id)
    setNotifications(prev => prev.filter(n => n.id !== id))
    try {
      const next = new Set(clearedNotificationFingerprints)
      if (notif) {
        next.add(fingerprintFor(notif))
      }
      setClearedNotificationFingerprints(next)
      persistClearedFingerprints(next)
    } catch (e) {}
  }

  const clearNotifications = () => {
    // Persist fingerprints for all current notifications as cleared
    try {
      const next = new Set(clearedNotificationFingerprints)
      notifications.forEach(n => { if (n) next.add(fingerprintFor(n)) })
      setClearedNotificationFingerprints(next)
      persistClearedFingerprints(next)
    } catch (e) {}
    setNotifications([])
  }

  // Demo function to showcase advanced notification features
  const demoNotifications = () => {
    // Success notification with actions
    addNotification('Route analysis completed successfully!', 'success', {
      title: '🎯 Analysis Complete',
      details: 'Your route has been analyzed for safety hazards',
      actions: [
        { label: 'View Results', onClick: () => console.log('View results') },
        { label: 'Share Route', onClick: () => console.log('Share route') }
      ]
    })

    // Warning with high priority
    setTimeout(() => {
      addNotification('High accident risk detected on your route', 'warning', {
        title: '⚠️ Safety Alert',
        details: 'Consider alternative routes to avoid high-risk areas',
        priority: 'high',
        persistent: true,
        actions: [
          { label: 'Find Safe Route', onClick: () => console.log('Find safe route'), variant: 'primary' },
          { label: 'View Map', onClick: () => console.log('View map') }
        ]
      })
    }, 1000)

    // Progress notification
    setTimeout(() => {
      const progressId = Date.now() + Math.random()
      addNotification('Processing accident data...', 'system', {
        title: '🔄 Processing',
        details: 'Analyzing historical accident patterns',
        progress: 0,
        persistent: true
      })

      // Simulate progress updates
      let progress = 0
      const progressInterval = setInterval(() => {
        progress += 10
        updateNotification(progressId, { progress })

        if (progress >= 100) {
          clearInterval(progressInterval)
          setTimeout(() => {
            updateNotification(progressId, {
              type: 'success',
              title: '✅ Processing Complete',
              message: 'Analysis completed successfully',
              progress: 100,
              persistent: false
            })
          }, 500)
        }
      }, 300)
    }, 2000)
  }

  const submitAccidentReport = async (reportData) => {
    try {
      setLoading(true)
      const response = await api.createAccidentReport(reportData)
      console.log('✅ Report created with ID:', response?.id)
      addNotification('Accident report submitted successfully', 'success', {
        title: '✅ Report Submitted',
        details: 'Your accident report has been recorded and authorities have been notified',
        actions: [
          {
            label: 'View Reports',
            onClick: () => {
              // Could navigate to reports page or open reports modal
              console.log('Navigate to reports')
            }
          }
        ]
      })
      await loadAccidents()
      return response  // Return the response so AccidentReportForm can get the report ID
    } catch (error) {
      console.error('Failed to submit report:', error)
      addNotification('Failed to submit accident report', 'error', {
        title: '❌ Submission Failed',
        details: 'Please check your connection and try again',
        actions: [
          {
            label: 'Retry',
            onClick: () => submitAccidentReport(reportData),
            variant: 'primary'
          }
        ]
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const predictRisk = async (conditions) => {
    try {
      setLoading(true)
      return await api.predictRisk(conditions)
    } catch (error) {
      console.error('Risk prediction failed:', error)
      addNotification('Risk prediction failed', 'error')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const analyzeRoute = async (routeData) => {
    try {
      setLoading(true)
      return await api.analyzeRoute(routeData)
    } catch (error) {
      console.error('Route analysis failed:', error)
      addNotification('Route analysis failed', 'error')
      throw error
    } finally {
      setLoading(false)
    }
  }

  const detectNearMiss = async (eventData) => {
    try {
      const result = await api.detectNearMiss(eventData)
      if (result.is_near_miss) {
        setNearMissEvents(prev => [result, ...prev.slice(0, 49)])
        addNotification(`Near-miss detected: ${result.pattern_type}`, 'warning')
      }
      return result
    } catch (error) {
      console.error('Near-miss detection failed:', error)
      throw error
    }
  }

  const createAlert = async (alertData) => {
    try {
      await api.createAlert(alertData)
      addNotification('Alert created successfully', 'success')
      await loadAlerts()
    } catch (error) {
      console.error('Failed to create alert:', error)
      addNotification('Failed to create alert', 'error')
      throw error
    }
  }

  const dismissAlert = async (alertId) => {
    try {
      await api.dismissAlert(alertId)
      setAlerts(prev => prev.filter(a => a.id !== alertId))
      addNotification('Alert dismissed', 'success')
    } catch (error) {
      console.error('Failed to dismiss alert:', error)
      addNotification('Failed to dismiss alert', 'error')
    }
  }

  const value = {
    // State
    accidents,
    alerts,
    nearMissEvents,
    wsConnected,
    selectedAccident,
    notifications,
    loading,

    // Setters
    setSelectedAccident,
    setAccidents,
    setAlerts,

    // Functions
    loadAccidents,
    loadAlerts,
    submitAccidentReport,
    predictRisk,
    analyzeRoute,
    detectNearMiss,
    createAlert,
    dismissAlert,
    addNotification,
    updateNotification,
    dismissNotification,
    clearNotifications,
    demoNotifications
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}