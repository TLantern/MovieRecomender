import { NextRequest, NextResponse } from 'next/server';

interface ShareContent {
  platform: string;
  description: string;
  tags: string;
  mood: string;
  movies: string[];
  username: string;
  image?: string;
}

interface ShareResult {
  success: boolean;
  message?: string;
  shareUrl?: string;
  imageUrl?: string;
  downloadUrl?: string;
}

export async function POST(request: NextRequest) {
  try {
    const shareContent: ShareContent = await request.json();
    const { platform, description, tags, mood, movies, username, image } = shareContent;

    const baseText = `${description}\n\n${tags}\n\nMood: "${mood}"\nMovies: ${movies.join(', ')}\n\nCreated by ${username} on Yscenes`;
    
    let result: ShareResult;

    switch (platform.toLowerCase()) {
      case 'twitter':
      case 'x':
        result = await generateTwitterShare(baseText, image);
        break;
      case 'instagram':
        result = await generateInstagramShare(baseText, image);
        break;
      case 'tiktok':
        result = await generateTikTokShare(baseText, image);
        break;
      default:
        return NextResponse.json({ 
          error: 'Unsupported platform. Supported platforms: twitter, instagram, tiktok' 
        }, { status: 400 });
    }

    if (!result.success) {
      return NextResponse.json({
        error: result.message || `Failed to generate share for ${platform}`
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      platform,
      message: `Successfully generated share for ${platform}`,
      shareUrl: result.shareUrl,
      imageUrl: result.imageUrl,
      downloadUrl: result.downloadUrl
    });

  } catch (error) {
    console.error('Error generating share:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ 
      error: `Failed to generate share: ${errorMessage}`
    }, { status: 500 });
  }
}

async function generateTwitterShare(content: string, image?: string): Promise<ShareResult> {
  try {
    const truncatedContent = content.length > 280 ? content.substring(0, 277) + '...' : content;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(truncatedContent)}`;
    
    let imageUrl: string | undefined;
    if (image) {
      imageUrl = await generateShareableImage(content, 'twitter');
    }
    
    return {
      success: true,
      shareUrl,
      imageUrl
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

async function generateInstagramShare(content: string, image?: string): Promise<ShareResult> {
  try {
    const imageUrl = await generateShareableImage(content, 'instagram');
    const shareUrl = 'https://www.instagram.com/';
    
    return {
      success: true,
      shareUrl,
      imageUrl,
      downloadUrl: imageUrl
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

async function generateTikTokShare(content: string, image?: string): Promise<ShareResult> {
  try {
    const imageUrl = await generateShareableImage(content, 'tiktok');
    const shareUrl = 'https://www.tiktok.com/';
    
    return {
      success: true,
      shareUrl,
      imageUrl,
      downloadUrl: imageUrl
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

async function generateShareableImage(content: string, platform: string): Promise<string> {
  try {
    // Canvas package not available in this environment
    // Return a placeholder or throw an error
    throw new Error('Image generation not available in this environment');
  } catch (error) {
    console.error('Error generating shareable image:', error);
    throw new Error('Failed to generate shareable image');
  }
}
