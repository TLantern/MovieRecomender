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
}

export default function Home() {
  // const { movies, loading, error } = useMovies();
  const [searchResults, setSearchResults] = useState<MovieResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [bottomEmail, setBottomEmail] = useState('');
  const [bottomEmailMessage, setBottomEmailMessage] = useState('');

  const handleSearch = async (mood: string, yearRange: [number, number]) => {
    setSearchLoading(true);
    setShowResults(true);
    setSearchResults([]);

    try {
      const res = await fetch('/api/recommend', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mood, yearRange })
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
          <div className="flex flex-row gap-6 justify-center items-start max-w-6xl mx-auto pt-20">
            {/* Main Search Bar */}
            <div className="bg-black/80 backdrop-blur-sm rounded-xl p-4 shadow-2xl border border-white/30 relative flex-1 max-w-2xl drop-shadow-[0_0_30px_rgba(59,130,246,0.2)]">
              <div className="absolute inset-0 bg-white/5 rounded-xl blur-xl"></div>
              {/* This div sets up a relatively positioned container with a high z-index (z-25) to ensure its children (like the SearchBar) appear above background effects or overlays. */}
              <div className="relative z-35">
              <h1 className="text-4xl font-bold text-center text-white mb-8 pt-8 drop-shadow-[0_0_20px_rgba(200,4,24,0.3)]" style={{animation: 'fadeInOut 3s ease-in-out infinite'}}>
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
        
        {/* Search Results */}
        {showResults && (
          <div className="container mx-auto px-4 mt-8 max-w-6xl">
            {searchLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300">Loading recommendations…</p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((movie, index) => (
                  <div key={index} className="p-4 bg-white/5 dark:bg-gray-800/50 rounded-lg text-left h-full flex flex-col">
                    <h4 className="text-lg font-semibold text-white mb-2">
                      {movie.title} ({movie.year})
                    </h4>
                    <p className="text-gray-300 text-sm mb-2 flex-grow">{movie.description}</p>
                    <p className="text-blue-400 text-sm mb-3">
                      <strong>Rating:</strong> {movie.rating_out_of_10}/10 ({movie.stars}★)
                    </p>
                    <a 
                      href={movie.stream_link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-400 transition-colors duration-200 mt-auto"
                    >
                      ▶️ Watch here
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-300">No recommendations found. Try a different mood!</p>
              </div>
            )}
            
            {/* Bottom email form - only show when there are results */}
            {searchResults.length > 0 && (
              <div className="text-center mt-8 p-4 bg-white/5 dark:bg-gray-800/50 rounded-lg max-w-2xl mx-auto">
                <input 
                  type="email" 
                  placeholder="Your email for weekly picks" 
                  className="px-3 py-2 text-sm w-72 max-w-[80vw] rounded border border-gray-600 bg-gray-800 text-gray-100 placeholder-gray-400 focus:outline-none focus:border-blue-500 mr-2"
                  value={bottomEmail}
                  onChange={(e) => setBottomEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleBottomEmailSubmit()}
                />
                <button 
                  onClick={handleBottomEmailSubmit}
                  className="px-4 py-2 text-sm border-none rounded bg-black text-white cursor-pointer shadow-md hover:shadow-lg transition-all duration-200"
                >
                  Join the List
                </button>
                {bottomEmailMessage && (
                  <div className="mt-2 text-green-400 text-sm">
                    {bottomEmailMessage}
                  </div>
                )}
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
