'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Navbar from '../../components/navbar';
import Bookmark from '../../components/bookmark';

interface BookmarkedMovie {
  id: string;
  title: string;
  year: number;
  poster_url: string;
  rating_out_of_10?: number;
  created_at: string;
}

export default function BookmarksPage() {
  const { user, isLoaded } = useUser();
  const [bookmarkedMovies, setBookmarkedMovies] = useState<BookmarkedMovie[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real bookmarks from API
  useEffect(() => {
    if (isLoaded && user) {
      fetchBookmarks();
    }
  }, [isLoaded, user]);

  const fetchBookmarks = async () => {
    try {
      const response = await fetch('/api/bookmarks');
      if (response.ok) {
        const data = await response.json();
        // Transform API data to match our interface
        const transformedBookmarks: BookmarkedMovie[] = data.bookmarks.map((bookmark: any) => ({
          id: bookmark.movieId,
          title: bookmark.title,
          year: bookmark.year,
          poster_url: bookmark.poster_url,
          rating_out_of_10: bookmark.rating_out_of_10,
          created_at: new Date().toISOString().split('T')[0] // Use current date for now
        }));
        setBookmarkedMovies(transformedBookmarks);
      } else {
        console.error('Failed to fetch bookmarks');
        setBookmarkedMovies([]);
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      setBookmarkedMovies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookmarkToggle = (movieId: string, isBookmarked: boolean) => {
    if (!isBookmarked) {
      // Remove from bookmarks
      setBookmarkedMovies(prev => prev.filter(movie => movie.id !== movieId));
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-20">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <div className="loader mt-4">
                <div className="jimu-primary-loading"></div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <main className="pt-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold text-white mb-8 font-heading">
              Please Sign In
            </h1>
            <p className="text-white/70 text-lg font-body">
              You need to be signed in to view your bookmarked movies.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-20">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4 font-heading">
              Your Bookmarked Movies
            </h1>
            <p className="text-white/90 text-lg font-semibold font-body">
              {bookmarkedMovies.length} movie{bookmarkedMovies.length !== 1 ? 's' : ''} saved
            </p>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="text-center">
              <p className="text-white text-lg font-body">Loading your bookmarks...</p>
              <div className="loader mt-4">
                <div className="jimu-primary-loading"></div>
              </div>
            </div>
          ) : bookmarkedMovies.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16">
              <div className="bg-black/85 backdrop-blur-sm rounded-xl p-8 shadow-2xl border border-white/30 max-w-md mx-auto">
                <div className="text-6xl mb-4">📖</div>
                <h3 className="text-2xl font-bold text-white mb-4 font-heading">No Bookmarks Yet</h3>
                <p className="text-white/70 font-body mb-6">
                  Start exploring movies and bookmark your favorites to see them here!
                </p>
                <a 
                  href="/"
                  className="inline-block px-6 py-3 bg-white text-black rounded-lg hover:bg-gray-100 transition-all duration-200 hover:scale-105 font-medium"
                >
                  Discover Movies
                </a>
              </div>
            </div>
          ) : (
            /* Bookmarked Movies Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {bookmarkedMovies.map((movie) => (
                <div 
                  key={movie.id}
                  className="bg-black/85 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-white/30 relative transition-all duration-300 ease-out cursor-pointer hover:drop-shadow-[0_0_40px_rgba(59,130,246,0.3)] hover:scale-103 hover:border-white/40"
                >
                  {/* Bookmark - Top left corner */}
                  <div className="absolute top-3 left-3 z-20">
                    <Bookmark
                      movieId={movie.id}
                      title={movie.title}
                      year={movie.year}
                      poster_url={movie.poster_url}
                      rating_out_of_10={movie.rating_out_of_10}
                      description=""
                      isBookmarked={true}
                      onToggle={handleBookmarkToggle}
                    />
                  </div>

                  <div className="absolute inset-0 bg-white/3 rounded-xl blur-xl"></div>
                  
                  <div className="relative z-10 h-full flex flex-col">
                    {/* Rating at the top */}
                    {movie.rating_out_of_10 && (
                      <div className="flex items-center justify-end mb-3">
                        <div className="flex items-center bg-blue-600/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
                          <span className="text-yellow-400 mr-1 text-sm">★</span>
                          <span className="text-white text-sm font-light font-body">
                            {Number(movie.rating_out_of_10).toFixed(1)}/10
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {/* Movie Title */}
                    <h4 className="text-lg font-semibold text-white mb-3 text-center font-heading">
                      {movie.title} ({movie.year})
                    </h4>
                    
                    {/* Movie Poster - 9:16 aspect ratio */}
                    <div className="relative w-full mb-3 flex-grow">
                      <div className="aspect-[9/16] w-full max-w-[200px] mx-auto">
                        <img 
                          src={movie.poster_url || 'https://images.unsplash.com/photo-1624138784729-537e99f71d08?w=400&h=600&fit=crop'} 
                          alt={`${movie.title} poster`}
                          className="w-full h-full object-cover rounded-lg shadow-lg"
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1624138784729-537e99f71d08?w=400&h=600&fit=crop';
                          }}
                        />
                      </div>
                    </div>
                    
                    {/* Bookmarked date */}
                    <div className="text-center">
                      <p className="text-gray-400 text-xs font-body">
                        Bookmarked {new Date(movie.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
