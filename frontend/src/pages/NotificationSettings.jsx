import React, { useState, useEffect } from 'react'
import { Bell, Mail, MessageSquare, Phone, Save, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react'

const NotificationSettings = () => {
  const [settings, setSettings] = useState({
    // Email Notifications
    emailAccident: true,
    emailRiskWarning: true,
    emailWeatherAlert: true,
    emailNearMiss: false,
    emailMaintenanceReminder: false,

    // SMS Notifications
    smsAccident: true,
    smsRiskWarning: true,
    smsWeatherAlert: false,
    smsNearMiss: false,

    // In-App Notifications
    inAppAccident: true,
    inAppRiskWarning: true,
    inAppWeatherAlert: true,
    inAppNearMiss: true,
    inAppMaintenanceReminder: true,

    // Push Notifications
    pushAccident: true,
    pushRiskWarning: true,
    pushWeatherAlert: true,
    pushNearMiss: false,

    // Notification Timing
    quietHoursEnabled: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '07:00',
    urgentNotificationsDuringQuietHours: true,

    // Priority Levels
    notifyOnCritical: true,
    notifyOnHigh: true,
    notifyOnMedium: true,
    notifyOnLow: false,

    // Sound & Vibration
    soundEnabled: true,
    vibrationEnabled: true,
    criticalSoundEnabled: true
  })

  const [savedStatus, setSavedStatus] = useState(false)
  const [changesMade, setChangesMade] = useState(false)

  // Load settings from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('notificationSettings')
    if (stored) {
      setSettings(JSON.parse(stored))
    }
  }, [])

  // Handle setting change
  const handleChange = (key) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
    setChangesMade(true)
    setSavedStatus(false)
  }

  // Handle text input change
  const handleInputChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
    setChangesMade(true)
    setSavedStatus(false)
  }

  // Save settings
  const handleSave = () => {
    localStorage.setItem('notificationSettings', JSON.stringify(settings))
    setSavedStatus(true)
    setChangesMade(false)
    setTimeout(() => setSavedStatus(false), 3000)
  }

  // Reset to defaults
  const handleReset = () => {
    if (window.confirm('Reset all settings to defaults?')) {
      const defaults = {
        emailAccident: true,
        emailRiskWarning: true,
        emailWeatherAlert: true,
        emailNearMiss: false,
        emailMaintenanceReminder: false,
        smsAccident: true,
        smsRiskWarning: true,
        smsWeatherAlert: false,
        smsNearMiss: false,
        inAppAccident: true,
        inAppRiskWarning: true,
        inAppWeatherAlert: true,
        inAppNearMiss: true,
        inAppMaintenanceReminder: true,
        pushAccident: true,
        pushRiskWarning: true,
        pushWeatherAlert: true,
        pushNearMiss: false,
        quietHoursEnabled: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '07:00',
        urgentNotificationsDuringQuietHours: true,
        notifyOnCritical: true,
        notifyOnHigh: true,
        notifyOnMedium: true,
        notifyOnLow: false,
        soundEnabled: true,
        vibrationEnabled: true,
        criticalSoundEnabled: true
      }
      setSettings(defaults)
      localStorage.setItem('notificationSettings', JSON.stringify(defaults))
      setSavedStatus(true)
      setChangesMade(false)
      setTimeout(() => setSavedStatus(false), 3000)
    }
  }

  const SettingToggle = ({ label, description, value, onChange }) => (
    <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition">
      <div className="flex-1">
        <h4 className="font-semibold text-white text-sm">{label}</h4>
        <p className="text-xs text-gray-400 mt-1">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition ${
          value ? 'bg-blue-600' : 'bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )

  const SectionHeader = ({ icon: Icon, title }) => (
    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-700">
      <Icon className="w-6 h-6 text-blue-500" />
      <h3 className="text-xl font-bold text-white">{title}</h3>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white flex items-center gap-3 mb-2">
          <Bell className="w-8 h-8 text-blue-500" />
          Notification Settings
        </h1>
        <p className="text-gray-400">Customize how and when you receive notifications</p>
      </div>

      {/* Status Messages */}
      {savedStatus && (
        <div className="mb-6 p-4 bg-green-900/30 border border-green-600 rounded-lg flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span className="text-green-300">Settings saved successfully!</span>
        </div>
      )}

      {changesMade && (
        <div className="mb-6 p-4 bg-orange-900/30 border border-orange-600 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-orange-500" />
          <span className="text-orange-300">You have unsaved changes</span>
        </div>
      )}

      <div className="space-y-8">
        {/* Email Notifications Section */}
        <div>
          <SectionHeader icon={Mail} title="Email Notifications" />
          <div className="space-y-3">
            <SettingToggle
              label="Accident Reports"
              description="Receive email when accidents are reported"
              value={settings.emailAccident}
              onChange={() => handleChange('emailAccident')}
            />
            <SettingToggle
              label="Risk Warnings"
              description="Get notified when entering high-risk areas"
              value={settings.emailRiskWarning}
              onChange={() => handleChange('emailRiskWarning')}
            />
            <SettingToggle
              label="Weather Alerts"
              description="Receive alerts for severe weather conditions"
              value={settings.emailWeatherAlert}
              onChange={() => handleChange('emailWeatherAlert')}
            />
            <SettingToggle
              label="Near Miss Events"
              description="Get notified of near miss incidents"
              value={settings.emailNearMiss}
              onChange={() => handleChange('emailNearMiss')}
            />
            <SettingToggle
              label="Maintenance Reminders"
              description="Receive vehicle maintenance reminders"
              value={settings.emailMaintenanceReminder}
              onChange={() => handleChange('emailMaintenanceReminder')}
            />
          </div>
        </div>

        {/* SMS Notifications Section */}
        <div>
          <SectionHeader icon={MessageSquare} title="SMS Notifications" />
          <div className="space-y-3">
            <SettingToggle
              label="Critical Accidents"
              description="Text alerts for critical accident situations"
              value={settings.smsAccident}
              onChange={() => handleChange('smsAccident')}
            />
            <SettingToggle
              label="High-Risk Warnings"
              description="SMS alerts for high-risk driving zones"
              value={settings.smsRiskWarning}
              onChange={() => handleChange('smsRiskWarning')}
            />
            <SettingToggle
              label="Severe Weather"
              description="Text notifications for severe weather"
              value={settings.smsWeatherAlert}
              onChange={() => handleChange('smsWeatherAlert')}
            />
            <SettingToggle
              label="Near Miss Alerts"
              description="SMS notifications for near miss events"
              value={settings.smsNearMiss}
              onChange={() => handleChange('smsNearMiss')}
            />
          </div>
        </div>

        {/* In-App Notifications Section */}
        <div>
          <SectionHeader icon={Bell} title="In-App Notifications" />
          <div className="space-y-3">
            <SettingToggle
              label="Accidents"
              description="Show in-app alerts for accident reports"
              value={settings.inAppAccident}
              onChange={() => handleChange('inAppAccident')}
            />
            <SettingToggle
              label="Risk Warnings"
              description="Display risk zone notifications in-app"
              value={settings.inAppRiskWarning}
              onChange={() => handleChange('inAppRiskWarning')}
            />
            <SettingToggle
              label="Weather Alerts"
              description="Show weather warning notifications"
              value={settings.inAppWeatherAlert}
              onChange={() => handleChange('inAppWeatherAlert')}
            />
            <SettingToggle
              label="Near Miss Events"
              description="Display near miss notifications"
              value={settings.inAppNearMiss}
              onChange={() => handleChange('inAppNearMiss')}
            />
            <SettingToggle
              label="Maintenance Alerts"
              description="Show maintenance reminder notifications"
              value={settings.inAppMaintenanceReminder}
              onChange={() => handleChange('inAppMaintenanceReminder')}
            />
          </div>
        </div>

        {/* Push Notifications Section */}
        <div>
          <SectionHeader icon={Phone} title="Push Notifications" />
          <div className="space-y-3">
            <SettingToggle
              label="Critical Accidents"
              description="Push notifications for critical situations"
              value={settings.pushAccident}
              onChange={() => handleChange('pushAccident')}
            />
            <SettingToggle
              label="Risk Warnings"
              description="Push alerts for high-risk areas"
              value={settings.pushRiskWarning}
              onChange={() => handleChange('pushRiskWarning')}
            />
            <SettingToggle
              label="Weather Alerts"
              description="Push notifications for severe weather"
              value={settings.pushWeatherAlert}
              onChange={() => handleChange('pushWeatherAlert')}
            />
            <SettingToggle
              label="Near Miss Alerts"
              description="Push notifications for near miss events"
              value={settings.pushNearMiss}
              onChange={() => handleChange('pushNearMiss')}
            />
          </div>
        </div>

        {/* Quiet Hours Section */}
        <div>
          <SectionHeader icon={AlertCircle} title="Quiet Hours" />
          <div className="space-y-3">
            <SettingToggle
              label="Enable Quiet Hours"
              description="Silence non-critical notifications during specified hours"
              value={settings.quietHoursEnabled}
              onChange={() => handleChange('quietHoursEnabled')}
            />

            {settings.quietHoursEnabled && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <label className="block text-sm font-semibold text-white mb-2">Start Time</label>
                  <input
                    type="time"
                    value={settings.quietHoursStart}
                    onChange={(e) => handleInputChange('quietHoursStart', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <label className="block text-sm font-semibold text-white mb-2">End Time</label>
                  <input
                    type="time"
                    value={settings.quietHoursEnd}
                    onChange={(e) => handleInputChange('quietHoursEnd', e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}

            <SettingToggle
              label="Critical Notifications During Quiet Hours"
              description="Always notify for critical incidents even during quiet hours"
              value={settings.urgentNotificationsDuringQuietHours}
              onChange={() => handleChange('urgentNotificationsDuringQuietHours')}
            />
          </div>
        </div>

        {/* Priority Level Settings */}
        <div>
          <SectionHeader icon={AlertCircle} title="Notification Priority Levels" />
          <div className="space-y-3">
            <SettingToggle
              label="Critical (P1)"
              description="Highest priority - immediate critical alerts"
              value={settings.notifyOnCritical}
              onChange={() => handleChange('notifyOnCritical')}
            />
            <SettingToggle
              label="High (P2)"
              description="High priority - important alerts"
              value={settings.notifyOnHigh}
              onChange={() => handleChange('notifyOnHigh')}
            />
            <SettingToggle
              label="Medium (P3)"
              description="Medium priority - standard notifications"
              value={settings.notifyOnMedium}
              onChange={() => handleChange('notifyOnMedium')}
            />
            <SettingToggle
              label="Low (P4)"
              description="Low priority - information only"
              value={settings.notifyOnLow}
              onChange={() => handleChange('notifyOnLow')}
            />
          </div>
        </div>

        {/* Sound & Vibration Settings */}
        <div>
          <SectionHeader icon={Phone} title="Sound & Vibration" />
          <div className="space-y-3">
            <SettingToggle
              label="Sound Enabled"
              description="Play sound for notifications"
              value={settings.soundEnabled}
              onChange={() => handleChange('soundEnabled')}
            />
            <SettingToggle
              label="Vibration Enabled"
              description="Vibrate device for notifications"
              value={settings.vibrationEnabled}
              onChange={() => handleChange('vibrationEnabled')}
            />
            <SettingToggle
              label="Critical Alert Sound"
              description="Always play sound for critical alerts"
              value={settings.criticalSoundEnabled}
              onChange={() => handleChange('criticalSoundEnabled')}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-12 flex gap-4 sticky bottom-0 bg-gray-900 pt-6 border-t border-gray-700">
        <button
          onClick={handleSave}
          disabled={!changesMade}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition ${
            changesMade
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          <Save className="w-5 h-5" />
          Save Settings
        </button>

        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600 transition"
        >
          <RotateCcw className="w-5 h-5" />
          Reset to Defaults
        </button>
      </div>
    </div>
  )
}

export default NotificationSettings