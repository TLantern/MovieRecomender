import { NextRequest, NextResponse } from 'next/server';
import { recommendationLogger } from '../../../utils/logger';

const API_BASE = process.env.API_BASE_URL || "http://localhost:8000";
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

    // Get previously recommended titles to exclude them and prevent duplicates
    let previouslyRecommendedTitles: string[] = [];
    try {
      const excludeResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/logs?action=exclude-titles`);
      if (excludeResponse.ok) {
        const excludeData = await excludeResponse.json();
        previouslyRecommendedTitles = excludeData.excludeTitles || [];
        console.log(`Excluding ${previouslyRecommendedTitles.length} previously recommended titles to prevent duplicates`);
      }
    } catch (error) {
      console.warn('Could not fetch previously recommended titles for exclusion:', error);
    }

    // Combine user-provided exclusions with previously recommended titles
    const allExcludeMovies = [...excludeMovies];
    
    // Add previously recommended titles to exclusion list
    previouslyRecommendedTitles.forEach(titleWithYear => {
      // Extract title and year from "Title (Year)" format
      const match = titleWithYear.match(/^(.+?)\s*\((\d{4})\)$/);
      if (match) {
        const [, title, year] = match;
        allExcludeMovies.push({
          title: title.trim(),
          year: parseInt(year)
        });
      }
    });

    // Try to call the FastAPI backend first
    let data;
    let backendAvailable = true;
    let source: 'backend' | 'fallback' = 'backend';
    
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
          excludeMovies: allExcludeMovies, // Use the enhanced exclusion list
          isFirstRecommendation,
          sessionSeed: sessionSeed // Pass session seed to backend for consistent randomization
        })
      });

      if (!response.ok) {
        throw new Error(`Backend API failed: ${response.status}`);
      }

      data = await response.json();
    } catch (backendError) {
      console.log('Backend unavailable, using fallback data:', backendError);
      backendAvailable = false;
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
      
      // Filter out previously recommended movies from fallback data
      const filteredFallbackMovies = fallbackMovies.filter(movie => {
        const titleKey = `${movie.title} (${movie.year})`;
        return !previouslyRecommendedTitles.includes(titleKey);
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
    
    // Transform the data and enrich with TMDB posters
    const transformedMovies = await Promise.all(
      data.movies.map(async (movie: any) => {
        // Fetch poster URL from TMDB
        const posterUrl = await getTMDBPoster(movie.title, movie.year);
        
        return {
          title: movie.title,
          year: movie.year,
          description: movie.description,
          rating_out_of_10: movie.rating_out_of_10 || 8.5, // Use backend rating if available, fallback to default
          stars: movie.stars || "★★★★☆", // Use backend stars if available, fallback to default
          stream_link: movie.stream_link || "https://www.netflix.com", // Use backend stream link if available, fallback to default
          poster_url: posterUrl || 'https://images.unsplash.com/photo-1624138784729-537e99f71d08?w=400&h=600&fit=crop' // TMDB poster URL or fallback image
        };
      })
    );

    // Log the recommendation results
    await recommendationLogger.logRecommendation(
      mood,
      yearRange as [number, number],
      transformedMovies,
      sessionId,
      backendAvailable,
      source
    );

    return NextResponse.json({ 
      movies: transformedMovies,
      mood: mood,
      sessionId: sessionId, // Return session ID for frontend tracking
      excludedCount: previouslyRecommendedTitles.length, // Return count of excluded titles
      message: `Excluded ${previouslyRecommendedTitles.length} previously recommended titles to prevent duplicates`
    });

  } catch (error) {
    console.error('Recommendation error:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' }, 
      { status: 500 }
    );
  }
} 