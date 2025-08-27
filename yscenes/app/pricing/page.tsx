'use client';

import { useState } from 'react';
import Navbar from '../../components/navbar';

export default function PricingPage() {
  const features = {
    free: [
      "3 movie recommendations per day (limited)",
      "3 day free trial",
      "No save functionality",
      "No filters",
      "Can share current mood",
      "Basic mood-based search"
    ],
    pro: [
      "Everything in free, plus:",
      "Unlimited saves + lists",
      "Timeline + actor filters",
      "Personalization to taste over time",
      "Mood history tracking",
      "3 recommendations to your email daily",
      "Advanced AI mood analysis",
      "Priority customer support"
    ],
    annual: [
      "All Pro features",
      "Best value",
      "Save 25% compared to monthly",
      "Unlimited saves + lists",
      "Timeline + actor filters",
      "Personalization to taste over time",
      "Mood history tracking",
      "3 recommendations to your email daily",
      "Advanced AI mood analysis",
      "Priority customer support"
    ]
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-0">
        <div className="container mx-auto px-4 py-16">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold text-white mb-6 font-heading">
              Find Your Perfect <span className="bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">Movie</span>
            </h1>
            <p className="text-gray-300 text-lg mb-8 font-body font-bold">
              All plans come with a 3-day free trial.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto">
            {/* Free Plan */}
            <div className="flex-1 bg-black/70 backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-white/30 relative drop-shadow-[0_0_30px_rgba(59,130,246,0.2)]">
              <div className="absolute inset-0 bg-white/3 rounded-xl blur-xl"></div>
              <div className="relative z-10 h-full flex flex-col">
                <h3 className="text-2xl font-bold text-white mb-2 font-heading">Free</h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-white">$0</span>
                  <span className="text-gray-400 ml-2">per month</span>
                </div>
                
                <ul className="space-y-4 mb-8 flex-grow">
                  {features.free.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-300 text-sm font-body">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button className="w-full py-3 px-6 bg-white/10 backdrop-blur-sm text-white border border-white/30 rounded-lg hover:bg-white/20 transition-all duration-200 hover:scale-105 font-medium mt-auto">
                  Start for free
                </button>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="flex-1 bg-black/70 backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-red-500/50 relative drop-shadow-[0_0_40px_rgba(239,68,68,0.3)]">
              <div className="absolute inset-0 bg-red-500/5 rounded-xl blur-xl"></div>
              
              {/* Popular Badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full shadow-lg border-2 border-red-400 font-bold text-sm">
                  Most Popular
                </div>
              </div>
              
              <div className="relative z-10 h-full flex flex-col">
                <h3 className="text-2xl font-bold text-white mb-2 font-heading">Pro</h3>
                <div className="mb-2">
                  <span className="text-5xl font-bold text-white">$4.99</span>
                  <span className="text-gray-400 ml-2">per month</span>
                </div>
                <p className="text-gray-400 text-sm mb-6">Everything in free, plus:</p>
                
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
                  href="https://buy.stripe.com/test_7sY3cu0yE7lZ2cv8kMefC00"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-6 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 hover:scale-105 font-medium shadow-lg inline-block text-center mt-auto"
                >
                  Start for free
                </a>
              </div>
            </div>

            {/* Annual Plan */}
            <div className="flex-1 bg-black/70 backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-blue-500/50 relative drop-shadow-[0_0_40px_rgba(59,130,246,0.3)]">
              <div className="absolute inset-0 bg-blue-500/5 rounded-xl blur-xl"></div>
              
              {/* Best Value Badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-full shadow-lg border-2 border-blue-400 font-bold text-sm">
                  Best Value
                </div>
              </div>
              
              <div className="relative z-10 h-full flex flex-col">
                <h3 className="text-2xl font-bold text-white mb-2 font-heading">Annual</h3>
                <div className="mb-2">
                  <span className="text-5xl font-bold text-white">$44.99</span>
                  <span className="text-gray-400 ml-2">per year</span>
                </div>
                <p className="text-blue-400 text-sm mb-6 font-medium">Save 25% compared to monthly</p>
                
                <ul className="space-y-3 mb-8 max-h-96 overflow-y-auto flex-grow">
                  {features.annual.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-400 text-sm font-body">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <a 
                  href="https://buy.stripe.com/test_bJedR85SYbCfeZh58AefC01"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:scale-105 font-medium shadow-lg inline-block text-center mt-auto"
                >
                  Start for free
                </a>
              </div>
            </div>
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-12">
            <button className="text-blue-400 hover:text-blue-300 transition-colors duration-200 text-sm font-medium">
              🔽 See full feature comparison below
            </button>
          </div>

          {/* Feature Comparison Table */}
          <div className="mt-16 bg-black/70 backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-white/30 relative drop-shadow-[0_0_30px_rgba(59,130,246,0.2)]">
            <div className="absolute inset-0 bg-white/3 rounded-xl blur-xl"></div>
            <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white text-center mb-8 font-heading">
                Choose the plan that's right for you
              </h2>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="text-left py-4 px-6 text-white font-medium">Features</th>
                      <th className="text-center py-4 px-6 text-white font-medium">Free</th>
                      <th className="text-center py-4 px-6 text-white font-medium">Pro</th>
                      <th className="text-center py-4 px-6 text-white font-medium">Annual</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-300">
                    <tr className="border-b border-white/10">
                      <td className="py-4 px-6">Daily movie recommendations</td>
                      <td className="text-center py-4 px-6">3 (limited)</td>
                      <td className="text-center py-4 px-6">Unlimited</td>
                      <td className="text-center py-4 px-6">Unlimited</td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-4 px-6">Save functionality</td>
                      <td className="text-center py-4 px-6">✗</td>
                      <td className="text-center py-4 px-6">✓ + Lists</td>
                      <td className="text-center py-4 px-6">✓ + Lists</td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-4 px-6">Filters (Timeline + Actor)</td>
                      <td className="text-center py-4 px-6">✗</td>
                      <td className="text-center py-4 px-6">✓</td>
                      <td className="text-center py-4 px-6">✓</td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-4 px-6">Email recommendations</td>
                      <td className="text-center py-4 px-6">✗</td>
                      <td className="text-center py-4 px-6">3 daily</td>
                      <td className="text-center py-4 px-6">3 daily</td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-4 px-6">Mood history</td>
                      <td className="text-center py-4 px-6">✗</td>
                      <td className="text-center py-4 px-6">✓</td>
                      <td className="text-center py-4 px-6">✓</td>
                    </tr>
                    <tr className="border-b border-white/10">
                      <td className="py-4 px-6">Price</td>
                      <td className="text-center py-4 px-6">$0</td>
                      <td className="text-center py-4 px-6">$4.99/month</td>
                      <td className="text-center py-4 px-6">$44.99/year</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 