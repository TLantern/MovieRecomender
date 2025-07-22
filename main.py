# main.py (your FastAPI handler)

import json
from json import JSONDecodeError

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openai import ChatCompletion  # or “import openai” if you prefer

app = FastAPI()


class RecommendRequest(BaseModel):
    mood: str

@app.post("/recommend")
async def recommend(req: RecommendRequest):
    prompt = (
        "You are a cinephile who ONLY returns valid JSON. "
        "Recommend exactly 3 hidden‑gem movies (no blockbusters, no classics). "
        "Output exactly in THIS format and NOTHING else:\n"
        '{ "movies": [ '
          '{ "title": "string", "year": number, "description": "string" }, '
          '{ "title": "string", "year": number, "description": "string" }, '
          '{ "title": "string", "year": number, "description": "string" } '
        '] }\n'
        f"User mood: \"{req.mood}\"."
    )

    resp = ChatCompletion.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
    )
    data = resp.choices[0].message.content
    try:
        parsed = json.loads(data)
    except JSONDecodeError as e:
        raise HTTPException(500, f"Invalid JSON from GPT: {e.msg}")

    movies = parsed.get("movies")
    if not isinstance(movies, list):
        raise HTTPException(500, "`movies` is not a list")

    # enforce exactly 3 items:
    movies = movies[:3]

    return {"movies": movies}
