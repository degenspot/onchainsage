import React from 'react';
import { Menu, Bell, Settings } from 'lucide-react';

const Navbar = () => {
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
          <button className="p-2 hover:bg-gray-800 rounded-full">
            <Bell size={20} />
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