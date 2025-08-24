'use client';

import { useState } from 'react';
// import Carousel from '../components/carousel';
import Navbar from '../components/navbar';
import SearchBar from '../components/search-bar';
// import { useMovies } from '../hooks/useMovies';

interface MovieResult {
  title: string;
  year: number;
  description: string;
  rating_out_of_10: number;
  stars: string;
  stream_link: string;
  poster_url?: string;
}

export default function Home() {
  // const { movies, loading, error } = useMovies();
  const [searchResults, setSearchResults] = useState<MovieResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [bottomEmail, setBottomEmail] = useState('');
  const [bottomEmailMessage, setBottomEmailMessage] = useState('');
  const [moreLoading, setMoreLoading] = useState(false);
  const [currentMood, setCurrentMood] = useState('');
  const [currentYearRange, setCurrentYearRange] = useState<[number, number]>([1970, 2025]);

  const handleSearch = async (mood: string, yearRange: [number, number]) => {
    setSearchLoading(true);
    setShowResults(true);
    setSearchResults([]);
    setCurrentMood(mood);
    setCurrentYearRange(yearRange);

    try {
      const res = await fetch('/api/recommend', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          mood, 
          yearRange,
          isFirstRecommendation: true  // Flag for fan favourites
        })
      });
      
      if (!res.ok) throw await res.text();
      
      const { movies: results } = await res.json();
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleMoreRecommendations = async () => {
    if (!currentMood || moreLoading) return;
    
    setMoreLoading(true);
    
    try {
      // Get current movies to exclude (capture current state)
      const currentMovies = searchResults.map(movie => ({ title: movie.title, year: movie.year }));
      
      const res = await fetch('/api/recommend', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          mood: currentMood, 
          yearRange: currentYearRange,
          excludeMovies: currentMovies,
          isFirstRecommendation: false  // Use current model for more recommendations
        })
      });
      
      if (!res.ok) throw await res.text();
      
      const { movies: newResults } = await res.json();
      
      // Filter out any duplicates that might have slipped through
      const filteredNewResults = newResults.filter((newMovie: any) => 
        !currentMovies.some(existing => 
          existing.title.toLowerCase() === newMovie.title.toLowerCase() && 
          existing.year === newMovie.year
        )
      );
      
      // Add filtered results to existing ones
      setSearchResults(prev => [...prev, ...filteredNewResults]);
    } catch (err) {
      console.error('More recommendations error:', err);
    } finally {
      setMoreLoading(false);
    }
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

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-0">
        <div className="container mx-auto">
          <div className="flex flex-row gap-6 justify-center items-start max-w-6xl mx-auto pt-8">
            {/* Main Search Bar */}
            <div className="bg-black/70 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-white/30 relative flex-1 max-w-2xl drop-shadow-[0_0_30px_rgba(59,130,246,0.2)]">
              <div className="absolute inset-0 bg-white/3 rounded-xl blur-xl"></div>
              {/* This div sets up a relatively positioned container with a high z-index (z-25) to ensure its children (like the SearchBar) appear above background effects or overlays. */}
              <div className="relative z-35">
              <h1 className="text-4xl font-bold text-center text-white mb-8 pt-8 drop-shadow-[0_0_20px_rgba(200,4,24,0.3)] font-heading" style={{animation: 'fadeInOut 3s ease-in-out infinite'}}>
              What's <span className="bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent animate-pulse" style={{animationDuration: '3s'}}>the Mood</span> for <span className="bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent animate-pulse" style={{animationDuration: '3s'}}>Tonight</span>?
            </h1>
                <SearchBar onSearch={handleSearch} loading={searchLoading} />
              </div>
            </div>

            {/* Side Card - Favourite Actors */}
            {/* <div className="bg-blue-900/80 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-white/30 relative flex-1 max-w-md drop-shadow-[0_0_30px_rgba(59,130,246,0.2)]">
              <div className="absolute inset-0 bg-white/5 rounded-xl blur-xl"></div>
              <div className="relative z-35">
                <h2 className="text-2xl font-bold text-center text-white mb-6 pt-4 drop-shadow-[0_0_15px_rgba(147,51,234,0.3)]">
                  <span className="text-white">Favourite Actor?</span>
                </h2>
                <div className="overflow-hidden">
                  <div className="flex flex-col gap-2">
                    {[
                      // Row 1
                      ['Leonardo DiCaprio', 'Dwayne Johnson', 'Zendaya', 'Timothée Chalamet', 'Jennifer Lawrence', 'Ryan Gosling', 'Margot Robbie', 'Cillian Murphy', 'Tom Holland', 'Florence Pugh'],
                      // Row 2
                      ['Robert Downey Jr.', 'Chris Hemsworth', 'Michael B. Jordan', 'Jenna Ortega', 'Pedro Pascal', 'Emma Stone', 'Ana de Armas', 'Ryan Reynolds', 'Viola Davis', 'Keanu Reeves'],
                      // Row 3
                      ['Scarlett Johansson', 'Austin Butler', 'Gal Gadot', 'Chris Evans', 'Adam Driver', 'Natalie Portman', 'Jake Gyllenhaal', 'Millie Bobby Brown', 'Oscar Isaac', 'Emily Blunt'],
                      // Row 4
                      ['Tom Hardy', 'Anya Taylor-Joy', 'Jason Momoa', 'Lupita Nyong\'o', 'Jamie Foxx', 'Paul Mescal', 'Sydney Sweeney', 'Jeremy Allen White', 'Brie Larson', 'Christian Bale'],
                      // Row 5
                      ['Henry Cavill', 'Robert Pattinson', 'Zoe Kravitz', 'Idris Elba', 'Glen Powell', 'Kate Winslet', 'Natalie Dormer', 'Mads Mikkelsen', 'Jacob Elordi', 'Dakota Johnson']
                    ].map((rowActors, rowIndex) => (
                      <div key={rowIndex} className="flex animate-scroll">
                        {rowActors.map((actor, i) => {
                          const gradients = [
                            'bg-gradient-to-br from-red-400 via-red-500 to-red-600',
                            'bg-gradient-to-br from-red-300 via-red-400 to-red-500',
                            'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600',
                            'bg-gradient-to-br from-orange-400 via-red-500 to-pink-600',
                            'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600',
                            'bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600',
                            'bg-gradient-to-br from-red-500 via-red-600 to-red-700',
                            'bg-gradient-to-br from-red-400 via-red-500 to-red-600',
                            'bg-gradient-to-br from-red-300 via-red-400 to-red-500',
                            'bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-600'
                          ];
                          const gradientClass = gradients[(i + rowIndex * 2) % gradients.length];
                          
                          return (
                            <div key={i} className={`${gradientClass} rounded-lg p-2 text-center hover:opacity-80 transition-all duration-200 cursor-pointer shadow-lg flex-shrink-0 mx-1 min-w-[80px]`}>
                              <div className="text-xs text-white font-medium leading-tight">{actor}</div>
                            </div>
                          );
                        })}
                        // Duplicate actors for seamless loop
                        {rowActors.map((actor, i) => {
                          const gradients = [
                            'bg-gradient-to-br from-red-400 via-red-500 to-red-600',
                            'bg-gradient-to-br from-red-300 via-red-400 to-red-500',
                            'bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600',
                            'bg-gradient-to-br from-orange-400 via-red-500 to-pink-600',
                            'bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600',
                            'bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600',
                            'bg-gradient-to-br from-red-500 via-red-600 to-red-700',
                            'bg-gradient-to-br from-red-400 via-red-500 to-red-600',
                            'bg-gradient-to-br from-red-300 via-red-400 to-red-500',
                            'bg-gradient-to-br from-teal-400 via-cyan-500 to-blue-600'
                          ];
                          const gradientClass = gradients[(i + rowIndex * 2) % gradients.length];
                          
                          return (
                            <div key={`duplicate-${i}`} className={`${gradientClass} rounded-lg p-2 text-center hover:opacity-80 transition-all duration-200 cursor-pointer shadow-lg flex-shrink-0 mx-1 min-w-[80px]`}>
                              <div className="text-xs text-white font-medium leading-tight">{actor}</div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div> */}
          </div>
        </div>
        
        {/* Email Form - positioned between search card and movie results */}
        {showResults && (
          <div className="text-center mt-10 mb-10">
            <div className="relative z-10 text-center">
              <input 
                type="email" 
                placeholder="Your email for weekly picks" 
                className="px-3 py-2 text-sm w-72 max-w-[80vw] rounded border border-gray-600 bg-gray-800 text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500 mr-2 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:drop-shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all duration-300"
                value={bottomEmail}
                onChange={(e) => setBottomEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleBottomEmailSubmit()}
              />
              <button 
                onClick={handleBottomEmailSubmit}
                className="px-4 py-2 text-sm border-none rounded bg-black text-white cursor-pointer shadow-md hover:shadow-lg transition-all duration-200 drop-shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:drop-shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:scale-105 transform transition-all duration-300"
              >
                Join the List
              </button>
              {bottomEmailMessage && (
                <div className="mt-2 text-green-400 text-sm">
                  {bottomEmailMessage}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Search Results */}
        {showResults && (
          <div className="container mx-auto px-4 max-w-6xl">
            {searchLoading ? (
              <div className="text-center py-8">
                {/* From Uiverse.io by terenceodonoghue */}
                <div className="relative mx-auto mb-6" style={{ height: '48px', width: '48px' }}>
                  <div className="loading-spinner"></div>
                </div>
                <p className="text-white text-lg font-body">Finding your Perfect Movie</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((movie, index) => {
                  // Check if this is the first recommendation and the middle card (index 1)
                  const isMasterpiece = searchResults.length === 3 && index === 1 && !currentMood.includes('more');
                  
                  return (
                                        <div 
                      key={index} 
                      className={`bg-black/85 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-white/30 relative flex-1 max-w-md transition-all duration-300 ease-out cursor-pointer ${
                        isMasterpiece 
                          ? 'drop-shadow-[0_0_40px_rgba(147,51,234,0.4)] hover:drop-shadow-[0_0_50px_rgba(147,51,234,0.6)] hover:scale-105 hover:border-purple-400/50' 
                          : 'drop-shadow-[0_0_30px_rgba(59,130,246,0.2)] hover:drop-shadow-[0_0_40px_rgba(59,130,246,0.3)] hover:scale-103 hover:border-white/40'
                      }`}
                    >
                      <div className="absolute inset-0 bg-white/3 rounded-xl blur-xl"></div>
                      
                      {/* Fan Favourite Label - Only for masterpiece (middle card) */}
                      {isMasterpiece && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-20">
                          <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black px-3 py-1.5 rounded-full shadow-lg border-2 border-yellow-300 flex items-center gap-2 font-bold text-sm">
                            <span className="text-yellow-600">⭐</span>
                            <span className="font-heading">Fan Favourite</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="relative z-10 h-full flex flex-col">
                      {/* Rating at the top */}
                      <div className="flex items-center justify-end mb-3">
                        <div className="flex items-center bg-blue-600/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
                          <span className="text-yellow-400 mr-1 text-sm">★</span>
                          <span className="text-white text-sm font-light font-body">{Number(movie.rating_out_of_10).toFixed(1)}/10</span>
                        </div>
                      </div>
                      
                      {/* Movie Title */}
                      <h4 className="text-lg font-semibold text-white mb-3 text-center font-heading">
                        {movie.title} ({movie.year})
                      </h4>
                      
                      {/* Movie Poster - 9:16 aspect ratio */}
                      <div className="relative w-full mb-3">
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
                      
                      {/* Description */}
                      <p className="text-gray-300 text-sm mb-3 flex-grow text-center leading-relaxed font-body">{movie.description}</p>
                      
                      {/* Watch button */}
                      <a 
                        href={movie.stream_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-400 transition-colors duration-200 mt-auto text-center font-medium hover:scale-105 transform transition-transform"
                      >
                        ▶️ Watch here
                      </a>
                    </div>
                  </div>
                );
              })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-300">No recommendations found. Try a different mood!</p>
              </div>
            )}
            
            {/* More Button - only show when there are results */}
            {searchResults.length > 0 && (
              <div className="text-center mt-16 mb-20">
                <button 
                  onClick={handleMoreRecommendations}
                  disabled={moreLoading}
                  className="px-6 py-3 text-base border-none rounded-lg bg-white text-black cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 hover:bg-gray-100 font-medium drop-shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:drop-shadow-[0_0_20px_rgba(59,130,246,0.5)] flex items-center justify-center gap-2"
                >
                  {moreLoading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                  )}
                  {moreLoading ? 'Finding More...' : 'More Recommendations'}
                </button>
              </div>
            )}
                    </div>
        )}
        
        {/* Trending Movies Carousel - Commented Out */}
        {/* {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400 mb-4">Error loading movies: {error}</p>
            <p className="text-gray-600 dark:text-gray-300">Please check your TMDb API key configuration.</p>
          </div>
        ) : (
          <Carousel movies={movies} title="Trending Movies" />
        )} */}
        
      </main>
    </div>
  );
}
