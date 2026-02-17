import React from 'react'
import { Marker, InfoWindow } from '@react-google-maps/api'

function AccidentMarker({ 
  accident, 
  isSelected, 
  onSelect, 
  onClose 
}) {
  
  const getSeverityColor = (severity) => {
    const colors = {
      'Minor': '#10B981',
      'Major': '#F59E0B',
      'Fatal': '#EF4444'
    }
    return colors[severity] || '#6B7280'
  }

  const getMarkerIcon = () => {
    if (!window.google) return null

    return {
      path: window.google.maps.SymbolPath.CIRCLE,
      scale: 12,
      fillColor: getSeverityColor(accident.severity),
      fillOpacity: 0.9,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      anchor: new window.google.maps.Point(0, 0)
    }
  }

  return (
    <>
      <Marker
        position={{ 
          lat: accident.latitude, 
          lng: accident.longitude 
        }}
        onClick={onSelect}
        icon={getMarkerIcon()}
        animation={isSelected ? window.google.maps.Animation.BOUNCE : null}
      />

      {isSelected && (
        <InfoWindow
          position={{ 
            lat: accident.latitude, 
            lng: accident.longitude 
          }}
          onCloseClick={onClose}
        >
          <div className="text-gray-900 p-3 max-w-sm">
            <div className="mb-3">
              <span 
                className="px-3 py-1 rounded-full text-xs font-bold text-white inline-block"
                style={{ backgroundColor: getSeverityColor(accident.severity) }}
              >
                {accident.severity}
              </span>
              {accident.verified && (
                <span className="ml-2 px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                  â Verified
                </span>
              )}
            </div>

            <h3 className="font-bold text-lg mb-2">
              Accident Report #{accident.id}
            </h3>

            {accident.description && (
              <p className="text-sm text-gray-700 mb-3 italic">
                "{accident.description}"
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-semibold">Weather:</span>
                <br />
                {accident.weather}
              </div>
              <div>
                <span className="font-semibold">Road:</span>
                <br />
                {accident.road_condition}
              </div>
              <div>
                <span className="font-semibold">Time:</span>
                <br />
                {accident.time_of_day}
              </div>
              <div>
                <span className="font-semibold">Vehicle:</span>
                <br />
                {accident.vehicle_type}
              </div>
            </div>

            {accident.speed && (
              <p className="text-sm mt-2">
                <span className="font-semibold">Speed:</span> {accident.speed} km/h
              </p>
            )}

            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                ð {accident.latitude.toFixed(5)}, {accident.longitude.toFixed(5)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                ð {new Date(accident.reported_at).toLocaleString()}
              </p>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  )
}

export default AccidentMarker