const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://integrated-accident-systemss.onrender.com'

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || `HTTP error! status: ${response.status}`)
      }

      return data.success !== undefined ? data.data : data
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error)
      throw error
    }
  }

  // ========== Member 1: Risk Prediction ==========
  
  async predictRisk(conditions) {
    return this.request('/api/member1/predict', {
      method: 'POST',
      body: JSON.stringify(conditions),
    })
  }

  async analyzeLocationRisk(locationData) {
    return this.request('/api/member1/analyze-location', {
      method: 'POST',
      body: JSON.stringify(locationData),
    })
  }

  async getFeatureImportance() {
    return this.request('/api/member1/feature-importance')
  }

  // ========== Member 2: Near-Miss Detection ==========
  
  async detectNearMiss(eventData) {
    return this.request('/api/member2/detect', {
      method: 'POST',
      body: JSON.stringify(eventData),
    })
  }

  async analyzeNearMissPatterns(location, radius = 1.0) {
    return this.request('/api/member2/analyze-patterns', {
      method: 'POST',
      body: JSON.stringify({
        latitude: location.latitude,
        longitude: location.longitude,
        radius_km: radius,
      }),
    })
  }

  async getRecentNearMissEvents() {
    return this.request('/api/member2/recent-events')
  }

  // ========== Member 3: Real-Time Alerts ==========
  
  async createAlert(alertData) {
    return this.request('/api/member3/alerts', {
      method: 'POST',
      body: JSON.stringify(alertData),
    })
  }

  async getAlerts() {
    return this.request('/api/member3/alerts')
  }

  async getNearbyAlerts(location, radius = 10) {
    return this.request('/api/member3/alerts/nearby', {
      method: 'POST',
      body: JSON.stringify({
        latitude: location.latitude,
        longitude: location.longitude,
        radius_km: radius,
      }),
    })
  }

  async dismissAlert(alertId) {
    return this.request(`/api/member3/alerts/${alertId}`, {
      method: 'DELETE',
    })
  }

  // ========== Member 4: Route Analysis ==========
  
  async analyzeRoute(routeData) {
    return this.request('/api/member4/analyze-route', {
      method: 'POST',
      body: JSON.stringify(routeData),
    })
  }

  async findSafeRoute(routeData) {
    return this.request('/api/member4/find-safe-route', {
      method: 'POST',
      body: JSON.stringify(routeData),
    })
  }

  async getRouteStatistics() {
    return this.request('/api/member4/statistics')
  }

  // ========== Accident Reporting ==========
  
  async createAccidentReport(reportData) {
    return this.request('/api/reports/', {
      method: 'POST',
      body: JSON.stringify(reportData),
    })
  }

  async getAccidentReports(filters = {}) {
    const params = new URLSearchParams()

    if (filters.limit) params.append('limit', filters.limit)
    if (filters.severity) params.append('severity', filters.severity)
    if (filters.verified !== undefined) params.append('verified', filters.verified)

    const query = params.toString()
    return this.request(`/api/reports/${query ? '?' + query : ''}`)
  }

  async getAccidentReport(reportId) {
    return this.request(`/api/reports/${reportId}`)
  }

  async updateAccidentReport(reportId, updateData) {
    return this.request(`/api/reports/${reportId}`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    })
  }

  async deleteAccidentReport(reportId) {
    return this.request(`/api/reports/${reportId}`, {
      method: 'DELETE',
    })
  }

  // ========== Health Check ==========
  
  async healthCheck() {
    return this.request('/health')
  }
}

const api = new ApiService()
export default api
