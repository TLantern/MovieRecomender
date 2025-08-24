'use client';

import { useState, useRef, useEffect } from 'react';
import MoviePoster from './movie-poster';

interface MovieCard {
  id: string;
  title: string;
  image: string;
  rating?: number;
  year?: number;
  genre?: string;
  overview?: string;
  backdrop?: string;
}

interface CarouselProps {
  movies: MovieCard[];
  title?: string;
}

export default function Carousel({ movies, title }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex >= movies.length - 3 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? movies.length - 3 : prevIndex - 1
    );
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index * 3);
  };

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 2500);

    return () => clearInterval(interval);
  }, [currentIndex, isAutoPlaying]);

  // Pause auto-play on hover
  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      {title && (
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center font-heading">
          {title}
        </h2>
      )}
      
      <div 
        ref={carouselRef}
        className="relative overflow-hidden rounded-lg w-full max-w-6xl"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Carousel Container */}
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * (100/3)}%)`,
          }}
        >
          {movies.map((movie, index) => (
            <div
              key={movie.id}
              className="w-1/3 flex-shrink-0 flex justify-center px-2"
            >
              <div className="relative w-64 h-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                  {/* Movie Image */}
                  <div className="relative w-full h-3/4">
                    <MoviePoster
                      src={movie.image}
                      alt={movie.title}
                      priority={index === 0}
                    />
                    {/* Overlay for better text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  </div>
                  
                  {/* Movie Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <h3 className="text-lg font-semibold mb-1 truncate font-heading">
                      {movie.title}
                    </h3>
                    <div className="flex items-center justify-between text-sm">
                      {movie.year && (
                        <span className="text-gray-300 font-body">{movie.year}</span>
                      )}
                      {movie.rating && (
                        <div className="flex items-center">
                          <span className="text-yellow-400 mr-1">★</span>
                          <span className="font-body">{movie.rating}</span>
                        </div>
                      )}
                    </div>
                    {movie.genre && (
                      <p className="text-xs text-gray-300 mt-1 truncate font-body">
                        {movie.genre}
                      </p>
                    )}
                  </div>
                </div>
              </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 text-gray-800 dark:text-white p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
          aria-label="Previous slide"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700 text-gray-800 dark:text-white p-2 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
          aria-label="Next slide"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {Array.from({ length: Math.ceil(movies.length / 3) }, (_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === Math.floor(currentIndex / 3)
                  ? 'bg-white dark:bg-gray-300 scale-125'
                  : 'bg-white/50 dark:bg-gray-300/50 hover:bg-white/75 dark:hover:bg-gray-300/75'
              }`}
              aria-label={`Go to slide group ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 