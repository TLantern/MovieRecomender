import os
import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import openai
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()
# Load OpenAI API key from environment
openai.api_key = os.getenv("OPENAI_API_KEY")
if not openai.api_key:
    raise RuntimeError("OPENAI_API_KEY environment variable not set")

app = FastAPI(
    title="Movie Recommendation API",
    description="An API that recommends movies based on mood using OpenAI GPT-4",
    version="1.0.0",
)

# Optional CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

    prompt = (
        f"You are a movie recommendation engine. Given the user's mood, provide exactly 3 "
        f"movies in JSON array format. Mood: \"{mood}\".\n"
        f"Return output as:\n"
        f"{{ \"movies\": [{{ \"title\": \"...\", \"year\": ####, \"description\": \"...\" }}, ...] }}"
    )

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "You provide movie recommendations in strict JSON."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=500,
        )
        content = response.choices[0].message.content.strip()
        data = json.loads(content)

        movies = data.get("movies")
        if not isinstance(movies, list) or len(movies) != 3:
            raise ValueError("Invalid response format from OpenAI")

        validated = []
        for m in movies:
            title = m.get("title")
            year = m.get("year")
            description = m.get("description")
            if not (isinstance(title, str) and isinstance(year, int) and isinstance(description, str)):
                raise ValueError("Invalid movie entry format")
            validated.append(Movie(title=title, year=year, description=description))

        return MovieResponse(movies=validated)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=int(os.getenv("PORT", 8000)))