import { NextRequest, NextResponse } from 'next/server';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

// Helper function to search for movie by title and year
async function searchMovie(title: string, year: number): Promise<any | null> {
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
      return results[0]; // Return the first (most relevant) result
    }
    
    return null;
  } catch (error) {
    console.error('TMDB movie search error:', error);
    return null;
  }
}

// Helper function to get watch providers for a movie
async function getWatchProviders(movieId: number): Promise<any> {
  if (!TMDB_API_KEY) return {};
  
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${movieId}/watch/providers?api_key=${TMDB_API_KEY}`,
      {
        headers: { 'Accept': 'application/json' },
      }
    );
    
    if (!response.ok) return {};
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('TMDB watch providers error:', error);
    return {};
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, year } = await request.json();

    if (!title || !year) {
      return NextResponse.json({ error: 'Title and year are required' }, { status: 400 });
    }

    // First, search for the movie to get its TMDB ID
    const movie = await searchMovie(title, year);
    
    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 });
    }

    // Then, get the watch providers for this movie
    const watchProviders = await getWatchProviders(movie.id);

    // Get detailed movie information
    const movieDetailsResponse = await fetch(
      `${TMDB_BASE_URL}/movie/${movie.id}?api_key=${TMDB_API_KEY}`,
      {
        headers: { 'Accept': 'application/json' },
      }
    );
    
    let detailedMovie = movie;
    if (movieDetailsResponse.ok) {
      detailedMovie = await movieDetailsResponse.json();
    }

    return NextResponse.json({
      movie: {
        id: detailedMovie.id,
        title: detailedMovie.title,
        year: detailedMovie.release_date ? new Date(detailedMovie.release_date).getFullYear() : year,
        poster_path: detailedMovie.poster_path,
        overview: detailedMovie.overview,
        vote_average: detailedMovie.vote_average,
        runtime: detailedMovie.runtime,
        genres: detailedMovie.genres,
        tagline: detailedMovie.tagline,
      },
      watchProviders: watchProviders.results || {}
    });

  } catch (error) {
    console.error('Watch providers API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watch providers' }, 
      { status: 500 }
    );
  }
}
