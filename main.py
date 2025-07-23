import json
from json import JSONDecodeError
import os

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import ChatCompletion

app = FastAPI()

# CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],            # TODO: restrict to your frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request models
class RecommendRequest(BaseModel):
    mood: str

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

# Endpoint: Recommend 3 movies based on mood
@app.post("/recommend")
async def recommend(req: RecommendRequest):
    prompt = (
        "You are a cinephile who ONLY returns valid JSON. "
        "Recommend exactly 3 hidden-gem movies (no blockbusters, no classics). "
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
    content = resp.choices[0].message.content

    try:
        parsed = json.loads(content)
    except JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Invalid JSON from GPT: {e.msg}")

    movies = parsed.get("movies")
    if not isinstance(movies, list):
        raise HTTPException(status_code=500, detail="`movies` is not a list")

    return {"movies": movies[:3]}

# Endpoint: Collect and save user email to file
@app.post("/subscribe")
async def subscribe(req: EmailRequest, bg: BackgroundTasks):
    # Schedule saving email to file
    bg.add_task(save_email_to_file, req.email)
    return {"status": "ok", "message": "Got it! You’re on the list."}
