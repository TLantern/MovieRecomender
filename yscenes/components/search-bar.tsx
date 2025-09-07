'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Slider } from './ui/slider';
import Image from 'next/image';
import AILoader from './ai-loader';
import { useUser, SignUpButton } from '@clerk/nextjs';

interface SearchBarProps {
  onSearch: (mood: string, yearRange: [number, number], selectedActor?: string) => void;
  loading?: boolean;
  selectedActor?: string;
  onActorSelect?: (actor: string) => void;
  searchCount?: number;
  isVipUser?: boolean;
  canSearch?: boolean;
}

export default function SearchBar({ onSearch, loading = false, selectedActor, onActorSelect, searchCount = 0, isVipUser = false, canSearch = true }: SearchBarProps) {
  const { user, isSignedIn } = useUser();
  const signUpButtonRef = useRef<HTMLButtonElement>(null);
  const [localSelectedActor, setLocalSelectedActor] = useState<string>('');
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
    // Stop carousel permanently if an actor is selected
    if (isCarouselPaused || localSelectedActor) return;
    
    const interval = setInterval(() => {
      setCarouselPosition(prev => {
        // Calculate total width and move carousel
        const totalWidth = 16 * 120; // 16 actors * ~120px each
        const moveAmount = 2; // Move 2px each tick
        // Reset position when reaching the end to create seamless loop
        const newPosition = prev + moveAmount;
        return newPosition >= totalWidth ? 0 : newPosition;
      });
    }, 50); // Update every 50ms for smooth movement
    
    return () => clearInterval(interval);
  }, [isCarouselPaused, localSelectedActor]);
  
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
  }, [charIndex, isDeleting, placeholderIndex]);

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
    onSearch(mood.trim(), yearRange, localSelectedActor || selectedActor);
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

  const handleYearRangeChange = (value: [number, number]) => {
    // Update visual state during sliding - no redirect here
    setYearRange(value);
  };

  const handleYearRangeCommit = (value: [number, number]) => {
    if (!isSignedIn) {
      // Trigger signup modal for non-signed in users
      signUpButtonRef.current?.click();
      return;
    }
    
    // TODO: Check if user has pro subscription here
    // For now, redirect all signed-in users to upgrade page
    const hasProSubscription = false; // Replace with actual subscription check
    
    if (!hasProSubscription) {
      // Redirect signed-in users without pro to upgrade page
      window.location.href = '/upgrade';
      return;
    }
  };

  const handleActorSelection = (actor: string) => {
    if (!isSignedIn) {
      // Trigger signup modal for non-signed in users
      signUpButtonRef.current?.click();
      return;
    }
    
    // TODO: Check if user has pro subscription here
    // For now, redirect all signed-in users to upgrade page
    const hasProSubscription = false; // Replace with actual subscription check
    
    if (!hasProSubscription) {
      // Redirect signed-in users without pro to upgrade page
      window.location.href = '/upgrade';
      return;
    }
    
    // Toggle actor selection
    const newActor = localSelectedActor === actor ? '' : actor;
    setLocalSelectedActor(newActor);
    
    // Carousel will stop spinning when actor is selected, resume when deselected
    
    if (onActorSelect) {
      onActorSelect(newActor);
    }
  };

  return (
    <>
      {/* Hidden SignUp button to trigger modal for premium features */}
      <SignUpButton mode="modal" fallbackRedirectUrl="/upgrade">
        <button 
          ref={signUpButtonRef}
          className="hidden"
          aria-hidden="true"
        />
      </SignUpButton>
      
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
          {/* AI Loader */}
          <div className="absolute top-2 left-2 z-10">
            <AILoader onClick={handleLogoClick} />
          </div>
        </div>
      </div>
      

      {/* Watch Now Button */}
      <div className="flex justify-center mb-6">
        {(!canSearch && !isVipUser) ? (
          isSignedIn ? (
            <Link href="/upgrade">
              <button
                className="px-4 py-2.5 text-sm border-none rounded-lg bg-white text-black cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 hover:bg-gray-100"
                style={{
                  boxShadow: '0 10px 20px -10px rgba(0,0,0,0.2)'
                }}
              >
                Upgrade to Search
              </button>
            </Link>
          ) : (
            <SignUpButton mode="modal" fallbackRedirectUrl="/upgrade">
              <button
                className="px-4 py-2.5 text-sm border-none rounded-lg bg-white text-black cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 hover:bg-gray-100"
                style={{
                  boxShadow: '0 10px 20px -10px rgba(0,0,0,0.2)'
                }}
              >
                Upgrade to Search
              </button>
            </SignUpButton>
          )
        ) : (
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
        )}
      </div>
      
                    {/* Year Range Slider */}
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-light text-gray-300 whitespace-nowrap min-w-[50px] text-center font-body">
            {yearRange[0]}
          </h2>
          <Slider
            value={yearRange}
            onValueChange={(value) => handleYearRangeChange(value as [number, number])}
            onValueCommit={(value) => handleYearRangeCommit(value as [number, number])}
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
      <div className="w-full mt-4 pt-4 pb-2 overflow-hidden">
        <div 
          className="flex gap-2 pb-2 scrollbar-hide px-2 transition-transform duration-100 ease-linear"
          style={{ transform: `translateX(-${carouselPosition}px)` }}
        >
          {[
            'Leonardo DiCaprio', 'Dwayne Johnson', 'Zendaya', 'Timothée Chalamet', 
            'Jennifer Lawrence', 'Ryan Gosling', 'Margot Robbie', 'Cillian Murphy',
            'Tom Holland', 'Florence Pugh', 'Robert Downey Jr.', 'Chris Hemsworth',
            'Emma Stone', 'Ryan Reynolds', 'Scarlett Johansson', 'Tom Hardy',
            // Duplicate for seamless loop
            'Leonardo DiCaprio', 'Dwayne Johnson', 'Zendaya', 'Timothée Chalamet', 
            'Jennifer Lawrence', 'Ryan Gosling', 'Margot Robbie', 'Cillian Murphy',
            'Tom Holland', 'Florence Pugh', 'Robert Downey Jr.', 'Chris Hemsworth',
            'Emma Stone', 'Ryan Reynolds', 'Scarlett Johansson', 'Tom Hardy'
          ].map((actor, index) => {
            // Define colors for selected state
            const selectedColors = [
              'bg-blue-100 text-blue-900',    // Pale blue
              'bg-purple-100 text-purple-900', // Pale purple
              'bg-pink-100 text-pink-900',     // Pale pink
              'bg-green-100 text-green-900',   // Pale green
              'bg-orange-100 text-orange-900'  // Pale orange
            ];
            const colorIndex = index % selectedColors.length;
            const selectedClass = `${selectedColors[colorIndex]} font-medium`;
            
            return (
            <button
              key={`${actor}-${index}`}
              onClick={() => handleActorSelection(actor)}
              className={`relative px-4 py-2 text-xs rounded-full whitespace-nowrap transition-all duration-300 flex-shrink-0 group ${
                (localSelectedActor === actor || selectedActor === actor)
                  ? selectedClass
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
              style={{
                filter: 'drop-shadow(0 0 0 transparent)',
                transition: 'filter 0.3s ease-in-out, transform 0.2s ease-in-out'
              }}
              onMouseEnter={(e) => {
                // Stop carousel immediately on hover
                setIsCarouselPaused(true);
                if (hoverTimeout) {
                  clearTimeout(hoverTimeout);
                  setHoverTimeout(null);
                }
                // Add very subtle colored glow - rotate between 5 colors
                const colors = [
                  'rgba(59, 130, 246, 0.25)',   // Blue
                  'rgba(147, 51, 234, 0.25)',   // Purple
                  'rgba(236, 72, 153, 0.25)',   // Pink
                  'rgba(34, 197, 94, 0.25)',    // Green
                  'rgba(251, 146, 60, 0.25)'    // Orange
                ];
                const colorIndex = index % colors.length;
                e.currentTarget.style.filter = `drop-shadow(0 1px 6px ${colors[colorIndex]}) drop-shadow(0 0 8px ${colors[colorIndex]})`;
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                // Resume carousel immediately on leave
                setIsCarouselPaused(false);
                // Remove colored glow and reset transform
                e.currentTarget.style.filter = 'drop-shadow(0 0 0 transparent)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseDown={(e) => {
                // Add intense glow effect on click/press
                const colors = [
                  'rgba(59, 130, 246, 1)',     // Bright Blue
                  'rgba(147, 51, 234, 1)',     // Bright Purple
                  'rgba(236, 72, 153, 1)',     // Bright Pink
                  'rgba(34, 197, 94, 1)',      // Bright Green
                  'rgba(251, 146, 60, 1)'      // Bright Orange
                ];
                const colorIndex = index % colors.length;
                e.currentTarget.style.filter = `drop-shadow(0 6px 24px ${colors[colorIndex]}) drop-shadow(0 0 32px ${colors[colorIndex]}) drop-shadow(0 0 8px ${colors[colorIndex]})`;
                e.currentTarget.style.transform = 'scale(0.95)';
              }}
              onMouseUp={(e) => {
                // Return to very subtle hover state after click
                const colors = [
                  'rgba(59, 130, 246, 0.25)',   // Blue
                  'rgba(147, 51, 234, 0.25)',   // Purple
                  'rgba(236, 72, 153, 0.25)',   // Pink
                  'rgba(34, 197, 94, 0.25)',    // Green
                  'rgba(251, 146, 60, 0.25)'    // Orange
                ];
                const colorIndex = index % colors.length;
                e.currentTarget.style.filter = `drop-shadow(0 1px 6px ${colors[colorIndex]}) drop-shadow(0 0 8px ${colors[colorIndex]})`;
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
            >
              {actor}
            </button>
            );
          })}
        </div>
      </div>
      </div>
    </>
  );
}