import json
from json import JSONDecodeError
import os
import random
import requests
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import ChatCompletion

# Load environment variables from .env file
load_dotenv(verbose=True)

# Debug: Print environment variables to see if they're loaded
print(f"TMDB_API_KEY loaded: {'TMDB_API_KEY' in os.environ}")
print(f"OPENAI_API_KEY loaded: {'OPENAI_API_KEY' in os.environ}")

app = FastAPI()

# Load API keys from environment
TMDB_API_KEY = os.getenv("TMDB_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not TMDB_API_KEY:
    raise RuntimeError("TMDB_API_KEY environment variable is required")

if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY environment variable is required")

# Set OpenAI API key for the library
import openai
openai.api_key = OPENAI_API_KEY

# CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],            # TODO: restrict to your frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request models
class YearRange(BaseModel):
    min: int
    max: int

class RecommendRequest(BaseModel):
    mood: str
    yearRange: YearRange
    actor: str = None  # Optional actor preference
    excludeMovies: list = []  # List of movies to exclude
    isFirstRecommendation: bool = False  # Flag for fan favourites
    sessionSeed: int = None  # Session seed for consistent randomization

class EmailRequest(BaseModel):
    email: str    # basic validation by Pydantic; use constr/email if stricter

# Background task to save email locally
def save_email_to_file(user_email: str):
    """
    Appends the user email to subscribers.txt in the working directory.
    """
    try:
        os.makedirs("data", exist_ok=True)
        path = os.path.join("data", "subscribers.txt")
        with open(path, "a", encoding="utf-8") as f:
            f.write(user_email + "\n")
    except Exception as e:
        print(f"❌ Failed to save email: {e}")

# Helper: enrich movie with TMDB ratings
def enrich_with_tmdb(movie: dict) -> dict:
    title = movie.get("title")
    year = movie.get("year")
    # Search TMDB for movie
    resp = requests.get(
        "https://api.themoviedb.org/3/search/movie",
        params={"api_key": TMDB_API_KEY, "query": title, "year": year},
        timeout=5,
    )
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"TMDB search failed for {title}")
    results = resp.json().get("results", [])
    if not results:
        movie.update({"rating_out_of_10": None, "stars": None, "source": "tmdb"})
        return movie
    best = results[0]
    raw = best.get("vote_average")  # 0-10 scale
    if raw is not None:
        rating = round(raw, 2)  # max 2 decimal places
        stars = round(rating / 2, 1)  # one decimal place for stars
    else:
        rating = None
        stars = None
    movie.update({"rating_out_of_10": rating, "stars": stars, "source": "tmdb"})
    return movie

# Helper: fetch high-rated movies from TMDB based on mood
def fetch_high_rated_movies(mood: str, year_range: dict, exclude_movies: list, session_seed: int = None) -> dict:
    """Fetch movies with rating >9/10 from TMDB based on mood and year range."""
    try:
        # Set random seed for consistent randomization within session
        if session_seed:
            random.seed(session_seed)
        
        # Add more randomization to the search
        random_pages = random.sample(range(1, 6), 3)  # Randomly select 3 pages
        all_results = []
        
        for page in random_pages:
            resp = requests.get(
                "https://api.themoviedb.org/3/discover/movie",
                params={
                    "api_key": TMDB_API_KEY,
                    "vote_average.gte": 8.7,  # Only movies with rating >= 8.7
                    "vote_count.gte": 100,    # Minimum vote count for reliability
                    "primary_release_date.gte": f"{year_range['min']}-01-01",
                    "primary_release_date.lte": f"{year_range['max']}-12-31",
                    "sort_by": random.choice([
                        "vote_average.desc", 
                        "popularity.desc", 
                        "release_date.desc"
                    ]),
                    "page": page,
                    "language": "en-US"
                },
                timeout=10,
            )
            
            if resp.status_code == 200:
                results = resp.json().get("results", [])
                all_results.extend(results)
        
        # Filter out excluded movies
        filtered_results = []
        for movie in all_results:
            title = movie.get("title", "")
            year = movie.get("release_date", "")[:4] if movie.get("release_date") else ""
            
            # Check if this movie is in the exclusion list
            is_excluded = any(
                excl.get("title", "").lower() == title.lower() and 
                str(excl.get("year", "")) == year
                for excl in exclude_movies
            )
            
            if not is_excluded:
                filtered_results.append({
                    "title": title,
                    "year": int(year) if year.isdigit() else None,
                    "description": movie.get("overview", ""),
                    "rating_out_of_10": round(movie.get("vote_average", 0), 2),
                    "stars": round(movie.get("vote_average", 0) / 2, 1),
                    "source": "tmdb_high_rated",
                    "poster_url": f"https://image.tmdb.org/t/p/w500{movie.get('poster_path')}" if movie.get('poster_path') else None
                })
        
        # Shuffle results for variety and return up to 3 movies
        if filtered_results:
            random.shuffle(filtered_results)
            return filtered_results[:3]
        return None
        
    except Exception as e:
        print(f"Error fetching high-rated movies: {e}")
        return None


# Endpoint: Recommend 3 movies based on mood
@app.post("/recommend")
async def recommend(req: RecommendRequest):
    # Set random seed based on session for consistent randomization
    if req.sessionSeed:
        random.seed(req.sessionSeed)
    
    # Build exclusion list for the prompt
    exclude_text = ""
    if req.excludeMovies:
        exclude_text = f"\n\nDO NOT recommend these movies (they were already suggested):\n"
        for movie in req.excludeMovies:
            exclude_text += f"- {movie.get('title', 'Unknown')} ({movie.get('year', 'Unknown')})\n"
    
    # Add session-specific randomization to the prompt
    random_adjectives = [
        "underrated", "overlooked", "cult classic", "indie gem", 
        "foreign masterpiece", "arthouse", "experimental", "avant-garde",
        "hidden treasure", "sleeper hit", "undiscovered gem", "cult favorite"
    ]
    
    random_adjective = random.choice(random_adjectives)
    
    if req.isFirstRecommendation:
        # Enhanced system prompt for first recommendation
        prompt = (
            f"You are an expert movie curator with deep knowledge of cinema across all eras and genres. "
            f"Your mission: recommend exactly 3 movies that perfectly match the user's specific mood and preferences.\n\n"
            
            f"USER REQUEST: \"{req.mood}\"\n"
            f"YEAR RANGE: {req.yearRange.min}-{req.yearRange.max}\n"
            f"ACTOR PREFERENCE: {req.actor or 'None specified'}\n\n"
            
            f"REQUIREMENTS:\n"
            f"• Movies MUST be from {req.yearRange.min}-{req.yearRange.max}\n"
            f"• If actor specified, ALL movies must feature that actor prominently\n"
            f"• Match the mood/genre perfectly - be precise about emotional tone\n"
            f"• Include a mix: 1 popular/acclaimed film + 2 hidden gems or cult favorites\n"
            f"• Avoid generic blockbusters unless they truly fit the mood\n"
            f"• Descriptions should be vivid and capture why it matches their mood\n\n"
            
            f"CRITICAL: DO NOT recommend these already-suggested movies:{exclude_text}\n\n"
            
            f"Return ONLY valid JSON in this exact format:\n"
            '{ "movies": [\n'
            '  { "title": "Movie Title", "year": YYYY, "description": "Compelling 1-2 sentence description explaining why this perfectly matches their mood" },\n'
            '  { "title": "Movie Title", "year": YYYY, "description": "Compelling 1-2 sentence description explaining why this perfectly matches their mood" },\n'
            '  { "title": "Movie Title", "year": YYYY, "description": "Compelling 1-2 sentence description explaining why this perfectly matches their mood" }\n'
            '] }'
        )
    else:
        # Enhanced prompt for additional recommendations
        prompt = (
            f"You are a cinema expert specializing in discovering {random_adjective} films. "
            f"The user wants MORE movies that match their mood, so focus on deeper cuts and hidden gems.\n\n"
            
            f"USER REQUEST: \"{req.mood}\"\n"
            f"YEAR RANGE: {req.yearRange.min}-{req.yearRange.max}\n"
            f"ACTOR PREFERENCE: {req.actor or 'None specified'}\n\n"
            
            f"REQUIREMENTS:\n"
            f"• Movies MUST be from {req.yearRange.min}-{req.yearRange.max}\n"
            f"• If actor specified, ALL movies must feature that actor\n"
            f"• Focus on lesser-known films, international cinema, or cult classics\n"
            f"• Avoid mainstream hits - they want discoveries\n"
            f"• Each description should highlight what makes it special\n\n"
            
            f"CRITICAL: DO NOT recommend these already-suggested movies:{exclude_text}\n\n"
            
            f"Return ONLY valid JSON in this exact format:\n"
            '{ "movies": [\n'
            '  { "title": "Movie Title", "year": YYYY, "description": "Why this hidden gem perfectly captures their mood" },\n'
            '  { "title": "Movie Title", "year": YYYY, "description": "Why this hidden gem perfectly captures their mood" },\n'
            '  { "title": "Movie Title", "year": YYYY, "description": "Why this hidden gem perfectly captures their mood" }\n'
            '] }'
        )

    resp = ChatCompletion.create(
        model="gpt-5-nano",
        messages=[{"role": "user", "content": prompt}],
        # GPT-5 Nano uses default temperature (1) only
    )
    content = resp.choices[0].message.content

    try:
        parsed = json.loads(content)
    except JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Invalid JSON from GPT: {e.msg}")

    movies = parsed.get("movies")
    if not isinstance(movies, list):
        raise HTTPException(status_code=500, detail="`movies` is not a list")

    if req.isFirstRecommendation:
        # For first recommendation: Get 3 movies from GPT and enrich them
        enriched = []
        for m in movies[:3]:
            enriched.append(enrich_with_tmdb(m))
        
        # Ensure we have exactly 3 movies
        while len(enriched) < 3:
            # If we don't have enough movies, try to get more from TMDB
            tmdb_backup = fetch_high_rated_movies(req.mood, req.yearRange.dict(), req.excludeMovies, req.sessionSeed)
            if tmdb_backup and len(tmdb_backup) > 0:
                enriched.extend(tmdb_backup[:3-len(enriched)])
            else:
                break
        
        return {"movies": enriched[:3]}
    else:
        # Regular recommendations: enrich all 3 movies from GPT
        enriched = []
        for m in movies[:3]:
            enriched.append(enrich_with_tmdb(m))
        
        # Ensure we have exactly 3 movies
        while len(enriched) < 3:
            # If we don't have enough movies, try to get more from TMDB
            tmdb_backup = fetch_high_rated_movies(req.mood, req.yearRange.dict(), req.excludeMovies, req.sessionSeed)
            if tmdb_backup and len(tmdb_backup) > 0:
                enriched.extend(tmdb_backup[:3-len(enriched)])
            else:
                break
        
        return {"movies": enriched[:3]}

# Endpoint: Collect and save user email to file
@app.post("/subscribe")
async def subscribe(req: EmailRequest, bg: BackgroundTasks):
    bg.add_task(save_email_to_file, req.email)
    return {"status": "ok", "message": "Got it! You’re on the list."}

# Endpoint: Retrieve subscribers list as plain text
from fastapi.responses import FileResponse

@app.get("/subscribers")
async def get_subscribers():
    """Return the raw subscribers.txt file."""
    data_dir = os.path.join(os.getcwd(), "data")
    path = os.path.join(data_dir, "subscribers.txt")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="No subscribers found yet.")
    return FileResponse(path, media_type="text/plain", filename="subscribers.txt")
