'use client';

import { useState, useEffect, useRef } from 'react';
import { Slider } from './ui/slider';
import Image from 'next/image';

interface SearchBarProps {
  onSearch: (mood: string, yearRange: [number, number]) => void;
  loading?: boolean;
}

export default function SearchBar({ onSearch, loading = false }: SearchBarProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mood, setMood] = useState('');
  const [yearRange, setYearRange] = useState<[number, number]>([1970, 2025]);
  const [bottomEmail, setBottomEmail] = useState('');
  const [bottomEmailMessage, setBottomEmailMessage] = useState('');
  
  // Animated placeholder states
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Logo click typing states
  const [isTypingSuggestion, setIsTypingSuggestion] = useState(false);
  const [typingText, setTypingText] = useState('');
  const [typingIndex, setTypingIndex] = useState(0);
  const [showEnterPrompt, setShowEnterPrompt] = useState(false);
  
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

  const aiMoodSuggestions = [
    "Heartwarming and cozy like a warm hug on a cold day",
    "Gritty and intense with unexpected emotional depth",
    "Quirky comedy that makes you think while you laugh",
    "Mind-bending sci-fi that questions reality itself",
    "Dark mystery with a glimmer of hope at the end",
    "Epic fantasy adventure with stunning visuals",
    "Intimate character study about human connection",
    "Thrilling heist with clever twists and turns"
  ];

  useEffect(() => {
    // Don't show animated placeholder if there's text in the textarea
    if (mood.trim()) return;
    
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
  }, [charIndex, isDeleting, placeholderIndex, moodSuggestions, mood]);

  // Typing animation for AI suggestions
  useEffect(() => {
    if (!isTypingSuggestion || !typingText) return;

    if (typingIndex < typingText.length) {
      const timeout = setTimeout(() => {
        setMood(typingText.substring(0, typingIndex + 1));
        setTypingIndex(typingIndex + 1);
      }, 80 + Math.random() * 40); // Variable typing speed for human-like effect
      return () => clearTimeout(timeout);
    } else {
      // Finished typing, show enter prompt and focus textarea
      setShowEnterPrompt(true);
      setIsTypingSuggestion(false);
      
      // Auto-focus the textarea after typing is complete
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100);
    }
  }, [isTypingSuggestion, typingText, typingIndex]);

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
      if (showEnterPrompt) {
        // Finalize the AI suggestion by making it white (removing grey styling)
        setShowEnterPrompt(false);
        return;
      }
      handleSubmit();
    }
  };

  const handleLogoClick = () => {
    if (isTypingSuggestion || loading) return;
    
    // Clear current mood and reset states (allow overwriting existing text)
    setMood('');
    setShowEnterPrompt(false);
    setTypingIndex(0);
    
    // Select random AI suggestion
    const randomSuggestion = aiMoodSuggestions[Math.floor(Math.random() * aiMoodSuggestions.length)];
    setTypingText(randomSuggestion);
    setIsTypingSuggestion(true);
  };

  return (
    <div className="text-center mt-8 relative">
      {/* Mood Input */}
      <div className="flex justify-center mb-4">
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={mood}
            onChange={(e) => {
              setMood(e.target.value);
              if (showEnterPrompt) {
                setShowEnterPrompt(false);
              }
            }}
            onKeyPress={handleKeyPress}
            placeholder={isTypingSuggestion ? "" : (mood.trim() ? "" : currentPlaceholder)}
            className={`px-4 py-3.5 pl-12 text-base w-80 max-w-[80vw] h-28 rounded-lg border border-white/30 bg-gray-800 placeholder-gray-400 focus:outline-none focus:border-white/50 transition-colors duration-200 resize-none ${
              showEnterPrompt ? 'text-gray-400' : 'text-gray-100'
            }`}
            disabled={loading || isTypingSuggestion}
            rows={4}
          />
          {/* Enter prompt */}
          {showEnterPrompt && (
            <div className="absolute bottom-2 right-3 text-xs text-gray-500 animate-pulse">
              Press Enter to continue
            </div>
          )}
          {/* Aimagic Logo */}
          <div 
            className="absolute top-2 left-2 cursor-pointer z-10"
            onClick={handleLogoClick}
          >
            <div className="relative group">
              {/* Glow effect behind the logo */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full blur-md opacity-70 group-hover:opacity-100 transition-opacity duration-300"></div>
              {/* Logo */}
              <div className="relative transform transition-transform duration-300 group-hover:scale-125">
                <Image
                  src="/Aimagic.png"
                  alt="Aimagic Logo"
                  width={32}
                  height={32}
                  className="rounded-sm"
                />
              </div>
            </div>
          </div>
        </div>
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
          <h2 className="text-sm font-light text-gray-300 whitespace-nowrap min-w-[50px] text-center font-body">
            {yearRange[0]}
          </h2>
          <Slider
            value={yearRange}
            onValueChange={(value) => setYearRange(value as [number, number])}
            max={2025}
            min={1970}
            step={1}
            className="flex-1" 
          />
          <h2 className="text-sm font-light text-gray-300 whitespace-nowrap min-w-[50px] text-center font-body">
            {yearRange[1]}
          </h2>
        </div>
      </div>
    </div>
  );
}