const WS_URL = import.meta.env.VITE_WS_URL || 'wss://integrated-accident-systemss.onrender.com/api/member3/ws'

let websocket = null
let reconnectInterval = null
let messageHandlers = []
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 5

export const connectWebSocket = (handlers = {}) => {
  const {
    onOpen = () => {},
    onClose = () => {},
    onMessage = () => {},
    onError = () => {}
  } = handlers

  // Don't reconnect if already connected
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    console.log('WebSocket already connected')
    return websocket
  }

  try {
    websocket = new WebSocket(WS_URL)

    websocket.onopen = (event) => {
      console.log('✅ WebSocket connected')
      reconnectAttempts = 0
      onOpen(event)

      // Clear reconnect interval if exists
      if (reconnectInterval) {
        clearInterval(reconnectInterval)
        reconnectInterval = null
      }

      // Send initial ping
      sendPing()

      // Setup ping interval (every 30 seconds)
      setInterval(() => {
        if (websocket && websocket.readyState === WebSocket.OPEN) {
          sendPing()
        }
      }, 30000)
    }

    websocket.onclose = (event) => {
      console.log('❌ WebSocket disconnected')
      onClose(event)

      // Attempt to reconnect
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++
        console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`)

        reconnectInterval = setTimeout(() => {
          connectWebSocket(handlers)
        }, 3000 * reconnectAttempts) // Exponential backoff
      } else {
        console.error('Max reconnection attempts reached')
      }
    }

    websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('📩 WebSocket message:', data)

        // Call main handler
        onMessage(data)

        // Call all registered handlers
        messageHandlers.forEach(handler => handler(data))
      } catch (error) {
        console.error('Error parsing WebSocket message:', error)
      }
    }

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error)
      onError(error)
    }

    return websocket
  } catch (error) {
    console.error('Failed to create WebSocket:', error)
    onError(error)
    return null
  }
}

export const sendMessage = (message) => {
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    try {
      websocket.send(JSON.stringify(message))
      return true
    } catch (error) {
      console.error('Error sending WebSocket message:', error)
      return false
    }
  } else {
    console.warn('WebSocket is not connected')
    return false
  }
}

export const sendPing = () => {
  return sendMessage({
    type: 'ping',
    timestamp: new Date().toISOString()
  })
}

export const updateUserLocation = (latitude, longitude) => {
  return sendMessage({
    type: 'location_update',
    latitude,
    longitude
  })
}

export const addMessageHandler = (handler) => {
  messageHandlers.push(handler)

  // Return unsubscribe function
  return () => {
    messageHandlers = messageHandlers.filter(h => h !== handler)
  }
}

export const closeWebSocket = () => {
  if (websocket) {
    websocket.close()
    websocket = null
  }

  if (reconnectInterval) {
    clearTimeout(reconnectInterval)
    reconnectInterval = null
  }

  messageHandlers = []
  reconnectAttempts = 0
}

export const getWebSocketState = () => {
  if (!websocket) return 'CLOSED'

  switch (websocket.readyState) {
    case WebSocket.CONNECTING:
      return 'CONNECTING'
    case WebSocket.OPEN:
      return 'OPEN'
    case WebSocket.CLOSING:
      return 'CLOSING'
    case WebSocket.CLOSED:
      return 'CLOSED'
    default:
      return 'UNKNOWN'
  }
}

export const isWebSocketConnected = () => {
  return websocket && websocket.readyState === WebSocket.OPEN
}
