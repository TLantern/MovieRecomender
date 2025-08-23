import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.API_BASE_URL || "https://movierecomender.onrender.com";

export async function POST(request: NextRequest) {
  try {
    const { mood, yearRange } = await request.json();

    if (!mood) {
      return NextResponse.json({ error: 'Mood is required' }, { status: 400 });
    }

    if (!yearRange || !Array.isArray(yearRange) || yearRange.length !== 2) {
      return NextResponse.json({ error: 'Year range is required and must be an array of 2 numbers' }, { status: 400 });
    }

    // Call the FastAPI backend
    const response = await fetch(`${API_BASE}/recommend`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        mood,
        yearRange: {
          min: yearRange[0],
          max: yearRange[1]
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${errorText}`);
    }

    const data = await response.json();
    
    // Transform the data to match our frontend expectations
    const transformedMovies = data.movies.map((movie: any) => ({
      title: movie.title,
      year: movie.year,
      description: movie.description,
      rating_out_of_10: 8.5, // Default rating since main.py doesn't provide this
      stars: "★★★★☆", // Default stars
      stream_link: "https://www.netflix.com" // Default streaming link
    }));

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