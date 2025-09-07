'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Bookmark from './bookmark';

interface MovieModalProps {
  movie: {
    title: string;
    year: number;
    description: string;
    rating_out_of_10: number;
    poster_url?: string;
    stream_link?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  isBookmarked?: boolean;
  onBookmarkToggle?: (movieId: string, isBookmarked: boolean) => void;
}

interface WatchProvider {
  provider_name: string;
  provider_id: number;
  logo_path: string;
  display_priority: number;
}

interface WatchProvidersData {
  link?: string;
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
}

export default function MovieModal({ movie, isOpen, onClose, isBookmarked, onBookmarkToggle }: MovieModalProps) {
  const [watchProviders, setWatchProviders] = useState<WatchProvidersData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [movieDetails, setMovieDetails] = useState<any>(null);

  useEffect(() => {
    if (isOpen && movie) {
      fetchWatchProviders();
    }
  }, [isOpen, movie]);

  // Capture wheel events to scroll modal content instead of page
  useEffect(() => {
    if (isOpen) {
      const handleWheel = (e: WheelEvent) => {
        // Find the element under the mouse cursor
        const target = e.target as HTMLElement;
        
        // Check if we're hovering over scrollable content
        const descriptionElement = target.closest('.movie-description') as HTMLElement;
        const watchProvidersElement = target.closest('.watch-providers') as HTMLElement;
        
        if (descriptionElement && descriptionElement.scrollHeight > descriptionElement.clientHeight) {
          // Allow description to scroll
          e.preventDefault();
          descriptionElement.scrollTop += e.deltaY;
        } else if (watchProvidersElement && watchProvidersElement.scrollHeight > watchProvidersElement.clientHeight) {
          // Allow watch providers to scroll
          e.preventDefault();
          watchProvidersElement.scrollTop += e.deltaY;
        }
        // If neither, let the page scroll normally
      };

      document.addEventListener('wheel', handleWheel, { passive: false });
      return () => document.removeEventListener('wheel', handleWheel);
    }
  }, [isOpen]);

  const fetchWatchProviders = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/watch-providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: movie.title,
          year: movie.year
        })
      });

      if (!response.ok) throw new Error('Failed to fetch watch providers');

      const data = await response.json();
      setWatchProviders(data.watchProviders.US || {}); // Default to US providers
      setMovieDetails(data.movie); // Store additional movie details from TMDB
    } catch (err) {
      console.error('Error fetching watch providers:', err);
      setError('Failed to load streaming options');
    } finally {
      setLoading(false);
    }
  };

  const handleProviderClick = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const renderProviderRow = (providers: WatchProvider[], title: string) => {
    if (!providers || providers.length === 0) return null;

    return (
      <div className="mb-6">
        <h3 className="text-white text-lg font-semibold mb-3">{title}</h3>
        <div className="flex flex-wrap gap-3">
          {providers
            .sort((a, b) => a.display_priority - b.display_priority)
            .map((provider) => (
              <button
                key={provider.provider_id}
                onClick={() => watchProviders.link && handleProviderClick(watchProviders.link)}
                className="bg-white/10 backdrop-blur-sm rounded-lg p-3 hover:bg-white/20 transition-all duration-200 hover:scale-105 flex items-center gap-2 border border-white/20"
              >
                <Image
                  src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                  alt={provider.provider_name}
                  width={32}
                  height={32}
                  loading="lazy"
                  sizes="32px"
                  className="rounded"
                  unoptimized={false}
                />
                <span className="text-white text-sm font-medium">{provider.provider_name}</span>
              </button>
            ))}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-black/90 backdrop-blur-md rounded-xl border border-white/30 shadow-2xl overflow-hidden"
          style={{ width: 'min(95vw, calc(90vh * 12 / 16))', height: 'min(90vh, calc(95vw * 16 / 12))' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Bookmark button */}
          {onBookmarkToggle && (
            <div className="absolute top-4 left-4 z-10">
              <Bookmark
                movieId={`${movie.title}-${movie.year}`}
                title={movie.title}
                year={movie.year}
                poster_url={movie.poster_url}
                rating_out_of_10={movie.rating_out_of_10}
                description={movie.description}
                isBookmarked={isBookmarked || false}
                onToggle={onBookmarkToggle}
              />
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 text-white/70 hover:text-white transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex h-full">
            {/* Left Side - Movie Details */}
            <div className="flex-1 p-6 md:p-7 overflow-y-auto">
              {/* Movie Poster */}
              <div className="relative w-full max-w-[200px] mx-auto mb-6">
                <div className="relative aspect-[9/16] w-full">
                  <Image
                    src={
                      movie.poster_url
                        ? movie.poster_url
                        : movieDetails?.poster_path
                        ? `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}`
                        : 'https://images.unsplash.com/photo-1624138784729-537e99f71d08?w=400&h=600&fit=crop'
                    }
                    alt={`${movie.title} poster`}
                    fill
                    priority={true}
                    sizes="(max-width: 768px) 200px, 200px"
                    className="object-cover rounded-lg shadow-lg"
                    unoptimized={false}
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkbHB0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                  />
                </div>
              </div>

              {/* Movie Info */}
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-white font-heading">
                    {movie.title}
                  </h2>
                  <span className="text-white/70 text-lg">({movie.year})</span>
                </div>

                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <div className="flex items-center bg-blue-600/80 backdrop-blur-sm px-2 py-1.5 rounded-full">
                    <span className="text-yellow-400 mr-1 text-sm">★</span>
                    <span className="text-white text-sm font-medium">{Number(movie.rating_out_of_10).toFixed(1)}/10</span>
                  </div>
                  {movieDetails?.runtime && (
                    <div className="bg-gray-600/80 backdrop-blur-sm px-2 py-1.5 rounded-full">
                      <span className="text-white text-xs">{movieDetails.runtime} min</span>
                    </div>
                  )}
                  {movieDetails?.vote_average && (
                    <div className="bg-green-600/80 backdrop-blur-sm px-2 py-1.5 rounded-full">
                      <span className="text-white text-xs">TMDB: {movieDetails.vote_average.toFixed(1)}/10</span>
                    </div>
                  )}
                </div>
                
                {movieDetails?.genres && movieDetails.genres.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1.5">
                      {movieDetails.genres.slice(0, 4).map((genre: any) => (
                        <span key={genre.id} className="bg-purple-600/80 backdrop-blur-sm px-2 py-1 rounded-full text-white text-xs">
                          {genre.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="movie-description text-gray-300 text-base leading-relaxed mb-6 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
                  <p>
                    {movieDetails?.overview && movieDetails.overview.length > movie.description.length 
                      ? movieDetails.overview 
                      : movie.description}
                    {movieDetails?.overview && movieDetails.overview !== movie.description && movieDetails.overview.length <= movie.description.length && (
                      <span className="block mt-3 text-gray-400 italic">
                        {movieDetails.overview}
                      </span>
                    )}
                  </p>
                  {/* Scroll indicator */}
                  <div className="text-center text-gray-500 text-xs mt-2 opacity-60">

                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Where to Watch */}
            <div className="w-56 p-6 md:p-7 border-l border-white/20 overflow-y-auto watch-providers">
              <h3 className="text-2xl font-bold text-white mb-6 font-heading">
                Where to Watch
              </h3>

              {loading && (
                <div className="flex items-center gap-3 text-white">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Loading streaming options...</span>
                </div>
              )}

              {error && (
                <div className="text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg p-4">
                  {error}
                </div>
              )}

              {!loading && !error && (
                <>
                  {watchProviders.flatrate && renderProviderRow(watchProviders.flatrate, "Stream")}
                  {watchProviders.rent && renderProviderRow(watchProviders.rent, "Rent")}
                  {watchProviders.buy && renderProviderRow(watchProviders.buy, "Buy")}

                  {(!watchProviders.flatrate || watchProviders.flatrate.length === 0) &&
                   (!watchProviders.rent || watchProviders.rent.length === 0) &&
                   (!watchProviders.buy || watchProviders.buy.length === 0) && (
                    <div className="text-gray-400 text-center py-8">
                      <p>No streaming options available in your region.</p>
                      {movie.stream_link && (
                        <button
                          onClick={() => window.open(movie.stream_link, '_blank', 'noopener,noreferrer')}
                          className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                        >
                          Check Original Source
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
