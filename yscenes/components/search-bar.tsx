'use client';

import { useState, useEffect } from 'react';
import { Slider } from './ui/slider';

interface SearchBarProps {
  onSearch: (mood: string, yearRange: [number, number]) => void;
  loading?: boolean;
}

export default function SearchBar({ onSearch, loading = false }: SearchBarProps) {
  const [mood, setMood] = useState('');
  const [yearRange, setYearRange] = useState<[number, number]>([1970, 2025]);
  const [bottomEmail, setBottomEmail] = useState('');
  const [bottomEmailMessage, setBottomEmailMessage] = useState('');
  
  // Animated placeholder states
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const moodSuggestions = [
    "Need something scary but still heartwarming",
    "Feeling nostalgic for the 90s",
    "Want to laugh until I cry",
    "In the mood for a mind-bending thriller",
    "Something romantic but not cheesy",
    "Need an epic adventure to escape reality",
    "Feeling philosophical and deep",
    "Want to be inspired and motivated"
  ];

  useEffect(() => {
    const currentSuggestion = moodSuggestions[placeholderIndex];
    
    if (!isDeleting && charIndex < currentSuggestion.length) {
      // Typing
      const timeout = setTimeout(() => {
        setCharIndex(charIndex + 1);
      }, 100);
      return () => clearTimeout(timeout);
    } else if (!isDeleting && charIndex === currentSuggestion.length) {
      // Pause at end
      const timeout = setTimeout(() => {
        setIsDeleting(true);
      }, 2000);
      return () => clearTimeout(timeout);
    } else if (isDeleting && charIndex > 0) {
      // Deleting
      const timeout = setTimeout(() => {
        setCharIndex(charIndex - 1);
      }, 50);
      return () => clearTimeout(timeout);
    } else if (isDeleting && charIndex === 0) {
      // Move to next suggestion
      setIsDeleting(false);
      setPlaceholderIndex((placeholderIndex + 1) % moodSuggestions.length);
    }
  }, [charIndex, isDeleting, placeholderIndex, moodSuggestions]);

  const currentPlaceholder = moodSuggestions[placeholderIndex].substring(0, charIndex);

  const handleSubmit = () => {
    if (!mood.trim()) {
      alert("Tell us your mood first!");
      return;
    }
    onSearch(mood.trim(), yearRange);
  };

  const handleBottomEmailSubmit = async () => {
    const emailValue = bottomEmail.trim();
    if (!emailValue) {
      alert("Enter your email!");
      return;
    }

    try {
      const res = await fetch('/api/subscribe', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue })
      });
      
      if (!res.ok) throw await res.text();
      
      setBottomEmailMessage("Thanks—you're on the list!");
      setBottomEmail('');
    } catch (e) {
      console.error(e);
      setBottomEmailMessage("Oops, try again later.");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="text-center mt-8 relative">
      {/* Mood Input */}
      <div className="flex justify-center mb-4">
        <textarea
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={currentPlaceholder}
          className="px-4 py-3.5 text-base w-80 max-w-[80vw] h-28 rounded-lg border border-white/30 bg-gray-800 text-gray-100 placeholder-gray-400 focus:outline-none focus:border-white/50 transition-colors duration-200 resize-none"
          disabled={loading}
          rows={4}
        />
      </div>
      
      {/* Watch Now Button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-4 py-2.5 text-sm border-none rounded-lg bg-white text-black cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 hover:bg-gray-100"
          style={{
            boxShadow: '0 10px 20px -10px rgba(0,0,0,0.2)'
          }}
        >
          {loading ? 'Finding Films...' : 'Watch Now'}
        </button>
      </div>
      
                    {/* Year Range Slider */}
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-medium text-gray-300 whitespace-nowrap">1970s</h2>
          <Slider
            value={yearRange}
            onValueChange={(value) => setYearRange(value as [number, number])}
            max={2025}
            min={1970}
            step={1}
            className="flex-1" 
          />
          <h2 className="text-sm font-medium text-gray-300 whitespace-nowrap">2020s</h2>
        </div>
      </div>
    </div>
  );
}