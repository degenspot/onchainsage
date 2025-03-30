"use client";
import React, { useState } from "react";

interface NotificationToggleProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  defaultEnabled?: boolean;
  onToggle: (enabled: boolean) => void;
}

const Toggle = ({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: () => void;
}) => {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        enabled ? "bg-gray-900" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          enabled ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
};const NotificationToggle = ({
  title,
  description,
  icon,
  defaultEnabled = false,
  onToggle,
}: NotificationToggleProps) => {
  const [enabled, setEnabled] = useState(defaultEnabled);

   const handleToggle = () => {
     const newState = !enabled;
     setEnabled(newState);
     onToggle(newState);
   };

return (
    <div className="flex items-start justify-between py-3">
      <div className="flex items-start space-x-3">
        <div className="text-gray-500 pt-1 flex-shrink-0">{icon}</div>
        <div className="text-left">
          <h3 className="text-sm font-medium text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <Toggle enabled={enabled} onChange={handleToggle} />
    </div>
  );
};

const NotificationPreferences = () => {
  const [preferences, setPreferences] = useState({
    highConfidence: true,
    emergingTrends: true,
    riskySignals: false,
    email: true,
    browser: true,
    mobile: true,
  });

  const updatePreference = (key: keyof typeof preferences, value: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    // Here you would typically send the preferences to your backend
    console.log("Saving preferences:", preferences);
    // You could add a success message/toast here
  };

  return (
    <div className="w-[400px] mx-auto bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-xl font-medium text-gray-900">
          Notification Preferences
        </h2>
        <p className="text-sm text-gray-500">
          Manage how you receive notifications and alerts
        </p>
      </div>

      <div className="mb-6">
        <h3 className="text-base font-medium text-gray-900 mb-2">
          Signal Notifications
        </h3>

        <NotificationToggle
          title="High Confidence Signals"
          description="Receive alerts for high confidence trading signals"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                clipRule="evenodd"
              />
            </svg>
          }
          defaultEnabled={preferences.highConfidence}
          onToggle={(value) => updatePreference("highConfidence", value)}
        />

        <NotificationToggle
          title="Emerging Trends"
          description="Receive alerts for emerging trend signals"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-yellow-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                clipRule="evenodd"
              />
            </svg>
          }
          defaultEnabled={preferences.emergingTrends}
          onToggle={(value) => updatePreference("emergingTrends", value)}
        />

        <NotificationToggle
          title="Risky Signals"
          description="Receive alerts for risky trading signals"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-red-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          }
          defaultEnabled={preferences.riskySignals}
          onToggle={(value) => updatePreference("riskySignals", value)}
        />
      </div>

      <div className="mb-6">
        <h3 className="text-base font-medium text-gray-900 mb-2">
          Notification Channels
        </h3>

        <NotificationToggle
          title="Email Notifications"
          description="Receive notifications via email"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
          }
          defaultEnabled={preferences.email}
          onToggle={(value) => updatePreference("email", value)}
        />

        <NotificationToggle
          title="Browser Notifications"
          description="Receive notifications in your browser"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
          }
          defaultEnabled={preferences.browser}
          onToggle={(value) => updatePreference("browser", value)}
        />

        <NotificationToggle
          title="Mobile Notifications"
          description="Receive notifications on your mobile device"
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
          }
          defaultEnabled={preferences.mobile}
          onToggle={(value) => updatePreference("mobile", value)}
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          className="px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900"
        >
          Save Preferences
        </button>
      </div>
    </div>
  );
};

export default NotificationPreferences;
