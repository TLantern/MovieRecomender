'use client';

import { useState } from 'react';
import Navbar from '../../components/navbar';

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  const features = {
    pro: [
      "Unlimited movie recommendations",
      "Unlimited saves + lists",
      "Timeline + actor filters",
      "Personalization to taste over time",
      "Mood history tracking",
      "3 recommendations to your email daily",
      "Advanced AI mood analysis",
      "Priority customer support"
    ]
  };

  const Switch = () => {
    return (
      <div className="relative inline-block w-16 h-9">
        <input 
          type="checkbox" 
          className="opacity-0 w-0 h-0"
          checked={isAnnual}
          readOnly
        />
        <span className={`absolute pointer-events-none inset-0 border-2 rounded-full transition-all duration-400 ease-in-out ${
          isAnnual 
            ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.8)]' 
            : 'border-gray-400'
        }`}>
          <span className={`absolute w-7 h-7 bg-white rounded-full transition-all duration-400 ease-in-out transform ${
            isAnnual ? 'translate-x-7' : 'translate-x-0'
          } top-0.5 left-0.5`} />
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-0">
        <div className="container mx-auto px-4 py-5">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 font-heading">
              Find Your Perfect <span className="bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">Movie</span>
            </h1>
            <p className="text-gray-300 text-lg mb-8 font-body font-bold">
              Start with a 3-day free trial.
            </p>
          </div>

          {/* Pricing Card */}
          <div className="flex justify-center max-w-lg mx-auto">
            {/* Pro Plan */}
            <div className="w-full bg-black/70 backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-red-500/50 relative drop-shadow-[0_0_40px_rgba(239,68,68,0.3)]">
              <div className="absolute inset-0 bg-red-500/5 rounded-xl blur-xl"></div>
              
              {/* Toggle Switch in top right */}
              <div 
                className="absolute top-2 right-2 flex items-center space-x-2 sm:space-x-3 cursor-pointer p-2 sm:p-3 rounded-lg hover:bg-white/5 transition-colors duration-200 z-20"
                onClick={() => setIsAnnual(!isAnnual)}
              >
                <span className={`text-xs sm:text-sm font-medium select-none ${!isAnnual ? 'text-white' : 'text-gray-400'}`}>
                  Monthly
                </span>
                <Switch />
                <span className={`text-xs sm:text-sm font-medium select-none ${isAnnual ? 'text-white' : 'text-gray-400'}`}>
                  Annual
                </span>
              </div>
              
              <div className="relative z-10 h-full flex flex-col">
                <h3 className="text-2xl font-bold text-white mb-2 font-heading">Pro</h3>
                <div className="mb-2">
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
                    {isAnnual ? '$44.99' : '$4.99'}
                  </span>
                  <span className="text-gray-400 ml-2 text-sm sm:text-base">
                    {isAnnual ? 'per year' : 'per month'}
                  </span>
                </div>
                {isAnnual && (
                  <p className="text-blue-400 text-sm mb-2 font-medium">Save 25% compared to monthly</p>
                )}
                <p className="text-gray-400 text-sm mb-6">Everything you need for perfect movie recommendations:</p>
                
                <ul className="space-y-3 mb-8 max-h-96 overflow-y-auto flex-grow">
                  {features.pro.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-300 text-sm font-body">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <a 
                  href={isAnnual 
                    ? "https://buy.stripe.com/9B614m2Kw8hy6ZcdJFbbG00" 
                    : "https://buy.stripe.com/aFa8wO5WI9lC3N07lhbbG01"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-6 bg-white border-2 border-white text-black rounded-lg hover:bg-black hover:text-white transition-all duration-200 hover:scale-105 font-medium shadow-lg inline-block text-center mt-auto"
                >
                  Start for free
                </a>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
} 