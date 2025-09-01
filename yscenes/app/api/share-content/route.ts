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
    const { createCanvas } = require('canvas');
    
    let width = 1200;
    let height = 630;
    
    if (platform === 'instagram') {
      width = 1080;
      height = 1080;
    } else if (platform === 'tiktok') {
      width = 1080;
      height = 1920;
    }
    
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);
    
    // Gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;
    
    // Brand
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Yscenes', width / 2, 80);
    
    // Content
    ctx.font = '24px Arial';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    
    const words = content.split(' ');
    let line = '';
    let y = 150;
    
    for (const word of words) {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > width - 100 && line !== '') {
        ctx.fillText(line, 50, y);
        line = word + ' ';
        y += 35;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 50, y);
    
    // Platform
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Share on ${platform.charAt(0).toUpperCase() + platform.slice(1)}`, width / 2, height - 50);
    
    const buffer = canvas.toBuffer('image/png');
    const fs = require('fs');
    const path = require('path');
    
    const publicDir = path.join(process.cwd(), 'public', 'shares');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    const filename = `share-${platform}-${Date.now()}.png`;
    const filepath = path.join(publicDir, filename);
    
    fs.writeFileSync(filepath, buffer);
    
    return `/shares/${filename}`;
    
  } catch (error) {
    console.error('Error generating shareable image:', error);
    throw new Error('Failed to generate shareable image');
  }
}
