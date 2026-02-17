// RouteSearch.jsx (Updated)
import React, { useState, useRef } from 'react'
import { Search, Navigation, MapPin, X } from 'lucide-react'

function RouteSearch({ onRouteAnalyze, loading }) {
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const originInputRef = useRef(null)
  const destInputRef = useRef(null)

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()

    if (!origin || !destination) {
      alert('Please enter both origin and destination')
      return
    }

    try {
      await onRouteAnalyze(origin, destination)
    } catch (error) {
      console.error('Route analysis failed:', error)
    }
  }

  const handleClear = () => {
    setOrigin('')
    setDestination('')
  }

  const handleSwap = () => {
    const temp = origin
    setOrigin(destination)
    setDestination(temp)
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center gap-2">
          <Navigation size={24} className="text-blue-500" />
          Route Safety Analysis
        </h3>
      </div>

      <div className="space-y-4">
        {/* Origin Input */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            <MapPin size={16} className="inline mr-1" />
            Starting Point
          </label>
          <div className="relative">
            <input
              ref={originInputRef}
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="e.g., Kollam, Kerala or Kochi, Kerala"
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 pr-10 outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            {origin && (
              <button
                type="button"
                onClick={() => setOrigin('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleSwap}
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition text-gray-400 hover:text-white"
            title="Swap origin and destination"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
              />
            </svg>
          </button>
        </div>

        {/* Destination Input */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            <MapPin size={16} className="inline mr-1" />
            Destination
          </label>
          <div className="relative">
            <input
              ref={destInputRef}
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="e.g., Trivandrum, Kerala or Thrissur, Kerala"
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 pr-10 outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            {destination && (
              <button
                type="button"
                onClick={() => setDestination('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition font-medium"
            disabled={loading}
          >
            Clear
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !origin || !destination}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Analyzing...
              </>
            ) : (
              <>
                <Search size={20} />
                Analyze Safety
              </>
            )}
          </button>
        </div>

      {/* View Map Button */}
      <div className="pt-4 border-t border-gray-700">
        <button
          type="button"
          onClick={() => {
            const params = new URLSearchParams();
            if (origin) params.append('start', origin);
            if (destination) params.append('end', destination);
            const url = `/Mapshot.html${params.toString() ? '?' + params.toString() : ''}`;
            window.open(url, '_blank');
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition font-medium"
        >
          View Map
        </button>
        <p className="text-xs text-gray-500 mt-2 text-center">
          🌍 Interactive map showing accident-prone areas in Kerala
        </p>
      </div>

      {/* Quick Examples */}
      <div className="mt-6 pt-6 border-t border-gray-700">
        <p className="text-sm text-gray-400 mb-3">Quick Examples (Kerala):</p>
        <div className="flex flex-wrap gap-2">
          {[
            { from: 'Kollam, Kerala', to: 'Trivandrum, Kerala' },
            { from: 'Kochi, Kerala', to: 'Thrissur, Kerala' },
            { from: 'Alappuzha, Kerala', to: 'Kottayam, Kerala' },
            { from: 'Palakkad, Kerala', to: 'Thrissur, Kerala' },
            { from: 'Kozhikode, Kerala', to: 'Malappuram, Kerala' },
            { from: 'Thiruvananthapuram, Kerala', to: 'Kollam, Kerala' }
          ].map((example, idx) => (
            <button
              key={idx}
              onClick={() => {
                setOrigin(example.from)
                setDestination(example.to)
              }}
              className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 px-3 py-2 rounded transition"
            >
              {example.from} → {example.to}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          💡 Try adding ", Kerala" or ", Kerala, India" for better results
        </p>
      </div>
    </div>
    </div>
  )
}

export default RouteSearch;