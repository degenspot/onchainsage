"use client";
import React, { useState, useEffect } from "react";
import { Menu, Bell, Settings } from "lucide-react";
import Notification from "../../components/ui/notification";

const Navbar = () => {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isNotificationOpen &&
        !event
          .composedPath()
          .includes(document.querySelector(".notification-dropdown") as Node)
      ) {
        setIsNotificationOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isNotificationOpen]);

  return (
    <nav className="bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button className="lg:hidden">
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-bold">OnChain Sage</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button
            className="p-2 hover:bg-gray-800 rounded-full relative"
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
          >
            <Bell size={20} />
            {isNotificationOpen && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-white text-black shadow-lg rounded-lg z-10 notification-dropdown">
                <Notification />
              </div>
            )}
          </button>
          <button className="p-2 hover:bg-gray-800 rounded-full">
            <Settings size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
