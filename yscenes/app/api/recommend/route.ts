import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.API_BASE_URL || "http://localhost:8000";
const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

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
    const { mood, yearRange, excludeMovies = [], isFirstRecommendation = false } = await request.json();

    if (!mood) {
      return NextResponse.json({ error: 'Mood is required' }, { status: 400 });
    }

    if (!yearRange || !Array.isArray(yearRange) || yearRange.length !== 2) {
      return NextResponse.json({ error: 'Year range is required and must be an array of 2 numbers' }, { status: 400 });
    }

    // Try to call the FastAPI backend first
    let data;
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
          excludeMovies,
          isFirstRecommendation
        })
      });

      if (!response.ok) {
        throw new Error(`Backend API failed: ${response.status}`);
      }

      data = await response.json();
    } catch (backendError) {
      console.log('Backend unavailable, using fallback data:', backendError);
      
      // Fallback data when backend is unavailable
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
      
      data = { movies: fallbackMovies };
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

    return NextResponse.json({ 
      movies: transformedMovies,
      mood: mood 
    });

  } catch (error) {
    console.error('Recommendation error:', error);
    return NextResponse.json(
      { error: 'Failed to get recommendations' }, 
      { status: 500 }
    );
  }
} 