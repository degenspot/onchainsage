import React from 'react';
import { Brain, Shield, Coins, ChartColumnDecreasing, Clock2, ChartSpline , LucideIcon } from 'lucide-react';

const FeatureCard = ({ icon: Icon, title, description }: { icon: LucideIcon, title: string, description: string }) => (
  <div className="flex flex-col items-start p-6 bg-white border text-gray-900 border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
    <Icon className="w-10 h-10 mb-4 text-gray-800" />
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-gray-600 text-sm">{description}</p>
  </div>
);

const OnChainSageFeatures = () => {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Analysis',
      description: 'Advanced NLP and ML models analyze Twitter data to detect emerging trends.'
    },
    {
      icon: ChartColumnDecreasing,
      title: 'On-Chain Insights',
      description: 'Monitor liquidity, volume, and whale activity via on-chain APIs.'
    },
    {
      icon: Clock2,
      title: 'Real-Time Signals',
      description: 'Receive categorized signals (high-confidence, emerging, risky) to guide trading decisions.'
    },
    {
      icon: ChartSpline ,
      title: 'Dynamic Visualizations',
      description: 'Interactive charts and graphs powered by Chart.js and D3.js.'
    },
    {
      icon: Shield,
      title: 'Secure Blockchain Integration',
      description: 'Smart contracts on Starknet manage STRK token transactions and premium access.'
    },
    {
      icon: Coins,
      title: 'Decentralized Payment',
      description: 'Utilizes the Starknet network and STRK tokens for gas fees and premium access.'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-16 text-gray-900">
      <div className="text-center mb-12">
      <div className='bg-gray-300 mb-3 text-gray-800 py-1 text-sm px-4 rounded-full flex  justify-center w-fit mx-auto'> 
        <p className="">
         feature
        </p>
        </div>
        <h2 className="text-4xl font-bold mb-4">Powerful Trading Intelligence</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          OnChain Sage combines social sentiment analysis with on-chain data to provide actionable trading signals.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <FeatureCard 
            key={index} 
            icon={feature.icon} 
            title={feature.title} 
            description={feature.description} 
          />
        ))}
      </div>
    </div>
  );
};

export default OnChainSageFeatures;