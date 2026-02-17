import React, { useState, useEffect } from 'react'
import { AlertTriangle, X, MapPin, Clock } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'

function AlertsPanel({ alerts = [] }) {
  const { dismissAlert } = useApp()
  const [userLocation, setUserLocation] = useState(null)
  const [filteredAlerts, setFilteredAlerts] = useState([])
  const [radiusKm, setRadiusKm] = useState(50) // Filter alerts within 50km

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          console.error('Geolocation error:', error)
          // Default to a central location if geolocation fails
          setUserLocation({
            latitude: 10.8505,
            longitude: 76.2711
          })
        }
      )
    }
  }, [])

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Filter alerts by current location radius
  useEffect(() => {
    if (!userLocation || !alerts.length) {
      setFilteredAlerts(alerts)
      return
    }

    const nearby = alerts.filter(alert => {
      try {
        const alertLat = alert.location?.latitude || alert.latitude
        const alertLon = alert.location?.longitude || alert.longitude

        if (!alertLat || !alertLon) return false

        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          alertLat,
          alertLon
        )

        return distance <= radiusKm
      } catch (e) {
        console.error('Error filtering alert:', e)
        return false
      }
    })

    setFilteredAlerts(nearby)
  }, [alerts, userLocation, radiusKm])

  const getSeverityStyle = (severity) => {
    const styles = {
      low: {
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/30',
        text: 'text-blue-400',
        icon: '🔵'
      },
      medium: {
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/30',
        text: 'text-yellow-400',
        icon: '🟡'
      },
      high: {
        bg: 'bg-orange-500/10',
        border: 'border-orange-500/30',
        text: 'text-orange-400',
        icon: '🟠'
      },
      critical: {
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        text: 'text-red-400',
        icon: '🔴'
      }
    }
    return styles[severity] || styles.medium
  }

  const handleDismiss = async (alertId) => {
    await dismissAlert(alertId)
  }

  if (filteredAlerts.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
        <AlertTriangle size={48} className="mx-auto text-gray-600 mb-4" />
        <p className="text-gray-400 text-lg">No alerts nearby</p>
        <p className="text-gray-500 text-sm mt-2">
          No safety alerts within {radiusKm}km of your current location.
        </p>
        <div className="mt-4">
          <label className="text-sm text-gray-400 mr-2">Search radius:</label>
          <select
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="bg-gray-700 text-white text-sm px-3 py-1 rounded border border-gray-600"
          >
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={25}>25 km</option>
            <option value={50}>50 km</option>
            <option value={100}>100 km</option>
          </select>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <AlertTriangle size={24} className="text-orange-500" />
          Nearby Alerts
          <span className="text-sm font-normal text-gray-400">
            ({filteredAlerts.length})
          </span>
        </h3>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">Radius:</label>
          <select
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600"
          >
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={25}>25 km</option>
            <option value={50}>50 km</option>
            <option value={100}>100 km</option>
          </select>
        </div>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredAlerts.map(alert => {
          const style = getSeverityStyle(alert.severity)
          
          // Calculate distance to user
          let distance = null
          if (userLocation) {
            try {
              const alertLat = alert.location?.latitude || alert.latitude
              const alertLon = alert.location?.longitude || alert.longitude
              if (alertLat && alertLon) {
                distance = calculateDistance(
                  userLocation.latitude,
                  userLocation.longitude,
                  alertLat,
                  alertLon
                )
              }
            } catch (e) {
              console.error('Error calculating distance:', e)
            }
          }

          return (
            <div
              key={alert.id}
              className={`${style.bg} ${style.border} border rounded-lg p-4 hover:shadow-lg transition-all duration-200`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{alert.icon || style.icon}</span>
                    <span className={`font-semibold ${style.text} uppercase text-xs`}>
                      {alert.severity} - {alert.type.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-white text-sm mb-3">
                    {alert.message}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {(alert.location?.latitude || alert.latitude)?.toFixed(4)}, {(alert.location?.longitude || alert.longitude)?.toFixed(4)}
                      {distance && <span className="ml-1 text-blue-400">({distance.toFixed(1)}km away)</span>}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </span>
                  </div>

                  {alert.radius_km && (
                    <div className="mt-2 text-xs text-gray-500">
                      Alert radius: {alert.radius_km} km
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleDismiss(alert.id)}
                  className="ml-4 p-1 rounded hover:bg-gray-700 transition"
                  title="Dismiss alert"
                >
                  <X size={18} className="text-gray-400 hover:text-white" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AlertsPanel