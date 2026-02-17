import React, { useEffect, useState, useRef } from 'react'
import { X, AlertTriangle, CheckCircle, Info, AlertCircle, Bell, Zap, Clock, Play, Pause, Volume2, VolumeX } from 'lucide-react'

function NotificationToast({ notifications, onDismiss }) {
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('notificationSound') !== 'false'
  })
  const [isPaused, setIsPaused] = useState(false)
  const audioRef = useRef(null)
  const timersRef = useRef(new Map())

  // Sound notification function
  const playNotificationSound = (type) => {
    if (!soundEnabled) return

    try {
      const audio = new Audio()
      // Create different sounds for different notification types
      const frequencies = {
        success: 800,
        error: 400,
        warning: 600,
        info: 500
      }

      const frequency = frequencies[type] || 500
      const duration = 200

      // Create a simple beep sound using Web Audio API
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + duration / 1000)
    } catch (error) {
      console.warn('Could not play notification sound:', error)
    }
  }

  // Auto-dismiss logic with proper cleanup
  useEffect(() => {
    // Clear existing timers
    timersRef.current.forEach(timer => clearTimeout(timer))
    timersRef.current.clear()

    if (!isPaused) {
      notifications.forEach(notification => {
        if (!notification.persistent && !notification.dismissed) {
          const timer = setTimeout(() => {
            onDismiss(notification.id)
          }, notification.duration || 5000)

          timersRef.current.set(notification.id, timer)
        }
      })
    }

    // Cleanup function
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer))
      timersRef.current.clear()
    }
  }, [notifications, onDismiss, isPaused])

  // Play sound when new notifications arrive
  useEffect(() => {
    notifications.forEach(notification => {
      if (!notification.soundPlayed) {
        playNotificationSound(notification.type)
        // Mark as played to avoid repeated sounds
        notification.soundPlayed = true
      }
    })
  }, [notifications])

  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="text-green-500" size={20} />
      case 'error':
        return <AlertCircle className="text-red-500" size={20} />
      case 'warning':
        return <AlertTriangle className="text-orange-500" size={20} />
      case 'info':
        return <Info className="text-blue-500" size={20} />
      case 'alert':
        return <Bell className="text-purple-500" size={20} />
      case 'system':
        return <Zap className="text-cyan-500" size={20} />
      default:
        return <Info className="text-blue-500" size={20} />
    }
  }

  const getStyles = (type) => {
    const styles = {
      success: 'bg-green-500/20 border-green-500 shadow-green-500/20',
      error: 'bg-red-500/20 border-red-500 shadow-red-500/20',
      warning: 'bg-orange-500/20 border-orange-500 shadow-orange-500/20',
      info: 'bg-blue-500/20 border-blue-500 shadow-blue-500/20',
      alert: 'bg-purple-500/20 border-purple-500 shadow-purple-500/20',
      system: 'bg-cyan-500/20 border-cyan-500 shadow-cyan-500/20'
    }
    return styles[type] || styles.info
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

  const handleAction = (notification, action) => {
    if (action.onClick) {
      action.onClick(notification)
    }
    if (action.dismissAfter) {
      onDismiss(notification.id)
    }
  }

  const toggleSound = () => {
    const newState = !soundEnabled
    setSoundEnabled(newState)
    localStorage.setItem('notificationSound', newState.toString())
  }

  const togglePause = () => {
    setIsPaused(!isPaused)
  }

  if (notifications.length === 0) return null

  return (
    <>
      {/* Notification Container */}
      <div className="fixed top-20 right-4 z-50 space-y-3 max-w-md">
        {notifications.slice(0, 5).map((notification, index) => (
          <div
            key={notification.id}
            className={`${getStyles(notification.type)} border-l-4 rounded-lg p-4 shadow-2xl backdrop-blur-lg animate-slideIn transition-all duration-300 hover:scale-105`}
            style={{
              animationDelay: `${index * 100}ms`,
              transform: `translateY(${isPaused ? '0' : '0'})`
            }}
          >
            {/* Progress Bar for Auto-dismiss */}
            {!notification.persistent && !isPaused && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-gray-600 rounded-t-lg overflow-hidden">
                <div
                  className="h-full bg-current animate-progress"
                  style={{
                    animationDuration: `${notification.duration || 5000}ms`,
                    backgroundColor: notification.type === 'success' ? '#10b981' :
                                   notification.type === 'error' ? '#ef4444' :
                                   notification.type === 'warning' ? '#f59e0b' : '#3b82f6'
                  }}
                />
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(notification.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-white">
                    {formatContent(notification.title) || formatContent(notification.message)}
                  </p>
                  {notification.persistent && (
                    <Clock size={12} className="text-gray-400 ml-2" />
                  )}
                </div>

                {notification.message && notification.title && (
                  <p className="text-sm text-gray-300 mb-2">
                    {formatContent(notification.message)}
                  </p>
                )}

                {notification.details && (
                  <p className="text-xs text-gray-300 mb-2">
                    {formatContent(notification.details)}
                  </p>
                )}

                {/* Progress Bar for Loading Notifications */}
                {notification.progress !== undefined && (
                  <div className="w-full bg-gray-600 rounded-full h-2 mb-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${notification.progress}%` }}
                    />
                  </div>
                )}

                {/* Action Buttons */}
                {notification.actions && notification.actions.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {notification.actions.map((action, actionIndex) => (
                      <button
                        key={actionIndex}
                        onClick={() => handleAction(notification, action)}
                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                          action.variant === 'primary'
                            ? 'bg-blue-500 hover:bg-blue-600 text-white'
                            : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
                        }`}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-400">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </p>

                  {/* Notification Priority Indicator */}
                  {notification.priority === 'high' && (
                    <div className="flex items-center text-xs text-red-400">
                      <AlertTriangle size={12} className="mr-1" />
                      High Priority
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <button
                  onClick={() => onDismiss(notification.id)}
                  className="flex-shrink-0 text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700 rounded"
                  title="Dismiss notification"
                >
                  <X size={16} />
                </button>

                {notification.persistent && (
                  <button
                    onClick={() => {/* Could add minimize functionality */}}
                    className="flex-shrink-0 text-gray-400 hover:text-white transition-colors p-1 hover:bg-gray-700 rounded"
                    title="Minimize"
                  >
                    <span className="text-xs">−</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Control Panel */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-40 bg-gray-800/90 backdrop-blur-lg rounded-lg p-2 shadow-lg border border-gray-700">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              className={`p-2 rounded-md transition-colors ${
                soundEnabled ? 'text-green-400 hover:bg-green-700/50' : 'text-gray-400 hover:bg-gray-700/50'
              }`}
              title={soundEnabled ? 'Disable sound notifications' : 'Enable sound notifications'}
            >
              {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            <button
              onClick={togglePause}
              className={`p-2 rounded-md transition-colors ${
                isPaused ? 'text-orange-400 hover:bg-orange-700/50' : 'text-blue-400 hover:bg-blue-700/50'
              }`}
              title={isPaused ? 'Resume auto-dismiss' : 'Pause auto-dismiss'}
            >
              {isPaused ? <Play size={16} /> : <Pause size={16} />}
            </button>

            <div className="text-xs text-gray-400 px-2">
              {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default NotificationToast