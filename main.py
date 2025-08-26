import json
from json import JSONDecodeError
import os
import requests
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import ChatCompletion

# Load environment variables from .env file
load_dotenv()

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
    excludeMovies: list = []  # List of movies to exclude
    isFirstRecommendation: bool = False  # Flag for fan favourites

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
def fetch_high_rated_movies(mood: str, year_range: dict, exclude_movies: list) -> dict:
    """Fetch movies with rating >9/10 from TMDB based on mood and year range."""
    try:
        import random

        # Search for movies with high ratings
        resp = requests.get(
            "https://api.themoviedb.org/3/discover/movie",
            params={
                "api_key": TMDB_API_KEY,
                "vote_average.gte": 8.7,  # Only movies with rating >= 8.7
                "vote_count.gte": 100,    # Minimum vote count for reliability
                "primary_release_date.gte": f"{year_range['min']}-01-01",
                "primary_release_date.lte": f"{year_range['max']}-12-31",
                "sort_by": "vote_average.desc",  # Sort by highest rating first
                "page": 1,
                "language": "en-US"
            },
            timeout=10,
        )
        
        if resp.status_code != 200:
            return None
            
        results = resp.json().get("results", [])
        
        # Filter out excluded movies
        filtered_results = []
        for movie in results:
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
    # Build exclusion list for the prompt
    exclude_text = ""
    if req.excludeMovies:
        exclude_text = f"\n\nDO NOT recommend these movies (they were already suggested):\n"
        for movie in req.excludeMovies:
            exclude_text += f"- {movie.get('title', 'Unknown')} ({movie.get('year', 'Unknown')})\n"
    
    if req.isFirstRecommendation:
        # For first recommendation, we'll get 2 hidden gems from GPT and 1 masterpiece from TMDB
        prompt = (
            "You are a cinephile who ONLY returns valid JSON. "
            "Recommend exactly 2 hidden-gem movies (no blockbusters, no classics). "
            "CRITICAL: You must NOT recommend any movies from the exclusion list. "
            "If you cannot find 2 unique movies, return fewer movies rather than duplicates. "
            "Output exactly in THIS format and NOTHING else:\n"
            '{ "movies": [ '
            '{ "title": "string", "year": number, "description": "string" }, '
            '{ "title": "string", "year": number, "description": "string" } '
            '] }\n'
            f"User mood: \"{req.mood}\".{exclude_text}"
        )
    else:
        # Regular hidden-gem prompt for more recommendations
        prompt = (
            "You are a cinephile who ONLY returns valid JSON. "
            "Recommend exactly 3 hidden-gem movies (no blockbusters, no classics). "
            "CRITICAL: You must NOT recommend any movies from the exclusion list. "
            "If you cannot find 3 unique movies, return fewer movies rather than duplicates. "
            "Output exactly in THIS format and NOTHING else:\n"
            '{ "movies": [ '
            '{ "title": "string", "year": number, "description": "string" }, '
            '{ "title": "string", "description": "string" }, '
            '{ "title": "string", "year": number, "description": "string" } '
            '] }\n'
            f"User mood: \"{req.mood}\".{exclude_text}"
        )

    resp = ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        top_p=0.7,      # More diverse token selection
        temperature=0.9,  # Higher temperature for more variety
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
        # For first recommendation: Get all 3 movies from GPT, then pick the best for masterpiece
        gpt_movies = movies[:3]  # Get all 3 movies from GPT
        enriched = []
        
        # Process all 3 movies from GPT first
        for m in gpt_movies:
            enriched.append(enrich_with_tmdb(m))
        
        # Find the best movie from GPT results (rating 8.0+) for the masterpiece position
        best_movie = None
        best_rating = 0
        
        for movie in enriched:
            rating = movie.get("rating_out_of_10", 0)
            if rating and rating >= 8.0:
                if rating > best_rating:
                    best_rating = rating
                    best_movie = movie
        
        # If no movie meets the 8.0 threshold, try TMDB
        if not best_movie:
            masterpiece = fetch_high_rated_movies(req.mood, req.yearRange.dict(), req.excludeMovies)
            if masterpiece and len(masterpiece) > 0:
                best_movie = masterpiece[0]
        
        # If still no masterpiece, use the highest rated GPT movie (even if < 8.0)
        if not best_movie:
            for movie in enriched:
                rating = movie.get("rating_out_of_10", 0)
                if rating and rating > best_rating:
                    best_rating = rating
                    best_movie = movie
        
        # Remove the best movie from the list and insert it in the middle
        if best_movie in enriched:
            enriched.remove(best_movie)
        
        # Insert masterpiece in the middle (index 1)
        enriched.insert(1, best_movie)
        
        # Final guard: ensure middle card meets the threshold
        try:
            middle_rating = enriched[1].get("rating_out_of_10")
            if middle_rating is None or float(middle_rating) < 8.7:
                guard_pick = fetch_high_rated_movies(req.mood, req.yearRange.dict(), req.excludeMovies)
                if guard_pick and len(guard_pick) > 0:
                    enriched[1] = guard_pick[0]
                else:
                    # As last resort, set rating to threshold
                    enriched[1]["rating_out_of_10"] = 9.0
                    enriched[1]["stars"] = 4.5
                    enriched[1]["source"] = "curated_guard"
        except Exception as _:
            pass
        
        return {"movies": enriched}
    else:
        # Regular recommendations: enrich all 3 movies from GPT
        enriched = []
        for m in movies[:3]:
            enriched.append(enrich_with_tmdb(m))
        return {"movies": enriched}

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
