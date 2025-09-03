'use client';

import { useState, useEffect, useRef } from 'react';
import { Slider } from './ui/slider';
import Image from 'next/image';

interface SearchBarProps {
  onSearch: (mood: string, yearRange: [number, number], selectedActor?: string) => void;
  loading?: boolean;
  selectedActor?: string;
}

export default function SearchBar({ onSearch, loading = false, selectedActor }: SearchBarProps) {
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
  
  // Actor carousel rotation states
  const [carouselPosition, setCarouselPosition] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  
  // Auto-rotate carousel
  useEffect(() => {
    if (isCarouselPaused) return;
    
    const interval = setInterval(() => {
      setCarouselPosition(prev => {
        // Calculate total width and move carousel
        const totalWidth = 16 * 120; // 16 actors * ~120px each
        const moveAmount = 2; // Move 2px each tick
        return (prev + moveAmount) % totalWidth;
      });
    }, 50); // Update every 50ms for smooth movement
    
    return () => clearInterval(interval);
  }, [isCarouselPaused]);
  
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

  // Dynamically fetch AI mood suggestions from ChatGPT (cheap model) using these as examples
  const aiMoodExamples = [
    "Need something scary but still heartwarming",
    "Feeling nostalgic for the 90s",
    "Want to laugh until I cry",
    "In the mood for a mind-bending thriller",
    "Something romantic but not cheesy",
    "Need an epic adventure to escape reality",
    "Feeling philosophical and deep",
    "Want to be inspired and motivated"
  ];

  // State for AI-generated mood suggestions
  const [aiMoodSuggestions, setAiMoodSuggestions] = useState<string[]>([]);
  const [isLoadingAiSuggestions, setIsLoadingAiSuggestions] = useState(false);

  async function fetchAIMoodSuggestions(): Promise<string[]> {
    // This function should call your backend API that wraps OpenAI's cheap model (gpt-3.5-turbo)
    // and returns a list of creative mood prompts for movies, using aiMoodExamples as inspiration.
    // Example prompt for the backend:
    // "Give me 8 creative, diverse, and cinematic moods for movie watching, similar to these: [examples]. Each should be a short phrase or sentence."
    try {
      const res = await fetch('/api/ai-mood-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examples: aiMoodExamples })
      });
      if (!res.ok) throw new Error('Failed to fetch AI mood suggestions');
      const data = await res.json();
      return data.suggestions as string[];
    } catch (err) {
      // Fallback to examples if API fails
      return aiMoodExamples;
    }
  }

  // Fetch AI mood suggestions on component mount
  useEffect(() => {
    const loadAiSuggestions = async () => {
      setIsLoadingAiSuggestions(true);
      try {
        const suggestions = await fetchAIMoodSuggestions();
        setAiMoodSuggestions(suggestions);
      } catch (error) {
        console.error('Failed to load AI mood suggestions:', error);
        // Fallback to examples if API fails
        setAiMoodSuggestions(aiMoodExamples);
      } finally {
        setIsLoadingAiSuggestions(false);
      }
    };

    loadAiSuggestions();
  }, []);

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
    onSearch(mood.trim(), yearRange, selectedActor);
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
    
    // Use AI-generated suggestions if available, otherwise fallback to examples
    const availableSuggestions = aiMoodSuggestions.length > 0 ? aiMoodSuggestions : aiMoodExamples;
    const randomSuggestion = availableSuggestions[Math.floor(Math.random() * availableSuggestions.length)];
    setTypingText(randomSuggestion);
    setIsTypingSuggestion(true);
  };

  return (
    <div className="text-center mt-8 relative">
      {/* Mood Input */}
      <div className="flex justify-center mb-4">
        <div className="relative">
          {/* Selected Actor Tag */}
          {selectedActor && (
            <div className="absolute -top-8 left-0 right-0 flex justify-center z-20">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg">
                🎬 {selectedActor}
              </div>
            </div>
          )}
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

      {/* Compact Actor Carousel */}
      <div className="w-full mt-4">
        <div 
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide px-2 transition-transform duration-100 ease-linear"
          style={{ transform: `translateX(-${carouselPosition}px)` }}
        >
          {[
            'Leonardo DiCaprio', 'Dwayne Johnson', 'Zendaya', 'Timothée Chalamet', 
            'Jennifer Lawrence', 'Ryan Gosling', 'Margot Robbie', 'Cillian Murphy',
            'Tom Holland', 'Florence Pugh', 'Robert Downey Jr.', 'Chris Hemsworth',
            'Emma Stone', 'Ryan Reynolds', 'Scarlett Johansson', 'Tom Hardy'
          ].map((actor, index) => (
            <button
              key={actor}
              onClick={() => onSearch(mood, yearRange, actor)}
              onMouseEnter={() => {
                // Pause carousel after a short delay
                const timeout = setTimeout(() => {
                  setIsCarouselPaused(true);
                }, 500);
                setHoverTimeout(timeout);
              }}
              onMouseLeave={() => {
                // Resume carousel immediately on leave
                if (hoverTimeout) {
                  clearTimeout(hoverTimeout);
                  setHoverTimeout(null);
                }
                setIsCarouselPaused(false);
              }}
              className={`relative px-4 py-2 text-xs rounded-full whitespace-nowrap transition-all duration-300 overflow-hidden group flex-shrink-0 ${
                selectedActor === actor
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white border border-white/20'
              }`}
            >
              {/* Hover gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-b from-white/20 via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                selectedActor === actor ? 'hidden' : ''
              }`} />
              
              {/* Red glow at bottom on hover */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-400 via-red-500 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ${
                selectedActor === actor ? 'hidden' : ''
              }`} />
              
              {/* Button text */}
              <span className="relative z-10">{actor}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}