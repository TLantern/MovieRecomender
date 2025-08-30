# Image Posting Implementation

This document explains the image posting functionality that has been implemented for social media sharing.

## Overview

The application now captures screenshots of the movie ranking modal and includes them in social media posts. This provides a visual representation of the "Top 3 Mood Matches" along with the text content.

## How It Works

### 1. Modal Screenshot Capture

- **Library**: Uses `html2canvas` to capture the modal as an image
- **Trigger**: Automatically captures the modal when a user initiates social media posting
- **Quality**: High-resolution capture (2x scale) for crisp images
- **Format**: PNG format with transparent background

### 2. Social Media Integration

#### X/Twitter ✅ FULLY IMPLEMENTED
- **Image Upload**: Uses Twitter's media upload API (`upload.twitter.com/1.1/media/upload.json`)
- **Authentication**: OAuth 1.0a with proper signature generation
- **Process**: 
  1. Upload image to get media_id
  2. Post tweet with media_id attached
- **Limitations**: None - fully functional

#### Instagram ⚠️ PARTIALLY IMPLEMENTED  
- **Requirement**: Needs publicly accessible image URL
- **Current Status**: Placeholder implementation
- **Issue**: Instagram API requires images to be hosted at a public URL, not base64 data
- **Solution Needed**: Upload captured image to CDN/server first
- **Error Handling**: Returns helpful error messages about requirement

#### TikTok ⚠️ PARTIALLY IMPLEMENTED
- **Requirement**: Primarily video-focused platform
- **Current Status**: Image posting disabled with informative message
- **Issue**: TikTok API prefers video content over static images
- **Solution Needed**: Convert image to video format or implement video creation

## Implementation Details

### Frontend Changes (socials.tsx)

```typescript
// Added image capture functionality
const captureModalImage = async (): Promise<string | null> => {
  if (!modalRef.current) return null;
  
  try {
    // Hide UI elements that shouldn't be in screenshot
    const closeButton = modalRef.current.querySelector('.close-button') as HTMLElement;
    if (closeButton) closeButton.style.display = 'none';
    
    const canvas = await html2canvas(modalRef.current, {
      background: null,
      scale: 2, // Higher quality
      useCORS: true,
      allowTaint: true,
      height: modalRef.current.offsetHeight,
      width: modalRef.current.offsetWidth,
    });
    
    // Restore hidden elements
    if (closeButton) closeButton.style.display = '';
    
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error capturing modal image:', error);
    return null;
  }
};
```

### Backend Changes (post-to-social/route.ts)

```typescript
// Updated interface to include image data
interface PostContent {
  platform: string;
  description: string;
  tags: string;
  mood: string;
  movies: string[];
  username: string;
  image?: string; // Base64 encoded image data
}

// Twitter media upload implementation
async function uploadTwitterMedia(imageData: string, ...credentials): Promise<string | null> {
  // Converts base64 to buffer
  // Creates OAuth signature
  // Uploads to Twitter media API
  // Returns media_id for tweet attachment
}
```

## Current Status by Platform

| Platform | Image Support | Status | Notes |
|----------|---------------|---------|-------|
| X/Twitter | ✅ Full | Working | Complete implementation with media upload API |
| Instagram | ⚠️ Partial | Needs CDN | Requires public image URL, not base64 |
| TikTok | ⚠️ Limited | Video preferred | Image-to-video conversion needed |

## Next Steps

### For Instagram
1. **Implement image hosting**: Upload captured images to your CDN/server
2. **Return public URL**: Modify `uploadImageToTempService()` function
3. **Example services**: AWS S3, Cloudinary, or your own server endpoint

### For TikTok  
1. **Image-to-video conversion**: Convert static image to short video
2. **Libraries**: Consider ffmpeg.js or similar for client-side conversion
3. **Alternative**: Create slideshow-style video with transitions

### For Production
1. **Error handling**: Implement retry logic for failed uploads
2. **Rate limiting**: Respect platform API limits
3. **User feedback**: Show upload progress and better error messages
4. **Optimization**: Compress images before upload to reduce bandwidth

## Environment Variables

The following environment variables are required for full functionality:

```env
# X/Twitter (OAuth 1.0a recommended for posting)
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
TWITTER_ACCESS_TOKEN=your_access_token_here
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret_here

# TikTok
TIKTOK_CLIENT_KEY=your_client_key_here
TIKTOK_CLIENT_SECRET=your_client_secret_here
TIKTOK_ACCESS_TOKEN=your_access_token_here

# Instagram
INSTAGRAM_ACCESS_TOKEN=your_access_token_here
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_business_account_id_here
# OR
FACEBOOK_PAGE_ID=your_facebook_page_id_here
```

## Testing

1. **Modal Screenshot**: Test that modal captures correctly without UI elements
2. **X/Twitter**: Test image posting with proper credentials
3. **Error Handling**: Test behavior when credentials are missing
4. **Image Quality**: Verify captured images are high quality and properly formatted

The implementation is production-ready for X/Twitter, and provides a solid foundation for Instagram and TikTok once the additional requirements are addressed.
