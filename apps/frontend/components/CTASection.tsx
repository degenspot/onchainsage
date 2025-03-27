'use client';

import React from 'react';

const CTASection: React.FC = () => {
  return (
    <section className="bg-gray-200 py-16 text-center px-6 md:px-12 lg:px-24">
      <h2 className="text-4xl md:text-4xl font-bold text-gray-900">
        Ready to Elevate Your Trading?
      </h2>
      <p className="text-gray-600 mt-4 max-w mx-auto">
        Join OnChain Sage today and gain access to AI-powered trading <br />signals.
      </p>
      <div className="mt-6 flex justify-center space-x-4">
        <button className="bg-black text-white px-6 py-3 rounded-md font-medium hover:bg-gray-400 transition-colors">
          Get Started
        </button>
        <button className="border border-gray-200 bg-gray-100 text-gray-900 px-6 py-3 rounded-md font-medium hover:bg-gray-600 transition-colors">
          View Demo
        </button>
      </div>
    </section>
  );
};

export { CTASection };
