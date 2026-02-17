import React from 'react'
import { Shield, CheckCircle, AlertTriangle, Zap, Users, Settings, TrendingDown, Clock, ChevronDown, ChevronUp, Target, Lightbulb } from 'lucide-react'

function PreventionStrategiesPanel({ hotspot, expandedStrategies = {}, onToggleStrategy = null }) {
  const preventionStrategies = [
    {
      id: 1,
      title: "Speed Control Measures",
      icon: <Zap size={20} />,
      description: "Enforce speed limits effectively",
      details: [
        "Deploy radar speed guns at entry points",
        "Install variable speed limit signs",
        "Increase traffic police presence",
        "Implement automated enforcement cameras"
      ],
      priority: "High",
      impact: "Reduce speeds by 20-30%",
      timeline: "1-2 weeks",
      color: "text-red-400"
    },
    {
      id: 2,
      title: "Road Infrastructure",
      icon: <Settings size={20} />,
      description: "Improve visibility and design",
      details: [
        "Better road markings and signage",
        "Improved lighting at night",
        "Better lane markings",
        "Speed bump installation"
      ],
      priority: "High",
      impact: "Reduce accidents by 15-25%",
      timeline: "1-3 months",
      color: "text-orange-400"
    },
    {
      id: 3,
      title: "Traffic Management",
      icon: <Users size={20} />,
      description: "Optimize traffic flow",
      details: [
        "Install intelligent traffic signals",
        "Deploy traffic police during peak hours",
        "Create dedicated vehicle lanes",
        "Real-time traffic monitoring"
      ],
      priority: "Medium",
      impact: "Improve flow by 30%",
      timeline: "2-4 weeks",
      color: "text-blue-400"
    },
    {
      id: 4,
      title: "Driver Education",
      icon: <Lightbulb size={20} />,
      description: "Awareness and training",
      details: [
        "Safety awareness campaigns",
        "Training for transport workers",
        "Driver refresher courses",
        "Community engagement programs"
      ],
      priority: "Medium",
      impact: "Reduce human error by 20%",
      timeline: "Continuous",
      color: "text-yellow-400"
    },
    {
      id: 5,
      title: "Emergency Response",
      icon: <AlertTriangle size={20} />,
      description: "Quick response network",
      details: [
        "Setup emergency response booths",
        "Deploy ambulances nearby",
        "First aid training",
        "24/7 response team"
      ],
      priority: "High",
      impact: "Reduce fatalities by 35%",
      timeline: "Immediate",
      color: "text-red-500"
    },
    {
      id: 6,
      title: "Data & Monitoring",
      icon: <Target size={20} />,
      description: "Monitoring and analysis",
      details: [
        "Install CCTV cameras",
        "Real-time accident detection",
        "Data analytics",
        "Quarterly safety audits"
      ],
      priority: "Medium",
      impact: "Enable proactive prevention",
      timeline: "2-3 months",
      color: "text-green-400"
    }
  ]

  return (
    <>
      {preventionStrategies.map((strategy) => {
        const isExpanded = expandedStrategies[strategy.id]
        const toggleStrategy = () => {
          if (onToggleStrategy) {
            onToggleStrategy(strategy.id)
          }
        }

        const priorityColor = strategy.priority === 'High' 
          ? 'bg-red-500/30 border-red-500/50 text-red-400'
          : 'bg-yellow-500/30 border-yellow-500/50 text-yellow-400'

        return (
          <div
            key={strategy.id}
            className="border border-gray-700 rounded-lg overflow-hidden bg-gradient-to-r from-gray-800/50 to-gray-700/30 hover:from-gray-800 hover:to-gray-700/50 transition-all"
          >
            {/* Strategy Header - Clickable */}
            <button
              onClick={toggleStrategy}
              className="w-full p-3 flex items-start gap-3 hover:bg-gray-700/30 transition text-left"
            >
              <div className={`${strategy.color} p-1.5 rounded-lg bg-gray-800/50 flex-shrink-0`}>
                {strategy.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-semibold text-white text-sm truncate">{strategy.title}</p>
                  {isExpanded ? (
                    <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-gray-400 truncate">{strategy.description}</p>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap flex-shrink-0 border ${priorityColor}`}>
                    {strategy.priority}
                  </span>
                </div>
              </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="border-t border-gray-700 p-4 bg-gray-800/30 space-y-4">
                {/* Action Items */}
                <div>
                  <p className="text-xs font-bold text-gray-300 mb-2 uppercase tracking-wide flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-400" />
                    Action Items
                  </p>
                  <ul className="space-y-2 ml-1">
                    {strategy.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-gray-300">
                        <span className="text-green-400 font-bold mt-1">â</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Metrics Row */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-700">
                  <div className="bg-gray-700/50 rounded-lg p-2">
                    <p className="text-xs text-gray-400 mb-1">Expected Impact</p>
                    <p className="text-xs font-semibold text-green-400">{strategy.impact}</p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-2">
                    <p className="text-xs text-gray-400 mb-1">Timeline</p>
                    <p className="text-xs font-semibold text-blue-400">{strategy.timeline}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

export default PreventionStrategiesPanel