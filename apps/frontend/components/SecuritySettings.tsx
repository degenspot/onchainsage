"use client";

import { useState } from "react";
import { Shield } from "lucide-react";

export default function SecuritySettings() {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  return (
    <div className=" max-w-[90%] mx-auto p-6 bg-white border shadow-sm rounded-lg my-10">
      <h2 className="text-2xl font-semibold">Security Settings</h2>
      <p className="text-gray-600 mb-4">
        Manage your account security and authentication methods
      </p>

      <div className="mb-6">
        <h3 className="text-lg font-medium">Password</h3>
        <div className="mt-2">
          <label className="text-sm font-medium text-gray-700">
            Current Password
          </label>
          <input
            type="password"
            className="mt-1 w-full px-3 py-2 border rounded-md outline-none"
          />
        </div>
        <div className="mt-2">
          <label className=" text-sm font-medium text-gray-700">
            New Password
          </label>
          <input
            type="password"
            className="mt-1 w-full px-3 py-2 border rounded-md outline-none"
          />
        </div>
        <div className="mt-2">
          <label className=" text-sm font-medium text-gray-700">
            Confirm New Password
          </label>
          <input
            type="password"
            className="mt-1 w-full px-3 py-2 border rounded-md "
          />
        </div>
        <button className="mt-4 w-full bg-black text-white py-2 rounded-md">
          Update Password
        </button>
      </div>

      <hr className="my-6" />

      <div>
        <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <Shield />
            <div>
              <p className="text-sm font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-gray-600">
                Add an extra layer of security to your account
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            className="hidden"
            id="2fa-toggle"
            checked={is2FAEnabled}
            onChange={() => setIs2FAEnabled(!is2FAEnabled)}
          />
          <label
            htmlFor="2fa-toggle"
            className={`relative w-10 h-6 rounded-full cursor-pointer transition-colors ${is2FAEnabled ? "bg-black" : "bg-gray-300"}`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${is2FAEnabled ? "translate-x-4" : "translate-x-0"}`}
            ></span>
          </label>
        </div>
        <button className="mt-4 w-full border border-gray-300 py-2 rounded-md">
          Set Up 2FA
        </button>
      </div>
    </div>
  );
}
