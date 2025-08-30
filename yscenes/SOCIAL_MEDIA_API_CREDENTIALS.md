# Social Media API Credentials Setup

This document outlines all the environment variables you need to add to your `.env.local` file to enable social media posting functionality for X/Twitter, TikTok, and Instagram.

## Required Environment Variables

### X/Twitter API Credentials

You have two authentication options for X/Twitter:

#### Option 1: OAuth 2.0 Bearer Token (Simpler, but read-only for some endpoints)
```env
TWITTER_BEARER_TOKEN=your_bearer_token_here
```

#### Option 2: OAuth 1.0a (Full access, required for posting)
```env
TWITTER_API_KEY=your_api_key_here
TWITTER_API_SECRET=your_api_secret_here
TWITTER_ACCESS_TOKEN=your_access_token_here
TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret_here
```

**Recommended**: Use Option 2 (OAuth 1.0a) for posting capabilities.

### TikTok API Credentials
```env
TIKTOK_CLIENT_KEY=your_client_key_here
TIKTOK_CLIENT_SECRET=your_client_secret_here
TIKTOK_ACCESS_TOKEN=your_access_token_here
```

### Instagram API Credentials
```env
INSTAGRAM_ACCESS_TOKEN=your_access_token_here

# One of the following is required:
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_business_account_id_here
# OR
FACEBOOK_PAGE_ID=your_facebook_page_id_here
```

## Setup Instructions

### X/Twitter API Setup

1. **Create a Developer Account**
   - Go to [developer.x.com](https://developer.x.com)
   - Apply for a developer account (may require approval)

2. **Create a New App**
   - In the Developer Portal, create a new app
   - Note down your API Key and API Secret

3. **Generate Access Tokens**
   - In your app settings, generate Access Token and Access Token Secret
   - Ensure your app has "Read and Write" permissions

4. **Add to Environment**
   ```env
   TWITTER_API_KEY=your_api_key_here
   TWITTER_API_SECRET=your_api_secret_here
   TWITTER_ACCESS_TOKEN=your_access_token_here
   TWITTER_ACCESS_TOKEN_SECRET=your_access_token_secret_here
   ```

### TikTok API Setup

1. **Create a Developer Account**
   - Go to [developers.tiktok.com](https://developers.tiktok.com)
   - Register for a developer account

2. **Create a New App**
   - Create a new application in the developer portal
   - Provide app details and await approval (may take time)

3. **Configure OAuth**
   - Set up redirect URIs for OAuth flow
   - Note down your Client Key and Client Secret

4. **Get Access Token**
   - Implement OAuth flow to get user access tokens
   - Users must authorize your app

5. **Add to Environment**
   ```env
   TIKTOK_CLIENT_KEY=your_client_key_here
   TIKTOK_CLIENT_SECRET=your_client_secret_here
   TIKTOK_ACCESS_TOKEN=your_access_token_here
   ```

**Important**: TikTok API requires video content. Text-only posts are not supported.

### Instagram API Setup

1. **Create a Facebook App**
   - Go to [developers.facebook.com](https://developers.facebook.com)
   - Create a new app (Consumer type recommended)

2. **Add Instagram Product**
   - In your app dashboard, add the Instagram product
   - Configure Instagram Basic Display or Instagram API

3. **Setup Business Account**
   - Instagram API requires a Business or Creator account
   - Connect your Instagram account to a Facebook Page (if using Facebook Page method)

4. **Get Access Token**
   - Implement OAuth flow to get long-lived access tokens
   - Get your Instagram Business Account ID or Facebook Page ID

5. **Add to Environment**
   ```env
   INSTAGRAM_ACCESS_TOKEN=your_access_token_here
   INSTAGRAM_BUSINESS_ACCOUNT_ID=your_business_account_id_here
   ```
   OR
   ```env
   INSTAGRAM_ACCESS_TOKEN=your_access_token_here
   FACEBOOK_PAGE_ID=your_facebook_page_id_here
   ```

**Important**: Instagram API requires image or video content. Text-only posts are not supported.

## Important Notes

### Content Limitations
- **X/Twitter**: 280 character limit for text
- **TikTok**: Requires video content, text-only posts not supported via API
- **Instagram**: Requires image/video content, text-only posts not supported via API

### Rate Limits
- All platforms have rate limits. Monitor your usage to avoid being blocked.
- X/Twitter: 300 tweets per 15-minute window
- TikTok: Varies by endpoint, typically 100-1000 requests per day
- Instagram: 200 requests per hour per user

### Permissions & Approval
- **TikTok**: May require app review and approval for production use
- **Instagram**: Business account required, some features need app review
- **X/Twitter**: Basic access available immediately, elevated access may require approval

### Testing
- Start with sandbox/test environments where available
- Use personal accounts for initial testing
- Ensure proper error handling for API failures

## Security Best Practices

1. **Never commit credentials to version control**
2. **Use environment variables for all sensitive data**
3. **Regularly rotate access tokens**
4. **Monitor API usage and billing**
5. **Implement proper error handling and logging**

## Troubleshooting

### Common Issues
- **401 Unauthorized**: Check your credentials and token expiration
- **403 Forbidden**: Your app may need additional permissions or approval
- **400 Bad Request**: Check required parameters and content format
- **Rate Limited**: Wait and implement retry logic with exponential backoff

### Debug Tips
- Enable detailed error logging
- Check API documentation for recent changes
- Verify account types and permissions
- Test with minimal examples first

For the latest API documentation, always refer to the official docs:
- [X/Twitter API Docs](https://developer.x.com/en/docs)
- [TikTok API Docs](https://developers.tiktok.com/doc)
- [Instagram API Docs](https://developers.facebook.com/docs/instagram-api)
