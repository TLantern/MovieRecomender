import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createServerSupabaseClient } from '../../../lib/supabase';

interface BookmarkData {
  movieId: string;
  title: string;
  year: number;
  poster_url: string;
  rating_out_of_10?: number;
  description?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: BookmarkData = await request.json();
    if (!body.movieId || !body.title || !body.year) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient();

    // Check if bookmark already exists
    const { data: existingBookmark, error: checkError } = await supabase
      .from('user_bookmarks')
      .select('*')
      .eq('user_id', userId)
      .eq('movie_id', body.movieId)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking existing bookmark:', checkError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (existingBookmark) {
      // Remove existing bookmark
      const { error: deleteError } = await supabase
        .from('user_bookmarks')
        .delete()
        .eq('user_id', userId)
        .eq('movie_id', body.movieId);

      if (deleteError) {
        console.error('Error deleting bookmark:', deleteError);
        return NextResponse.json({ error: 'Failed to remove bookmark' }, { status: 500 });
      }

      return NextResponse.json({ 
        message: 'Bookmark removed', 
        bookmarked: false 
      });
    } else {
      // Add new bookmark
      const { error: insertError } = await supabase
        .from('user_bookmarks')
        .insert({
          user_id: userId,
          movie_id: body.movieId,
          title: body.title,
          year: body.year,
          poster_url: body.poster_url,
          rating_out_of_10: body.rating_out_of_10,
          description: body.description
        });

      if (insertError) {
        console.error('Error inserting bookmark:', insertError);
        return NextResponse.json({ error: 'Failed to add bookmark' }, { status: 500 });
      }

      return NextResponse.json({ 
        message: 'Bookmark added', 
        bookmarked: true 
      });
    }
  } catch (error) {
    console.error('Bookmark API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createServerSupabaseClient();

    // Fetch user's bookmarks from Supabase
    const { data: bookmarks, error } = await supabase
      .from('user_bookmarks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching bookmarks:', error);
      return NextResponse.json({ error: 'Failed to fetch bookmarks' }, { status: 500 });
    }

    return NextResponse.json({ bookmarks: bookmarks || [] });
  } catch (error) {
    console.error('Get bookmarks API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 