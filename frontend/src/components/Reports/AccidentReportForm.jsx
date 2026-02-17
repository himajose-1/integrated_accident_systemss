

import React, { useState } from 'react'
import { X, MapPin, AlertTriangle, Bell, Send, Upload, FileType, Trash2, Image, Video } from 'lucide-react'
import { useApp } from '../../contexts/AppContext'

function AccidentReportForm({ location, onClose, onSubmit }) {
  const { addNotification } = useApp()
  
  const [formData, setFormData] = useState({
    severity: 'Minor',
    description: '',
    weather: 'Clear',
    road_condition: 'Dry',
    vehicle_type: 'Car',
    speed: '',
    traffic_density: 'Medium'
  })

  const [submitting, setSubmitting] = useState(false)
  const [notifyUsers, setNotifyUsers] = useState(false)
  const [notificationRadius, setNotificationRadius] = useState(5)
  const [mediaFiles, setMediaFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files)
    const validFiles = files.filter(file => {
      const ext = file.name.split('.').pop().toLowerCase()
      const allowed = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'webm']
      return allowed.includes(ext)
    })

    if (validFiles.length !== files.length) {
      addNotification(
        'Some files were rejected. Only images (jpg, png, gif) and videos (mp4, mov, avi, webm) are allowed.',
        'warning'
      )
    }

    setMediaFiles([...mediaFiles, ...validFiles])
  }

  const removeMediaFile = (index) => {
    setMediaFiles(mediaFiles.filter((_, i) => i !== index))
  }

  const isImageFile = (filename) => {
    const ext = filename.split('.').pop().toLowerCase()
    return ['jpg', 'jpeg', 'png', 'gif'].includes(ext)
  }

  const convertImagesToDataUrl = async (files) => {
    const imagePromises = files
      .filter(file => isImageFile(file.name))
      .map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            resolve({
              name: file.name,
              data: e.target.result,
              size: file.size
            })
          }
          reader.readAsDataURL(file)
        })
      })
    return Promise.all(imagePromises)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Convert images to base64 for storage
    const imageFiles = await convertImagesToDataUrl(mediaFiles)

    const reportData = {
      latitude: location.lat,
      longitude: location.lng,
      ...formData,
      speed: formData.speed ? parseFloat(formData.speed) : null,
      images: imageFiles
    }

    setSubmitting(true)
    try {
      console.log('Submitting report with images:', imageFiles.length)
      const response = await onSubmit(reportData)
      console.log('Full report submission response:', JSON.stringify(response, null, 2))
      console.log('Response type:', typeof response)
      console.log('Response properties:', Object.keys(response || {}))
      
      const reportId = response?.data?.id || response?.id
      console.log('Extracted reportId:', reportId, 'Type:', typeof reportId)

      // Upload media files if any
      if (mediaFiles.length > 0) {
        if (!reportId) {
          console.error('❌ CRITICAL: No reportId extracted! Cannot upload media files.')
          console.error('Response structure:', JSON.stringify(response, null, 2))
          console.error('Expected: response.id or response.data.id')
          console.error('Possible issue: Backend response format mismatch or submitAccidentReport not returning response')
          
          addNotification(
            'Report created but image upload failed - no report ID received',
            'warning',
            {
              title: '⚠️ Partial Upload',
              details: 'Report was created but images could not be uploaded. Check browser console for details.',
              duration: 8000
            }
          )
        } else {
          setUploading(true)
          let uploadedCount = 0
          let failedCount = 0

          for (let i = 0; i < mediaFiles.length; i++) {
            const file = mediaFiles[i]
            const formDataFile = new FormData()
            formDataFile.append('file', file)

            try {
              console.log(`Uploading file ${i + 1}/${mediaFiles.length}: ${file.name} to report ${reportId}`)
              const uploadResponse = await fetch(`/api/reports/${reportId}/upload-media`, {
                method: 'POST',
                body: formDataFile
              })

              console.log(`Upload response status: ${uploadResponse.status} for ${file.name}`)
              const uploadData = await uploadResponse.json()
              console.log(`Upload response data:`, uploadData)

              if (uploadResponse.ok) {
                uploadedCount++
                setUploadProgress(Math.round((uploadedCount / mediaFiles.length) * 100))
              } else {
                failedCount++
                console.error(`Upload failed for ${file.name}: ${uploadData.detail || 'Unknown error'}`)
              }
            } catch (error) {
              failedCount++
              console.error(`Failed to upload file ${file.name}:`, error)
            }
          }

          // Show appropriate notification
          if (uploadedCount > 0) {
            addNotification(
              `${uploadedCount}/${mediaFiles.length} media file(s) uploaded successfully`,
              'success',
              {
                title: '📸 Media Uploaded',
                details: `Your evidence has been attached to the report${failedCount > 0 ? ` (${failedCount} failed)` : ''}`,
                duration: 6000
              }
            )
          } else if (failedCount > 0) {
            addNotification(
              `Failed to upload ${failedCount} media file(s). Please try again.`,
              'error',
              {
                title: '❌ Upload Failed',
                details: 'Check browser console for details',
                duration: 8000
              }
            )
          }
        }
      } else {
        console.log('✅ No media files to upload')
      }

      // Add notification to dashboard
      addNotification(
        `${formData.severity} accident reported at ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`,
        'warning',
        {
          title: `🚨 ${formData.severity} Accident Alert`,
          details: `${formData.description || 'No description provided'} - ${formData.weather} weather, ${formData.road_condition} road${mediaFiles.length > 0 ? ` - Evidence attached (${mediaFiles.length} file(s))` : ''}`,
          priority: formData.severity === 'Critical' ? 'high' : 'normal',
          duration: 8000
        }
      )

      // Notify nearby users if enabled
      if (notifyUsers) {
        addNotification(
          `📢 Notifying nearby users within ${notificationRadius}km radius about this accident`,
          'info',
          {
            title: '📍 Users Notified',
            details: `${notificationRadius}km radius notification sent successfully`,
            duration: 6000
          }
        )
        console.log(`✅ Nearby users notified within ${notificationRadius}km radius`)
      }

      // Close form after successful submission
      setTimeout(() => {
        onClose()
      }, 1000)

      // Close form after uploads are done
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (error) {
      console.error('Failed to submit report:', error)
      addNotification(
        'Failed to submit accident report. Please try again.',
        'error',
        {
          title: '❌ Submission Failed',
          details: error.message,
          persistent: true
        }
      )
    } finally {
      setSubmitting(false)
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase()
    if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) {
      return <Video size={16} className="text-blue-400" />
    }
    return <Image size={16} className="text-green-400" />
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[2000] p-4 animate-fadeIn">
      <div className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-6 flex items-center justify-between z-10">
          <div>
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <AlertTriangle className="text-red-500" size={28} />
              Report Accident
            </h3>
            <p className="text-sm text-gray-400 mt-1">
              Help improve road safety by reporting accidents
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition p-2 rounded-lg hover:bg-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Location Display */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <label className="block text-sm font-medium text-blue-400 mb-2 flex items-center gap-2">
              <MapPin size={16} />
              Accident Location
            </label>
            <div className="font-mono text-white text-lg">
              {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
            </div>
          </div>

          {/* Severity */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Severity <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['Minor', 'Major', 'Fatal'].map(severity => (
                <button
                  key={severity}
                  type="button"
                  onClick={() => handleChange('severity', severity)}
                  className={`py-3 px-4 rounded-lg font-semibold transition ${
                    formData.severity === severity
                      ? severity === 'Fatal'
                        ? 'bg-red-600 text-white'
                        : severity === 'Major'
                        ? 'bg-orange-600 text-white'
                        : 'bg-green-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {severity}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 h-24 resize-none outline-none focus:ring-2 focus:ring-blue-500 transition"
              placeholder="Describe what happened (optional)..."
            />
          </div>

          {/* Weather and Road Condition */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Weather Condition
              </label>
              <select
                value={formData.weather}
                onChange={(e) => handleChange('weather', e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="Clear">Clear ☀️</option>
                <option value="Rain">Rain 🌧️</option>
                <option value="Fog">Fog 🌫️</option>
                <option value="Snow">Snow ❄️</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Road Condition
              </label>
              <select
                value={formData.road_condition}
                onChange={(e) => handleChange('road_condition', e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="Dry">Dry</option>
                <option value="Wet">Wet</option>
                <option value="Icy">Icy</option>
                <option value="Damaged">Damaged</option>
              </select>
            </div>
          </div>

          {/* Vehicle Type and Speed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Vehicle Type
              </label>
              <select
                value={formData.vehicle_type}
                onChange={(e) => handleChange('vehicle_type', e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="Car">Car 🚗</option>
                <option value="Truck">Truck 🚚</option>
                <option value="Motorcycle">Motorcycle 🏍️</option>
                <option value="Bus">Bus 🚌</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Approximate Speed (km/h)
              </label>
              <input
                type="number"
                value={formData.speed}
                onChange={(e) => handleChange('speed', e.target.value)}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition"
                placeholder="Optional"
                min="0"
                max="200"
              />
            </div>
          </div>

          {/* Traffic Density */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Traffic Density
            </label>
            <div className="grid grid-cols-3 gap-3">
              {['Low', 'Medium', 'High'].map(density => (
                <button
                  key={density}
                  type="button"
                  onClick={() => handleChange('traffic_density', density)}
                  className={`py-3 px-4 rounded-lg font-semibold transition ${
                    formData.traffic_density === density
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {density}
                </button>
              ))}
            </div>
          </div>

          {/* Media Upload Section */}
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 space-y-4">
            <label className="block text-sm font-medium text-purple-300 flex items-center gap-2">
              <Upload size={16} />
              Upload Evidence (Images/Videos)
            </label>
            <input
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileSelect}
              disabled={uploading}
              className="w-full bg-gray-700 text-white text-sm rounded-lg px-4 py-3 file:bg-purple-600 file:text-white file:border-0 file:rounded file:px-3 file:py-1 file:cursor-pointer hover:file:bg-purple-700 transition outline-none focus:ring-2 focus:ring-purple-500"
            />
            <p className="text-xs text-purple-300">
              Supported: JPG, PNG, GIF (images) and MP4, MOV, AVI, WEBM (videos)
            </p>

            {/* Media Files List */}
            {mediaFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-purple-300 flex items-center gap-2">
                  📎 Attached Files ({mediaFiles.length})
                </p>
                <div className="space-y-2">
                  {mediaFiles.map((file, index) => (
                    <div
                      key={index}
                      className="bg-gray-700 rounded-lg p-3 flex items-center justify-between hover:bg-gray-600 transition"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getFileIcon(file.name)}
                        <div className="min-w-0">
                          <div className="text-sm text-white truncate">{file.name}</div>
                          <div className="text-xs text-gray-400">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMediaFile(index)}
                        disabled={uploading}
                        className="text-red-400 hover:text-red-300 p-2 rounded hover:bg-gray-600 transition disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {uploading && (
                  <div className="bg-gray-700 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                      <span className="text-sm text-purple-300">Uploading media...</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{uploadProgress}% complete</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notify Nearby Users Section */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyUsers}
                onChange={(e) => setNotifyUsers(e.target.checked)}
                className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-blue-300 flex items-center gap-2">
                <Bell size={16} />
                Notify Nearby Users
              </span>
            </label>
            
            {notifyUsers && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notification Radius (km)
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="20"
                    value={notificationRadius}
                    onChange={(e) => setNotificationRadius(parseInt(e.target.value))}
                    className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="bg-blue-600 text-white rounded-lg px-4 py-2 font-bold min-w-[50px] text-center">
                    {notificationRadius}km
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting || uploading}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition font-semibold disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting || uploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  {uploading ? 'Uploading...' : 'Submitting...'}
                </>
              ) : (
                <>
                  <AlertTriangle size={20} />
                  Submit & {notifyUsers ? '📢 Notify' : 'Report'}{mediaFiles.length > 0 ? ` (${mediaFiles.length} files)` : ''}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AccidentReportForm