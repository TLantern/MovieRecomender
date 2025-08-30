import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const { posterUrl } = await request.json();

    if (!posterUrl) {
      return NextResponse.json({ error: 'Poster URL is required' }, { status: 400 });
    }

    // Fetch the image
    const imageResponse = await fetch(posterUrl);
    const imageBuffer = await imageResponse.arrayBuffer();

    // Process the image with sharp
    const blurredImageBuffer = await sharp(Buffer.from(imageBuffer))
      .blur(20) // Blur radius
      .modulate({ brightness: 0.3 }) // Darken the image
      .jpeg({ quality: 80 })
      .toBuffer();

    // Convert to base64
    const base64Image = `data:image/jpeg;base64,${blurredImageBuffer.toString('base64')}`;

    return NextResponse.json({ 
      blurredImage: base64Image,
      originalUrl: posterUrl 
    });

  } catch (error) {
    console.error('Error blurring movie poster:', error);
    return NextResponse.json({ 
      error: 'Failed to process image' 
    }, { status: 500 });
  }
}
