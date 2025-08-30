import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { examples } = await request.json();
    
    // Check if OpenAI API key is available
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const prompt = `Generate a list of unique movie-watching moods. Each mood should be short (1 sentence or phrase), emotionally evocative, and specific enough to guide a recommendation engine. The tone should feel conversational and human, not like categories or genres. Examples: 'Something scary but still heartwarming,' 'Feeling nostalgic for the 90s,' 'Want to laugh until I cry,' 'In the mood for a mind-bending thriller,' 'Something romantic but not cheesy,' 'Need an epic adventure to escape reality,' 'Feeling philosophical and deep,' 'Want to be inspired and motivated.', dont use - in answers`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
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
      .filter((line: string) => line.length > 0);

    return NextResponse.json({ suggestions });
    
  } catch (error) {
    console.error('Error generating AI mood suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate mood suggestions' },
      { status: 500 }
    );
  }
}
