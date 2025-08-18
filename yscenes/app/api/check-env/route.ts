import { NextResponse } from 'next/server';

export async function GET() {
  const hasApiKey = !!process.env.TMDB_API_KEY;
  
  return NextResponse.json({
    hasApiKey,
    apiKeyConfigured: hasApiKey ? 'Yes' : 'No',
    message: hasApiKey 
      ? 'TMDb API key is configured correctly' 
      : 'TMDb API key is missing. Please add TMDB_API_KEY to your .env.local file'
  });
} 