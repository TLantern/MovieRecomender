# Movie Recommendation API

## Overview
This is a simple FastAPI service that provides movie recommendations based on user mood. It uses OpenAI's GPT-4 model under the hood.

## Setup & Run

1. **Clone the repo**
   ```bash
   git clone https://github.com/yourusername/movie-recommender-api.git
   cd movie-recommender-api

2. **Start Backend**
uvicorn main:app --reload

**Test EndPoint**
curl -X POST "http://localhost:8000/recommend" \
     -H "Content-Type: application/json" \
     -d '{"mood": "adventurous"}

3.**Deploy Vercel**
vercel deploy
