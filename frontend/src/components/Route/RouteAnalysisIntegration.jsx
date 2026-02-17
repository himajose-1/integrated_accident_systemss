// RouteAnalysisIntegration.jsx
import React, { useState, useEffect } from 'react'
import RouteSearch from './RouteSearch'
import SafetyAnalysis from './SafetyAnalysis'

// IMPORTANT: Change this to your backend URL
const API_BASE_URL = 'http://localhost:8000'

function RouteAnalysisIntegration() {
  const [loading, setLoading] = useState(false)
  const [routeAnalysis, setRouteAnalysis] = useState(null)
  const [error, setError] = useState(null)

  // Test API connection on component mount
  useEffect(() => {
    console.log('🔗 Testing API connection...')
    fetch('http://localhost:8000/')
      .then(r => r.json())
      .then(data => console.log('✅ Backend connected:', data))
      .catch(err => console.error('❌ Backend connection failed:', err))
  }, [])

  // Geocode location using Nominatim (OpenStreetMap) with fallbacks
  const geocodeLocation = async (locationName) => {
    const searchQueries = [
      locationName,
      `${locationName}, India`,
      `${locationName}, Kerala, India`,
      `${locationName}, Kerala`,
      locationName.replace(/\s+/g, '+')
    ]

    for (const query of searchQueries) {
      try {
        console.log(`🔍 Trying: ${query}`)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=IN`,
          {
            headers: {
              'User-Agent': 'RouteAnalysisApp/1.0'
            }
          }
        )

        if (!response.ok) {
          console.warn(`HTTP ${response.status} for query: ${query}`)
          continue
        }

        const data = await response.json()

        if (data.length > 0) {
          // Filter for Kerala locations if searching in India
          let bestMatch = data[0]

          // Prefer locations in Kerala for Indian searches
          if (query.includes('India') || query.includes('Kerala')) {
            const keralaMatches = data.filter(item =>
              item.display_name.toLowerCase().includes('kerala') ||
              item.display_name.toLowerCase().includes('thiruvananthapuram') ||
              item.display_name.toLowerCase().includes('trivandrum')
            )
            if (keralaMatches.length > 0) {
              bestMatch = keralaMatches[0]
            }
          }

          console.log(`✅ Found: ${bestMatch.display_name}`)
          return {
            latitude: parseFloat(bestMatch.lat),
            longitude: parseFloat(bestMatch.lon),
            display_name: bestMatch.display_name
          }
        }

        // Wait a bit before next query to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 200))

      } catch (error) {
        console.warn(`❌ Query failed for ${query}:`, error.message)
        continue
      }
    }

    // Try some common Kerala city name mappings as fallback
    const keralaCityMappings = {
      'trivandrum': { lat: 8.5241, lng: 76.9366, name: 'Thiruvananthapuram, Kerala, India' },
      'thiruvananthapuram': { lat: 8.5241, lng: 76.9366, name: 'Thiruvananthapuram, Kerala, India' },
      'kollam': { lat: 8.8932, lng: 76.6141, name: 'Kollam, Kerala, India' },
      'quilon': { lat: 8.8932, lng: 76.6141, name: 'Kollam, Kerala, India' },
      'kochi': { lat: 9.9312, lng: 76.2673, name: 'Kochi, Kerala, India' },
      'cochin': { lat: 9.9312, lng: 76.2673, name: 'Kochi, Kerala, India' },
      'ernakulam': { lat: 9.9816, lng: 76.2999, name: 'Ernakulam, Kerala, India' },
      'thrissur': { lat: 10.5276, lng: 76.2144, name: 'Thrissur, Kerala, India' },
      'trichur': { lat: 10.5276, lng: 76.2144, name: 'Thrissur, Kerala, India' },
      'kottayam': { lat: 9.5916, lng: 76.5222, name: 'Kottayam, Kerala, India' },
      'alappuzha': { lat: 9.4981, lng: 76.3388, name: 'Alappuzha, Kerala, India' },
      'alleppey': { lat: 9.4981, lng: 76.3388, name: 'Alappuzha, Kerala, India' },
      'palakkad': { lat: 10.7867, lng: 76.6548, name: 'Palakkad, Kerala, India' },
      'palghat': { lat: 10.7867, lng: 76.6548, name: 'Palakkad, Kerala, India' },
      'kozhikode': { lat: 11.2588, lng: 75.7804, name: 'Kozhikode, Kerala, India' },
      'calicut': { lat: 11.2588, lng: 75.7804, name: 'Kozhikode, Kerala, India' },
      'malappuram': { lat: 11.0732, lng: 76.0740, name: 'Malappuram, Kerala, India' },
      'kannur': { lat: 11.8745, lng: 75.3704, name: 'Kannur, Kerala, India' },
      'kasaragod': { lat: 12.4996, lng: 74.9869, name: 'Kasaragod, Kerala, India' }
    }

    const normalizedName = locationName.toLowerCase().trim()
    if (keralaCityMappings[normalizedName]) {
      const mapping = keralaCityMappings[normalizedName]
      console.log(`✅ Found via mapping: ${mapping.name}`)
      return {
        latitude: mapping.lat,
        longitude: mapping.lng,
        display_name: mapping.name
      }
    }

    throw new Error(`Location not found: ${locationName}. Try: Kollam, Kochi, Thrissur, Kottayam, Alappuzha, Palakkad, Kozhikode, Malappuram, Kannur, Kasaragod`)
  }

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371 // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  const handleRouteAnalyze = async (originText, destinationText) => {
    setLoading(true)
    setError(null)
    setRouteAnalysis(null)
    
    try {
      console.log('🚀 Starting route analysis...')
      console.log('📍 Origin:', originText)
      console.log('📍 Destination:', destinationText)
      
      // Geocode both locations
      const originCoords = await geocodeLocation(originText)
      const destCoords = await geocodeLocation(destinationText)
      
      console.log('✅ Geocoding complete')
      console.log('   Origin:', originCoords.latitude, originCoords.longitude)
      console.log('   Destination:', destCoords.latitude, destCoords.longitude)
      
      // Calculate distance and duration
      const distance = calculateDistance(
        originCoords.latitude, originCoords.longitude,
        destCoords.latitude, destCoords.longitude
      )
      const estimatedDuration = (distance / 60) * 60 // Assuming 60 km/h average
      
      console.log(`📏 Distance: ${distance.toFixed(2)} km`)
      console.log(`⏱️  Duration: ${estimatedDuration.toFixed(0)} minutes`)
      
      // Prepare request payload
      const requestBody = {
        origin: {
          latitude: originCoords.latitude,
          longitude: originCoords.longitude
        },
        destination: {
          latitude: destCoords.latitude,
          longitude: destCoords.longitude
        },
        waypoints: [],
        distance_km: distance,
        duration_minutes: estimatedDuration
      }
      
      console.log('📤 Sending request to backend...')
      console.log('   URL:', `${API_BASE_URL}/api/member4/analyze-route`)
      console.log('   Payload:', JSON.stringify(requestBody, null, 2))
      
      // Call your FastAPI backend
      const response = await fetch(`${API_BASE_URL}/api/member4/analyze-route`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      console.log('📥 Response received')
      console.log('   Status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ API Error Response:', errorText)
        throw new Error(`Backend API error: ${response.status} - ${errorText}`)
      }

      const result = await response.json()
      console.log('✅ API Response:', result)
      
      // Check if response has the expected structure
      if (!result.success) {
        console.error('❌ Invalid response structure:', result)
        throw new Error(result.message || 'Invalid response from backend')
      }

      const apiData = result.data
      console.log('📊 Processing response data...')
      
      // Transform the backend response to match SafetyAnalysis component expectations
      const transformedData = {
        safety_score: Math.max(0, Math.min(100, 100 - (apiData.safety_analysis.overall_risk_score * 10))),
        risk_level: apiData.safety_analysis.safety_level.replace(' Risk', ''),
        total_distance_km: apiData.route_summary.distance_km,
        estimated_duration_minutes: apiData.route_summary.duration_minutes,
        high_risk_zones_count: apiData.safety_analysis.high_risk_zones || 0,
        recommendations: apiData.recommendations || [],
        high_risk_zones: (apiData.hotspots || []).map((hotspot, idx) => {
          // Map risk level to score
          let riskScore = 5.0
          if (hotspot.risk_level === 'High') riskScore = 8.5
          else if (hotspot.risk_level === 'Medium') riskScore = 5.5
          else if (hotspot.risk_level === 'Low') riskScore = 3.0
          
          return {
            location: {
              latitude: hotspot.latitude,
              longitude: hotspot.longitude
            },
            risk_score: riskScore,
            reason: [
              `${hotspot.accident_count} accidents recorded`,
              `${hotspot.fatal_count} fatal, ${hotspot.serious_count} serious, ${hotspot.minor_count} minor`,
              `Common weather: ${hotspot.common_weather || 'N/A'}`,
              `Common road condition: ${hotspot.common_road_condition || 'N/A'}`
            ]
          }
        }),
        statistics: {
          total_segments: apiData.statistics?.total_segments || (apiData.hotspots || []).length,
          high_risk_segments: apiData.safety_analysis.high_risk_zones || 0,
          average_segment_risk: apiData.safety_analysis.overall_risk_score
        },
        alternative_routes: apiData.alternative_routes || []
      }
      
      console.log('✅ Data transformation complete:', transformedData)
      setRouteAnalysis(transformedData)
      
    } catch (error) {
      console.error('💥 Route analysis error:', error)
      setError(error.message)
      
      // Show detailed error in alert
      const errorDetails = [
        `Error: ${error.message}`,
        '',
        'Troubleshooting:',
        `1. Backend running? Check: ${API_BASE_URL}`,
        '2. CORS enabled in FastAPI?',
        '3. Check browser console (F12) for details',
        '4. Try the endpoint in Swagger docs: /docs'
      ].join('\n')
      
      alert(errorDetails)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Route Safety Analysis</h1>
          <div className="flex items-center gap-4 text-sm">
            <p className="text-gray-400">Backend: {API_BASE_URL}</p>
            <a 
              href={`${API_BASE_URL}/docs`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              API Docs
            </a>
          </div>
          {error && (
            <div className="mt-4 bg-red-500/20 border border-red-500 rounded-lg px-4 py-3">
              <p className="text-red-400 font-semibold mb-1">❌ Error</p>
              <p className="text-red-300 text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-xs text-red-400 hover:text-red-300 underline"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Route Search Component */}
          <div>
            <RouteSearch onRouteAnalyze={handleRouteAnalyze} loading={loading} />
          </div>

          {/* Safety Analysis Component */}
          <div>
            <SafetyAnalysis routeAnalysis={routeAnalysis} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default RouteAnalysisIntegration