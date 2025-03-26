'use client';

import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-100 py-4 px-6 md:px-10 lg:px-24 text-gray-600 text-sm flex items-center justify-between">
    <div className="flex space-x-4"> <p>&copy; 2025 OnChain Sage. All rights reserved.</p></div>
  <div className="flex space-x-4">
    <Link href="/terms" className="hover:underline">
      Terms
    </Link>
    <Link href="/privacy" className="hover:underline">
      Privacy
    </Link>
    <Link href="/contact" className="hover:underline">
      Contact
    </Link>
  </div>
</footer>

  );
};

export { Footer };
