'use client';

import { useState, useEffect, useRef } from 'react';

interface Actor {
  id: string;
  name: string;
  image?: string;
  gradient: string;
}

interface ActorCarouselProps {
  onActorClick: (actorName: string) => void;
}

export default function ActorCarousel({ onActorClick }: ActorCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [hoveredActor, setHoveredActor] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const actors: Actor[] = [
    { id: '1', name: 'Leonardo DiCaprio', gradient: 'bg-gradient-to-br from-red-400 via-red-500 to-red-600' },
    { id: '2', name: 'Dwayne Johnson', gradient: 'bg-gradient-to-br from-orange-400 via-red-500 to-pink-600' },
    { id: '3', name: 'Zendaya', gradient: 'bg-gradient-to-br from-purple-400 via-pink-500 to-red-600' },
    { id: '4', name: 'Timothée Chalamet', gradient: 'bg-gradient-to-br from-blue-400 via-purple-500 to-pink-600' },
    { id: '5', name: 'Jennifer Lawrence', gradient: 'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600' },
    { id: '6', name: 'Ryan Gosling', gradient: 'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600' },
    { id: '7', name: 'Margot Robbie', gradient: 'bg-gradient-to-br from-pink-400 via-rose-500 to-red-600' },
    { id: '8', name: 'Cillian Murphy', gradient: 'bg-gradient-to-br from-slate-400 via-gray-500 to-zinc-600' },
    { id: '9', name: 'Tom Holland', gradient: 'bg-gradient-to-br from-red-400 via-red-500 to-red-700' },
    { id: '10', name: 'Florence Pugh', gradient: 'bg-gradient-to-br from-violet-400 via-purple-500 to-indigo-600' },
    { id: '11', name: 'Robert Downey Jr.', gradient: 'bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-600' },
    { id: '12', name: 'Scarlett Johansson', gradient: 'bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-600' },
    { id: '13', name: 'Chris Hemsworth', gradient: 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600' },
    { id: '14', name: 'Emma Stone', gradient: 'bg-gradient-to-br from-rose-400 via-pink-500 to-red-600' },
    { id: '15', name: 'Ryan Reynolds', gradient: 'bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600' }
  ];

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex >= actors.length - 1 ? 0 : prevIndex + 1
    );
  };

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 3000);

    return () => clearInterval(interval);
  }, [currentIndex, isAutoPlaying]);

  // Pause auto-play on hover
  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  const handleActorClick = (actorName: string) => {
    onActorClick(actorName);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6">
      <h2 className="text-xl font-bold text-white mb-4 text-center font-heading">
        Select Your Favorite Actor
      </h2>
      
      <div 
        ref={carouselRef}
        className="relative overflow-hidden rounded-lg w-full"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Carousel Container */}
        <div 
          className="flex transition-transform duration-700 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * (100 / 5)}%)`,
          }}
        >
          {actors.map((actor, index) => (
            <div
              key={actor.id}
              className="w-1/5 flex-shrink-0 flex justify-center px-1"
            >
              <div 
                className={`relative w-full h-20 ${actor.gradient} rounded-lg shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 group`}
                onClick={() => handleActorClick(actor.name)}
                onMouseEnter={() => setHoveredActor(actor.id)}
                onMouseLeave={() => setHoveredActor(null)}
              >
                {/* Hover gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-r from-white/20 via-white/30 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                {/* Glow effect on hover */}
                <div className={`absolute inset-0 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-lg blur-md opacity-0 group-hover:opacity-70 transition-opacity duration-300 -z-10`} />
                
                {/* Actor name */}
                <div className="absolute inset-0 flex items-center justify-center p-2">
                  <span className="text-white font-medium text-sm text-center leading-tight group-hover:text-white/90 transition-colors duration-300 font-body">
                    {actor.name}
                  </span>
                </div>

                {/* Shimmer effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transform -translate-x-full group-hover:translate-x-full transition-all duration-700" />
              </div>
            </div>
          ))}
        </div>

        {/* Gradient fade edges */}
        <div className="absolute left-0 top-0 w-8 h-full bg-gradient-to-r from-black/50 to-transparent pointer-events-none z-10" />
        <div className="absolute right-0 top-0 w-8 h-full bg-gradient-to-l from-black/50 to-transparent pointer-events-none z-10" />
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center mt-4 space-x-1">
        {Array.from({ length: actors.length - 4 }, (_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              index === currentIndex
                ? 'bg-white scale-125'
                : 'bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`Go to actor group ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
} 