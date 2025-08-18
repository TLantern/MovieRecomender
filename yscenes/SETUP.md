# YScenes TMDb Integration Setup

## Prerequisites

1. Get a TMDb API key from [The Movie Database](https://www.themoviedb.org/settings/api)
2. Create a free account if you don't have one

## Environment Configuration

1. Create a `.env.local` file in the root of your project
2. Add your TMDb API key:

```env
TMDB_API_KEY=your_actual_api_key_here
```

## Features

- **Live Movie Data**: Fetches trending movies from TMDb API
- **High-Quality Posters**: Uses TMDb's high-resolution poster images
- **Real Ratings**: Displays actual user ratings from TMDb
- **Auto-Refresh**: Data updates automatically when the API is called

## API Endpoint

The `/api/movies` endpoint fetches trending movies for the current week and returns:
- Movie title
- Poster image (500px width)
- User rating (0-10 scale)
- Release year
- Genre information
- Movie overview
- Backdrop image

## Error Handling

If the API key is not configured or there's an error:
- Loading spinner is shown while fetching data
- Error messages are displayed to users
- Graceful fallback handling

## Security

- API key is stored in environment variables
- No sensitive data is exposed to the client
- Server-side API calls only 