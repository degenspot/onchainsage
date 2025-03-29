"use client"
import React, { useState } from "react";
import { Globe, Moon, PanelLeft, Sun } from "lucide-react";

export default function Page() {
  const [lightMode, setLightMode] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Appearance Settings</h1>
          <p className="text-muted-foreground">Customize how OnChain Sage looks and feels</p>
        </div>
        <div className="space-y-4">
          <h2 className="text-lg font-medium">Theme</h2>
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              <Sun className="h-5 w-5 text-amber-500" />
              <div>
                <p className="font-medium">Light Mode</p>
                <p className="text-sm text-muted-foreground">Use light theme</p>
              </div>
            </div>
            <button
              onClick={() => {
                setLightMode(!lightMode);
                setDarkMode(lightMode);
              }}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition ${
                lightMode ? "bg-blue-500" : "bg-gray-300"
              }`}
            >
              <div
                className={`h-5 w-5 bg-white rounded-full shadow-md transform transition ${
                  lightMode ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              <Moon className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-muted-foreground">Use dark theme</p>
              </div>
            </div>
            <button
              onClick={() => {
                setDarkMode(!darkMode);
                setLightMode(darkMode);
              }}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition ${
                darkMode ? "bg-blue-500" : "bg-gray-300"
              }`}
            >
              <div
                className={`h-5 w-5 bg-white rounded-full shadow-md transform transition ${
                  darkMode ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <PanelLeft className="h-5 w-5" />
            <div>
              <p className="font-medium">Sidebar Behavior</p>
              <p className="text-sm text-muted-foreground">Choose how the sidebar behaves</p>
            </div>
          </div>
          <select className="w-full md:w-[180px] mt-1 border rounded-md p-2">
            <option value="collapsible">Collapsible</option>
            <option value="fixed">Fixed</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>
        <div className="pt-2">
          <h2 className="text-lg font-medium mb-4">Language & Region</h2>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5" />
                <div>
                  <p className="font-medium">Language</p>
                  <p className="text-sm text-muted-foreground">Select your preferred language</p>
                </div>
              </div>
              <select className="w-full md:w-[180px] mt-1 border rounded-md p-2">
                <option value="english">English</option>
                <option value="spanish">Spanish</option>
                <option value="french">French</option>
                <option value="german">German</option>
              </select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center h-5 w-5 font-semibold text-sm">
                  $
                </span>
                <div>
                  <p className="font-medium">Currency</p>
                  <p className="text-sm text-muted-foreground">Select your preferred currency</p>
                </div>
              </div>
              <select className="w-full md:w-[180px] mt-1 border rounded-md p-2">
                <option value="usd">USD ($)</option>
                <option value="eur">EUR (€)</option>
                <option value="gbp">GBP (£)</option>
                <option value="jpy">JPY (¥)</option>
              </select>
            </div>
          </div>
        </div>
        <div className="pt-4">
          <button className="bg-black text-white hover:bg-black/90 py-2 px-4 rounded-md">
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
