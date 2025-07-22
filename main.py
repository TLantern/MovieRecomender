import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openai

# Load your OpenAI key from .env or environment
openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI(
    title="Movie Recommender",
    description="Paste your mood, get 3 niche movie picks",
    version="1.0.0"
)

# ==== CORS Middleware ====
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],         
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==== Request & Response Models ====
class MoodRequest(BaseModel):
    mood: str

class Movie(BaseModel):
    title: str
    year: int
    description: str

class RecommendResponse(BaseModel):
    movies: list[Movie]

# ==== /recommend Endpoint ====
@app.post("/recommend", response_model=RecommendResponse)
async def recommend_movies(payload: MoodRequest):
    if not payload.mood.strip():
        raise HTTPException(status_code=400, detail="Mood must be a non-empty string")

    try:
        # Example GPT prompt; tweak for your “deep niche” needs
        prompt = (
            f"You are a movie curator. "
            f"Suggest 3 movies that fit this mood: '{payload.mood}'. "
            f"Try not to suggest mainstream movies first"
            f"Return JSON array with title, year, and 2-sentence description."
        )

        resp = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[{"role": "system", "content": "You suggest niche movie picks."},
                      {"role": "user",   "content": prompt}],
            temperature=0.8,
            max_tokens=300
        )

        content = resp.choices[0].message.content.strip()
        # Expecting something like: [{"title":..., "year":..., "description":...}, ...]
        movies = openai.util.convert_to_dict(content)

        return RecommendResponse(movies=movies)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==== Health Check (optional) ====
@app.get("/health")
async def health():
    return {"status": "alive"}
