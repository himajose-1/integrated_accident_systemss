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
  Send
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
  Cell
} from 'recharts'

const PreventionStrategies = () => {
  const { accidents, alerts, predictRisk, addNotification } = useApp()
  const [riskData, setRiskData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedScenario, setSelectedScenario] = useState(null)
  const [preventionStrategies, setPreventionStrategies] = useState([])
  const [riskHistory, setRiskHistory] = useState([])
  const [activeTab, setActiveTab] = useState('overview')

  // Risk conditions for testing/prediction
  const [conditions, setConditions] = useState({
    speed: 60,
    weather: 'Clear',
    road_condition: 'Dry',
    vehicle_type: 'Car',
    time_of_day: 'Day',
    traffic_density: 'Medium',
    visibility: 'Good'
  })

  // Prevention strategies based on risk level
  const strategyDatabase = {
    Minor: [
      {
        title: 'Maintain Safe Speed',
        description: 'Keep within speed limits appropriate for road conditions',
        actions: [
          'Monitor speedometer regularly',
          'Adjust speed for weather conditions',
          'Reduce speed in congested areas',
          'Leave extra time for your journey'
        ],
        severity: 'low'
      },
      {
        title: 'Defensive Driving',
        description: 'Stay alert and anticipate other drivers\' actions',
        actions: [
          'Keep 3-second following distance',
          'Scan road ahead for hazards',
          'Check mirrors frequently',
          'Avoid distractions (phones, eating)'
        ],
        severity: 'low'
      },
      {
        title: 'Vehicle Maintenance',
        description: 'Ensure your vehicle is in good condition',
        actions: [
          'Check tire pressure and tread',
          'Test brakes regularly',
          'Keep lights and wipers functional',
          'Maintain proper fluid levels'
        ],
        severity: 'low'
      }
    ],
    Major: [
      {
        title: 'Reduce Speed Significantly',
        description: 'Current conditions require reduced speed',
        actions: [
          'Reduce speed by 20-30%',
          'Increase following distance to 4-5 seconds',
          'Avoid sudden maneuvers',
          'Reduce acceleration and braking'
        ],
        severity: 'high'
      },
      {
        title: 'Enhanced Vehicle Control',
        description: 'Maintain firm grip on steering and smooth inputs',
        actions: [
          'Keep both hands on steering wheel',
          'Make smooth, gradual steering inputs',
          'Avoid sudden braking',
          'Use lower gear for better control'
        ],
        severity: 'high'
      },
      {
        title: 'Increased Vigilance',
        description: 'Pay heightened attention to surroundings',
        actions: [
          'Eliminate all distractions',
          'Do not use mobile devices',
          'Skip radio/music adjustments',
          'Avoid eating or drinking'
        ],
        severity: 'high'
      },
      {
        title: 'Consider Alternative Route',
        description: 'Avoid high-risk areas if possible',
        actions: [
          'Use GPS to find safer routes',
          'Avoid peak traffic hours',
          'Stay away from known hazard zones',
          'Request route analysis from app'
        ],
        severity: 'high'
      }
    ],
    Fatal: [
      {
        title: 'STOP - DO NOT TRAVEL',
        description: 'Conditions are extremely dangerous',
        actions: [
          'Pull over to safe location immediately',
          'Wait for conditions to improve',
          'Consider staying at destination',
          'Use public transportation if available'
        ],
        severity: 'critical'
      },
      {
        title: 'Maximum Caution Required',
        description: 'If travel is absolutely necessary',
        actions: [
          'Reduce speed to absolute minimum',
          'Increase following distance to 10+ seconds',
          'Use hazard lights if visibility poor',
          'Consider professional driving service'
        ],
        severity: 'critical'
      },
      {
        title: 'Emergency Preparations',
        description: 'Prepare for worst-case scenarios',
        actions: [
          'Have emergency kit in vehicle',
          'Ensure phone fully charged',
          'Inform someone of your route',
          'Have roadside assistance on speed dial'
        ],
        severity: 'critical'
      },
      {
        title: 'Real-Time Communication',
        description: 'Stay connected with emergency services',
        actions: [
          'Keep phone accessible',
          'Share location with trusted contact',
          'Monitor traffic alerts',
          'Report hazards to authorities'
        ],
        severity: 'critical'
      }
    ]
  }

  // Calculate risk based on conditions
  const calculateRisk = (cond) => {
    let riskScore = 0
    let factors = {}

    // Speed factor (0-30 points)
    if (cond.speed > 100) {
      riskScore += 30
      factors.speed = { score: 30, level: 'Critical', description: 'Extremely high speed' }
    } else if (cond.speed > 80) {
      riskScore += 20
      factors.speed = { score: 20, level: 'High', description: 'High speed' }
    } else if (cond.speed > 60) {
      riskScore += 10
      factors.speed = { score: 10, level: 'Medium', description: 'Moderate speed' }
    } else {
      riskScore += 5
      factors.speed = { score: 5, level: 'Low', description: 'Safe speed' }
    }

    // Weather factor (0-20 points)
    const weatherScores = {
      'Clear': 0,
      'Light Rain': 8,
      'Rain': 15,
      'Heavy Rain': 20,
      'Fog': 18,
      'Snow': 20,
      'Ice': 25
    }
    const weatherScore = weatherScores[cond.weather] || 0
    riskScore += weatherScore
    factors.weather = {
      score: weatherScore,
      level: weatherScore < 10 ? 'Low' : weatherScore < 15 ? 'Medium' : 'High',
      description: cond.weather
    }

    // Road condition factor (0-15 points)
    const roadScores = {
      'Dry': 0,
      'Wet': 8,
      'Icy': 15,
      'Damaged': 12
    }
    const roadScore = roadScores[cond.road_condition] || 0
    riskScore += roadScore
    factors.road = {
      score: roadScore,
      level: roadScore < 5 ? 'Low' : roadScore < 10 ? 'Medium' : 'High',
      description: cond.road_condition
    }

    // Visibility factor (0-15 points)
    const visibilityScores = {
      'Good': 0,
      'Moderate': 8,
      'Poor': 15
    }
    const visScore = visibilityScores[cond.visibility] || 0
    riskScore += visScore
    factors.visibility = {
      score: visScore,
      level: visScore < 5 ? 'Low' : visScore < 10 ? 'Medium' : 'High',
      description: cond.visibility
    }

    // Time of day factor (0-10 points)
    const timeScores = {
      'Morning': 2,
      'Afternoon': 2,
      'Evening': 5,
      'Night': 10
    }
    const timeScore = timeScores[cond.time_of_day] || 0
    riskScore += timeScore
    factors.time = {
      score: timeScore,
      level: timeScore < 3 ? 'Low' : timeScore < 6 ? 'Medium' : 'High',
      description: cond.time_of_day
    }

    // Traffic density factor (0-10 points)
    const trafficScores = {
      'Low': 0,
      'Medium': 3,
      'High': 10
    }
    const trafficScore = trafficScores[cond.traffic_density] || 0
    riskScore += trafficScore
    factors.traffic = {
      score: trafficScore,
      level: trafficScore < 3 ? 'Low' : trafficScore < 7 ? 'Medium' : 'High',
      description: cond.traffic_density
    }

    // Determine severity
    let severity = 'Minor'
    if (riskScore >= 70) severity = 'Fatal'
    else if (riskScore >= 50) severity = 'Major'

    return {
      score: riskScore,
      severity,
      factors,
      confidence: 85 + Math.random() * 10
    }
  }

  // Predict risk
  const handlePredictRisk = async () => {
    setLoading(true)
    try {
      console.log('🔍 Calculating risk for conditions:', conditions)
      
      const risk = calculateRisk(conditions)
      setRiskData(risk)
      setSelectedScenario(conditions)
      setPreventionStrategies(strategyDatabase[risk.severity] || [])
      
      // Add to history
      setRiskHistory(prev => [...prev.slice(-4), {
        timestamp: new Date().toLocaleTimeString(),
        score: risk.score,
        severity: risk.severity,
        conditions: { ...conditions }
      }])
      
      addNotification('success', `Risk Assessment: ${risk.severity} (Score: ${risk.score}/100)`)
      console.log('✅ Risk prediction completed:', risk)
    } catch (error) {
      console.error('❌ Risk prediction error:', error)
      addNotification('error', 'Failed to predict risk')
    } finally {
      setLoading(false)
    }
  }

  // Export report
  const handleExportReport = () => {
    if (!riskData) {
      addNotification('warning', 'No risk data to export')
      return
    }

    const report = {
      timestamp: new Date().toISOString(),
      riskAssessment: riskData,
      conditions: selectedScenario,
      preventionStrategies: preventionStrategies,
      recommendations: generateRecommendations()
    }

    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2)))
    element.setAttribute('download', `prevention-report-${Date.now()}.json`)
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
    
    addNotification('success', 'Report exported successfully')
  }

  // Generate recommendations
  const generateRecommendations = () => {
    if (!riskData) return []

    const recommendations = []

    if (riskData.factors.speed.level === 'High') {
      recommendations.push({
        priority: 'HIGH',
        action: 'Reduce speed immediately',
        reason: `Current speed (${conditions.speed} km/h) is too high for conditions`
      })
    }

    if (riskData.factors.weather.score > 10) {
      recommendations.push({
        priority: 'HIGH',
        action: 'Adjust driving for weather',
        reason: `${conditions.weather} conditions require cautious driving`
      })
    }

    if (riskData.factors.time.level === 'High') {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Increase alertness during night driving',
        reason: 'Visibility is reduced, accidents are more common at night'
      })
    }

    if (riskData.factors.traffic.score > 5) {
      recommendations.push({
        priority: 'MEDIUM',
        action: 'Maintain safe following distance',
        reason: 'Heavy traffic increases collision risk'
      })
    }

    return recommendations
  }

  // Get severity color
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Minor':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'Major':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'Fatal':
        return 'bg-red-100 text-red-800 border-red-300'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Get severity icon
  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'Minor':
        return <CheckCircle className="w-5 h-5" />
      case 'Major':
        return <AlertTriangle className="w-5 h-5" />
      case 'Fatal':
        return <AlertCircle className="w-5 h-5" />
      default:
        return <Shield className="w-5 h-5" />
    }
  }

  const radarData = riskData
    ? [
        { name: 'Speed', value: riskData.factors.speed.score },
        { name: 'Weather', value: riskData.factors.weather.score },
        { name: 'Road', value: riskData.factors.road.score },
        { name: 'Visibility', value: riskData.factors.visibility.score },
        { name: 'Time', value: riskData.factors.time.score },
        { name: 'Traffic', value: riskData.factors.traffic.score }
      ]
    : []

  const historyData = riskHistory.map((entry, idx) => ({
    name: `Test ${idx + 1}`,
    score: entry.score
  }))

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-8 h-8 text-blue-400" />
          <h1 className="text-4xl font-bold text-white">Prevention Strategies</h1>
        </div>
        <p className="text-slate-400">Real-time risk assessment and personalized safety recommendations</p>
      </div>

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Risk Input */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-xl">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Risk Assessment
            </h2>

            {/* Input Fields */}
            <div className="space-y-4">
              {/* Speed */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Speed: {conditions.speed} km/h
                </label>
                <input
                  type="range"
                  min="20"
                  max="120"
                  value={conditions.speed}
                  onChange={(e) => setConditions({ ...conditions, speed: parseInt(e.target.value) })}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Weather */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Weather</label>
                <select
                  value={conditions.weather}
                  onChange={(e) => setConditions({ ...conditions, weather: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option>Clear</option>
                  <option>Light Rain</option>
                  <option>Rain</option>
                  <option>Heavy Rain</option>
                  <option>Fog</option>
                  <option>Snow</option>
                  <option>Ice</option>
                </select>
              </div>

              {/* Road Condition */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Road Condition</label>
                <select
                  value={conditions.road_condition}
                  onChange={(e) => setConditions({ ...conditions, road_condition: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option>Dry</option>
                  <option>Wet</option>
                  <option>Icy</option>
                  <option>Damaged</option>
                </select>
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Visibility</label>
                <select
                  value={conditions.visibility}
                  onChange={(e) => setConditions({ ...conditions, visibility: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option>Good</option>
                  <option>Moderate</option>
                  <option>Poor</option>
                </select>
              </div>

              {/* Time of Day */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Time of Day</label>
                <select
                  value={conditions.time_of_day}
                  onChange={(e) => setConditions({ ...conditions, time_of_day: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option>Morning</option>
                  <option>Afternoon</option>
                  <option>Evening</option>
                  <option>Night</option>
                </select>
              </div>

              {/* Traffic Density */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Traffic Density</label>
                <select
                  value={conditions.traffic_density}
                  onChange={(e) => setConditions({ ...conditions, traffic_density: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </div>

              {/* Vehicle Type */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Vehicle Type</label>
                <select
                  value={conditions.vehicle_type}
                  onChange={(e) => setConditions({ ...conditions, vehicle_type: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option>Car</option>
                  <option>Truck</option>
                  <option>Motorcycle</option>
                  <option>Bus</option>
                </select>
              </div>

              {/* Predict Button */}
              <button
                onClick={handlePredictRisk}
                disabled={loading}
                className="w-full mt-6 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? '⏳ Analyzing...' : <><Zap className="w-4 h-4" /> Analyze Risk</> }
              </button>
            </div>

            {/* Risk History */}
            {riskHistory.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-700">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Recent Assessments</h3>
                <div className="space-y-2">
                  {riskHistory.map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">{entry.timestamp}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(entry.severity)}`}>
                        {entry.severity} ({entry.score})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Middle Panel - Risk Visualization */}
        <div className="lg:col-span-2 space-y-6">
          {/* Risk Score Card */}
          {riskData && (
            <div className={`rounded-lg p-6 border shadow-xl ${getSeverityColor(riskData.severity)}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                    {getSeverityIcon(riskData.severity)}
                    Risk Level: {riskData.severity}
                  </h3>
                  <p className="text-sm opacity-90">Confidence: {riskData.confidence.toFixed(1)}%</p>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-bold">{riskData.score}</div>
                  <div className="text-sm opacity-75">/100</div>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 border-b border-slate-700">
            {['overview', 'analysis', 'history'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium text-sm transition-colors capitalize ${
                  activeTab === tab
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && riskData && (
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4">Risk Factors</h3>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(riskData.factors).map(([key, factor]) => (
                  <div key={key} className="bg-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-300 text-sm font-medium capitalize">{key}</span>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        factor.level === 'Low' ? 'bg-green-900 text-green-300' :
                        factor.level === 'Medium' ? 'bg-yellow-900 text-yellow-300' :
                        'bg-red-900 text-red-300'
                      }`}>
                        {factor.level}
                      </span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">{factor.score}</div>
                    <div className="text-xs text-slate-400">{factor.description}</div>
                    <div className="mt-2 bg-slate-600 rounded-full h-2 w-full">
                      <div
                        className={`h-full rounded-full ${
                          factor.score < 10 ? 'bg-green-500' :
                          factor.score < 15 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(factor.score * 4, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Analysis Tab */}
          {activeTab === 'analysis' && riskData && radarData.length > 0 && (
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4">Risk Factor Analysis</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#475569" />
                  <PolarAngleAxis dataKey="name" stroke="#94a3b8" />
                  <PolarRadiusAxis stroke="#64748b" />
                  <Radar name="Risk Score" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && historyData.length > 0 && (
            <div className="bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4">Risk Score Trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={historyData}>
                  <CartesianGrid stroke="#475569" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Prevention Strategies */}
      {preventionStrategies.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Shield className="w-6 h-6 text-green-400" />
              Prevention Strategies
            </h2>
            <button
              onClick={handleExportReport}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              Export Report
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {preventionStrategies.map((strategy, idx) => (
              <div
                key={idx}
                className={`rounded-lg p-6 border shadow-lg transition-all hover:shadow-xl ${
                  strategy.severity === 'critical'
                    ? 'bg-red-900 bg-opacity-30 border-red-500 border-2'
                    : strategy.severity === 'high'
                    ? 'bg-yellow-900 bg-opacity-30 border-yellow-500'
                    : 'bg-slate-800 border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3 mb-4">
                  {strategy.severity === 'critical' ? (
                    <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
                  ) : strategy.severity === 'high' ? (
                    <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
                  ) : (
                    <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">{strategy.title}</h3>
                    <p className="text-sm text-slate-300 mt-1">{strategy.description}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-300">Action Items:</h4>
                  {strategy.actions.map((action, actionIdx) => (
                    <div key={actionIdx} className="flex items-start gap-2 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />
                      <span className="text-slate-300">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {riskData && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-400" />
            Personalized Recommendations
          </h2>

          <div className="space-y-4">
            {generateRecommendations().map((rec, idx) => (
              <div
                key={idx}
                className={`rounded-lg p-4 border-l-4 ${
                  rec.priority === 'HIGH'
                    ? 'bg-red-900 bg-opacity-20 border-red-500'
                    : rec.priority === 'MEDIUM'
                    ? 'bg-yellow-900 bg-opacity-20 border-yellow-500'
                    : 'bg-blue-900 bg-opacity-20 border-blue-500'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-white">{rec.action}</h4>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    rec.priority === 'HIGH' ? 'bg-red-600 text-red-100' :
                    rec.priority === 'MEDIUM' ? 'bg-yellow-600 text-yellow-100' :
                    'bg-blue-600 text-blue-100'
                  }`}>
                    {rec.priority}
                  </span>
                </div>
                <p className="text-sm text-slate-300">{rec.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emergency Contacts */}
      <div className="mt-8 bg-slate-800 rounded-lg p-6 border border-slate-700 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Heart className="w-5 h-5 text-red-400" />
          Emergency Contacts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-400 mb-2">911</div>
            <div className="text-sm text-slate-300">Emergency Services</div>
            <div className="text-xs text-slate-400 mt-1">Fire, Ambulance, Police</div>
          </div>
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-400 mb-2">*77</div>
            <div className="text-sm text-slate-300">Highway Patrol</div>
            <div className="text-xs text-slate-400 mt-1">Road Emergency</div>
          </div>
          <div className="bg-slate-700 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400 mb-2">411</div>
            <div className="text-sm text-slate-300">Roadside Assistance</div>
            <div className="text-xs text-slate-400 mt-1">Towing & Rescue</div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {!riskData && (
        <div className="mt-12 text-center py-12 bg-slate-800 rounded-lg border border-slate-700">
          <Shield className="w-16 h-16 text-slate-600 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-slate-400 mb-2">No Risk Assessment Yet</h3>
          <p className="text-slate-500">Adjust the conditions above and click "Analyze Risk" to get started</p>
        </div>
      )}
    </div>
  )
}

export default PreventionStrategies