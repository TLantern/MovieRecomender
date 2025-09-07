import { NextRequest, NextResponse } from 'next/server';
import { recommendationLogger } from '../../../utils/logger';

const API_BASE = process.env.API_BASE_URL || "https://movierecomender.onrender.com";
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Helper function to generate consistent hash from string
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Helper function to fetch poster URL from TMDB
async function getTMDBPoster(title: string, year: number): Promise<string | null> {
  if (!TMDB_API_KEY) return null;
  
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&year=${year}`,
      {
        headers: { 'Accept': 'application/json' },
      }
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const results = data.results;
    
    if (results && results.length > 0) {
      const posterPath = results[0].poster_path;
      return posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : null;
    }
    
    return null;
  } catch (error) {
    console.error('TMDB poster fetch error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { mood, yearRange, actor, excludeMovies = [], isFirstRecommendation = false, sessionId } = await request.json();

    if (!mood) {
      return NextResponse.json({ error: 'Mood is required' }, { status: 400 });
    }

    if (!yearRange || !Array.isArray(yearRange) || yearRange.length !== 2) {
      return NextResponse.json({ error: 'Year range is required and must be an array of 2 numbers' }, { status: 400 });
    }

    // Generate session-specific randomization seed
    const sessionSeed = sessionId ? hashString(sessionId) : Date.now();
    const randomOffset = (sessionSeed % 100) / 100; // 0-1 range

    // Use only the current session's exclude list (passed from frontend)
    // This ensures we only prevent duplicates within the current session, not across all sessions
    const allExcludeMovies = [...excludeMovies];
    console.log(`Excluding ${excludeMovies.length} titles from current session to prevent duplicates`);

    // Function to fetch movies from backend with retries until we get enough valid ones
    const fetchMoviesUntilValid = async (maxAttempts = 5): Promise<{ movies: any[], backendAvailable: boolean, source: 'backend' | 'fallback' }> => {
      let allMovies: any[] = [];
      let backendWorking = true;
      let attempts = 0;
      
      while (allMovies.length < 10 && attempts < maxAttempts) { // Get up to 10 movies to filter from
        try {
          const response = await fetch(`${API_BASE}/recommend`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              mood,
              yearRange: {
                min: yearRange[0],
                max: yearRange[1]
              },
              actor,
              excludeMovies: [...allExcludeMovies, ...allMovies.map(m => ({ title: m.title, year: m.year }))], // Exclude previously fetched movies too
              isFirstRecommendation: attempts === 0 ? isFirstRecommendation : false,
              sessionSeed: sessionSeed + attempts // Vary seed to get different results
            })
          });

          if (!response.ok) {
            throw new Error(`Backend API failed: ${response.status}`);
          }

          const batchData = await response.json();
          
          // Add new movies, avoiding duplicates
          const newMovies = batchData.movies.filter((newMovie: any) => 
            !allMovies.some(existing => 
              existing.title === newMovie.title && existing.year === newMovie.year
            )
          );
          
          allMovies.push(...newMovies);
          attempts++;
          
          // Small delay between requests to be respectful to the backend
          if (attempts < maxAttempts && allMovies.length < 10) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
        } catch (error) {
          console.log(`Backend attempt ${attempts + 1} failed:`, error);
          backendWorking = false;
          break;
        }
      }
      
      return {
        movies: allMovies,
        backendAvailable: backendWorking,
        source: backendWorking ? 'backend' : 'fallback'
      };
    };

    // Try to get movies from backend with retries
    let data;
    let backendAvailable = true;
    let source: 'backend' | 'fallback' = 'backend';
    
    const fetchResult = await fetchMoviesUntilValid();
    data = { movies: fetchResult.movies };
    backendAvailable = fetchResult.backendAvailable;
    source = fetchResult.source;
    
    // Fallback only if backend is completely unavailable
    if (!backendAvailable) {
      console.log('Backend unavailable, using fallback data');
      source = 'fallback';
      
      // Fallback data when backend is unavailable
      // Use session seed to randomize fallback data
      const fallbackMovies = [
        {
          title: "The Grand Budapest Hotel",
          year: 2014,
          description: "A whimsical comedy about a legendary concierge and his young protégé, featuring stunning visuals and quirky humor that will lift your spirits.",
          rating_out_of_10: 8.1,
          stars: "★★★★☆",
          stream_link: "https://www.netflix.com",
          poster_url: "https://images.unsplash.com/photo-1624138784729-537e99f71d08?w=400&h=600&fit=crop"
        },
        {
          title: "La La Land",
          year: 2016,
          description: "A romantic musical about two artists pursuing their dreams in Los Angeles, filled with beautiful music and heartfelt storytelling.",
          rating_out_of_10: 8.0,
          stars: "★★★★☆",
          stream_link: "https://www.netflix.com",
          poster_url: "https://images.unsplash.com/photo-1624138784729-537e99f71d08?w=400&h=600&fit=crop"
        },
        {
          title: "The Secret Life of Walter Mitty",
          year: 2013,
          description: "An inspiring adventure about a daydreamer who embarks on a real journey, perfect for when you need motivation and wonder.",
          rating_out_of_10: 7.3,
          stars: "★★★☆☆",
          stream_link: "https://www.netflix.com",
          poster_url: "https://images.unsplash.com/photo-1624138784729-537e99f71d08?w=400&h=600&fit=crop"
        }
      ];
      
      // Filter out current session movies from fallback data
      const filteredFallbackMovies = fallbackMovies.filter(movie => {
        return !allExcludeMovies.some(excluded => 
          excluded.title === movie.title && excluded.year === movie.year
        );
      });
      
      // If all fallback movies were filtered out, add some generic ones
      if (filteredFallbackMovies.length === 0) {
        filteredFallbackMovies.push({
          title: "Paddington",
          year: 2014,
          description: "A charming family film about a polite bear who finds himself in London, perfect for uplifting entertainment.",
          rating_out_of_10: 7.8,
          stars: "★★★★☆",
          stream_link: "https://www.netflix.com",
          poster_url: "https://images.unsplash.com/photo-1624138784729-537e99f71d08?w=400&h=600&fit=crop"
        });
      }
      
      // Shuffle fallback data based on session seed for variety
      const shuffledFallback = [...filteredFallbackMovies].sort(() => randomOffset - 0.5);
      data = { movies: shuffledFallback };
    }
    
    // Helper function to check if movie matches actor filter
    const movieMatchesActor = async (movieTitle: string, movieYear: number, requiredActor: string): Promise<boolean> => {
      if (!TMDB_API_KEY || !requiredActor) return true; // Skip validation if no TMDB key or no actor required
      
      try {
        // Get movie details from TMDB to check cast
        const searchResponse = await fetch(
          `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movieTitle)}&year=${movieYear}`
        );
        
        if (!searchResponse.ok) return true; // Skip validation on API error
        
        const searchData = await searchResponse.json();
        if (!searchData.results || searchData.results.length === 0) return true;
        
        const movieId = searchData.results[0].id;
        
        // Get cast information
        const creditsResponse = await fetch(
          `${TMDB_BASE_URL}/movie/${movieId}/credits?api_key=${TMDB_API_KEY}`
        );
        
        if (!creditsResponse.ok) return true; // Skip validation on API error
        
        const creditsData = await creditsResponse.json();
        const cast = creditsData.cast || [];
        
        // Check if required actor is in the cast
        return cast.some((member: any) => 
          member.name && member.name.toLowerCase().includes(requiredActor.toLowerCase())
        );
      } catch (error) {
        console.error('Actor validation error:', error);
        return true; // Skip validation on error
      }
    };

    // Helper function to check if movie matches mood/genre requirements
    const movieMatchesMood = async (movieTitle: string, movieYear: number, mood: string): Promise<boolean> => {
      if (!TMDB_API_KEY) return true; // Skip validation if no TMDB key
      
      try {
        // Get movie details from TMDB to check genres and rating
        const searchResponse = await fetch(
          `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movieTitle)}&year=${movieYear}`
        );
        
        if (!searchResponse.ok) return true; // Skip validation on API error
        
        const searchData = await searchResponse.json();
        if (!searchData.results || searchData.results.length === 0) return true;
        
        const movie = searchData.results[0];
        const movieId = movie.id;
        
        // Get detailed movie information including genres
        const detailsResponse = await fetch(
          `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}`
        );
        
        if (!detailsResponse.ok) return true; // Skip validation on API error
        
        const movieDetails = await detailsResponse.json();
        const genres = movieDetails.genres || [];
        const genreNames = genres.map((g: any) => g.name.toLowerCase());
        const rating = movieDetails.vote_average || 0;
        
        const moodLower = mood.toLowerCase();
        
        // Define quality filters - exclude obviously bad movies
        if (rating < 3.5) return false; // Filter out very low-rated movies (lowered threshold)
        
        // Define genre expectations based on mood keywords - be more lenient
        if (moodLower.includes('romantic') || moodLower.includes('romance')) {
          // Accept romance, drama, or comedy for romantic requests
          return genreNames.includes('romance') || genreNames.includes('drama') || genreNames.includes('comedy');
        }
        
        if (moodLower.includes('comedy') || moodLower.includes('funny') || moodLower.includes('laugh')) {
          // Accept comedy or romance for comedy requests
          return genreNames.includes('comedy') || genreNames.includes('romance');
        }
        
        if (moodLower.includes('scary') || moodLower.includes('horror')) {
          return genreNames.includes('horror') || genreNames.includes('thriller');
        }
        
        if (moodLower.includes('action') || moodLower.includes('adrenaline')) {
          return genreNames.includes('action') || genreNames.includes('adventure') || genreNames.includes('thriller');
        }
        
        if (moodLower.includes('thriller') || moodLower.includes('suspense')) {
          return genreNames.includes('thriller') || genreNames.includes('mystery') || genreNames.includes('crime');
        }
        
        if (moodLower.includes('sci-fi') || moodLower.includes('science fiction')) {
          return genreNames.includes('science fiction') || genreNames.includes('fantasy');
        }
        
        if (moodLower.includes('fantasy')) {
          return genreNames.includes('fantasy') || genreNames.includes('adventure');
        }
        
        if (moodLower.includes('documentary')) {
          return genreNames.includes('documentary');
        }
        
        if (moodLower.includes('drama') || moodLower.includes('emotional')) {
          return genreNames.includes('drama') || genreNames.includes('romance');
        }
        
        // For general moods or unrecognized patterns, be more lenient
        if (rating >= 5.5) return true; // Accept decent movies for general moods (lowered threshold)
        
        return true; // Default to accepting - better to show something than nothing
        
      } catch (error) {
        console.error('Mood validation error:', error);
        return true; // Skip validation on error
      }
    };

    // Transform and filter the data
    const transformedMovies = await Promise.all(
      data.movies.map(async (movie: any) => {
        // Fetch poster URL from TMDB
        const posterUrl = await getTMDBPoster(movie.title, movie.year);
        
        return {
          title: movie.title,
          year: movie.year,
          description: movie.description,
          rating_out_of_10: movie.rating_out_of_10 || 8.5,
          stars: movie.stars || "★★★★☆",
          stream_link: movie.stream_link || "https://www.netflix.com",
          poster_url: posterUrl || 'https://images.unsplash.com/photo-1624138784729-537e99f71d08?w=400&h=600&fit=crop'
        };
      })
    );

    // Filter movies based on provided filters
    const filteredMovies: any[] = [];
    for (const movie of transformedMovies) {
      // Check year range filter
      const yearInRange = movie.year >= yearRange[0] && movie.year <= yearRange[1];
      
      // Check actor filter (if provided)
      const actorMatch = actor ? await movieMatchesActor(movie.title, movie.year, actor) : true;
      
      // Check mood/genre filter
      const moodMatch = await movieMatchesMood(movie.title, movie.year, mood);
      
      if (yearInRange && actorMatch && moodMatch) {
        filteredMovies.push(movie);
      }
    }

    // Since we fetched multiple batches, we should have enough valid movies
    // Take the first 3 that match all criteria
    let finalMovies = filteredMovies.slice(0, 3);
    
    // Progressive fallback to ensure we always return 3 movies
    if (finalMovies.length < 3) {
      console.log(`Only ${finalMovies.length} movies passed all filters, adding fallbacks...`);
      
      // Try year + actor matches (without mood validation)
      const yearActorMatches = [];
      for (const movie of transformedMovies) {
        const yearInRange = movie.year >= yearRange[0] && movie.year <= yearRange[1];
        const actorMatch = actor ? await movieMatchesActor(movie.title, movie.year, actor) : true;
        const notAlreadyIncluded = !finalMovies.some(existing => existing.title === movie.title && existing.year === movie.year);
        
        if (yearInRange && actorMatch && notAlreadyIncluded) {
          yearActorMatches.push(movie);
        }
      }
      
      finalMovies.push(...yearActorMatches.slice(0, 3 - finalMovies.length));
    }
    
    // If still not enough, add any year-range matches
    if (finalMovies.length < 3) {
      console.log(`Still only ${finalMovies.length} movies, adding year-range matches...`);
      
      const yearOnlyMatches = transformedMovies.filter(movie => 
        movie.year >= yearRange[0] && movie.year <= yearRange[1] &&
        !finalMovies.some(existing => existing.title === movie.title && existing.year === movie.year)
      );
      
      finalMovies.push(...yearOnlyMatches.slice(0, 3 - finalMovies.length));
    }
    
    // Final fallback - just take any movies if we're still short
    if (finalMovies.length < 3) {
      console.log(`Still only ${finalMovies.length} movies, adding any available movies...`);
      
      const anyMovies = transformedMovies.filter(movie => 
        !finalMovies.some(existing => existing.title === movie.title && existing.year === movie.year)
      );
      
      finalMovies.push(...anyMovies.slice(0, 3 - finalMovies.length));
    }

    // Log the recommendation results
    await recommendationLogger.logRecommendation(
      mood,
      yearRange as [number, number],
      finalMovies,
      sessionId,
      backendAvailable,
      source
    );

    return NextResponse.json({ 
      movies: finalMovies,
      mood: mood,
      sessionId: sessionId, // Return session ID for frontend tracking
      excludedCount: excludeMovies.length, // Return count of excluded titles from current session
      message: `Excluded ${excludeMovies.length} titles from current session to prevent duplicates. Filtered ${transformedMovies.length - finalMovies.length} movies that didn't match criteria.`
    });

  } catch (error) {
    console.error('Recommendation error:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' }, 
      { status: 500 }
    );
  }
} 