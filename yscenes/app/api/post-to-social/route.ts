import { NextRequest, NextResponse } from 'next/server';

interface PostContent {
  platform: string;
  description: string;
  tags: string;
  mood: string;
  movies: string[];
  username: string;
  image?: string; // Base64 encoded image data
}

interface SocialMediaResult {
  postId?: string;
  url?: string;
  success: boolean;
  message?: string;
}

export async function POST(request: NextRequest) {
  try {
    const postContent: PostContent = await request.json();
    const { platform, description, tags, mood, movies, username, image } = postContent;

    // Create the post content - truncate if needed for platform limits
    const baseText = `${description}\n\n${tags}\n\nMood: "${mood}"\nMovies: ${movies.join(', ')}\n\nCreated by ${username} on Yscenes`;
    
    let result: SocialMediaResult;

    switch (platform.toLowerCase()) {
      case 'tiktok':
        result = await postToTikTok(baseText, image);
        break;
      case 'twitter':
      case 'x':
        result = await postToTwitter(baseText, image);
        break;
      case 'instagram':
        result = await postToInstagram(baseText, image);
        break;
      default:
        return NextResponse.json({ 
          error: 'Unsupported platform. Supported platforms: twitter, tiktok, instagram' 
        }, { status: 400 });
    }

    if (!result.success) {
      return NextResponse.json({
        error: result.message || `Failed to post to ${platform}`
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      platform,
      message: `Successfully posted to ${platform}`,
      postId: result.postId,
      url: result.url
    });

  } catch (error) {
    console.error('Error posting to social media:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ 
      error: `Failed to post to social media: ${errorMessage}`
    }, { status: 500 });
  }
}

async function postToTikTok(content: string, image?: string): Promise<SocialMediaResult> {
  // TikTok for Developers API v2 integration
  const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY;
  const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET;
  const TIKTOK_ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN;
  
  // Check for required credentials
  if (!TIKTOK_CLIENT_KEY || !TIKTOK_CLIENT_SECRET || !TIKTOK_ACCESS_TOKEN) {
    return {
      success: false,
      message: 'TikTok API credentials not configured. Need TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, and TIKTOK_ACCESS_TOKEN'
    };
  }

  // TikTok has different content limits depending on the type
  // For text posts, the limit is typically around 2200 characters
  const truncatedContent = content.length > 2200 ? content.substring(0, 2197) + '...' : content;

  try {
    // TikTok API primarily supports video content
    // Images can be used but typically require conversion to video format
    if (image) {
      return {
        success: false,
        message: 'TikTok image posting not fully implemented. TikTok API primarily supports video content. Consider implementing image-to-video conversion.'
      };
    }

    // TikTok API v2 for content posting
    // Note: TikTok's content posting API may require additional setup and approval
    const response = await fetch('https://open.tiktokapis.com/v2/post/publish/content/init/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TIKTOK_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        post_info: {
          title: truncatedContent.substring(0, 150), // Title limit
          description: truncatedContent,
          privacy_level: 'MUTUAL_FOLLOW_FRIENDS', // Options: PUBLIC_TO_EVERYONE, MUTUAL_FOLLOW_FRIENDS, FOLLOWER_OF_CREATOR, SELF_ONLY
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000
        },
        source_info: {
          source: 'PULL_FROM_URL',
          video_url: '', // TikTok requires video content - text-only posts are not supported via API
          video_size: 0
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('TikTok API Error:', response.status, errorData);
      
      // TikTok API often returns specific error codes
      if (response.status === 401) {
        return {
          success: false,
          message: 'TikTok API authentication failed. Check your access token.'
        };
      } else if (response.status === 403) {
        return {
          success: false,
          message: 'TikTok API access denied. Your app may need additional permissions or approval.'
        };
      } else {
        return {
          success: false,
          message: `TikTok API error: ${response.status} - ${errorData}`
        };
      }
    }

    const data = await response.json();
    
    // TikTok API returns different response structure
    return {
      success: true,
      postId: data.data?.publish_id || data.data?.share_id,
      url: data.data?.share_url || undefined
    };
    
  } catch (error) {
    console.error('Error posting to TikTok:', error);
    return {
      success: false,
      message: `TikTok posting failed: ${error instanceof Error ? error.message : 'Unknown error'}. Note: TikTok API requires video content - text-only posts may not be supported.`
    };
  }
}

// Helper function to upload media to Twitter
async function uploadTwitterMedia(imageData: string, apiKey: string, apiSecret: string, accessToken: string, accessTokenSecret: string): Promise<string | null> {
  try {
    // Convert base64 to buffer
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    const crypto = require('crypto');
    const oauth_nonce = crypto.randomBytes(32).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
    const oauth_timestamp = Math.floor(Date.now() / 1000).toString();
    
    // Create OAuth signature for media upload
    const oauth_signature_method = 'HMAC-SHA1';
    const oauth_version = '1.0';
    
    const params = {
      oauth_consumer_key: apiKey,
      oauth_nonce,
      oauth_signature_method,
      oauth_timestamp,
      oauth_token: accessToken,
      oauth_version
    };
    
    // Create parameter string
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key as keyof typeof params])}`)
      .join('&');
    
    // Create signature base string
    const signatureBaseString = `POST&${encodeURIComponent('https://upload.twitter.com/1.1/media/upload.json')}&${encodeURIComponent(paramString)}`;
    
    // Create signing key
    const signingKey = `${encodeURIComponent(apiSecret)}&${encodeURIComponent(accessTokenSecret)}`;
    
    // Create signature
    const oauth_signature = crypto.createHmac('sha1', signingKey).update(signatureBaseString).digest('base64');
    
    // Create authorization header
    const authHeader = `OAuth oauth_consumer_key="${encodeURIComponent(apiKey)}", oauth_nonce="${encodeURIComponent(oauth_nonce)}", oauth_signature="${encodeURIComponent(oauth_signature)}", oauth_signature_method="${encodeURIComponent(oauth_signature_method)}", oauth_timestamp="${encodeURIComponent(oauth_timestamp)}", oauth_token="${encodeURIComponent(accessToken)}", oauth_version="${encodeURIComponent(oauth_version)}"`;
    
    // Create form data
    const formData = new FormData();
    formData.append('media', new Blob([buffer], { type: 'image/png' }), 'image.png');
    
    const response = await fetch('https://upload.twitter.com/1.1/media/upload.json', {
      method: 'POST',
      headers: {
        'Authorization': authHeader
      },
      body: formData
    });
    
    if (!response.ok) {
      console.error('Twitter media upload failed:', response.status, await response.text());
      return null;
    }
    
    const data = await response.json();
    return data.media_id_string;
  } catch (error) {
    console.error('Error uploading media to Twitter:', error);
    return null;
  }
}

async function postToTwitter(content: string, image?: string): Promise<SocialMediaResult> {
  // X/Twitter API v2 integration with OAuth 2.0
  const TWITTER_API_KEY = process.env.TWITTER_API_KEY;
  const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET;
  const TWITTER_ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN;
  const TWITTER_ACCESS_TOKEN_SECRET = process.env.TWITTER_ACCESS_TOKEN_SECRET;
  const TWITTER_BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
  
  // Check for required credentials
  if (!TWITTER_BEARER_TOKEN && (!TWITTER_API_KEY || !TWITTER_API_SECRET || !TWITTER_ACCESS_TOKEN || !TWITTER_ACCESS_TOKEN_SECRET)) {
    return {
      success: false,
      message: 'Twitter API credentials not configured. Need either TWITTER_BEARER_TOKEN or OAuth 1.0a credentials (TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET)'
    };
  }

  // Truncate content to Twitter's character limit (280 characters)
  const truncatedContent = content.length > 280 ? content.substring(0, 277) + '...' : content;

  try {
    let response: Response;
    let mediaIds: string[] = [];

    // If image is provided, upload it first
    if (image) {
      const mediaId = await uploadTwitterMedia(image, TWITTER_API_KEY!, TWITTER_API_SECRET!, TWITTER_ACCESS_TOKEN!, TWITTER_ACCESS_TOKEN_SECRET!);
      if (mediaId) {
        mediaIds.push(mediaId);
      }
    }

    if (TWITTER_BEARER_TOKEN) {
      // OAuth 2.0 Bearer Token approach (requires app-only auth)
      const tweetData: any = { text: truncatedContent };
      if (mediaIds.length > 0) {
        tweetData.media = { media_ids: mediaIds };
      }
      
      response = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TWITTER_BEARER_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tweetData)
      });
    } else {
      // OAuth 1.0a approach (requires all 4 credentials)
      const crypto = require('crypto');
      const oauth_nonce = crypto.randomBytes(32).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
      const oauth_timestamp = Math.floor(Date.now() / 1000).toString();
      
      // Create OAuth signature
      const oauth_signature_method = 'HMAC-SHA1';
      const oauth_version = '1.0';
      
      const params = {
        oauth_consumer_key: TWITTER_API_KEY,
        oauth_nonce,
        oauth_signature_method,
        oauth_timestamp,
        oauth_token: TWITTER_ACCESS_TOKEN,
        oauth_version
      };
      
      // Create parameter string
      const paramString = Object.keys(params)
        .sort()
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key as keyof typeof params])}`)
        .join('&');
      
      // Create signature base string
      const signatureBaseString = `POST&${encodeURIComponent('https://api.twitter.com/2/tweets')}&${encodeURIComponent(paramString)}`;
      
      // Create signing key
      const signingKey = `${encodeURIComponent(TWITTER_API_SECRET!)}&${encodeURIComponent(TWITTER_ACCESS_TOKEN_SECRET!)}`;
      
      // Create signature
      const oauth_signature = crypto.createHmac('sha1', signingKey).update(signatureBaseString).digest('base64');
      
      // Create authorization header
      const authHeader = `OAuth oauth_consumer_key="${encodeURIComponent(TWITTER_API_KEY!)}", oauth_nonce="${encodeURIComponent(oauth_nonce)}", oauth_signature="${encodeURIComponent(oauth_signature)}", oauth_signature_method="${encodeURIComponent(oauth_signature_method)}", oauth_timestamp="${encodeURIComponent(oauth_timestamp)}", oauth_token="${encodeURIComponent(TWITTER_ACCESS_TOKEN!)}", oauth_version="${encodeURIComponent(oauth_version)}"`;
      
      const tweetData: any = { text: truncatedContent };
      if (mediaIds.length > 0) {
        tweetData.media = { media_ids: mediaIds };
      }
      
      response = await fetch('https://api.twitter.com/2/tweets', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tweetData)
      });
    }

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Twitter API Error:', response.status, errorData);
      return {
        success: false,
        message: `Twitter API error: ${response.status} - ${errorData}`
      };
    }

    const data = await response.json();
    
    return {
      success: true,
      postId: data.data?.id,
      url: data.data?.id ? `https://x.com/i/status/${data.data.id}` : undefined
    };
  } catch (error) {
    console.error('Error posting to Twitter:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Helper function to upload image for Instagram (placeholder implementation)
async function uploadImageToTempService(imageData: string): Promise<string> {
  // Instagram requires publicly accessible image URLs
  // This is a placeholder implementation
  // In production, you would:
  // 1. Upload the image to your own server/CDN
  // 2. Return the public URL
  // 3. Use that URL in Instagram API calls
  
  throw new Error('Image upload service not implemented. Instagram requires publicly accessible image URLs.');
  
  // Example implementation would be:
  // const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
  // const buffer = Buffer.from(base64Data, 'base64');
  // const response = await uploadToYourCDN(buffer);
  // return response.publicUrl;
}

async function postToInstagram(content: string, image?: string): Promise<SocialMediaResult> {
  // Instagram Graph API integration (Basic Display API is deprecated as of Dec 2024)
  const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
  const INSTAGRAM_BUSINESS_ACCOUNT_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID; // Required for Instagram Business API
  
  // Check for required credentials
  if (!INSTAGRAM_ACCESS_TOKEN) {
    return {
      success: false,
      message: 'Instagram API credentials not configured. Need INSTAGRAM_ACCESS_TOKEN and either INSTAGRAM_BUSINESS_ACCOUNT_ID or FACEBOOK_PAGE_ID'
    };
  }

  // Check if image is provided
  if (!image) {
    return {
      success: false,
      message: 'Instagram requires image content. No image provided.'
    };
  }

  // Instagram has a 2200 character limit for captions
  const truncatedContent = content.length > 2200 ? content.substring(0, 2197) + '...' : content;

  try {
    // Instagram requires different endpoints based on account type
    let mediaEndpoint: string;
    let publishEndpoint: string;

    if (INSTAGRAM_BUSINESS_ACCOUNT_ID) {
      // Instagram Business/Creator Account
      mediaEndpoint = `https://graph.facebook.com/v19.0/${INSTAGRAM_BUSINESS_ACCOUNT_ID}/media`;
      publishEndpoint = `https://graph.facebook.com/v19.0/${INSTAGRAM_BUSINESS_ACCOUNT_ID}/media_publish`;
    } else if (FACEBOOK_PAGE_ID) {
      // Instagram Business Account connected to Facebook Page
      mediaEndpoint = `https://graph.facebook.com/v19.0/${FACEBOOK_PAGE_ID}/media`;
      publishEndpoint = `https://graph.facebook.com/v19.0/${FACEBOOK_PAGE_ID}/media_publish`;
    } else {
      return {
        success: false,
        message: 'Instagram posting requires either INSTAGRAM_BUSINESS_ACCOUNT_ID or FACEBOOK_PAGE_ID. Personal accounts cannot post via API.'
      };
    }

    // Step 1: Upload image and create media container
    // Instagram requires a publicly accessible image URL
    // For now, we'll try to upload the base64 image to a temporary service
    // In production, you'd want to upload to your own server/CDN first
    
    let imageUrl: string;
    try {
      // Convert base64 to blob and upload to a temporary image hosting service
      // Note: This is a simplified approach. In production, upload to your own CDN
      imageUrl = await uploadImageToTempService(image);
    } catch (error) {
      return {
        success: false,
        message: 'Failed to upload image for Instagram posting. Instagram requires publicly accessible image URLs.'
      };
    }

    const mediaResponse = await fetch(mediaEndpoint, {
      method: 'POST',
      body: new URLSearchParams({
        'image_url': imageUrl,
        'caption': truncatedContent,
        'access_token': INSTAGRAM_ACCESS_TOKEN
      })
    });

    if (!mediaResponse.ok) {
      const errorData = await mediaResponse.text();
      console.error('Instagram Media Creation Error:', mediaResponse.status, errorData);
      
      if (mediaResponse.status === 401) {
        return {
          success: false,
          message: 'Instagram API authentication failed. Check your access token and permissions.'
        };
      } else if (mediaResponse.status === 400) {
        return {
          success: false,
          message: 'Instagram API error: Bad request. Instagram requires image or video content - text-only posts are not supported via API.'
        };
      } else {
        return {
          success: false,
          message: `Instagram API error: ${mediaResponse.status} - ${errorData}`
        };
      }
    }

    const mediaData = await mediaResponse.json();
    const creationId = mediaData.id;

    // Step 2: Publish the media container
    const publishResponse = await fetch(publishEndpoint, {
      method: 'POST',
      body: new URLSearchParams({
        'creation_id': creationId,
        'access_token': INSTAGRAM_ACCESS_TOKEN
      })
    });

    if (!publishResponse.ok) {
      const errorData = await publishResponse.text();
      console.error('Instagram Publish Error:', publishResponse.status, errorData);
      return {
        success: false,
        message: `Instagram publish error: ${publishResponse.status} - ${errorData}`
      };
    }

    const publishData = await publishResponse.json();
    
    return {
      success: true,
      postId: publishData.id,
      url: publishData.id ? `https://www.instagram.com/p/${publishData.id}/` : undefined
    };
    
  } catch (error) {
    console.error('Error posting to Instagram:', error);
    return {
      success: false,
      message: `Instagram posting failed: ${error instanceof Error ? error.message : 'Unknown error'}. Note: Instagram API requires image or video content - text-only posts are not supported.`
    };
  }
}
