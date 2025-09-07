'use client';

import { useState } from 'react';
import Navbar from '../../components/navbar';

export default function UpgradePage() {
  const [isAnnual, setIsAnnual] = useState(false);

  const handleStartTrial = () => {
    const checkoutUrl = isAnnual 
      ? "https://buy.stripe.com/test_bJedR85SYbCfeZh58AefC01" 
      : "https://buy.stripe.com/test_7sY3cu0yE7lZ2cv8kMefC00";
    window.open(checkoutUrl, '_blank');
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-0">
        <div className="container mx-auto px-4 py-4 flex flex-col items-center justify-start min-h-screen pt-16">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 font-heading">
              Upgrade to <span className="bg-gradient-to-r from-purple-400 via-purple-500 to-blue-500 bg-clip-text text-transparent">Pro</span>
            </h1>
          </div>

          {/* Single Upgrade Card */}
          <div className="max-w-lg mx-auto">
            <div className="bg-black/70 backdrop-blur-sm rounded-xl p-8 border border-purple-500/50 shadow-2xl relative">
              {/* Free Trial Badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-purple-400 to-blue-500 text-white px-4 py-2 rounded-full shadow-lg border-2 border-purple-300 font-bold text-sm">
                  🎉 3-Day FREE Trial
                </div>
              </div>

              {/* Plan Toggle */}
              <div className="flex justify-center mb-6 mt-4">
                <div className="bg-black/50 rounded-lg p-1 flex items-center space-x-2">
                  <button
                    onClick={() => setIsAnnual(false)}
                    className={`px-4 py-2 rounded-md text-sm transition-all duration-200 font-medium ${
                      !isAnnual 
                        ? 'bg-white text-black shadow-lg' 
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setIsAnnual(true)}
                    className={`px-4 py-2 rounded-md text-sm transition-all duration-200 font-medium relative ${
                      isAnnual 
                        ? 'bg-white text-black shadow-lg' 
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    Annual
                    <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs px-1 py-0.5 rounded-full">
                      25%
                    </span>
                  </button>
                </div>
              </div>

              {/* Pricing */}
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-white mb-1">
                  {isAnnual ? '$44.99' : '$4.99'}
                </div>
                <div className="text-gray-400 text-sm mb-2">
                  {isAnnual ? 'per year' : 'per month'}
                </div>
                {isAnnual && (
                  <div className="text-purple-400 text-xs font-medium">
                    Save $14.89 vs monthly
                  </div>
                )}
              </div>

              {/* Features - Condensed */}
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    "✅ Unlimited recommendations",
                    "✅ Unlimited saves & lists",
                    "✅ Timeline + actor filters", 
                    "✅ Personalized suggestions",
                    "✅ Mood history tracking",
                    "✅ Daily email picks",
                    "✅ Advanced AI analysis",
                    "✅ Priority support"
                  ].map((feature, index) => (
                    <div key={index} className="text-gray-300 font-body">
                      {feature}
                    </div>
                  ))}
                </div>
              </div>

              {/* Trial Highlight */}
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mb-6">
                <div className="text-center">
                  <div className="text-purple-400 font-bold text-sm mb-1">
                    🎯 Try Everything FREE for 3 Days
                  </div>
                  <div className="text-gray-300 text-xs">
                    No charge until trial ends • Cancel anytime
                  </div>
                </div>
              </div>
              
              {/* Start Trial Button */}
              <button 
                onClick={handleStartTrial}
                className="w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all duration-200 hover:scale-105 font-bold shadow-lg text-lg"
              >
                Start FREE Trial Now
              </button>
              
              {/* Trust Indicators */}
              <div className="flex justify-center items-center space-x-4 text-gray-400 text-xs mt-4">
                <div className="flex items-center space-x-1">
                  <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Secure</span>
                </div>
                <div className="flex items-center space-x-1">
                  <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Guaranteed</span>
                </div>
                <div className="flex items-center space-x-1">
                  <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
