import React, { useState, useRef } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { AlertTriangle, MapIcon, Route, FileText, Activity, Shield, Search, X, Plus, Bell, MapPin, Clock, Navigation, TrendingUp, CheckCircle, AlertCircle, Eye, Menu } from 'lucide-react'
import { useApp } from '../contexts/AppContext'
import api from '../services/api'

// Import Components
import Navbar from "../components/Common/Navbar";
import Sidebar from "../components/Common/Sidebar";

import LeafletMap from "../components/Map/LeafletMap";
import ReportDetailPanel from "../components/Reports/ReportDetailPanel";



import StatsPanel from '../components/Dashboard/StatsPanel'
import AlertsPanel from '../components/Dashboard/AlertsPanel'
import LiveUpdates from '../components/Dashboard/LiveUpdates'
import RouteAnalysisIntegration from '../components/Route/RouteAnalysisIntegration'
import AccidentReportForm from '../components/Reports/AccidentReportForm'
import PreventionStrategies from './PreventionStrategies'
import RiskAndPreventionDashboard from './RiskAndPreventionDashboard'
import NotificationAlertPanel from '../components/Dashboard/NotificationAlertPanel'
import NotificationSettings from './NotificationSettings'
import NotificationToast from '../components/Common/NotificationToast'

const mapContainerStyle = { width: '100%', height: '100%' }
const defaultCenter = { lat: 10.8505, lng: 76.2711 }

export default function MainDashboard() {

  const {
    accidents,
    alerts,
    nearMissEvents,
    wsConnected,
    selectedAccident,
    setSelectedAccident,
    submitAccidentReport,
    predictRisk,
    notifications,
    dismissNotification,
    addNotification,
  } = useApp()

  // State
  const [activeTab, setActiveTab] = useState('dashboard')
  const [showReportForm, setShowReportForm] = useState(false)
  const [reportLocation, setReportLocation] = useState(null)
  const [riskPrediction, setRiskPrediction] = useState(null)
  const [selectedHotspot, setSelectedHotspot] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [accidentImages, setAccidentImages] = useState({})

  // Risk Prediction Handler
  const handleRiskPrediction = async (conditions) => {
    try {
      const result = await predictRisk(conditions)
      setRiskPrediction(result)
    } catch (error) {
      console.error('Risk prediction failed:', error)
      alert('Failed to predict risk. Please try again.')
    }
  }

  // Accident Report Handler
  const handleAccidentReport = async (reportData) => {
    try {
      // Store images if present - use location as matching key
      if (reportData.images && reportData.images.length > 0) {
        const locationKey = `${reportData.latitude.toFixed(4)}_${reportData.longitude.toFixed(4)}`
        console.log('Storing images for location:', locationKey, 'Count:', reportData.images.length)
        setAccidentImages(prev => ({
          ...prev,
          [locationKey]: reportData.images
        }))
      }
      
      const response = await submitAccidentReport(reportData)
      console.log('Report submitted successfully:', response)
      // The form will close itself after uploads complete
      return response
    } catch (error) {
      console.error('Failed to submit report:', error)
      alert('Failed to submit accident report. Please try again.')
      throw error
    }
  }
  console.log('🔍 MainDashboard Data Check:', {
    notifications: notifications,
    notificationsLength: notifications?.length,
    alerts: alerts,
    alertsLength: alerts?.length,
    activeTab: activeTab
  })
  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden relative">
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-gray-800 border border-gray-700 rounded-lg p-2 hover:bg-gray-700 transition"
        title="Toggle Menu"
      >
        <Menu size={24} className="text-white" />
      </button>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed md:static top-0 left-0 h-screen z-40 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          wsConnected={wsConnected}
          onItemClick={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Top Navbar */}
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Content Views */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'dashboard' && (
            <DashboardView 
              accidents={accidents} 
              alerts={alerts} 
              nearMissEvents={nearMissEvents}
              notifications={notifications}
            />
          )}
          
          {activeTab === 'map' && (
            <MapView
              accidents={accidents}
              alerts={alerts}
              selectedAccident={selectedAccident}
              setSelectedAccident={setSelectedAccident}
              selectedHotspot={selectedHotspot}
              setSelectedHotspot={setSelectedHotspot}
              setReportLocation={setReportLocation}
              setShowReportForm={setShowReportForm}
              setActiveTab={setActiveTab}
            />
          )}
          
          {activeTab === 'route' && (
            <RouteAnalysisView />
          )}
          
          {activeTab === 'prediction' && (
            <RiskAndPreventionDashboard />
          )}
          
     {activeTab === 'alerts' && (
            <NotificationAlertPanel 
              notifications={notifications}
              alerts={alerts}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'notification-settings' && (
            <NotificationSettings />
          )}
          
          {activeTab === 'reports' && (
            <ReportsView accidents={accidents} accidentImages={accidentImages} />
          )}
          
          {activeTab === 'prevention' && (
            <PreventionStrategies />
          )}
        </div>
      </div>

      {/* Accident Report Modal */}
      {showReportForm && (
        <AccidentReportForm
          location={reportLocation}
          onClose={() => {
            setShowReportForm(false)
            setReportLocation(null)
          }}
          onSubmit={handleAccidentReport}
        />
      )}

      {/* Notification Toast */}
      <NotificationToast
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </div>
  )
}

// ==================== Dashboard View ====================
function DashboardView({ accidents, alerts, nearMissEvents, notifications }) {
  const severityCounts = {
    Minor: accidents.filter(a => a.severity === 'Minor').length,
    Major: accidents.filter(a => a.severity === 'Major').length,
    Fatal: accidents.filter(a => a.severity === 'Fatal').length
  }

  const pieData = [
    { name: 'Minor', value: severityCounts.Minor, color: '#10B981' },
    { name: 'Major', value: severityCounts.Major, color: '#F59E0B' },
    { name: 'Fatal', value: severityCounts.Fatal, color: '#EF4444' }
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Stats Panel */}
      <StatsPanel 
        accidents={accidents} 
        alerts={alerts} 
        nearMissEvents={nearMissEvents} 
      />

      {/* Charts and Lists Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Distribution Chart */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-white">Severity Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Accidents List */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-white">Recent Accidents</h3>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {accidents.slice(0, 5).map(accident => (
              <div key={accident.id} className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          accident.severity === 'Fatal' ? 'bg-red-500' :
                          accident.severity === 'Major' ? 'bg-orange-500' : 'bg-green-500'
                        } text-white`}
                      >
                        {accident.severity}
                      </span>
                      {accident.verified && (
                        <span className="px-2 py-1 rounded text-xs bg-blue-500 text-white">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-300 mb-2">
                      {accident.description || 'No description provided'}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>{accident.weather}</span>
                      <span>{accident.road_condition}</span>
                      <span>{new Date(accident.reported_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {accidents.length === 0 && (
              <p className="text-gray-400 text-center py-8">No accidents reported yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Alerts and Live Updates Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AlertsPanel alerts={alerts} />
        <LiveUpdates 
          accidents={accidents} 
          alerts={alerts} 
          notifications={notifications} 
        />
      </div>
    </div>
  )
}

// ==================== Map View ====================
function MapView({ accidents, alerts, selectedAccident, setSelectedAccident, selectedHotspot, setSelectedHotspot, setReportLocation, setShowReportForm, setActiveTab }) {
  const [mapType, setMapType] = useState('hotspot'); // 'live' or 'hotspot'
  const [showPreventionStrategy, setShowPreventionStrategy] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLocation, setSearchLocation] = useState(null)
  const [filteredHotspots, setFilteredHotspots] = useState([])
  const [filteredAccidents, setFilteredAccidents] = useState(accidents || [])
  const [isSearching, setIsSearching] = useState(false)
  const [dynamicHotspots, setDynamicHotspots] = useState([])
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'YOUR_GOOGLE_MAPS_API_KEY'
  const hasValidGoogleKey = googleMapsApiKey && googleMapsApiKey !== 'YOUR_GOOGLE_MAPS_API_KEY'

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371 // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  // Generate dynamic hotspots from accident clusters and repeated locations
  const generateDynamicHotspots = (accidentList) => {
    if (!accidentList || accidentList.length === 0) return []
    
    const clusterRadius = 0.5 // 0.5 km clustering radius
    const locationTolerance = 0.0001 // ~11 meters for exact same spot detection
    const clusters = []
    const processed = new Set()
    let nextId = 1
    let clusterCount = 1
    
    // First pass: Find exact same location reports (same spot with multiple reports)
    const locationMap = {}
    accidentList.forEach((accident, idx) => {
      const locKey = `${Math.round(accident.latitude / locationTolerance) * locationTolerance},${Math.round(accident.longitude / locationTolerance) * locationTolerance}`
      if (!locationMap[locKey]) {
        locationMap[locKey] = []
      }
      locationMap[locKey].push(idx)
    })
    
    // Create hotspots for locations with 2+ reports at exact same spot
    Object.entries(locationMap).forEach(([locKey, indices]) => {
      if (indices.length >= 2) {
        const cluster = indices.map(idx => accidentList[idx])
        const fatalCount = cluster.filter(a => a.severity === 'Fatal').length
        const majorCount = cluster.filter(a => a.severity === 'Major').length
        
        const riskLevel = fatalCount > 0 ? 'High' : majorCount >= 1 ? 'Medium' : 'Low'
        
        clusters.push({
          id: nextId++,
          name: `Hotspot (Same Spot) #${clusterCount}`,
          lat: cluster[0].latitude,
          lng: cluster[0].longitude,
          riskLevel: riskLevel,
          accidents: cluster.length,
          fatal: fatalCount,
          major: majorCount,
          isDynamic: true,
          type: 'sameSpot'
        })
        
        // Mark these accidents as processed
        indices.forEach(idx => processed.add(idx))
        clusterCount++
      }
    })
    
    // Second pass: Cluster remaining accidents by proximity
    accidentList.forEach((accident, idx) => {
      if (processed.has(idx)) return
      
      const cluster = [accident]
      processed.add(idx)
      
      // Find all unprocessed accidents within clusterRadius
      accidentList.forEach((other, otherIdx) => {
        if (processed.has(otherIdx) || idx === otherIdx) return
        const distance = calculateDistance(
          accident.latitude, accident.longitude,
          other.latitude, other.longitude
        )
        if (distance <= clusterRadius) {
          cluster.push(other)
          processed.add(otherIdx)
        }
      })
      
      // Create hotspot if cluster has more than 2 accidents
      if (cluster.length > 2) {
        const avgLat = cluster.reduce((sum, acc) => sum + acc.latitude, 0) / cluster.length
        const avgLng = cluster.reduce((sum, acc) => sum + acc.longitude, 0) / cluster.length
        
        const fatalCount = cluster.filter(a => a.severity === 'Fatal').length
        const majorCount = cluster.filter(a => a.severity === 'Major').length
        
        const riskLevel = fatalCount > 0 ? 'High' : majorCount > 1 ? 'Medium' : 'Low'
        
        clusters.push({
          id: nextId++,
          name: `Hotspot (Cluster) #${clusterCount}`,
          lat: avgLat,
          lng: avgLng,
          riskLevel: riskLevel,
          accidents: cluster.length,
          fatal: fatalCount,
          major: majorCount,
          isDynamic: true,
          type: 'cluster'
        })
        clusterCount++
      }
    })
    
    return clusters
  }

  // Get combined hotspots (dynamic only)
  const getCombinedHotspots = () => {
    return [...dynamicHotspots]
  }

  // Filter hotspots within 5km radius
  const filterHotspotsWithinRadius = (centerLat, centerLng, radiusKm = 5) => {
    const allHotspots = getCombinedHotspots()
    return allHotspots.filter(hotspot => {
      const distance = calculateDistance(centerLat, centerLng, hotspot.lat, hotspot.lng)
      return distance <= radiusKm
    }).map(hotspot => ({
      ...hotspot,
      distance: calculateDistance(centerLat, centerLng, hotspot.lat, hotspot.lng)
    }))
  }

  // Update dynamic hotspots when accidents change
  React.useEffect(() => {
    if (accidents && accidents.length > 0) {
      const generated = generateDynamicHotspots(accidents)
      setDynamicHotspots(generated)
      // Initialize filtered hotspots with combined list
      setFilteredHotspots(getCombinedHotspots())
    }
  }, [accidents])

  // Update filtered accidents when accidents prop changes
  React.useEffect(() => {
    if (!searchLocation) {
      setFilteredAccidents(accidents || [])
    }
  }, [accidents, searchLocation])

  // Filter accidents within 5km radius
  const filterAccidentsWithinRadius = (centerLat, centerLng, radiusKm = 5) => {
    return accidents.filter(accident => {
      const distance = calculateDistance(centerLat, centerLng, accident.latitude, accident.longitude)
      return distance <= radiusKm
    })
  }

  // Search for a place using Nominatim (OpenStreetMap) or current location
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const query = searchQuery.trim().toLowerCase()
      
      // Check if user wants to search for current location
      if (query === 'my location' || query === 'current location' || query === 'here' || query === 'my current location') {
        // Get user's current location using geolocation API
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords
              const location = {
                lat: latitude,
                lng: longitude,
                name: 'Your Current Location'
              }
              setSearchLocation(location)
              
              // Filter hotspots within 5km
              const nearby = filterHotspotsWithinRadius(latitude, longitude, 5)
              setFilteredHotspots(nearby)
              
              // Filter accidents within 5km
              const nearbyAccidents = filterAccidentsWithinRadius(latitude, longitude, 5)
              setFilteredAccidents(nearbyAccidents)
              setIsSearching(false)
            },
            (error) => {
              console.error('Geolocation error:', error)
              alert('Unable to access your location. Please enable location services and try again.')
              setIsSearching(false)
            }
          )
        } else {
          alert('Geolocation is not supported by your browser.')
          setIsSearching(false)
        }
      } else {
        // Search using Nominatim (OpenStreetMap)
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
        )
        const data = await response.json()
        
        if (data && data.length > 0) {
          const location = {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
            name: data[0].display_name
          }
          setSearchLocation(location)
          
          // Filter hotspots within 5km
          const nearby = filterHotspotsWithinRadius(location.lat, location.lng, 5)
          setFilteredHotspots(nearby)
          
          // Filter accidents within 5km
          const nearbyAccidents = filterAccidentsWithinRadius(location.lat, location.lng, 5)
          setFilteredAccidents(nearbyAccidents)
        } else {
          alert('Location not found. Please try a different search term.')
        }
        setIsSearching(false)
      }
    } catch (error) {
      console.error('Search error:', error)
      alert('Error searching for location. Please try again.')
      setIsSearching(false)
    }
  }

  // Clear search and reset filters
  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchLocation(null)
    setFilteredHotspots(getCombinedHotspots())
    setFilteredAccidents(accidents)
  }

  const onMapClick = (e) => {
    setReportLocation({
      lat: e.latLng.lat(),
      lng: e.latLng.lng()
    })
    setShowReportForm(true)
  }

  const onAccidentSelect = (accident) => {
    setSelectedAccident(accident)
  }

  const onHotspotSelect = (hotspot) => {
    setSelectedHotspot(hotspot)
  }

  // Handle Report Accident Now button
  const handleReportAccidentNow = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          setReportLocation({
            lat: latitude,
            lng: longitude
          })
          setShowReportForm(true)
        },
        (error) => {
          console.error('Geolocation error:', error)
          alert('Unable to access your location. Please enable location services and try again.')
        }
      )
    } else {
      alert('Geolocation is not supported by your browser.')
    }
  }

  return (
    <div className="w-full h-full bg-gray-900 flex flex-col overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between flex-shrink-0 z-50 relative">
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-700 transition"
        >
          <Menu size={24} className="text-gray-300" />
        </button>
        <div className="flex-1 ml-4">
          <h1 className="text-lg font-bold text-white">Live Map</h1>
          <p className="text-xs text-gray-400">Search & Hotspots</p>
        </div>
        {searchLocation && (
          <div className="text-xs bg-cyan-500/20 px-2 py-1 rounded text-cyan-400">
            {filteredHotspots.length}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 relative overflow-hidden">
        
        {/* Mobile Overlay - Blocks interaction with map */}
        {isMobileSidebarOpen && (
          <div
            className="md:hidden absolute inset-0 bg-black/50 z-30"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar - Overlays map on mobile */}
        <div className={`
          absolute md:relative top-0 left-0 bottom-0 w-80 bg-gray-800 border-r border-gray-700
          p-6 overflow-y-auto z-40 md:z-auto flex-shrink-0 h-full
          transition-transform duration-300 transform
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <div className="space-y-6">
            {/* Mobile Close Button */}
            <div className="md:hidden flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Search & Details</h2>
              <button
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-2 hover:bg-gray-700 rounded transition"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Search Section */}
            <div className="bg-gray-700 rounded-lg p-4 border border-gray-600">
              <div className="mb-3 flex items-center gap-2">
                <Search size={16} className="text-cyan-400" />
                <h3 className="text-sm font-bold text-cyan-400">Search Location</h3>
              </div>
              <div className="space-y-2">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search location or 'my location'"
                    className="w-full px-3 py-2 pl-9 bg-gray-900 border border-gray-600 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/50 transition"
                  />
                  <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                <button
                  onClick={handleSearch}
                  disabled={isSearching || !searchQuery.trim()}
                  className="w-full px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition shadow-lg shadow-cyan-500/20 disabled:shadow-none flex items-center justify-center gap-2 text-sm"
                >
                  <Search size={14} />
                  {isSearching ? 'Searching...' : 'Find Hotspots (5km)'}
                </button>
                {searchLocation && (
                  <button
                    onClick={handleClearSearch}
                    className="w-full px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 rounded-lg font-medium transition flex items-center justify-center gap-2 text-sm"
                  >
                    <X size={14} />
                    Clear Search
                  </button>
                )}
              </div>
              {searchLocation && (
                <div className="mt-3 p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                  <p className="text-xs text-cyan-400 font-medium">
                    📍 {filteredHotspots.length} hotspot{filteredHotspots.length !== 1 ? 's' : ''} found within 5km
                  </p>
                </div>
              )}

              {/* Report Accident Now Button */}
              <button
                onClick={handleReportAccidentNow}
                className="w-full px-4 py-3 mt-4 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white rounded-lg font-semibold transition shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 text-sm"
              >
                <AlertCircle size={16} />
                Report Accident Now
              </button>
            </div>

            {/* Hotspot Details - Mobile Responsive */}
            {selectedHotspot ? (
              <>
                <div className="flex items-center justify-between mb-4 md:mb-6">
                  <h3 className="text-lg md:text-xl font-bold text-white truncate">Hotspot Details</h3>
                  <button
                    onClick={() => setSelectedHotspot(null)}
                    className="text-gray-400 hover:text-white flex-shrink-0"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-3 md:space-y-4 pb-6">
                  {/* Hotspot Type Badge */}
                  {selectedHotspot.isDynamic && (
                    <div className={`rounded-lg p-3 border ${
                      selectedHotspot.type === 'sameSpot'
                        ? 'bg-purple-900/30 border-purple-500/50'
                        : 'bg-cyan-900/30 border-cyan-500/50'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-lg ${
                          selectedHotspot.type === 'sameSpot' ? 'text-purple-400' : 'text-cyan-400'
                        }`}>
                          {selectedHotspot.type === 'sameSpot' ? '🎯' : '📍'}
                        </span>
                        <div className="min-w-0">
                          <p className={`text-xs md:text-sm font-semibold ${
                            selectedHotspot.type === 'sameSpot' ? 'text-purple-300' : 'text-cyan-300'
                          }`}>
                            {selectedHotspot.type === 'sameSpot' ? 'Same Spot' : 'Cluster'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                            {selectedHotspot.type === 'sameSpot' 
                              ? 'Multiple reports at same location'
                              : 'Auto-generated from nearby accidents'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Basic Information */}
                  <div className="bg-gray-700 rounded-lg p-3 md:p-4">
                    <h4 className="text-base md:text-lg font-semibold text-white mb-2 truncate">{selectedHotspot.name}</h4>
                    <div className="space-y-2 text-xs md:text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Risk Level:</span>
                        <span className={`font-semibold ${
                          selectedHotspot.riskLevel === 'High' ? 'text-red-400' :
                          selectedHotspot.riskLevel === 'Medium' ? 'text-yellow-400' : 'text-green-400'
                        }`}>
                          {selectedHotspot.riskLevel}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Accidents:</span>
                        <span className="text-white font-semibold">{selectedHotspot.accidents}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Fatal:</span>
                        <span className="text-red-400 font-semibold">{selectedHotspot.fatal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Major:</span>
                        <span className="text-orange-400 font-semibold">{selectedHotspot.major}</span>
                      </div>
                    </div>
                  </div>

                  {/* Location & Coordinates */}
                  <div className="bg-gray-700 rounded-lg p-3 md:p-4">
                    <h4 className="text-base md:text-lg font-semibold text-white mb-2 flex items-center gap-1">
                      <MapPin size={16} className="flex-shrink-0" />
                      <span className="truncate">Location</span>
                    </h4>
                    <div className="space-y-2 text-xs md:text-sm">
                      <div>
                        <span className="text-gray-400 block mb-1">Coordinates:</span>
                        <div className="bg-gray-600 rounded p-2 font-mono text-xs break-all">
                          <div>{selectedHotspot.lat.toFixed(6)}</div>
                          <div>{selectedHotspot.lng.toFixed(6)}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setActiveTab('map')
                        setIsMobileSidebarOpen(false)
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition font-medium text-sm"
                    >
                      View Integrated Map
                    </button>
                    <button
                      onClick={() => window.open(`https://www.google.com/maps?q=${selectedHotspot.lat},${selectedHotspot.lng}`, '_blank')}
                      className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition font-medium text-sm"
                    >
                      Google Maps
                    </button>
                    <button
                      onClick={() => setShowPreventionStrategy(!showPreventionStrategy)}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded-lg transition font-medium text-sm"
                    >
                      {showPreventionStrategy ? 'Hide Strategy' : 'Show Strategy'}
                    </button>
                  </div>

                  {/* Prevention Strategy */}
                  {showPreventionStrategy && selectedHotspot && (
                    <div className="mt-4 bg-gray-700 rounded-lg p-3 md:p-4 border border-orange-500/30">
                      <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2 mb-3">
                        <Shield size={18} className="text-orange-400 flex-shrink-0" />
                        <span>Prevention</span>
                      </h3>
                      <div className="space-y-3 text-xs md:text-sm">
                        <div className="bg-gray-600 rounded-lg p-2">
                          <h4 className="text-md font-semibold text-orange-400 mb-1">Immediate Actions</h4>
                          <ul className="text-gray-300 space-y-1">
                            <li>• Add traffic signals</li>
                            <li>• Deploy speed cameras</li>
                            <li>• Improve visibility</li>
                          </ul>
                        </div>
                        <div className="bg-gray-600 rounded-lg p-2">
                          <h4 className="text-md font-semibold text-orange-400 mb-1">Long-term</h4>
                          <ul className="text-gray-300 space-y-1">
                            <li>• Road redesign</li>
                            <li>• Traffic optimization</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center text-gray-400 mt-4 md:mt-8">
                <MapPin size={32} className="mx-auto mb-2 md:mb-4 opacity-50" />
                <p className="text-sm md:text-lg font-medium mb-1">Select a Hotspot</p>
                <p className="text-xs md:text-sm">Click on map markers for details</p>
              </div>
            )}
          </div>
        </div>

        {/* Map Container - Flexes to fill remaining space */}
        <div className="flex-1 min-w-0 min-h-0 relative bg-gray-800 z-0">
          <div className="w-full h-full p-0 md:p-4">
            <div className="w-full h-full rounded-none md:rounded-lg overflow-hidden bg-gray-700 z-0">
              <LeafletMap
                accidents={searchLocation ? filteredAccidents : accidents}
                alerts={alerts}
                hotspots={searchLocation ? filteredHotspots : getCombinedHotspots()}
                selectedAccident={selectedAccident}
                selectedHotspot={selectedHotspot}
                onAccidentSelect={onAccidentSelect}
                onHotspotSelect={onHotspotSelect}
                onMapClick={onMapClick}
                searchLocation={searchLocation}
                searchRadius={5000}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ==================== Route Analysis View ====================
function RouteAnalysisView() {
  return <RouteAnalysisIntegration />
}

// ==================== Risk Prediction View ====================
function RiskPredictionView({ handleRiskPrediction, riskPrediction }) {
  const [formData, setFormData] = useState({
    speed: 60,
    weather: 'Clear',
    vehicle_type: 'Car',
    road_condition: 'Dry',
    visibility: 'Good',
    time_of_day: 'Afternoon',
    traffic_density: 'Medium'
  })
  
  const onSubmit = (e) => {
    e.preventDefault()
    handleRiskPrediction(formData)
  }

  const getRiskColor = (score) => {
    if (score >= 70) return '#EF4444'
    if (score >= 40) return '#F59E0B'
    return '#10B981'
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-semibold mb-6 text-white flex items-center gap-2">
          <AlertTriangle className="text-orange-500" />
          Predict Accident Risk
        </h3>
        <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-2 text-gray-400">Speed (km/h)</label>
            <input
              type="number"
              value={formData.speed}
              onChange={(e) => setFormData({ ...formData, speed: Number(e.target.value) })}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
              max="200"
            />
          </div>
          <div>
            <label className="block text-sm mb-2 text-gray-400">Weather</label>
            <select
              value={formData.weather}
              onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Clear</option>
              <option>Rain</option>
              <option>Fog</option>
              <option>Snow</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-2 text-gray-400">Vehicle Type</label>
            <select
              value={formData.vehicle_type}
              onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Car</option>
              <option>Motorcycle</option>
              <option>Truck</option>
              <option>Bus</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-2 text-gray-400">Road Condition</label>
            <select
              value={formData.road_condition}
              onChange={(e) => setFormData({ ...formData, road_condition: e.target.value })}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Dry</option>
              <option>Wet</option>
              <option>Icy</option>
              <option>Muddy</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-2 text-gray-400">Visibility</label>
            <select
              value={formData.visibility}
              onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Good</option>
              <option>Moderate</option>
              <option>Poor</option>
              <option>Very Poor</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-2 text-gray-400">Time of Day</label>
            <select
              value={formData.time_of_day}
              onChange={(e) => setFormData({ ...formData, time_of_day: e.target.value })}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Early Morning</option>
              <option>Morning</option>
              <option>Afternoon</option>
              <option>Evening</option>
              <option>Night</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-2 text-gray-400">Traffic Density</label>
            <select
              value={formData.traffic_density}
              onChange={(e) => setFormData({ ...formData, traffic_density: e.target.value })}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Very High</option>
            </select>
          </div>
          <button
            type="submit"
            className="md:col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg  transition"
          >
            Predict Risk
          </button>
        </form>
      </div>
      {riskPrediction && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-semibold mb-4 text-white">Risk Analysis</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Risk Score</span>
                <span className="text-white font-semibold">{riskPrediction.score}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-lg h-3 overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${riskPrediction.score}%`,
                    backgroundColor: getRiskColor(riskPrediction.score)
                  }}
                />
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-300">{riskPrediction.recommendation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



// ==================== Reports View ====================
function ReportsView({ accidents, accidentImages = {} }) {
  const [filter, setFilter] = useState('all')
  const [showReportGeneration, setShowReportGeneration] = useState(false)
  const [selectedReportId, setSelectedReportId] = useState(null)
  const [generatedReport, setGeneratedReport] = useState(null)
  const [notificationRadius, setNotificationRadius] = useState(5)
  const [notificationSent, setNotificationSent] = useState(false)
  const [analytics, setAnalytics] = useState(null)
  const [notifyingId, setNotifyingId] = useState(null)
  const [showDetailPanel, setShowDetailPanel] = useState(false)
  const [selectedReport, setSelectedReport] = useState(null)
  const { submitAccidentReport, addNotification } = useApp()

  const filteredAccidents = accidents.filter(acc => {
    if (filter === 'all') return true
    return acc.severity === filter
  })

  const handleGenerateReport = async (reportId) => {
    try {
      const selectedAccident = accidents.find(a => a.id === reportId)
      if (!selectedAccident) {
        alert('Accident not found')
        return
      }

      // Get images from stored images using ID or location
      let reportImages = accidentImages[reportId] || selectedAccident.images || []
      
      // If not found by ID, try to find by location
      if (reportImages.length === 0) {
        const locationKey = `${selectedAccident.latitude.toFixed(4)}_${selectedAccident.longitude.toFixed(4)}`
        reportImages = accidentImages[locationKey] || []
        console.log('Looking up by location:', locationKey, 'Found:', reportImages.length)
      }
      
      console.log('Report ID:', reportId)
      console.log('Accident Location:', selectedAccident.latitude, selectedAccident.longitude)
      console.log('Found images:', reportImages.length)
      console.log('All stored images:', accidentImages)
      
      // Generate a detailed report from the accident data
      const report = {
        report_id: `RPT-${reportId}-${Date.now()}`,
        generated_at: new Date().toISOString(),
        accident_details: {
          id: selectedAccident.id,
          severity: selectedAccident.severity,
          reported_at: selectedAccident.reported_at,
          verified: selectedAccident.verified,
          description: selectedAccident.description || 'No description provided'
        },
        environmental_conditions: {
          weather: selectedAccident.weather || 'Unknown',
          road_condition: selectedAccident.road_condition || 'Unknown',
          time_of_day: selectedAccident.time_of_day || 'Unknown',
          traffic_density: selectedAccident.traffic_density || 'Unknown'
        },
        location: {
          latitude: selectedAccident.latitude,
          longitude: selectedAccident.longitude
        },
        images: reportImages,
        risk_analysis: {
          base_risk_score: Math.floor(Math.random() * 40) + 60,
          environmental_impact: parseFloat((Math.random() * 1.5 + 0.8).toFixed(2)),
          traffic_impact: parseFloat((Math.random() * 1.3 + 0.9).toFixed(2)),
          total_risk_multiplier: parseFloat((Math.random() * 1.8 + 1.2).toFixed(2))
        },
        recommendations: [
          'Increase traffic monitoring in the area',
          'Review road surface conditions and conduct repairs if needed',
          `Implement advisory speed limits during ${selectedAccident.weather}`,
          'Install additional signage warning of hazard conditions',
          'Schedule regular maintenance for this section',
          'Coordinate with traffic management for congestion control'
        ]
      }
      
      setGeneratedReport(report)
      setSelectedReportId(reportId)
      setShowReportGeneration(true)
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Failed to generate detailed report')
    }
  }

  const handleNotifyNearby = async (reportId) => {
    setNotifyingId(reportId)
    try {
      const selectedAccident = accidents.find(a => a.id === reportId)
      if (!selectedAccident) {
        alert('Accident not found')
        return
      }

      // Send notification to nearby users
      const recipientsCount = Math.floor(Math.random() * 50) + 10
      const notificationMessage = {
        type: 'accident_alert',
        severity: selectedAccident.severity,
        title: `${selectedAccident.severity} Accident Alert`,
        message: `Accident reported at coordinates: ${selectedAccident.latitude.toFixed(4)}, ${selectedAccident.longitude.toFixed(4)}. Weather: ${selectedAccident.weather}. Please exercise caution.`,
        location: `Lat: ${selectedAccident.latitude.toFixed(4)}, Lng: ${selectedAccident.longitude.toFixed(4)}`,
        timestamp: new Date().toISOString(),
        radius_km: notificationRadius,
        recipients_notified: recipientsCount,
        latitude: selectedAccident.latitude,
        longitude: selectedAccident.longitude
      }

      setNotificationSent(true)
      // Dispatch to backend so server can notify nearby users
      try {
        await api.createAlert(notificationMessage)
        if (addNotification) addNotification(`Notification dispatched to users within ${notificationRadius} km`, 'success')
      } catch (err) {
        console.error('API dispatch failed:', err)
        if (addNotification) addNotification('Failed to dispatch notification to users', 'error')
      }
      
      // Reset notification sent flag
      setTimeout(() => setNotificationSent(false), 3000)
    } catch (error) {
      console.error('Error sending notifications:', error)
      if (addNotification) {
        addNotification('Failed to send notifications', 'error')
      } else {
        alert('Failed to send notifications')
      }
    } finally {
      setNotifyingId(null)
    }
  }

  const downloadReport = (report) => {
    const dataStr = JSON.stringify(report, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `accident-report-${report.report_id}.json`
    link.click()
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">Accident Report Management</h3>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-gray-700 text-white rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Severities</option>
          <option value="Minor">Minor</option>
          <option value="Major">Major</option>
          <option value="Fatal">Fatal</option>
        </select>
      </div>

      {/* Reports Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Severity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Weather</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Road Condition</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredAccidents.map((accident) => (
                <tr key={accident.id} className="hover:bg-gray-700/50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{accident.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      accident.severity === 'Fatal' ? 'bg-red-500' :
                      accident.severity === 'Major' ? 'bg-orange-500' : 'bg-green-500'
                    } text-white`}>
                      {accident.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {new Date(accident.reported_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{accident.weather}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{accident.road_condition}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded text-xs ${
                      accident.verified ? 'bg-blue-600' : 'bg-gray-600'
                    } text-white`}>
                      {accident.verified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedReport(accident)
                          setShowDetailPanel(true)
                        }}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded transition text-xs"
                      >
                        View Evidence
                      </button>
                      <button
                        onClick={() => handleGenerateReport(accident.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition text-xs"
                      >
                        Generate Report
                      </button>
                      <button
                        onClick={() => handleNotifyNearby(accident.id)}
                        disabled={notifyingId === accident.id}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-3 py-1 rounded transition text-xs"
                      >
                        {notifyingId === accident.id ? 'Notifying...' : 'Notify Nearby'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredAccidents.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No accidents found matching the filter criteria
            </div>
          )}
        </div>
      </div>

      {/* Generated Report Modal - Fixed Overlay */}
      {showReportGeneration && generatedReport && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-6 border-2 border-blue-500 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sticky top-0 bg-gray-800 pb-4 border-b border-gray-700 z-10">
              <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="text-blue-400" />
                Detailed Accident Report
              </h4>
              <button
                onClick={() => {
                  setShowReportGeneration(false)
                  setGeneratedReport(null)
                }}
                className="text-gray-400 hover:text-white p-2 hover:bg-gray-700 rounded-lg transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Accident Details */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h5 className="font-semibold text-white mb-3">Accident Details</h5>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400">Severity:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-white font-semibold ${
                      generatedReport.accident_details.severity === 'Fatal' ? 'bg-red-500' :
                      generatedReport.accident_details.severity === 'Major' ? 'bg-orange-500' : 'bg-green-500'
                    }`}>
                      {generatedReport.accident_details.severity}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Reported:</span>
                    <span className="ml-2 text-white">{new Date(generatedReport.accident_details.reported_at).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-white text-xs ${
                      generatedReport.accident_details.verified ? 'bg-blue-600' : 'bg-gray-600'
                    }`}>
                      {generatedReport.accident_details.verified ? 'Verified' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Environmental Conditions */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h5 className="font-semibold text-white mb-3">Environmental Conditions</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-gray-400">Weather:</span>
                    <span className="block mt-1 text-white">{generatedReport.environmental_conditions.weather}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Road Condition:</span>
                    <span className="block mt-1 text-white">{generatedReport.environmental_conditions.road_condition}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Time of Day:</span>
                    <span className="block mt-1 text-white">{generatedReport.environmental_conditions.time_of_day}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Traffic:</span>
                    <span className="block mt-1 text-white">{generatedReport.environmental_conditions.traffic_density}</span>
                  </div>
                </div>
              </div>

              {/* Risk Analysis */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h5 className="font-semibold text-white mb-3">Risk Analysis</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Base Risk Score:</span>
                    <span className="text-white font-semibold">{generatedReport.risk_analysis.base_risk_score}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Environmental Impact:</span>
                    <span className="text-white font-semibold">{generatedReport.risk_analysis.environmental_impact.toFixed(2)}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Traffic Impact:</span>
                    <span className="text-white font-semibold">{generatedReport.risk_analysis.traffic_impact.toFixed(2)}x</span>
                  </div>
                  <div className="border-t border-gray-600 pt-2 flex justify-between">
                    <span className="text-gray-300">Total Risk Multiplier:</span>
                    <span className="text-orange-400 font-bold">{generatedReport.risk_analysis.total_risk_multiplier.toFixed(2)}x</span>
                  </div>
                </div>
              </div>

              {/* Evidence Section */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h5 className="font-semibold text-white mb-3 flex items-center gap-2">
                  📸 Evidence
                  {generatedReport.images && generatedReport.images.length > 0 && (
                    <span className="ml-auto bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded">
                      {generatedReport.images.length} image{generatedReport.images.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </h5>
                
                {generatedReport.images && generatedReport.images.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {generatedReport.images.map((image, idx) => (
                      <div
                        key={idx}
                        className="relative group rounded-lg overflow-hidden border border-gray-600 hover:border-blue-400 transition cursor-pointer"
                        onClick={() => image.data && window.open(image.data, '_blank')}
                      >
                        <img
                          src={image.data}
                          alt={image.name}
                          className="w-full h-32 object-cover hover:scale-110 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
                          <Eye size={24} className="text-white opacity-0 group-hover:opacity-100 transition" />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition">
                          <p className="text-xs text-white truncate">{image.name || `Image ${idx + 1}`}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    <p className="text-sm">No evidence images available for this incident</p>
                  </div>
                )}
              </div>

              {/* Recommendations */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h5 className="font-semibold text-white mb-3">Recommendations</h5>
                <ul className="space-y-2">
                  {generatedReport.recommendations.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-300">
                      <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-600">
                <button
                  onClick={() => downloadReport(generatedReport)}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <FileText size={18} />
                  Download Report
                </button>
                <button
                  onClick={() => handleNotifyNearby(selectedReportId)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Bell size={18} />
                  Notify Nearby Users
                </button>
              </div>

              {notificationSent && (
                <div className="bg-green-900 border border-green-600 rounded-lg p-3 text-green-200 text-sm flex items-center gap-2">
                  <CheckCircle size={18} />
                  Notification sent to users within 5 km
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Report Detail Panel with Evidence */}
      {showDetailPanel && selectedReport && (
        <ReportDetailPanel 
          report={selectedReport}
          onClose={() => {
            setShowDetailPanel(false)
            setSelectedReport(null)
          }}
          onDelete={async (reportId) => {
            try {
              await fetch(`/api/reports/${reportId}`, {
                method: 'DELETE'
              })
              addNotification('Report deleted successfully', 'success')
              setShowDetailPanel(false)
              setSelectedReport(null)
              // Refresh accidents list
              window.location.reload()
            } catch (error) {
              addNotification('Failed to delete report', 'error')
            }
          }}
        />
      )}
    </div>
  )
}
