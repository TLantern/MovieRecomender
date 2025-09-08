import { NextRequest, NextResponse } from 'next/server';
import { recommendationLogger } from '../../../utils/logger';

const API_BASE = process.env.API_BASE_URL || "https://movierecomender.onrender.com";
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// In-memory cache for TMDB data with TTL
const tmdbCache = new Map<string, { data: any; expiry: number }>();
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

function getCacheKey(title: string, year: number): string {
  return `${title.toLowerCase().replace(/[^a-z0-9]/g, '')}_${year}`;
}

function getCachedData<T>(key: string): T | null {
  const cached = tmdbCache.get(key);
  if (cached && Date.now() < cached.expiry) {
    return cached.data as T;
  }
  if (cached) {
    tmdbCache.delete(key); // Remove expired data
  }
  return null;
}

function setCachedData<T>(key: string, data: T): void {
  tmdbCache.set(key, {
    data,
    expiry: Date.now() + CACHE_DURATION
  });
}

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

// Enhanced function to fetch all TMDB data in one call with caching
async function getTMDBData(title: string, year: number): Promise<{
  posterUrl: string | null;
  movieData: any | null;
  cast: any[] | null;
  genres: any[] | null;
  rating: number | null;
}> {
  if (!TMDB_API_KEY) return { posterUrl: null, movieData: null, cast: null, genres: null, rating: null };
  
  const cacheKey = getCacheKey(title, year);
  
  // Check cache first
  const cachedResult = getCachedData<{
    posterUrl: string | null;
    movieData: any | null;
    cast: any[] | null;
    genres: any[] | null;
    rating: number | null;
  }>(cacheKey);
  
  if (cachedResult) {
    return cachedResult;
  }
  
  try {
    // Single search call to get movie ID
    const searchResponse = await fetch(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&year=${year}`,
      {
        headers: { 'Accept': 'application/json' },
      }
    );
    
    if (!searchResponse.ok) {
      const result = { posterUrl: null, movieData: null, cast: null, genres: null, rating: null };
      setCachedData(cacheKey, result); // Cache negative results too
      return result;
    }
    
    const searchData = await searchResponse.json();
    const results = searchData.results;
    
    if (!results || results.length === 0) {
      const result = { posterUrl: null, movieData: null, cast: null, genres: null, rating: null };
      setCachedData(cacheKey, result);
      return result;
    }
    
    const movie = results[0];
    const movieId = movie.id;
    const posterUrl = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null;
    
    // Parallel fetch for detailed data and credits
    const [detailsResponse, creditsResponse] = await Promise.all([
      fetch(`${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}`),
      fetch(`${TMDB_BASE_URL}/movie/${movieId}/credits?api_key=${TMDB_API_KEY}`)
    ]);
    
    const [movieDetails, creditsData] = await Promise.all([
      detailsResponse.ok ? detailsResponse.json() : null,
      creditsResponse.ok ? creditsResponse.json() : null
    ]);
    
    const result = {
      posterUrl,
      movieData: movieDetails,
      cast: creditsData?.cast || null,
      genres: movieDetails?.genres || null,
      rating: movieDetails?.vote_average || null
    };
    
    // Cache the result
    setCachedData(cacheKey, result);
    
    return result;
  } catch (error) {
    console.error('TMDB data fetch error:', error);
    const result = { posterUrl: null, movieData: null, cast: null, genres: null, rating: null };
    setCachedData(cacheKey, result); // Cache errors to prevent retries
    return result;
  }
}

export async function POST(request: NextRequest) {
  // Add overall timeout to prevent requests from taking too long
  const controller = new AbortController();
  const overallTimeout = setTimeout(() => {
    controller.abort();
  }, 30000); // 30 second max for entire request
  
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

    // Aggressive single-call backend fetch with timeout
    const fetchMoviesUntilValid = async (): Promise<{ movies: any[], backendAvailable: boolean, source: 'backend' | 'fallback' }> => {
      try {
        // Single backend call with aggressive timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
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
            excludeMovies: allExcludeMovies,
            isFirstRecommendation,
            sessionSeed
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Backend API failed: ${response.status}`);
        }

        const batchData = await response.json();
        
        return {
          movies: batchData.movies || [],
          backendAvailable: true,
          source: 'backend'
        };
        
      } catch (error: any) {
        console.log(`Backend took >30 seconds (timeout), switching to instant fallback for better UX:`, error?.name || 'Unknown error');
        return {
          movies: [],
          backendAvailable: false,
          source: 'fallback'
        };
      }
    };

    // Try to get movies from backend with retries
    let data;
    let backendAvailable = true;
    let source: 'backend' | 'fallback' = 'backend';
    
    const fetchResult = await fetchMoviesUntilValid();
    data = { movies: fetchResult.movies };
    backendAvailable = fetchResult.backendAvailable;
    source = fetchResult.source;
    
    // Instant fallback when backend is unavailable
    if (!backendAvailable) {
      console.log('Backend unavailable, using instant fallback');
      source = 'fallback';
      
      // Return instant fallback movies from around 2000 (always 3 movies)
      const fastFallback = [
        {
          title: "Gladiator",
          year: 2000,
          description: "A former Roman general seeks revenge against the corrupt emperor who murdered his family.",
          rating_out_of_10: 8.5,
          stars: "★★★★☆",
          stream_link: "https://www.netflix.com",
          poster_url: "https://images.unsplash.com/photo-1624138784729-537e99f71d08?w=400&h=600&fit=crop"
        },
        {
          title: "Almost Famous", 
          year: 2000,
          description: "A teenager writes for Rolling Stone magazine while touring with an up-and-coming rock band.",
          rating_out_of_10: 7.9,
          stars: "★★★★☆",
          stream_link: "https://www.netflix.com",
          poster_url: "https://images.unsplash.com/photo-1624138784729-537e99f71d08?w=400&h=600&fit=crop"
        },
        {
          title: "Cast Away",
          year: 2000,
          description: "A FedEx executive becomes stranded on a deserted island after his plane crashes in the South Pacific.",
          rating_out_of_10: 7.8,
          stars: "★★★★☆",
          stream_link: "https://www.netflix.com",
          poster_url: "https://images.unsplash.com/photo-1624138784729-537e99f71d08?w=400&h=600&fit=crop"
        }
      ];
      
      data = { movies: fastFallback };
    }
    
    // Helper function to check if movie matches actor filter using pre-fetched data
    const movieMatchesActor = (cast: any[] | null, requiredActor: string): boolean => {
      if (!requiredActor || !cast) return true;
      
      return cast.some((member: any) => 
        member.name && member.name.toLowerCase().includes(requiredActor.toLowerCase())
      );
    };

    // Helper function to check if movie matches mood/genre requirements using pre-fetched data
    const movieMatchesMood = (genres: any[] | null, rating: number | null, mood: string): boolean => {
      if (!genres || !rating) return true;
      
      const genreNames = genres.map((g: any) => g.name.toLowerCase());
      const moodLower = mood.toLowerCase();
      
      // Define quality filters - exclude obviously bad movies
      if (rating < 3.5) return false; // Filter out very low-rated movies
      
      // Define genre expectations based on mood keywords - be more lenient
      if (moodLower.includes('romantic') || moodLower.includes('romance')) {
        return genreNames.includes('romance') || genreNames.includes('drama') || genreNames.includes('comedy');
      }
      
      if (moodLower.includes('comedy') || moodLower.includes('funny') || moodLower.includes('laugh')) {
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
      if (rating >= 5.5) return true; // Accept decent movies for general moods
      
      return true; // Default to accepting
    };

    // Only enrich first 9 movies to save time - we need 3 final results
    const moviesToProcess = data.movies.slice(0, 9);
    const processedCount = moviesToProcess.length;
    
    // Parallel transform with timeout for TMDB calls
    const enrichedMovies = await Promise.all(
      moviesToProcess.map(async (movie: any) => {
        try {
          // Add timeout to TMDB calls
          const tmdbPromise = getTMDBData(movie.title, movie.year);
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('TMDB timeout')), 8000) // 8 second timeout
          );
          
          const tmdbData = await Promise.race([tmdbPromise, timeoutPromise]) as any;
          
          return {
            ...movie,
            poster_url: tmdbData.posterUrl || 'https://images.unsplash.com/photo-1624138784729-537e99f71d08?w=400&h=600&fit=crop',
            rating_out_of_10: movie.rating_out_of_10 || 8.5,
            stars: movie.stars || "★★★★☆",
            stream_link: movie.stream_link || "https://www.netflix.com",
            // Include TMDB data for filtering
            _tmdb: tmdbData
          };
        } catch (error) {
          console.log(`TMDB enrichment failed for ${movie.title}, using fallback`);
          // Return movie with fallback data if TMDB fails
          return {
            ...movie,
            poster_url: 'https://images.unsplash.com/photo-1624138784729-537e99f71d08?w=400&h=600&fit=crop',
            rating_out_of_10: movie.rating_out_of_10 || 8.5,
            stars: movie.stars || "★★★★☆",
            stream_link: movie.stream_link || "https://www.netflix.com",
            _tmdb: { posterUrl: null, movieData: null, cast: null, genres: null, rating: null }
          };
        }
      })
    );

    // Simplified filtering - prioritize speed over perfect accuracy
    const filteredMovies: any[] = [];
    for (const movie of enrichedMovies) {
      // Basic year range filter (always fast)
      const yearInRange = movie.year >= yearRange[0] && movie.year <= yearRange[1];
      
      // Skip expensive actor/mood validation if TMDB data is missing
      if (!movie._tmdb.cast && !movie._tmdb.genres) {
        if (yearInRange) {
          const { _tmdb, ...movieData } = movie;
          filteredMovies.push(movieData);
        }
        continue;
      }
      
      // Quick actor check only if cast data exists
      const actorMatch = actor && movie._tmdb.cast 
        ? movieMatchesActor(movie._tmdb.cast, actor) 
        : true;
      
      // Quick mood check - be very lenient to prioritize speed
      const moodMatch = movie._tmdb.genres 
        ? movieMatchesMood(movie._tmdb.genres, movie._tmdb.rating, mood)
        : true; // Accept movies without genre data
      
      if (yearInRange && actorMatch && moodMatch) {
        const { _tmdb, ...movieData } = movie;
        filteredMovies.push(movieData);
        
        // Early exit once we have 3 movies to save time
        if (filteredMovies.length >= 3) {
          break;
        }
      }
    }

    // Since we fetched multiple batches, we should have enough valid movies
    // Take the first 3 that match all criteria
    let finalMovies = filteredMovies.slice(0, 3);
    
    // Fast fallback - just take any available movies to reach exactly 3
    if (finalMovies.length < 3) {
      console.log(`Only ${finalMovies.length} movies passed filters, padding with available movies to reach 3...`);
      
      const remainingMovies = enrichedMovies
        .filter(movie => 
          !finalMovies.some(existing => existing.title === movie.title && existing.year === movie.year)
        )
        .map(movie => {
          const { _tmdb, ...movieData } = movie;
          return movieData;
        })
        .slice(0, 3 - finalMovies.length);
      
      finalMovies.push(...remainingMovies);
      
      // If we still don't have 3 movies, use additional fallback movies
      if (finalMovies.length < 3) {
        const additionalFallback = [
          {
            title: "The Shawshank Redemption",
            year: 1994,
            description: "Two imprisoned men bond over years, finding solace and eventual redemption through acts of common decency.",
            rating_out_of_10: 9.3,
            stars: "★★★★★",
            stream_link: "https://www.netflix.com",
            poster_url: "https://images.unsplash.com/photo-1624138784729-537e99f71d08?w=400&h=600&fit=crop"
          },
          {
            title: "Pulp Fiction",
            year: 1994,
            description: "The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.",
            rating_out_of_10: 8.9,
            stars: "★★★★★",
            stream_link: "https://www.netflix.com",
            poster_url: "https://images.unsplash.com/photo-1624138784729-537e99f71d08?w=400&h=600&fit=crop"
          },
          {
            title: "Forrest Gump",
            year: 1994,
            description: "The presidencies of Kennedy and Johnson through the eyes of an Alabama man with an IQ of 75.",
            rating_out_of_10: 8.8,
            stars: "★★★★★",
            stream_link: "https://www.netflix.com",
            poster_url: "https://images.unsplash.com/photo-1624138784729-537e99f71d08?w=400&h=600&fit=crop"
          }
        ];
        
        const neededCount = 3 - finalMovies.length;
        finalMovies.push(...additionalFallback.slice(0, neededCount));
      }
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

    // Clear the timeout since we're done
    clearTimeout(overallTimeout);
    
    return NextResponse.json({ 
      movies: finalMovies,
      mood: mood,
      sessionId: sessionId, // Return session ID for frontend tracking
      excludedCount: excludeMovies.length, // Return count of excluded titles from current session
      message: `Excluded ${excludeMovies.length} titles from current session to prevent duplicates. Processed ${processedCount} movies, returned ${finalMovies.length}.`
    });

  } catch (error: any) {
    clearTimeout(overallTimeout);
    
    if (error?.name === 'AbortError') {
      console.error('Request timed out after 30 seconds');
      return NextResponse.json(
        { error: 'Request timed out. Please try again.' }, 
        { status: 408 }
      );
    }
    
    console.error('Recommendation error:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' }, 
      { status: 500 }
    );
  }
} 