import React, { useState, useEffect } from 'react'
import { AlertTriangle, Shield, MapPin, TrendingUp, Clock, Zap, ChevronDown, ChevronUp, Radio, X, Search, Activity, Route, Target, FileText } from 'lucide-react'
import LeafletMap from './LeafletMap'
import PreventionStrategiesPanel from './PreventionStrategiesPanel'

function LiveMapDashboard({ 
  accidents = [], 
  alerts = [], 
  hotspots = [],
  selectedAccident = null,
  onAccidentSelect = null
}) {
  const [selectedHotspot, setSelectedHotspot] = useState(null)
  const [showPreventionDetails, setShowPreventionDetails] = useState(false)
  const [expandedStrategies, setExpandedStrategies] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [searchLocation, setSearchLocation] = useState(null)
  const [filteredHotspots, setFilteredHotspots] = useState(hotspots)
  const [isSearching, setIsSearching] = useState(false)

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

  // Filter hotspots within 5km radius
  const filterHotspotsWithinRadius = (centerLat, centerLng, radiusKm = 5) => {
    return hotspots.filter(hotspot => {
      const distance = calculateDistance(centerLat, centerLng, hotspot.lat, hotspot.lng)
      return distance <= radiusKm
    }).map(hotspot => ({
      ...hotspot,
      distance: calculateDistance(centerLat, centerLng, hotspot.lat, hotspot.lng)
    }))
  }

  // Search for a place using Nominatim (OpenStreetMap)
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
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
      } else {
        alert('Location not found. Please try a different search term.')
      }
    } catch (error) {
      console.error('Search error:', error)
      alert('Error searching for location. Please try again.')
    } finally {
      setIsSearching(false)
    }
  }

  // Clear search and reset filters
  const handleClearSearch = () => {
    setSearchQuery('')
    setSearchLocation(null)
    setFilteredHotspots(hotspots)
  }

  const handleHotspotSelect = (hotspot) => {
    setSelectedHotspot(hotspot)
    setShowPreventionDetails(true)
  }

  const handleCloseHotspot = () => {
    setSelectedHotspot(null)
    setShowPreventionDetails(false)
  }

  const toggleStrategy = (strategyId) => {
    setExpandedStrategies(prev => ({
      ...prev,
      [strategyId]: !prev[strategyId]
    }))
  }

  const getRiskColor = (riskLevel) => {
    switch(riskLevel) {
      case 'High': return { text: 'text-red-500', bg: 'bg-red-500/20', border: 'border-red-500/50', badge: 'bg-red-600' }
      case 'Medium': return { text: 'text-yellow-500', bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', badge: 'bg-yellow-600' }
      case 'Low': return { text: 'text-green-500', bg: 'bg-green-500/20', border: 'border-green-500/50', badge: 'bg-green-600' }
      default: return { text: 'text-gray-400', bg: 'bg-gray-500/20', border: 'border-gray-500/50', badge: 'bg-gray-600' }
    }
  }

  const getStatistics = () => {
    const displayHotspots = searchLocation ? filteredHotspots : hotspots
    return {
      totalAccidents: accidents.length,
      totalHotspots: displayHotspots.length,
      highRisk: displayHotspots.filter(h => h.riskLevel === 'High').length,
      mediumRisk: displayHotspots.filter(h => h.riskLevel === 'Medium').length,
      lowRisk: displayHotspots.filter(h => h.riskLevel === 'Low').length,
      activeAlerts: alerts.length
    }
  }

  const stats = getStatistics()
  const colors = selectedHotspot ? getRiskColor(selectedHotspot.riskLevel || 'Low') : null
  const displayHotspots = searchLocation ? filteredHotspots : hotspots

  return (
    <div className="w-full h-screen bg-gray-900 text-white flex overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-72 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 border border-blue-500 flex items-center justify-center">
              <Shield size={28} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">SafeRoute</h1>
              <p className="text-xs text-gray-400">Accident Analysis</p>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="p-4 border-b border-gray-700">
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
                placeholder="Search location..."
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
                📍 {filteredHotspots.length} hotspot{filteredHotspots.length !== 1 ? 's' : ''} found
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-white transition">
            <Activity size={20} />
            <span className="font-medium">Dashboard</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-500/20 text-blue-400 font-medium border border-blue-500/30">
            <MapPin size={20} />
            <span>Live Map</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-white transition">
            <Route size={20} />
            <span className="font-medium">Route Analysis</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-white transition">
            <Target size={20} />
            <span className="font-medium">Risk Prediction</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-white transition">
            <FileText size={20} />
            <span className="font-medium">Reports</span>
          </a>
        </nav>

        {/* Connection Status */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-green-400 font-medium">Connected</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700 p-4 flex items-center justify-between shadow-lg">
          <div>
            <h1 className="text-2xl font-bold text-white">Live Accident Map</h1>
            <p className="text-sm text-gray-400">Real-time accident analysis and safety intelligence</p>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg">
            <Radio size={16} className="text-green-400 animate-pulse" />
            <span className="text-sm font-medium text-green-400">Live</span>
          </div>
        </div>

        {/* Search Result Info */}
        {searchLocation && (
          <div className="bg-cyan-500/10 border-b border-cyan-500/30 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-cyan-400" />
              <span className="text-sm text-cyan-400 font-medium">
                Showing {filteredHotspots.length} hotspot{filteredHotspots.length !== 1 ? 's' : ''} within 5km of: {searchLocation.name}
              </span>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex gap-4 p-4 overflow-hidden">
          {/* Map Section */}
          <div className="flex-1 rounded-lg overflow-hidden border border-gray-700 bg-gray-800 shadow-2xl relative">
            <LeafletMap 
              accidents={accidents}
              alerts={alerts}
              hotspots={displayHotspots}
              searchLocation={searchLocation}
              searchRadius={5000}
              selectedAccident={selectedAccident}
              selectedHotspot={selectedHotspot}
              onAccidentSelect={onAccidentSelect}
              onHotspotSelect={handleHotspotSelect}
            />

            {/* Statistics Overlay */}
            <div className="absolute left-4 top-4 bg-gray-900/95 backdrop-blur border border-gray-700 rounded-lg p-4 max-w-xs shadow-xl">
              <h3 className="text-sm font-bold text-cyan-400 mb-3 flex items-center gap-2">
                <TrendingUp size={16} />
                Live Statistics
              </h3>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-gray-800/80 p-2 rounded border border-gray-700">
                  <p className="text-gray-400">Accidents</p>
                  <p className="text-lg font-bold text-white">{stats.totalAccidents}</p>
                </div>
                <div className="bg-gray-800/80 p-2 rounded border border-gray-700">
                  <p className="text-gray-400">Hotspots</p>
                  <p className="text-lg font-bold text-white">{stats.totalHotspots}</p>
                </div>
                <div className="bg-red-500/30 p-2 rounded border border-red-500/50">
                  <p className="text-red-400 text-xs">High Risk</p>
                  <p className="text-lg font-bold text-red-300">{stats.highRisk}</p>
                </div>
                <div className="bg-yellow-500/30 p-2 rounded border border-yellow-500/50">
                  <p className="text-yellow-400 text-xs">Medium</p>
                  <p className="text-lg font-bold text-yellow-300">{stats.mediumRisk}</p>
                </div>
                <div className="bg-green-500/30 p-2 rounded border border-green-500/50">
                  <p className="text-green-400 text-xs">Low Risk</p>
                  <p className="text-lg font-bold text-green-300">{stats.lowRisk}</p>
                </div>
                <div className="bg-blue-500/30 p-2 rounded border border-blue-500/50">
                  <p className="text-blue-400 text-xs">Alerts</p>
                  <p className="text-lg font-bold text-blue-300">{stats.activeAlerts}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="w-96 flex flex-col gap-4 overflow-hidden">
            {selectedHotspot ? (
              <>
                {/* Hotspot Details Card */}
                <div className={`${colors.bg} border ${colors.border} rounded-lg overflow-hidden shadow-xl`}>
                  <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-gray-800/50">
                    <div>
                      <h2 className="text-lg font-bold text-white">{selectedHotspot.name}</h2>
                      <p className={`text-sm font-semibold ${colors.text}`}>{selectedHotspot.riskLevel} Risk Area</p>
                      {selectedHotspot.distance && (
                        <p className="text-xs text-gray-400 mt-1">
                          {selectedHotspot.distance.toFixed(2)} km from search location
                        </p>
                      )}
                    </div>
                    <button
                      onClick={handleCloseHotspot}
                      className="p-1 hover:bg-gray-700 rounded transition"
                    >
                      <X size={20} className="text-gray-400" />
                    </button>
                  </div>

                  <div className="p-4 space-y-4 overflow-y-auto max-h-48">
                    {/* Location */}
                    <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                      <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                        <MapPin size={14} className="text-cyan-400" />
                        Location
                      </p>
                      <p className="text-white font-semibold mb-1">{selectedHotspot.name}</p>
                      <p className="text-xs text-gray-500 font-mono">
                        {selectedHotspot.lat?.toFixed(4)}, {selectedHotspot.lng?.toFixed(4)}
                      </p>
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700 text-center">
                        <p className="text-xs text-gray-400">Total</p>
                        <p className="text-lg font-bold text-white">{selectedHotspot.accidents || 0}</p>
                      </div>
                      <div className="bg-red-500/20 rounded-lg p-2 border border-red-500/30 text-center">
                        <p className="text-xs text-red-400">Fatal</p>
                        <p className="text-lg font-bold text-red-400">{selectedHotspot.fatal || 0}</p>
                      </div>
                      <div className="bg-yellow-500/20 rounded-lg p-2 border border-yellow-500/30 text-center">
                        <p className="text-xs text-yellow-400">Major</p>
                        <p className="text-lg font-bold text-yellow-400">{selectedHotspot.major || 0}</p>
                      </div>
                    </div>

                    {/* Additional Info */}
                    {selectedHotspot.timePattern && (
                      <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700 text-sm">
                        <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                          <Clock size={14} className="text-orange-400" />
                          Peak Hours
                        </p>
                        <p className="text-white font-medium">{selectedHotspot.timePattern}</p>
                      </div>
                    )}

                    {selectedHotspot.roadCondition && (
                      <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700 text-sm">
                        <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                          <AlertTriangle size={14} className="text-orange-400" />
                          Road Condition
                        </p>
                        <p className="text-white font-medium">{selectedHotspot.roadCondition}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Prevention Strategies Section */}
                <div className="flex-1 rounded-lg overflow-hidden border border-gray-700 bg-gray-800 shadow-xl flex flex-col">
                  <div className="p-4 border-b border-gray-700 bg-gray-800/50">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <Shield size={18} className="text-green-400" />
                      Prevention Strategies
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">Recommended solutions for this hotspot</p>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    <PreventionStrategiesPanel 
                      hotspot={selectedHotspot}
                      expandedStrategies={expandedStrategies}
                      onToggleStrategy={toggleStrategy}
                    />
                  </div>
                </div>
              </>
            ) : (
              // Empty State
              <div className="flex-1 flex flex-col items-center justify-center rounded-lg border border-gray-700 bg-gray-800/50">
                <div className="text-center p-6">
                  <div className="w-16 h-16 rounded-full bg-gray-700/50 flex items-center justify-center mx-auto mb-4">
                    <MapPin size={32} className="text-gray-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-300 mb-2">Select a Hotspot</h3>
                  <p className="text-sm text-gray-400">Click on any hotspot marker on the map to view</p>
                  <p className="text-sm text-gray-400">prevention strategies and detailed information.</p>
                  
                  {displayHotspots.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-700">
                      <p className="text-xs text-gray-500 mb-3">
                        {searchLocation ? 'Nearby Hotspots:' : 'Available Hotspots:'}
                      </p>
                      <div className="space-y-2">
                        {displayHotspots.slice(0, 3).map(hotspot => (
                          <button
                            key={hotspot.id}
                            onClick={() => handleHotspotSelect(hotspot)}
                            className={`w-full p-2 rounded-lg text-sm font-medium transition ${
                              getRiskColor(hotspot.riskLevel).bg
                            } border ${getRiskColor(hotspot.riskLevel).border} hover:opacity-80`}
                          >
                            <div>{hotspot.name}</div>
                            {hotspot.distance && (
                              <div className="text-xs text-gray-400 mt-1">
                                {hotspot.distance.toFixed(2)} km away
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default LiveMapDashboard