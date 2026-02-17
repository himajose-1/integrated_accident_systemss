import React, { useState, useEffect } from 'react'
import { X, Download, Trash2, AlertTriangle, Clock, FileText, Image, Video, Settings, Eye } from 'lucide-react'
import api from '../../services/api'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function ReportDetailPanel({ report, onClose, onDelete }) {
  const [evidence, setEvidence] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (report?.id) {
      console.log('ReportDetailPanel: Fetching evidence for report', report.id)
      fetchEvidence()
    } else {
      console.log('ReportDetailPanel: No report ID provided', report)
      setError('No report data provided')
      setLoading(false)
    }
  }, [report])

  const fetchEvidence = async () => {
    try {
      setLoading(true)
      setError(null)
      const endpoint = `${API_BASE_URL}/api/reports/${report.id}/evidence`
      console.log('🔍 Fetching evidence from:', endpoint)
      const response = await fetch(endpoint)
      
      console.log('📥 Evidence fetch response status:', response.status)
      
      const data = await response.json()
      console.log('📊 Evidence response data:', JSON.stringify(data, null, 2))
      
      if (response.ok) {
        const files = (data.data?.files || []).map(file => ({
          ...file,
          url: file.url.startsWith('http') ? file.url : `${API_BASE_URL}${file.url}`
        }))
        console.log('✅ Setting evidence files with corrected URLs:', files)
        setEvidence(files)
      } else {
        const errMsg = data.detail || 'Failed to load evidence'
        console.error('❌ API error:', errMsg)
        setError(errMsg)
      }
    } catch (err) {
      console.error('❌ Error fetching evidence:', err)
      setError(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const downloadFile = async (evidence_file) => {
    try {
      const fileUrl = evidence_file.url.startsWith('http') ? evidence_file.url : `${API_BASE_URL}${evidence_file.url}`
      console.log('📥 Downloading file from:', fileUrl)
      const response = await fetch(fileUrl)
      if (!response.ok) throw new Error('Download failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = evidence_file.original_name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('❌ Download error:', error)
      alert('Failed to download file')
    }
  }

  const isImageFile = (file_type) => {
    return ['jpg', 'jpeg', 'png', 'gif'].includes(file_type?.toLowerCase())
  }

  const isVideoFile = (file_type) => {
    return ['mp4', 'mov', 'avi', 'webm'].includes(file_type?.toLowerCase())
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-700">
        {/* Header */}
        <div className="border-b border-gray-700 p-6 flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-2xl font-bold text-white">Report Details</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                report?.severity === 'Critical' ? 'bg-red-600 text-white' :
                report?.severity === 'Major' ? 'bg-orange-600 text-white' :
                report?.severity === 'Minor' ? 'bg-yellow-600 text-white' :
                'bg-green-600 text-white'
              }`}>
                {report?.severity || 'Unknown'}
              </span>
              {report?.verified && (
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-green-600 text-white">
                  ✓ Verified
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm">
              Reported on {report?.reported_at ? new Date(report.reported_at).toLocaleString() : 'Unknown'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition p-2 hover:bg-gray-700 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {/* Show error prominently if it exists */}
          {error && (
            <div className="bg-red-900 border-2 border-red-700 rounded-lg p-6 text-red-200 mb-6 text-center">
              <p className="text-lg font-semibold mb-2">❌ Error Loading Evidence</p>
              <p>{error}</p>
              <button
                onClick={fetchEvidence}
                className="mt-4 px-4 py-2 bg-red-700 hover:bg-red-600 rounded text-white transition"
              >
                Retry
              </button>
            </div>
          )}

          {/* Show loading state */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
                <p className="text-gray-400">Loading evidence...</p>
              </div>
            </div>
          )}

          {/* Only show content if not loading and no error */}
          {!loading && !error && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <AlertTriangle size={16} />
                    <span className="text-sm font-semibold">Description</span>
                  </div>
                  <p className="text-white">{report?.description || 'No description provided'}</p>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <FileText size={16} />
                    <span className="text-sm font-semibold">Weather & Road</span>
                  </div>
                  <p className="text-white">Weather: {report?.weather || 'Unknown'}</p>
                  <p className="text-white">Road: {report?.road_condition || 'Unknown'}</p>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <Settings size={16} />
                    <span className="text-sm font-semibold">Conditions</span>
                  </div>
                  <p className="text-white">Vehicle: {report?.vehicle_type || 'Unknown'}</p>
                  <p className="text-white">Speed: {report?.speed || 'N/A'} km/h</p>
                  <p className="text-white">Traffic: {report?.traffic_density || 'Unknown'}</p>
                </div>

                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-400 mb-1">
                    <Clock size={16} />
                    <span className="text-sm font-semibold">Location</span>
                  </div>
                  <p className="text-white">Latitude: {report?.latitude?.toFixed(6)}</p>
                  <p className="text-white">Longitude: {report?.longitude?.toFixed(6)}</p>
                </div>
              </div>

              {/* Evidence Section */}
              <div className="mb-6">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Image size={24} />
                  Evidence & Media ({evidence.length} file{evidence.length !== 1 ? 's' : ''})
                </h3>

            {error && (
              <div className="bg-red-900 border border-red-700 rounded-lg p-4 text-red-200 mb-4">
                {error}
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-400">Loading evidence...</div>
              </div>
            ) : evidence.length === 0 ? (
              <div className="bg-gray-700 rounded-lg p-8 text-center">
                <Image size={48} className="text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">No evidence files attached to this report</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {evidence.map((evidence_file, index) => (
                  <div
                    key={index}
                    className="bg-gray-700 rounded-lg overflow-hidden hover:bg-gray-600 transition group"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-gray-800 flex items-center justify-center overflow-hidden cursor-pointer"
                      onClick={() => isImageFile(evidence_file.file_type) && setSelectedImage(evidence_file)}>
                      {isImageFile(evidence_file.file_type) ? (
                        <img
                          src={evidence_file.url}
                          alt={evidence_file.original_name}
                          className="w-full h-full object-cover group-hover:scale-110 transition"
                        />
                      ) : isVideoFile(evidence_file.file_type) ? (
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Video size={48} className="text-blue-400" />
                          <span className="text-sm text-gray-400">Video</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2">
                          <FileText size={48} className="text-gray-500" />
                          <span className="text-sm text-gray-400">File</span>
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="p-3">
                      <p className="text-sm text-gray-300 truncate mb-2">{evidence_file.original_name}</p>
                      <p className="text-xs text-gray-500 mb-3">
                        {new Date(evidence_file.uploaded_at).toLocaleString()}
                      </p>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => downloadFile(evidence_file)}
                          className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm transition"
                        >
                          <Download size={14} />
                          Download
                        </button>
                        {isImageFile(evidence_file.file_type) && (
                          <button
                            onClick={() => setSelectedImage(evidence_file)}
                            className="flex-1 flex items-center justify-center gap-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded text-sm transition"
                          >
                            <Eye size={14} />
                            View
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-6 flex justify-between gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
          >
            Close
          </button>
          {onDelete && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this report and all associated media?')) {
                  onDelete(report.id)
                }
              }}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center justify-center gap-2"
            >
              <Trash2 size={16} />
              Delete Report
            </button>
          )}
        </div>
      </div>

      {/* Image Lightbox Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] click-stop" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImage.url}
              alt={selectedImage.original_name}
              className="w-full h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded-lg hover:bg-opacity-75 transition"
            >
              <X size={24} />
            </button>
            <div className="absolute bottom-4 left-0 right-0 mx-auto w-fit">
              <button
                onClick={() => downloadFile(selectedImage)}
                className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition"
              >
                <Download size={16} />
                Download Full Size
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ReportDetailPanel
