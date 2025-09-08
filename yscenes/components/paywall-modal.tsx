'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export default function PaywallModal({ isOpen, onClose, onUpgrade }: PaywallModalProps) {
  const { user } = useUser();
  const [isAnnual, setIsAnnual] = useState(false);

  if (!isOpen) return null;

  const handleUpgrade = async () => {
    try {
      const email = user?.emailAddresses?.[0]?.emailAddress;
      
      if (!email) {
        alert('Please sign in to upgrade');
        return;
      }

      // Stripe price IDs for monthly and annual subscriptions
      const priceId = isAnnual 
        ? "price_1S4WlwAUgweEW9eMiepCbYMv" // Annual price ID
        : "price_1S4WlwAUgweEW9eMOjeZmqdd"; // Monthly price ID

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId,
          email,
          successUrl: `${window.location.origin}/upgrade/success`,
          cancelUrl: `${window.location.origin}/upgrade`
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { url } = await response.json();
      
      if (url) {
        window.location.href = url; // Redirect to Stripe checkout
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to start checkout. Please try again.');
    }
    
    onUpgrade();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-black/90 backdrop-blur-sm rounded-xl p-8 max-w-md w-full border border-purple-500/50 shadow-2xl relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-4">🎬</div>
          <h2 className="text-2xl font-bold text-white mb-2">
            You've Used Your Free Search!
          </h2>
          <p className="text-gray-300 text-sm">
            {user?.emailAddresses?.[0]?.emailAddress === 'pgtherealmvp@gmail.com' 
              ? "You have unlimited access!" 
              : "Upgrade to Pro for unlimited movie recommendations"
            }
          </p>
        </div>

        {/* Special message for pgtherealmvp@gmail.com */}
        {user?.emailAddresses?.[0]?.emailAddress === 'pgtherealmvp@gmail.com' ? (
          <div className="text-center">
            <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-lg p-4 mb-6">
              <p className="text-purple-300 text-sm font-medium">
                🎉 VIP Access - You have unlimited searches!
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all duration-200 font-bold"
            >
              Continue Searching
            </button>
          </div>
        ) : (
          <>
            {/* Pricing Toggle */}
            <div className="flex justify-center mb-6">
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
              <div className="text-3xl font-bold text-white mb-1">
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

            {/* Features */}
            <div className="mb-6">
              <div className="space-y-2 text-sm">
                {[
                  "✅ Unlimited movie recommendations",
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

            {/* Upgrade Button */}
            <button
              onClick={handleUpgrade}
              className="w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all duration-200 hover:scale-105 font-bold shadow-lg text-lg mb-2"
            >
              Start FREE Trial Now
            </button>

            {/* Signup Count */}
            <div className="text-center mb-4">
              <p className="text-gray-400 text-xs">
                43+ signed up today
              </p>
            </div>

            {/* Trust Indicators */}
            <div className="flex justify-center items-center space-x-4 text-gray-400 text-xs">
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
          </>
        )}
      </div>
    </div>
  );
}
