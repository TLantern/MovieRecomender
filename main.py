import os
import json
import requests
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import openai

# Load environment variables
load_dotenv()

# Required API keys
openai.api_key = os.getenv("OPENAI_API_KEY")
tmdb_api_key = os.getenv("TMDB_API_KEY")
if not openai.api_key:
    raise RuntimeError("OPENAI_API_KEY environment variable not set")
if not tmdb_api_key:
    raise RuntimeError("TMDB_API_KEY environment variable not set")

app = FastAPI(
    title="Movie Recommendation API",
    description="Recommends movies based on mood, enriched with real descriptions from TMDB.",
    version="1.1.0",
)

# Request schema
class MoodRequest(BaseModel):
    mood: str = Field(..., min_length=1, description="User's mood to get movie recommendations")

# Movie schema
class Movie(BaseModel):
    title: str
    year: int
    description: str

# Response schema
class MovieResponse(BaseModel):
    movies: list[Movie]

@app.post("/recommend", response_model=MovieResponse)
async def recommend(request: MoodRequest):
    mood = request.mood.strip()
    if not mood:
        raise HTTPException(status_code=400, detail="Mood must be a non-empty string")

    # Step 1: GPT for titles & years
    prompt = (
        f"Provide exactly 3 movie recommendations for mood '{mood}'. "
        f"Return only JSON: {{\"movies\":[{{\"title\":\"...\",\"year\":####}},...]}}"
    )
    try:
        gpt_resp = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "Output strictly JSON with title and year."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=300,
        )
        data = json.loads(gpt_resp.choices[0].message.content)
        movies = data.get("movies")
        if not isinstance(movies, list) or len(movies) != 3:
            raise ValueError("GPT response invalid format")

        enriched = []
        # Step 2: Fetch real descriptions from TMDB
        for m in movies:
            title = m.get("title")
            year = m.get("year")
            if not (isinstance(title, str) and isinstance(year, int)):
                raise ValueError("Invalid movie entry")

            tmdb_search = requests.get(
                "https://api.themoviedb.org/3/search/movie",
                params={"api_key": tmdb_api_key, "query": title, "year": year}
            ).json()
            results = tmdb_search.get("results", [])
            overview = results[0].get("overview") if results else "Description not available."

            enriched.append(Movie(title=title, year=year, description=overview))

        return MovieResponse(movies=enriched)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")

if __name__ == "__main__":
    import uvicorn
    from pyngrok import ngrok

    # start ngrok tunnel
    public_url = ngrok.connect(8000)
    print(f" * ngrok tunnel available at {public_url}")

    # run FastAPI
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
