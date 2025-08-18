import { NextResponse } from 'next/server';
import { getGenreNames } from '../../../utils/genres';

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

export async function GET() {
  try {
    if (!TMDB_API_KEY) {
      return NextResponse.json(
        { error: 'TMDb API key not configured' },
        { status: 500 }
      );
    }

    // Fetch trending movies from TMDb
    const response = await fetch(
      `${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}&language=en-US&page=1`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`TMDb API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Transform the data to match our carousel interface
    const movies = data.results.slice(0, 10).map((movie: any) => ({
      id: movie.id.toString(),
      title: movie.title,
      image: movie.poster_path 
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : 'https://images.unsplash.com/photo-1624138784729-537e99f71d08?w=400&h=600&fit=crop',
      rating: Math.round(movie.vote_average * 10) / 10,
      year: movie.release_date ? new Date(movie.release_date).getFullYear() : null,
      genre: movie.genre_ids ? getGenreNames(movie.genre_ids) : '',
      overview: movie.overview || '',
      backdrop: movie.backdrop_path 
        ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
        : null,
    }));

    return NextResponse.json({ movies });
  } catch (error) {
    console.error('Error fetching movies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch movies' },
      { status: 500 }
    );
  }
} 