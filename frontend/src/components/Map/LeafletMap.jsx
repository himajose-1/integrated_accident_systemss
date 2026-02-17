import React, { useEffect, useRef, useMemo, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useApp } from '../../contexts/AppContext'

function LeafletMap({ 
  accidents = [], 
  alerts = [], 
  hotspots = [], 
  selectedAccident, 
  selectedHotspot, 
  onAccidentSelect, 
  onHotspotSelect, 
  onMapClick, 
  center = [8.5089, 76.9458], 
  zoom = 12,
  searchLocation = null,
  searchRadius = 5000 // 5km in meters
}) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const searchMarkerRef = useRef(null)
  const searchCircleRef = useRef(null)
  const markersRef = useRef({ hotspots: [], accidents: [] })
  const { selectedAlert } = useApp()
  const [mapReady, setMapReady] = useState(false)

  // Initialize map only once
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    try {
      // Initialize map with provided center and zoom
      const mapCenter = Array.isArray(center) ? center : [center.lat, center.lng]
      const map = L.map(mapRef.current).setView(mapCenter, zoom)
      mapInstanceRef.current = map

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(map)

      // Add map click event for adding reports
      map.on('click', (e) => {
        if (onMapClick) {
          onMapClick({
            latLng: {
              lat: () => e.latlng.lat,
              lng: () => e.latlng.lng
            }
          })
        }
      })

      setMapReady(true)

      // Cleanup function
      return () => {
        if (mapInstanceRef.current) {
          try {
            mapInstanceRef.current.remove()
          } catch (e) {
            console.error('Error removing map:', e)
          }
          mapInstanceRef.current = null
        }
      }
    } catch (e) {
      console.error('Error initializing map:', e)
    }
  }, [])

  // Manage hotspot and accident markers (update when data changes)
  useEffect(() => {
    if (!mapInstanceRef.current || !mapReady) return

    const map = mapInstanceRef.current

    // Remove old markers
    markersRef.current.hotspots.forEach(marker => {
      try {
        map.removeLayer(marker)
      } catch (e) {}
    })
    markersRef.current.accidents.forEach(marker => {
      try {
        map.removeLayer(marker)
      } catch (e) {}
    })
    markersRef.current.hotspots = []
    markersRef.current.accidents = []

    // Add hotspot markers with enhanced styling
    hotspots.forEach(hotspot => {
      const color = hotspot.riskLevel === 'High' ? '#ef4444' :
                    hotspot.riskLevel === 'Medium' ? '#f59e0b' : '#10b981'
      
      const shadowColor = hotspot.riskLevel === 'High' ? 'rgba(239, 68, 68, 0.6)' :
                          hotspot.riskLevel === 'Medium' ? 'rgba(245, 158, 11, 0.6)' : 'rgba(16, 185, 129, 0.6)'

      // Enhanced hotspot marker with glow and animation effect
      const icon = L.divIcon({
        className: 'custom-hotspot-marker',
        html: `<div style="
            position: relative;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            animation: pulse-marker 2s ease-in-out infinite;
        ">
          <!-- Main marker -->
          <div style="
            position: relative;
            background-color: ${color};
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 6px ${shadowColor};
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            color: white;
            font-size: 12px;
            z-index: 10;
            transition: transform 0.2s ease;
          ">${hotspot.id}</div>
          
          <!-- Pin point at bottom -->
          <div style="
            position: absolute;
            bottom: -4px;
            width: 0;
            height: 0;
            border-left: 5px solid transparent;
            border-right: 5px solid transparent;
            border-top: 6px solid ${color};
            filter: drop-shadow(0 1px 2px ${shadowColor});
            z-index: 9;
          "></div>
        </div>
        
        <style>
          @keyframes pulse-marker {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
          }
          .custom-hotspot-marker:hover > div > div:nth-child(1) {
            transform: scale(1.15) !important;
          }
        </style>`,
        iconSize: [32, 40],
        iconAnchor: [16, 38],
        popupAnchor: [0, -38]
      })

      const marker = L.marker([hotspot.lat, hotspot.lng], { icon }).addTo(map)

      // Enhanced popup
      marker.bindPopup(`
        <div style="font-family: 'Segoe UI', Arial, sans-serif; min-width: 250px; color: #333;">
          <h3 style="margin: 0 0 12px 0; color: ${color}; font-size: 18px; font-weight: bold;">${hotspot.name}</h3>
          <div style="background: #f5f5f5; border-left: 4px solid ${color}; padding: 10px; margin-bottom: 12px; border-radius: 4px;">
            <p style="margin: 0; font-weight: bold; font-size: 14px;">Risk Level: <span style="color: ${color};">${hotspot.riskLevel}</span></p>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 12px;">
            <div style="text-align: center; padding: 8px; background: #f0f0f0; border-radius: 4px;">
              <p style="margin: 0; font-size: 11px; color: #666;">Total</p>
              <p style="margin: 0; font-size: 16px; font-weight: bold; color: #333;">${hotspot.accidents}</p>
            </div>
            <div style="text-align: center; padding: 8px; background: #ffe0e0; border-radius: 4px;">
              <p style="margin: 0; font-size: 11px; color: #c00;">Fatal</p>
              <p style="margin: 0; font-size: 16px; font-weight: bold; color: #ef4444;">${hotspot.fatal}</p>
            </div>
            <div style="text-align: center; padding: 8px; background: #fff4e0; border-radius: 4px;">
              <p style="margin: 0; font-size: 11px; color: #b83;">Major</p>
              <p style="margin: 0; font-size: 16px; font-weight: bold; color: #f59e0b;">${hotspot.major}</p>
            </div>
          </div>
          ${hotspot.timePattern ? `<p style="margin: 5px 0; font-size: 13px;"><strong>⏰ Peak Time:</strong> ${hotspot.timePattern}</p>` : ''}
          ${hotspot.roadCondition ? `<p style="margin: 5px 0; font-size: 13px;"><strong>🛣️ Road:</strong> ${hotspot.roadCondition}</p>` : ''}
          ${hotspot.distance ? `<p style="margin: 5px 0; font-size: 13px;"><strong>📏 Distance:</strong> ${hotspot.distance.toFixed(2)} km from search</p>` : ''}
          <p style="margin: 8px 0 0 0; font-size: 11px; color: #888; border-top: 1px solid #ddd; padding-top: 8px;">
            📍 ${hotspot.lat.toFixed(4)}, ${hotspot.lng.toFixed(4)}
          </p>
        </div>
      `, {
        className: 'hotspot-popup',
        maxWidth: 300
      })

      // Click handler to trigger state update
      marker.on('click', () => {
        onHotspotSelect(hotspot)
        marker.openPopup()
      })

      markersRef.current.hotspots.push(marker)
    })

    // Add accident markers
    accidents.forEach(accident => {
      const severityColor = {
        'Minor': '#10B981',
        'Major': '#F59E0B',
        'Fatal': '#EF4444'
      }[accident.severity] || '#6B7280'

      const marker = L.circleMarker([accident.latitude, accident.longitude], {
        color: 'white',
        weight: 2,
        fillColor: severityColor,
        fillOpacity: 0.9,
        radius: 8
      }).addTo(map)

      marker.bindPopup(`
        <div style="font-family: Arial, sans-serif; min-width: 200px;">
          <h3 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">${accident.severity} Accident</h3>
          ${accident.description ? `<p style="margin: 5px 0;">${accident.description}</p>` : ''}
          <p style="margin: 5px 0;"><strong>Weather:</strong> ${accident.weather}</p>
          <p style="margin: 5px 0;"><strong>Road Condition:</strong> ${accident.road_condition}</p>
          <p style="margin: 5px 0;"><strong>Time of Day:</strong> ${accident.time_of_day}</p>
          <p style="margin: 5px 0;"><strong>Vehicle Type:</strong> ${accident.vehicle_type}</p>
          ${accident.speed ? `<p style="margin: 5px 0;"><strong>Speed:</strong> ${accident.speed} km/h</p>` : ''}
          <p style="margin: 8px 0 0 0; font-size: 11px; color: #666;">Reported: ${new Date(accident.reported_at).toLocaleString()}</p>
          ${accident.verified ? '<p style="margin: 5px 0; color: #2563eb; font-weight: bold;">✓ Verified</p>' : ''}
        </div>
      `)

      // attach accident id for later lookup
      try { marker.accidentId = accident.id } catch (e) { marker.options.accidentId = accident.id }

      marker.on('click', () => onAccidentSelect(accident))

      markersRef.current.accidents.push(marker)
    })
  }, [hotspots, accidents, onAccidentSelect, onHotspotSelect, mapReady])

  // Handle search location marker and radius circle
  useEffect(() => {
    if (!mapInstanceRef.current) return

    const map = mapInstanceRef.current

    // Remove existing search marker and circle
    if (searchMarkerRef.current) {
      map.removeLayer(searchMarkerRef.current)
      searchMarkerRef.current = null
    }
    if (searchCircleRef.current) {
      map.removeLayer(searchCircleRef.current)
      searchCircleRef.current = null
    }

    // Add new search location marker and circle if searchLocation exists
    if (searchLocation) {
      // Add 5km radius circle only (no marker)
      searchCircleRef.current = L.circle([searchLocation.lat, searchLocation.lng], {
        color: '#06b6d4',
        fillColor: '#06b6d4',
        fillOpacity: 0.08,
        weight: 2,
        opacity: 0.6,
        radius: searchRadius,
        dashArray: '10, 10'
      }).addTo(map)

      // Add tooltip to circle
      searchCircleRef.current.bindTooltip('5km search radius', {
        permanent: false,
        direction: 'center',
        className: 'radius-tooltip'
      })

      // Fit map bounds to show search location and circle
      try {
        const bounds = searchCircleRef.current.getBounds()
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 })
      } catch (e) {
        // Fallback to centering on search location
        map.setView([searchLocation.lat, searchLocation.lng], 13)
      }
    }

    // Cleanup
    return () => {
      if (searchMarkerRef.current && map) {
        try { map.removeLayer(searchMarkerRef.current) } catch (e) {}
        searchMarkerRef.current = null
      }
      if (searchCircleRef.current && map) {
        try { map.removeLayer(searchCircleRef.current) } catch (e) {}
        searchCircleRef.current = null
      }
    }
  }, [searchLocation, searchRadius])

  // When an alert is selected elsewhere in the app, center and highlight it on the map
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedAlert) return
    const lat = selectedAlert.latitude ?? selectedAlert.location?.latitude
    const lng = selectedAlert.longitude ?? selectedAlert.location?.longitude
    if (lat == null || lng == null) return

    const map = mapInstanceRef.current
    try {
      map.setView([lat, lng], 14)
    } catch (e) {
      // ignore
    }

    const highlight = L.circleMarker([lat, lng], {
      color: '#ffffff',
      weight: 2,
      fillColor: selectedAlert.color || '#f59e0b',
      fillOpacity: 0.95,
      radius: 14
    }).addTo(map)

    const popup = L.popup({ closeButton: true })
      .setLatLng([lat, lng])
      .setContent(`<div style="font-family: Arial, sans-serif; min-width: 180px;"><h4 style="margin:0 0 6px 0;">${selectedAlert.title || selectedAlert.message || 'Alert'}</h4><p style="margin:0;">${selectedAlert.message || ''}</p></div>`)
      .openOn(map)

    // Remove highlight after some time or when selectedAlert changes
    const remover = setTimeout(() => {
      try { map.removeLayer(highlight) } catch (e) {}
      try { map.closePopup(popup) } catch (e) {}
    }, 10000)

    return () => {
      clearTimeout(remover)
      try { map.removeLayer(highlight) } catch (e) {}
      try { map.closePopup(popup) } catch (e) {}
    }
  }, [selectedAlert])

  // When a selected accident is set, center and highlight it on the map
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedAccident) return

    const lat = selectedAccident.latitude ?? selectedAccident.lat ?? selectedAccident.location?.latitude
    const lng = selectedAccident.longitude ?? selectedAccident.lng ?? selectedAccident.location?.longitude
    if (lat == null || lng == null) return

    const map = mapInstanceRef.current
    try {
      map.setView([lat, lng], 14)
    } catch (e) {
      // ignore
    }

    // Try to find an existing marker for this accident by id or by coordinates
    let targetMarker = null
    const tol = 0.0005 // ~50m tolerance
    for (const m of markersRef.current.accidents) {
      try {
        if (selectedAccident.id && (m.accidentId === selectedAccident.id || m.options?.accidentId === selectedAccident.id)) {
          targetMarker = m
          break
        }
        const pos = m.getLatLng()
        if (Math.abs(pos.lat - lat) < tol && Math.abs(pos.lng - lng) < tol) {
          targetMarker = m
          break
        }
      } catch (e) {
        // ignore
      }
    }

    let highlight = null
    if (targetMarker) {
      try {
        // open the marker popup if available
        if (typeof targetMarker.openPopup === 'function') {
          targetMarker.openPopup()
        }
        const pos = targetMarker.getLatLng()
        highlight = L.circleMarker([pos.lat, pos.lng], {
          color: '#ffffff',
          weight: 2,
          fillColor: '#ef4444',
          fillOpacity: 0.95,
          radius: 14
        }).addTo(map)
      } catch (e) {
        console.warn('Failed to open marker popup/highlight:', e)
      }
    } else {
      // fallback: generic highlight + popup
      highlight = L.circleMarker([lat, lng], {
        color: '#ffffff',
        weight: 2,
        fillColor: '#ef4444',
        fillOpacity: 0.95,
        radius: 14
      }).addTo(map)

      const popupContent = `<div style="font-family: Arial, sans-serif; min-width: 180px;"><h4 style="margin:0 0 6px 0;">${selectedAccident.severity || 'Accident'}</h4><p style="margin:0;">${selectedAccident.description || selectedAccident.message || ''}</p></div>`
      const popup = L.popup({ closeButton: true })
        .setLatLng([lat, lng])
        .setContent(popupContent)
        .openOn(map)

      // remove the fallback popup after timeout
      const fallbackRemover = setTimeout(() => {
        try { map.removeLayer(highlight) } catch (e) {}
        try { map.closePopup(popup) } catch (e) {}
      }, 10000)

      return () => {
        clearTimeout(fallbackRemover)
        try { map.removeLayer(highlight) } catch (e) {}
        try { map.closePopup(popup) } catch (e) {}
      }
    }

    const remover = setTimeout(() => {
      try { map.removeLayer(highlight) } catch (e) {}
      try { map.closePopup() } catch (e) {}
    }, 10000)

    return () => {
      clearTimeout(remover)
      try { map.removeLayer(highlight) } catch (e) {}
      try { map.closePopup() } catch (e) {}
    }
  }, [selectedAccident])

  // Update map view when center or zoom props change (but not when searching)
  useEffect(() => {
    if (!mapInstanceRef.current || searchLocation) return
    try {
      const mapCenter = Array.isArray(center) ? center : [center.lat, center.lng]
      mapInstanceRef.current.setView(mapCenter, zoom)
    } catch (e) {
      console.error('Failed to update map view:', e)
    }
  }, [center, zoom, searchLocation])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Custom CSS for tooltips */}
      <style>{`
        .radius-tooltip {
          background: rgba(6, 182, 212, 0.9);
          border: none;
          border-radius: 4px;
          color: white;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .radius-tooltip::before {
          border-top-color: rgba(6, 182, 212, 0.9);
        }
      `}</style>
    </div>
  )
}

export default LeafletMap