import React from 'react'
import { Shield, AlertTriangle, CheckCircle, Navigation, Clock, TrendingUp } from 'lucide-react'

function SafetyAnalysis({ routeAnalysis }) {
  if (!routeAnalysis) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
        <Navigation size={64} className="mx-auto text-gray-600 mb-4" />
        <p className="text-gray-400 text-lg">No route analyzed yet</p>
        <p className="text-gray-500 text-sm mt-2">
          Enter origin and destination to analyze route safety
        </p>
      </div>
    )
  }

  const getRiskColor = (score) => {
    if (score >= 70) return '#EF4444'
    if (score >= 40) return '#F59E0B'
    return '#10B981'
  }

  const getRiskLevel = (level) => {
    const styles = {
      'Low': { color: 'text-green-500', bg: 'bg-green-500/20', icon: CheckCircle },
      'Moderate': { color: 'text-yellow-500', bg: 'bg-yellow-500/20', icon: AlertTriangle },
      'High': { color: 'text-orange-500', bg: 'bg-orange-500/20', icon: AlertTriangle },
      'Very High': { color: 'text-red-500', bg: 'bg-red-500/20', icon: AlertTriangle }
    }
    return styles[level] || styles['Moderate']
  }

  const riskLevelStyle = getRiskLevel(routeAnalysis.risk_level)
  const RiskIcon = riskLevelStyle.icon

  return (
    <div className="space-y-6">
      {/* Safety Score Header */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Route Safety Analysis
            </h3>
            <p className="text-gray-400 text-sm">
              Based on historical accident data and risk factors
            </p>
          </div>

          <div className="text-center">
            <div className="text-sm text-gray-400 mb-2">Safety Score</div>
            <div
              className="text-6xl font-bold"
              style={{ color: getRiskColor(100 - routeAnalysis.safety_score) }}
            >
              {routeAnalysis.safety_score.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <RiskIcon size={20} className={riskLevelStyle.color} />
              <span className="text-sm text-gray-400">Risk Level</span>
            </div>
            <div className={`text-xl font-bold ${riskLevelStyle.color}`}>
              {routeAnalysis.risk_level}
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Navigation size={20} className="text-blue-400" />
              <span className="text-sm text-gray-400">Distance</span>
            </div>
            <div className="text-xl font-bold text-white">
              {routeAnalysis.total_distance_km.toFixed(1)} km
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={20} className="text-purple-400" />
              <span className="text-sm text-gray-400">Duration</span>
            </div>
            <div className="text-xl font-bold text-white">
              {routeAnalysis.estimated_duration_minutes.toFixed(0)} min
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={20} className="text-red-400" />
              <span className="text-sm text-gray-400">Risk Zones</span>
            </div>
            <div className="text-xl font-bold text-red-400">
              {routeAnalysis.high_risk_zones_count}
            </div>
          </div>
        </div>
      </div>

      {/* Safety Recommendations */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Shield size={20} className="text-blue-500" />
          Safety Recommendations
        </h4>

        <ul className="space-y-3">
          {routeAnalysis.recommendations.map((recommendation, index) => (
            <li
              key={index}
              className="flex items-start gap-3 bg-gray-700/50 rounded-lg p-3"
            >
              <span className="text-blue-400 mt-1 flex-shrink-0">
                {index + 1}.
              </span>
              <span className="text-gray-200 flex-1">{recommendation}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* High Risk Zones */}
      {routeAnalysis.high_risk_zones && routeAnalysis.high_risk_zones.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-red-500" />
            High Risk Zones Detected
          </h4>

          <div className="space-y-3">
            {routeAnalysis.high_risk_zones.map((zone, index) => (
              <div
                key={index}
                className="bg-red-500/10 border border-red-500/30 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-red-400">
                    Zone {index + 1}
                  </span>
                  <span className="text-sm text-red-400 font-mono">
                    Risk Score: {zone.risk_score.toFixed(1)}
                  </span>
                </div>

                <p className="text-sm text-gray-300 mb-2">
                  📍 {zone.location.latitude.toFixed(4)}, {zone.location.longitude.toFixed(4)}
                </p>

                {zone.reason && zone.reason.length > 0 && (
                  <div className="text-xs text-gray-400 mt-2">
                    <strong>Factors:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {zone.reason.map((factor, idx) => (
                        <li key={idx}>{factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistics */}
      {routeAnalysis.statistics && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-purple-500" />
            Route Statistics
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Total Segments</div>
              <div className="text-2xl font-bold text-white">
                {routeAnalysis.statistics.total_segments}
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">High Risk Segments</div>
              <div className="text-2xl font-bold text-orange-400">
                {routeAnalysis.statistics.high_risk_segments}
              </div>
            </div>

            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">Avg Segment Risk</div>
              <div className="text-2xl font-bold text-yellow-400">
                {routeAnalysis.statistics.average_segment_risk.toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alternative Routes */}
      {routeAnalysis.alternative_routes && routeAnalysis.alternative_routes.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h4 className="text-lg font-semibold text-white mb-4">
            Alternative Suggestions
          </h4>

          <div className="space-y-3">
            {routeAnalysis.alternative_routes.map((alt, index) => (
              <div key={index} className="bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-blue-400">
                    {alt.type.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-xs text-green-400">
                    {alt.potential_improvement}
                  </span>
                </div>
                <p className="text-sm text-gray-300">{alt.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SafetyAnalysis