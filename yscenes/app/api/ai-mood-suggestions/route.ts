import { NextRequest, NextResponse } from 'next/server';

// Simple cache for AI mood suggestions
let cachedSuggestions: string[] | null = null;
let cacheExpiry = 0;
const CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

export async function POST(request: NextRequest) {
  try {
    // Check cache first
    if (cachedSuggestions && Date.now() < cacheExpiry) {
      return NextResponse.json({ suggestions: cachedSuggestions });
    }

    // Check if OpenAI API key is available
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const prompt = `Generate a diverse list of 15-20 unique movie-watching moods. Each mood should be short (1 sentence or phrase), emotionally evocative, and specific enough to guide a recommendation engine. The tone should feel conversational and human, not like categories or genres. Make them creative, varied, and cover different emotions, genres, and situations. Examples: 'Something scary but still heartwarming,' 'Feeling nostalgic for the 90s,' 'Want to laugh until I cry,' 'In the mood for a mind-bending thriller,' 'Something romantic but not cheesy,' 'Need an epic adventure to escape reality,' 'Feeling philosophical and deep,' 'Want to be inspired and motivated.' IMPORTANT: Do NOT use any dashes, hyphens, or minus signs in your responses. Use only commas, periods, and regular words. Make each suggestion unique and specific.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_completion_tokens: 4096,
        temperature: 1
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error details:', errorData);
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response structure from OpenAI');
    }
    
    const content = data.choices[0].message.content;
    
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    // Parse the response to extract the mood suggestions
    // The AI should return a list, so we'll try to parse it
    const suggestions = content
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0)
      .map((line: string) => {
        // Remove numbering, quotes, and extra formatting
        return line.replace(/^\d+\.\s*/, '').replace(/^["']|["']$/g, '').trim();
      })
      .filter((line: string) => line.length > 0)
      .filter((line: string) => !line.includes('-') && !line.includes('–') && !line.includes('—')); // Remove any suggestions with dashes

    // Cache the successful result
    cachedSuggestions = suggestions;
    cacheExpiry = Date.now() + CACHE_DURATION;

    return NextResponse.json({ suggestions });
    
  } catch (error) {
    console.error('Error generating AI mood suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate mood suggestions' },
      { status: 500 }
    );
  }
}
