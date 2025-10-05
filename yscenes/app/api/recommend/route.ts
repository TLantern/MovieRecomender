import { NextRequest, NextResponse } from 'next/server';
import { recommendationLogger } from '../../../utils/logger';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
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
  }
}

// Function to get movie recommendations from OpenAI
async function getMovieRecommendationsFromOpenAI(
  mood: string,
  yearRange: [number, number],
  actor: string | null,
  excludeMovies: any[],
  isFirstRecommendation: boolean,
  sessionSeed: number
): Promise<any[]> {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  // Build exclusion list for the prompt
  let excludeText = "";
  if (excludeMovies.length > 0) {
    excludeText = `\n\nDO NOT recommend these movies (they were already suggested):\n`;
    for (const movie of excludeMovies) {
      excludeText += `- ${movie.title || 'Unknown'} (${movie.year || 'Unknown'})\n`;
    }
  }

  // Add session-specific randomization to the prompt
  const randomAdjectives = [
    "underrated", "overlooked", "cult classic", "indie gem", 
    "foreign masterpiece", "arthouse", "experimental", "avant-garde",
    "hidden treasure", "sleeper hit", "undiscovered gem", "cult favorite"
  ];
  
  // Use session seed for consistent randomization
  const adjIndex = sessionSeed % randomAdjectives.length;
  const randomAdjective = randomAdjectives[adjIndex];

  let prompt;
  if (isFirstRecommendation) {
    // Enhanced system prompt for first recommendation
    prompt = `You are an expert movie curator with deep knowledge of cinema across all eras and genres. Your mission: recommend exactly 3 movies that perfectly match the user's specific mood and preferences.

USER REQUEST: "${mood}"
YEAR RANGE: ${yearRange[0]}-${yearRange[1]}
ACTOR PREFERENCE: ${actor || 'None specified'}

REQUIREMENTS:
• Movies MUST be from ${yearRange[0]}-${yearRange[1]}
• If actor specified, ALL movies must feature that actor prominently
• Match the mood/genre perfectly - be precise about emotional tone
• Include a mix: 1 popular/acclaimed film + 2 hidden gems or cult favorites
• Avoid generic blockbusters unless they truly fit the mood
• Descriptions should be vivid and capture why it matches their mood

CRITICAL: DO NOT recommend these already-suggested movies:${excludeText}

Return ONLY valid JSON in this exact format:
{ "movies": [
  { "title": "Movie Title", "year": YYYY, "description": "Compelling 1-2 sentence description explaining why this perfectly matches their mood" },
  { "title": "Movie Title", "year": YYYY, "description": "Compelling 1-2 sentence description explaining why this perfectly matches their mood" },
  { "title": "Movie Title", "year": YYYY, "description": "Compelling 1-2 sentence description explaining why this perfectly matches their mood" }
] }`;
  } else {
    // Enhanced prompt for additional recommendations
    prompt = `You are a cinema expert specializing in discovering ${randomAdjective} films. The user wants MORE movies that match their mood, so focus on deeper cuts and hidden gems.

USER REQUEST: "${mood}"
YEAR RANGE: ${yearRange[0]}-${yearRange[1]}
ACTOR PREFERENCE: ${actor || 'None specified'}

REQUIREMENTS:
• Movies MUST be from ${yearRange[0]}-${yearRange[1]}
• If actor specified, ALL movies must feature that actor
• Focus on lesser-known films, international cinema, or cult classics
• Avoid mainstream hits - they want discoveries
• Each description should highlight what makes it special

CRITICAL: DO NOT recommend these already-suggested movies:${excludeText}

Return ONLY valid JSON in this exact format:
{ "movies": [
  { "title": "Movie Title", "year": YYYY, "description": "Why this hidden gem perfectly captures their mood" },
  { "title": "Movie Title", "year": YYYY, "description": "Why this hidden gem perfectly captures their mood" },
  { "title": "Movie Title", "year": YYYY, "description": "Why this hidden gem perfectly captures their mood" }
] }`;
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 1000
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No content received from OpenAI');
  }

  try {
    const parsed = JSON.parse(content);
    return parsed.movies || [];
  } catch (error) {
    console.error('Failed to parse OpenAI response:', content);
    throw new Error('Invalid JSON response from OpenAI');
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

    // Get movie recommendations directly from OpenAI
    let movies: any[] = [];
    let source: 'openai' | 'fallback' = 'openai';
    
    try {
      movies = await getMovieRecommendationsFromOpenAI(
        mood,
        yearRange as [number, number],
        actor,
        allExcludeMovies,
        isFirstRecommendation,
        sessionSeed
      );
      console.log(`Got ${movies.length} movies from OpenAI`);
    } catch (error: any) {
      console.error('OpenAI API failed:', error.message);
      source = 'fallback';
      
      // Fallback to diversified hardcoded movies with randomization
      const fallbackMovies = [
        {
          title: "The Shawshank Redemption",
          year: 1994,
          description: "Two imprisoned men bond over years, finding solace and eventual redemption through acts of common decency."
        },
        {
          title: "Pulp Fiction",
          year: 1994,
          description: "The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption."
        },
        {
          title: "Forrest Gump",
          year: 1994,
          description: "The presidencies of Kennedy and Johnson through the eyes of an Alabama man with an IQ of 75."
        },
        {
          title: "Goodfellas",
          year: 1990,
          description: "The story of Henry Hill and his life in the mob, covering his relationship with his wife Karen Hill and his mob partners."
        },
        {
          title: "The Matrix",
          year: 1999,
          description: "A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers."
        },
        {
          title: "Fight Club",
          year: 1999,
          description: "An insomniac office worker and a devil-may-care soapmaker form an underground fight club."
        },
        {
          title: "The Dark Knight",
          year: 2008,
          description: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests."
        },
        {
          title: "Inception",
          year: 2010,
          description: "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea."
        }
      ];
      
      // Use session seed for consistent randomization
      const shuffled = [...fallbackMovies];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = (sessionSeed + i) % (i + 1);
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      movies = shuffled.slice(0, 3);
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

    // Only enrich first 3 movies to save time
    const moviesToProcess = movies.slice(0, 3);
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
      source === 'openai',
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