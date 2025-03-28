import React from 'react';
import { BarChart2, Tv, Activity, Clock, Rss } from 'lucide-react';
import Link from 'next/link';

const Sidebar = () => {
  const menuItems = [
    { icon: BarChart2, label: 'Dashboard', href: '/' },
    { icon: Tv, label: 'Market View', href: '/market' },
    { icon: Rss, label: 'Social Signals', href: '/social', isCustom: true },
    { icon: Activity, label: 'Trading Analytics', href: '/analytics' },
    { icon: Clock, label: 'History', href: '/history' },
  ];

  return (
    <div className="hidden lg:block fixed left-0 w-64 h-screen bg-gray-800 text-white">
      <div className="p-4">
        <div className="space-y-4">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              {item.isCustom ? <item.icon /> : <item.icon size={20} />}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;