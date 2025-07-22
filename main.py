import os
import json
from dotenv import load_dotenv

import openai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic import BaseModel, EmailStr, ConfigDict

# ---------------- Load Environment ----------------
load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")

MAIL_CONF = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM=os.getenv("MAIL_FROM", "safeharbouragent@gmail.com"),
    MAIL_PORT=int(os.getenv("MAIL_PORT", "587")),
    MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_TLS=True,
    MAIL_SSL=False,
    USE_CREDENTIALS=True
)

# ---------------- App Initialization ----------------
app = FastAPI(title="Movie Recommender API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # tighten to your domain in prod
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# ---------------- Pydantic Models ----------------
class RecommendRequest(BaseModel):
    mood: str

    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid"
    )

class Movie(BaseModel):
    title: str
    year: int
    description: str

    model_config = ConfigDict(extra="forbid")

class RecommendResponse(BaseModel):
    movies: list[Movie]

class EmailRequest(BaseModel):
    email: EmailStr

    model_config = ConfigDict(extra="forbid")

# ---------------- Endpoints ----------------
@app.get("/")
async def health_check():
    return {"status": "alive"}

@app.post("/recommend", response_model=RecommendResponse)
async def recommend(req: RecommendRequest):
    if not req.mood:
        raise HTTPException(status_code=400, detail="`mood` must be provided")

    prompt = (
        "You are a film expert recommending unique, high‑quality, non‑mainstream movies. "
        "Reply with **valid JSON only** in this exact format:\n"
        '{ "movies": [ '
        '{ "title": "string", "year": integer, "description": "string" }, '
        '… ] }\n'
        f"User mood: \"{req.mood}\".\n"
        "Exclude blockbusters, obvious classics, and mainstream hits. "
        "Choose hidden gems, indie, foreign, or cult‑favorite films with strong reviews."
    )

    try:
        res = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=400,
        )
        raw = res.choices[0].message.content
        print("🔍 GPT raw:", raw)

        data = json.loads(raw)
        movies = data.get("movies")
        if not isinstance(movies, list):
            raise ValueError("`movies` is not a list in GPT output")

        return {"movies": movies}

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Invalid JSON from GPT: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/join")
async def join_email(req: EmailRequest):
    try:
        msg = MessageSchema(
            subject="New Movie Recs Signup",
            recipients=[MAIL_CONF.MAIL_FROM],
            body=f"New signup: {req.email}",
            subtype="plain"
        )
        fm = FastMail(MAIL_CONF)
        await fm.send_message(msg)
        return {"message": "Signup recorded"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Email error: {e}")
