import React, { useState, useEffect } from 'react'
import { useApp } from '../contexts/AppContext'
import api from '../services/api'
import {
  AlertCircle,
  TrendingUp,
  Shield,
  AlertTriangle,
  CheckCircle,
  Zap,
  Cloud,
  Eye,
  Clock,
  Users,
  Route,
  Heart,
  Download,
  Send,
  BarChart3,
  Activity,
  MapPin,
  Gauge
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts'

const RiskAndPreventionDashboard = () => {
  const { accidents, alerts, predictRisk, addNotification } = useApp()
  
  // Risk Prediction State
  const [riskFormData, setRiskFormData] = useState({
    speed: 60,
    weather: 'Clear',
    vehicle_type: 'Car',
    road_condition: 'Dry',
    visibility: 'Good',
    time_of_day: 'Afternoon',
    traffic_density: 'Medium'
  })
  const [riskPredictionResult, setRiskPredictionResult] = useState(null)
  const [riskLoading, setRiskLoading] = useState(false)

  // Prevention State
  const [riskHistory, setRiskHistory] = useState([])
  const [preventionStrategies, setPreventionStrategies] = useState([])
  const [recommendations, setRecommendations] = useState([])
  const [activeTab, setActiveTab] = useState('overview')

  // Prevention Strategies Database
  const strategyDatabase = {
    Minor: [
      {
        severity: 'Minor',
        title: 'Basic Safety Practices',
        description: 'Safe conditions with basic precautions',
        actions: [
          'Maintain 3-second following distance',
          'Check vehicle condition before driving',
          'Follow posted speed limits',
          'Stay alert and avoid distractions'
        ],
        priority: 'Low'
      }
    ],
    Major: [
      {
        severity: 'Major',
        title: 'Enhanced Safety Measures',
        description: 'Elevated risk - extra caution required',
        actions: [
          'Increase following distance to 5-6 seconds',
          'Reduce speed by 20-30%',
          'Turn on headlights',
          'Avoid unnecessary maneuvers',
          'Use extra care at intersections'
        ],
        priority: 'High'
      },
      {
        severity: 'Major',
        title: 'Weather-Specific Actions',
        description: 'Adapt to current weather conditions',
        actions: [
          'Activate all weather-related warnings',
          'Use winter tires if applicable',
          'Reduce speed an additional 10-15%',
          'Avoid sudden steering changes',
          'Check weather forecast regularly'
        ],
        priority: 'High'
      },
      {
        severity: 'Major',
        title: 'Vehicle Maintenance',
        description: 'Ensure vehicle is road-ready',
        actions: [
          'Check tire pressure and condition',
          'Verify brake functionality',
          'Inspect windshield wipers',
          'Ensure all lights are operational',
          'Check fluid levels'
        ],
        priority: 'High'
      },
      {
        severity: 'Major',
        title: 'Communication Protocol',
        description: 'Stay connected and informed',
        actions: [
          'Inform others of your route',
          'Share live location with trusted contact',
          'Plan regular check-in calls',
          'Identify safe rest stops',
          'Have emergency contacts ready'
        ],
        priority: 'High'
      }
    ],
    Fatal: [
      {
        severity: 'Fatal',
        title: '⚠️ IMMEDIATE ACTION REQUIRED',
        description: 'Critical conditions - Not recommended to travel',
        actions: [
          'DO NOT TRAVEL if possible',
          'Use alternative transportation methods',
          'Wait for conditions to improve significantly',
          'Consider rescheduling trip',
          'Seek professional driver assistance'
        ],
        priority: 'Critical'
      },
      {
        severity: 'Fatal',
        title: 'Emergency Preparedness',
        description: 'Be fully prepared for emergencies',
        actions: [
          'Carry comprehensive emergency kit',
          'Ensure mobile phone is fully charged',
          'Have emergency contacts accessible',
          'Know location of nearest hospital',
          'Have insurance documents ready'
        ],
        priority: 'Critical'
      },
      {
        severity: 'Fatal',
        title: 'Alternative Routes Planning',
        description: 'Find safer travel options',
        actions: [
          'Check real-time weather radar',
          'Use main highways and well-lit routes',
          'Avoid mountain passes and rural areas',
          'Consider public transportation',
          'Book accommodation and delay travel'
        ],
        priority: 'Critical'
      },
      {
        severity: 'Fatal',
        title: 'Professional Support',
        description: 'Use professional services',
        actions: [
          'Contact weather service for updates',
          'Call traffic control center',
          'Request police escort if available',
          'Use professional driver services',
          'Follow official travel advisories'
        ],
        priority: 'Critical'
      }
    ]
  }

  // Calculate Risk Score
  const calculateRiskScore = (conditions) => {
    let score = 0

    // Speed factor (0-30)
    const speed = conditions.speed || 0
    if (speed > 100) score += 30
    else if (speed > 80) score += 25
    else if (speed > 60) score += 15
    else if (speed > 40) score += 5
    else score += 0

    // Weather factor (0-25)
    const weatherFactors = { Clear: 0, Rain: 12, Fog: 15, Snow: 20 }
    score += weatherFactors[conditions.weather] || 0

    // Road condition (0-15)
    const roadFactors = { Dry: 0, Wet: 8, Icy: 15, Damaged: 10 }
    score += roadFactors[conditions.road_condition] || 0

    // Visibility (0-15)
    const visibilityFactors = { Good: 0, Moderate: 7, Poor: 15 }
    score += visibilityFactors[conditions.visibility] || 0

    // Time of day (0-10)
    const timeFactors = { Morning: 2, Afternoon: 3, Evening: 5, Night: 10 }
    score += timeFactors[conditions.time_of_day] || 0

    // Traffic density (0-10)
    const trafficFactors = { Low: 0, Medium: 4, High: 10 }
    score += trafficFactors[conditions.traffic_density] || 0

    // Vehicle type multiplier (1.0-1.5)
    const vehicleMultipliers = { Car: 1.0, Truck: 1.2, Motorcycle: 1.5, Bus: 1.1 }
    const multiplier = vehicleMultipliers[conditions.vehicle_type] || 1.0
    score = Math.round(score * multiplier)

    // Ensure score is between 0-100
    score = Math.min(Math.max(score, 0), 100)

    // Determine severity
    let severity = 'Minor'
    if (score >= 70) severity = 'Fatal'
    else if (score >= 50) severity = 'Major'
    else severity = 'Minor'

    return {
      score,
      severity,
      factors: {
        speed: Math.min(speed > 0 ? (speed / 120) * 30 : 0, 30),
        weather: weatherFactors[conditions.weather] || 0,
        road: roadFactors[conditions.road_condition] || 0,
        visibility: visibilityFactors[conditions.visibility] || 0,
        time: timeFactors[conditions.time_of_day] || 0,
        traffic: trafficFactors[conditions.traffic_density] || 0
      }
    }
  }

  // Generate Recommendations
  const generateRecommendations = (result) => {
    const { score, severity, factors } = result
    const recs = []

    if (score >= 70) {
      recs.push('⚠️ CRITICAL: Do not travel. Reschedule if possible.')
      recs.push('Contact emergency services for travel assistance.')
      recs.push('Use alternative transportation methods.')
    } else if (score >= 50) {
      const highFactors = Object.entries(factors)
        .filter(([_, val]) => val >= 10)
        .map(([key]) => key)

      if (highFactors.includes('speed')) {
        recs.push('Reduce speed significantly - speed is a major risk factor.')
      }
      if (highFactors.includes('weather')) {
        recs.push('Adapt to weather conditions - consider delaying travel.')
      }
      if (highFactors.includes('visibility')) {
        recs.push('Poor visibility detected - use headlights and reduce speed.')
      }
      if (highFactors.includes('time')) {
        recs.push('Night driving is risky - ensure good rest before driving.')
      }

      recs.push('Increase following distance to 5-6 seconds.')
      recs.push('Ensure vehicle maintenance is current.')
      recs.push('Share your location with a trusted contact.')
    } else {
      recs.push('✅ Safe driving conditions detected.')
      recs.push('Follow standard safety practices.')
      recs.push('Maintain normal speed and driving habits.')
      recs.push('Still stay alert and focused.')
    }

    return recs
  }

  // Handle Risk Prediction
  const handleRiskPrediction = (e) => {
    e.preventDefault()
    setRiskLoading(true)

    setTimeout(() => {
      const result = calculateRiskScore(riskFormData)
      setRiskPredictionResult(result)

      // Add to history
      const newHistory = [
        {
          timestamp: new Date().toLocaleTimeString(),
          score: result.score,
          severity: result.severity
        },
        ...riskHistory.slice(0, 49)
      ]
      setRiskHistory(newHistory)

      // Generate recommendations and strategies
      const recs = generateRecommendations(result)
      setRecommendations(recs)

      const strategies = strategyDatabase[result.severity] || []
      setPreventionStrategies(strategies)

      setRiskLoading(false)
      addNotification(`Risk Assessment: ${result.severity} Risk (Score: ${result.score})`, 'info')
    }, 500)
  }

  // Handle Export
  const handleExportReport = () => {
    if (!riskPredictionResult) {
      alert('Please calculate risk first')
      return
    }

    const report = {
      timestamp: new Date().toISOString(),
      riskScore: riskPredictionResult.score,
      severity: riskPredictionResult.severity,
      conditions: riskFormData,
      riskFactors: riskPredictionResult.factors,
      strategies: preventionStrategies,
      recommendations: recommendations
    }

    const dataStr = JSON.stringify(report, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `risk_assessment_${new Date().getTime()}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Get Severity Color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Minor':
        return '#10B981'
      case 'Major':
        return '#F59E0B'
      case 'Fatal':
        return '#EF4444'
      default:
        return '#6B7280'
    }
  }

  // Get Severity Icon
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'Minor':
        return <CheckCircle className="w-8 h-8 text-green-500" />
      case 'Major':
        return <AlertTriangle className="w-8 h-8 text-orange-500" />
      case 'Fatal':
        return <AlertCircle className="w-8 h-8 text-red-500" />
      default:
        return <Shield className="w-8 h-8 text-blue-500" />
    }
  }

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="text-blue-500" size={32} />
            Risk Prediction & Prevention
          </h1>
          <p className="text-gray-400 mt-1">Comprehensive safety assessment and prevention strategies</p>
        </div>
        {riskPredictionResult && (
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Download size={18} />
            Export Report
          </button>
        )}
      </div>

      {/* Main Layout - 2 Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Risk Prediction Form */}
        <div className="lg:col-span-1">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 sticky top-6">
            <h2 className="text-lg font-semibold mb-6 text-white flex items-center gap-2">
              <Gauge className="text-orange-500" />
              Risk Assessment Form
            </h2>

            <form onSubmit={handleRiskPrediction} className="space-y-4">
              {/* Speed */}
              <div>
                <label className="block text-sm mb-2 text-gray-400">Speed (km/h)</label>
                <input
                  type="range"
                  min="20"
                  max="120"
                  value={riskFormData.speed}
                  onChange={(e) => setRiskFormData({ ...riskFormData, speed: Number(e.target.value) })}
                  className="w-full"
                />
                <div className="text-right text-sm text-gray-300 mt-1">{riskFormData.speed} km/h</div>
              </div>

              {/* Weather */}
              <div>
                <label className="block text-sm mb-2 text-gray-400 flex items-center gap-2">
                  <Cloud size={16} />
                  Weather
                </label>
                <select
                  value={riskFormData.weather}
                  onChange={(e) => setRiskFormData({ ...riskFormData, weather: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Clear</option>
                  <option>Rain</option>
                  <option>Fog</option>
                  <option>Snow</option>
                </select>
              </div>

              {/* Road Condition */}
              <div>
                <label className="block text-sm mb-2 text-gray-400 flex items-center gap-2">
                  <Route size={16} />
                  Road Condition
                </label>
                <select
                  value={riskFormData.road_condition}
                  onChange={(e) => setRiskFormData({ ...riskFormData, road_condition: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Dry</option>
                  <option>Wet</option>
                  <option>Icy</option>
                  <option>Damaged</option>
                </select>
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm mb-2 text-gray-400 flex items-center gap-2">
                  <Eye size={16} />
                  Visibility
                </label>
                <select
                  value={riskFormData.visibility}
                  onChange={(e) => setRiskFormData({ ...riskFormData, visibility: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Good</option>
                  <option>Moderate</option>
                  <option>Poor</option>
                </select>
              </div>

              {/* Time of Day */}
              <div>
                <label className="block text-sm mb-2 text-gray-400 flex items-center gap-2">
                  <Clock size={16} />
                  Time of Day
                </label>
                <select
                  value={riskFormData.time_of_day}
                  onChange={(e) => setRiskFormData({ ...riskFormData, time_of_day: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Morning</option>
                  <option>Afternoon</option>
                  <option>Evening</option>
                  <option>Night</option>
                </select>
              </div>

              {/* Traffic Density */}
              <div>
                <label className="block text-sm mb-2 text-gray-400 flex items-center gap-2">
                  <Users size={16} />
                  Traffic Density
                </label>
                <select
                  value={riskFormData.traffic_density}
                  onChange={(e) => setRiskFormData({ ...riskFormData, traffic_density: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>

              {/* Vehicle Type */}
              <div>
                <label className="block text-sm mb-2 text-gray-400">Vehicle Type</label>
                <select
                  value={riskFormData.vehicle_type}
                  onChange={(e) => setRiskFormData({ ...riskFormData, vehicle_type: e.target.value })}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Car</option>
                  <option>Truck</option>
                  <option>Motorcycle</option>
                  <option>Bus</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={riskLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg transition font-semibold flex items-center justify-center gap-2"
              >
                <Zap size={18} />
                {riskLoading ? 'Calculating...' : 'Predict Risk'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column - Risk Results and Prevention */}
        <div className="lg:col-span-2 space-y-6">
          {/* Risk Score Card */}
          {riskPredictionResult && (
            <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Score Display */}
                <div className="flex flex-col items-center justify-center">
                  <div className="text-sm text-gray-400 mb-2">Risk Score</div>
                  <div
                    className="text-6xl font-bold mb-2"
                    style={{ color: getSeverityColor(riskPredictionResult.severity) }}
                  >
                    {riskPredictionResult.score}
                  </div>
                  <div className="text-center">
                    <span
                      className="text-lg font-semibold px-4 py-2 rounded-full"
                      style={{
                        color: '#fff',
                        backgroundColor: getSeverityColor(riskPredictionResult.severity)
                      }}
                    >
                      {riskPredictionResult.severity} Risk
                    </span>
                  </div>
                </div>

                {/* Severity Icon and Details */}
                <div className="flex flex-col items-center justify-center">
                  {getSeverityIcon(riskPredictionResult.severity)}
                  <p className="text-gray-400 text-sm mt-4 text-center">
                    {riskPredictionResult.severity === 'Minor'
                      ? 'Safe conditions detected'
                      : riskPredictionResult.severity === 'Major'
                      ? 'Extra caution recommended'
                      : 'Critical conditions detected'}
                  </p>
                </div>

                {/* Risk Factors Summary */}
                <div className="space-y-2">
                  <div className="text-sm font-semibold text-gray-400 mb-3">Risk Factors</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between text-gray-300">
                      <span>Speed:</span>
                      <span>{Math.round(riskPredictionResult.factors.speed)}/30</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Weather:</span>
                      <span>{riskPredictionResult.factors.weather}/25</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Road:</span>
                      <span>{riskPredictionResult.factors.road}/15</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Visibility:</span>
                      <span>{riskPredictionResult.factors.visibility}/15</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Time:</span>
                      <span>{riskPredictionResult.factors.time}/10</span>
                    </div>
                    <div className="flex justify-between text-gray-300">
                      <span>Traffic:</span>
                      <span>{riskPredictionResult.factors.traffic}/10</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Visualizations */}
          {riskPredictionResult && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Radar Chart - Risk Factors */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                  <BarChart3 size={18} />
                  Risk Factor Breakdown
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={[riskPredictionResult.factors]}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="name" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis stroke="#9CA3AF" angle={90} domain={[0, 30]} />
                    <Radar
                      name="Risk Points"
                      dataKey="value"
                      stroke="#3B82F6"
                      fill="#3B82F6"
                      fillOpacity={0.6}
                      data={[
                        { name: 'Speed', value: riskPredictionResult.factors.speed },
                        { name: 'Weather', value: Math.min(riskPredictionResult.factors.weather / 0.833, 30) },
                        { name: 'Road', value: Math.min(riskPredictionResult.factors.road * 2, 30) },
                        { name: 'Visibility', value: Math.min(riskPredictionResult.factors.visibility * 2, 30) },
                        { name: 'Time', value: Math.min(riskPredictionResult.factors.time * 3, 30) },
                        { name: 'Traffic', value: Math.min(riskPredictionResult.factors.traffic * 3, 30) }
                      ]}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Line Chart - Risk History */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                  <TrendingUp size={18} />
                  Risk History
                </h3>
                {riskHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={riskHistory}>
                      <CartesianGrid stroke="#374151" />
                      <XAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#9CA3AF" domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563' }}
                        cursor={{ stroke: '#3B82F6' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#3B82F6"
                        dot={{ fill: '#3B82F6', r: 4 }}
                        activeDot={{ r: 6 }}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-300 flex items-center justify-center text-gray-400">
                    No history yet - calculate risk to see trends
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {riskPredictionResult && recommendations.length > 0 && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                <Zap className="text-yellow-500" size={18} />
                Personalized Recommendations
              </h3>
              <div className="space-y-2">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-gray-700 rounded-lg">
                    <CheckCircle size={18} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-gray-200">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prevention Strategies */}
          {riskPredictionResult && preventionStrategies.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Shield className="text-blue-500" size={18} />
                Prevention Strategies for {riskPredictionResult.severity} Risk
              </h3>

              {preventionStrategies.map((strategy, idx) => (
                <div
                  key={idx}
                  className="bg-gray-800 rounded-lg p-6 border-l-4 border-gray-700"
                  style={{ borderLeftColor: getSeverityColor(strategy.severity) }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                        {strategy.severity === 'Fatal' && <AlertCircle className="text-red-500" size={20} />}
                        {strategy.severity === 'Major' && <AlertTriangle className="text-orange-500" size={20} />}
                        {strategy.severity === 'Minor' && <CheckCircle className="text-green-500" size={20} />}
                        {strategy.title}
                      </h4>
                      <p className="text-gray-400 text-sm mt-1">{strategy.description}</p>
                    </div>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold text-white whitespace-nowrap ml-4"
                      style={{ backgroundColor: getSeverityColor(strategy.severity) }}
                    >
                      {strategy.priority}
                    </span>
                  </div>

                  <div className="space-y-2 mt-4">
                    {strategy.actions.map((action, actionIdx) => (
                      <div key={actionIdx} className="flex items-start gap-2 text-gray-300">
                        <span className="text-blue-500 font-semibold mt-0.5">→</span>
                        <span>{action}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Emergency Contacts */}
          {riskPredictionResult && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-4 text-white flex items-center gap-2">
                <Heart className="text-red-500" size={18} />
                Emergency Contacts
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'Emergency', number: '911', icon: '🚨' },
                  { name: 'Police/Emergency', number: '911', icon: '👮' },
                  { name: 'Roadside Assistance', number: '1-800-AAA-HELP', icon: '🚗' },
                  { name: 'Highway Patrol', number: '*77', icon: '🚔' }
                ].map((contact, idx) => (
                  <div key={idx} className="bg-gray-700 rounded-lg p-4">
                    <p className="text-gray-400 text-sm">{contact.name}</p>
                    <p className="text-white text-lg font-semibold mt-2">{contact.number}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Empty State */}
      {!riskPredictionResult && (
        <div className="bg-gray-800 rounded-lg p-12 border border-gray-700 text-center">
          <AlertTriangle size={48} className="text-orange-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Start Your Risk Assessment</h3>
          <p className="text-gray-400 mb-6">
            Fill in the form on the left to calculate your current risk score and get personalized prevention strategies.
          </p>
          <div className="inline-block bg-blue-600 bg-opacity-20 border border-blue-500 rounded-lg p-4">
            <p className="text-blue-300 text-sm">
              💡 Tip: Change the conditions to see how different factors affect your risk score
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default RiskAndPreventionDashboard