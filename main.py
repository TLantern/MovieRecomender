import json
from json import JSONDecodeError
import os
import requests

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import ChatCompletion

app = FastAPI()

# Load TMDB API key from environment
TMDB_API_KEY = os.getenv("TMDB_API_KEY")
if not TMDB_API_KEY:
    raise RuntimeError("TMDB_API_KEY environment variable is required")

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

# Endpoint: Recommend 3 movies based on mood
@app.post("/recommend")
async def recommend(req: RecommendRequest):
    prompt = (
<<<<<<< HEAD
        "You are a seasoned cinephile and JSON-only API. "
        "Recommend exactly 3 hidden-gem movies — no blockbusters, no famous classics. "
        "Avoid repeating titles, especially if the user inputs similar moods. "
        "Balance decades with both newer films and lesser-known ‘oldies but goodies’."
        "CRITICAL RULES:\n"
        "- Output ONLY valid JSON, no commentary.\n"
        "- Use this exact JSON schema:\n"
        "{\n"
        "  \"movies\": [\n"
        "    { \"title\": \"string\", \"year\": number, \"description\": \"string\", \"stream_link\": \"string\" },\n"
        "    { \"title\": \"string\", \"year\": number, \"description\": \"string\", \"stream_link\": \"string\" },\n"
        "    { \"title\": \"string\", \"year\": number, \"description\": \"string\", \"stream_link\": \"string\" }\n"
        "  ]\n"
        "}\n"
        "- stream_link: a link to a JustWatch or Rotten Tomatoes page for the movie, not a single platform.\n"
        "- Do NOT repeat past recommendations.\n"
        "- Align choices precisely with the user's mood.\n\n"
        f'User mood: "{req.mood}".'
=======
        "You are a cinephile who ONLY returns valid JSON. "
        "Recommend exactly 3 hidden-gem movies (no blockbusters, no classics). "
        "Output exactly in THIS format and NOTHING else:\n"
        '{ "movies": [ '
        '{ "title": "string", "year": number, "description": "string" }, '
        '{ "title": "string", "year": number, "description": "string" }, '
        '{ "title": "string", "year": number, "description": "string" } '
        '] }\n'
        f"User mood: \"{req.mood}\". "
        f"CRITICAL: You MUST ONLY recommend movies from years {req.yearRange.min} to {req.yearRange.max}. "
        f"This is a STRICT requirement - if a movie's year is outside this range, DO NOT include it. "
        f"Double-check each movie's year before including it."
>>>>>>> b9658ba (V0.1)
    )

    resp = ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
    )
    content = resp.choices[0].message.content

    try:
        parsed = json.loads(content)
    except JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Invalid JSON from GPT: {e.msg}")

    movies = parsed.get("movies")
    if not isinstance(movies, list):
        raise HTTPException(status_code=500, detail="`movies` is not a list")

    # Enrich with TMDB ratings and return up to 3 recommendations
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
