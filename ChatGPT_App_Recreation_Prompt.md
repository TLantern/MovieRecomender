# ChatGPT Prompt: Recreate YScenes Movie Recommender as Mobile App

## Project Overview
You need to recreate a movie recommendation web application called "YScenes" as a mobile app. The original is a Next.js web app with a dark, cinematic design that recommends movies based on user mood, year preferences, and favorite actors.

## Core Features to Implement

### 1. Authentication System
- Implement user sign-up/sign-in with Google OAuth
- User profile management with avatar display
- Session management (30-minute sessions that auto-expire)

### 2. Main Recommendation Engine
- **Mood Input**: Large text area where users describe their mood
- **AI Suggestions**: Clickable "magic wand" button that auto-types mood suggestions
- **Year Range Slider**: Dual-range slider from 1970-2025
- **Actor Selection**: Horizontal scrolling carousel of popular actors
- **Smart Recommendations**: Returns 3 movie suggestions with the middle one marked as "Fan Favourite"

### 3. Movie Display & Details
- **Movie Cards**: Show poster, title, year, rating, description
- **Bookmark System**: Users can save/unsave movies
- **Movie Modal**: Detailed view with streaming platforms (Netflix, Prime, etc.)
- **Watch Providers**: Integration with streaming service availability

### 4. Session Memory System
- Track recommended movies within a session to prevent duplicates
- Auto-clear when session expires
- "More Recommendations" button for additional suggestions

## Design System & Color Scheme

### Color Palette
```css
Primary Colors:
- Background: Deep black (#000000) with semi-transparent overlays
- Text: White (#ffffff) and gray variants (#d1d5db, #9ca3af)
- Accent Red: Gradient from #f87171 to #dc2626 (for main branding)
- Accent Blue: #3b82f6 (for ratings and interactive elements)
- Accent Purple: #a855f7 (for "Fan Favourite" labels)

Background Effects:
- Main background: Dark movie poster image with black overlay (40% opacity)
- Card backgrounds: Black with 85% opacity + backdrop blur
- Glass morphism: White overlays at 3-5% opacity
- Glow effects: Blue/purple glows around interactive elements
```

### Typography
```css
Fonts:
- Headings: Montserrat (700 weight) - for titles and headings
- Body: Inter (300, 400 weight) - for body text and labels

Text Hierarchy:
- Main title: 4xl, white with red gradient on key words
- Section headings: 2xl, white, bold
- Movie titles: lg, white, semi-bold
- Body text: sm-base, gray-300
- Ratings: sm, blue background badges
```

### Visual Effects
```css
Key Effects:
- Drop shadows with color: drop-shadow-[0_0_30px_rgba(59,130,246,0.2)]
- Gradient backgrounds: from-red-400 via-red-500 to-red-600
- Backdrop blur: backdrop-blur-sm
- Hover animations: scale-105 transforms
- Glowing borders: border-white/30
- Animated placeholders with typing effects
```

## Screen Layout & Components

### 1. Home Screen
```
Header:
- Left: YScenes logo (movie.png) with expand animation
- Center: Navigation links (Home, Movies, Bookmarks, Pricing)
- Right: Authentication buttons or user avatar

Main Content:
- Large centered card with glass morphism effect
- Title: "What's the Mood for Tonight?" (animated)
- Mood input textarea with AI magic wand icon
- "Watch Now" button below
- Year range slider (1970-2025)

Secondary Content:
- Actor carousel (if no search results)
- Email signup form (when no results showing)
```

### 2. Search Results Screen
```
Results Grid:
- 3-column grid on desktop, responsive for mobile
- Movie cards with:
  * Bookmark icon (top-left)
  * Rating badge (top-right)
  * Movie poster (9:16 aspect ratio)
  * Title and year
  * Description text
  * "Watch here" button

Additional Elements:
- Email signup form between results and more button
- "More Recommendations" button at bottom
- Loading states with custom spinner animation
```

### 3. Movie Detail Modal
```
Modal Layout:
- Split view: Movie details (left) + Streaming options (right)
- Movie poster, title, year, rating badges
- Genre tags, runtime, TMDB score
- Full description with scroll
- Streaming providers with logos
- Bookmark toggle
```

### 4. Bookmarks Screen
```
Saved Movies:
- Grid layout of bookmarked movies
- Same card design as search results
- Filter/sort options
- Empty state when no bookmarks
```

## API Integration Requirements

### 1. Movie Recommendation API
```javascript
// Main recommendation endpoint
POST /api/recommend
{
  "mood": "feeling nostalgic for the 90s",
  "yearRange": [1990, 2000],
  "actor": "Leonardo DiCaprio",
  "excludeMovies": [...], // Session exclusion list
  "sessionId": "uuid",
  "isFirstRecommendation": true
}

Response:
{
  "movies": [
    {
      "title": "Movie Title",
      "year": 1995,
      "description": "Movie description",
      "rating_out_of_10": 8.5,
      "poster_url": "https://image.tmdb.org/t/p/w500/...",
      "stream_link": "https://netflix.com/..."
    }
  ],
  "sessionId": "uuid",
  "excludedCount": 2
}
```

### 2. Streaming Providers API
```javascript
// Get where to watch
POST /api/watch-providers
{
  "title": "Movie Title",
  "year": 1995
}

Response:
{
  "watchProviders": {
    "US": {
      "link": "https://themoviedb.org/...",
      "flatrate": [...], // Streaming services
      "rent": [...],     // Rental options
      "buy": [...]       // Purchase options
    }
  },
  "movie": { /* TMDB movie details */ }
}
```

### 3. Authentication & Bookmarks
```javascript
// Bookmark management
POST /api/bookmarks
{
  "action": "add" | "remove",
  "movieId": "movie-title-year",
  "movieData": { /* movie details */ }
}

// Email subscription
POST /api/subscribe
{
  "email": "user@example.com"
}
```

## Key Interactions & Animations

### 1. Mood Input Features
- Animated placeholder text that cycles through suggestions
- AI magic wand button that auto-types mood suggestions
- Typing indicator when AI is suggesting
- "Press Enter to continue" prompt after AI suggestion

### 2. Actor Carousel
- Horizontal scrolling with 5 visible actors
- Auto-play with 3-second intervals
- Hover to pause auto-play
- Click to select actor (shows as tag above mood input)
- Gradient backgrounds for each actor card

### 3. Movie Card Interactions
- Hover effects: scale and glow
- Bookmark heart animation (fill/unfill)
- "Fan Favourite" badge for middle recommendation
- Smooth loading states

### 4. Session Management
- 30-minute session timer
- Auto-refresh when session expires
- Duplicate prevention within session
- Clear exclusion list on new session

## Technical Requirements

### Mobile App Framework
Choose one of:
- **React Native** with Expo
- **Flutter** 
- **React Native CLI**

### State Management
- Context API or Redux for global state
- Session storage for recommendation memory
- Async storage for bookmarks

### External Integrations
- **TMDB API**: Movie posters and details
- **Authentication**: Google OAuth integration
- **Backend API**: FastAPI service for recommendations
- **Clerk/Auth0**: User management (optional)

### Performance Considerations
- Image lazy loading for posters
- Infinite scroll for more recommendations
- Caching for repeated searches
- Optimistic UI updates for bookmarks

## Implementation Steps

### Phase 1: Core UI (Days 1-3)
1. Set up mobile app project with navigation
2. Implement design system (colors, fonts, components)
3. Create main home screen with mood input
4. Build movie card component with proper styling
5. Add year range slider component

### Phase 2: Recommendation Engine (Days 4-5)
1. Implement mood input with AI suggestions
2. Create actor carousel component
3. Build search results screen
4. Add movie detail modal
5. Implement session management

### Phase 3: User Features (Days 6-7)
1. Add authentication system
2. Implement bookmark functionality
3. Create bookmarks screen
4. Add streaming providers integration
5. Build user profile screen

### Phase 4: Polish & Testing (Days 8-9)
1. Add loading states and animations
2. Implement error handling
3. Add responsive design improvements
4. Test user flows and fix bugs
5. Optimize performance

### Phase 5: Deployment (Day 10)
1. Set up app store deployment
2. Configure analytics
3. Add crash reporting
4. Submit to app stores

## Sample Data Structure

### Movie Object
```javascript
{
  title: "The Grand Budapest Hotel",
  year: 2014,
  description: "A whimsical comedy about a legendary concierge...",
  rating_out_of_10: 8.1,
  poster_url: "https://image.tmdb.org/t/p/w500/path.jpg",
  stream_link: "https://netflix.com/title/...",
  genres: ["Comedy", "Drama"],
  runtime: 99,
  tmdb_rating: 8.0
}
```

### Session Object
```javascript
{
  sessionId: "uuid-string",
  createdAt: timestamp,
  lastActivity: timestamp,
  recommendedMovies: [
    { title: "Movie 1", year: 2020 },
    { title: "Movie 2", year: 2019 }
  ],
  isExpired: false
}
```

## Success Criteria
- [ ] Users can input mood and get 3 relevant movie recommendations
- [ ] Middle recommendation is highlighted as "Fan Favourite"
- [ ] Actor selection influences recommendations
- [ ] Year range filtering works properly
- [ ] Session prevents duplicate recommendations
- [ ] Bookmarking works offline and syncs when online
- [ ] Streaming provider integration shows accurate availability
- [ ] App matches the visual design of the original web app
- [ ] Smooth animations and transitions throughout
- [ ] Authentication and user profiles work seamlessly

Start with Phase 1 and focus on getting the core UI exactly matching the design system described above. The dark, cinematic aesthetic with red accents and glass morphism effects is crucial to the app's identity.
