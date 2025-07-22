import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import openai
import os

openai.api_key = os.getenv("OPENAI_API_KEY")
app = FastAPI()

# CORS (wildcard for now)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RecommendRequest(BaseModel):
    mood: str

class Movie(BaseModel):
    title: str
    year: int
    description: str

class RecommendResponse(BaseModel):
    movies: list[Movie]

@app.post("/recommend", response_model=RecommendResponse)
async def recommend(req: RecommendRequest):
    if not req.mood.strip():
        raise HTTPException(400, "Mood must be non‑empty")

    # Build your prompt
    prompt = (
        "You are a movie expert. Recommend 3 movies that match the user's mood. "
    "For each movie, include the actual release year and a 1–2 sentence description. "
    "Return the response in **valid JSON only** in this format:\n"
    '{ "movies": [ { "title": "Movie Title", "year": 2016, "description": "..." }, ... ] }\n'
    f"User mood: \"{req.mood}\"."
    )

    try:
        resp = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[{"role": "system", "content": prompt}],
            temperature=0.7,
            max_tokens=300,
        )
        raw = resp.choices[0].message.content

        # Debug: log the raw string so you can inspect it in Render logs
        print("GPT raw response:", raw)

        # Safely parse it as JSON
        data = json.loads(raw)

        # Make sure it has the right structure
        if "movies" not in data or not isinstance(data["movies"], list):
            raise ValueError("GPT response missing `movies` list")

        return data

    except json.JSONDecodeError as e:
        raise HTTPException(500, f"Invalid JSON from GPT: {e}")
    except Exception as e:
        # Catch our ValueError or any other
        raise HTTPException(500, str(e))
