import os
import json
import smtplib
from email.message import EmailMessage
from dotenv import load_dotenv

import openai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, ConfigDict

load_dotenv()

# OpenAI key
openai.api_key = os.getenv("OPENAI_API_KEY")

# SMTP config (using Gmail App Password)
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = os.getenv("MAIL_USERNAME")           # e.g. safeharbouragent@gmail.com
SMTP_PASSWORD = os.getenv("MAIL_PASSWORD")       # your Gmail app password

app = FastAPI(title="Movie Recommender API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],    # lock this down in prod
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

class RecommendRequest(BaseModel):
    mood: str
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

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

@app.get("/")
async def health_check():
    return {"status": "alive"}

@app.post("/recommend", response_model=RecommendResponse)
async def recommend(req: RecommendRequest):
    if not req.mood:
        raise HTTPException(400, "`mood` must be provided")

    prompt = (
        "You are a film expert recommending unique, high‑quality, non‑mainstream movies. "
        "Reply with valid JSON only in this format:\n"
        '{ "movies": [ { "title": "string", "year": integer, "description": "string" }, … ] }\n'
        f"User mood: \"{req.mood}\".\n"
        "Exclude blockbusters and obvious classics. Choose hidden gems, indie, foreign, or cult favorites."
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
            raise ValueError("`movies` is not a list")

        return {"movies": movies}

    except json.JSONDecodeError as e:
        raise HTTPException(500, f"Invalid JSON from GPT: {e}")
    except Exception as e:
        raise HTTPException(500, str(e))

@app.post("/join")
async def join_email(req: EmailRequest):
    # Prepare email
    msg = EmailMessage()
    msg["Subject"] = "New Movie Recs Signup"
    msg["From"] = SMTP_USER
    msg["To"] = SMTP_USER
    msg.set_content(f"New signup: {req.email}")

    # Send via SMTP
    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as smtp:
            smtp.starttls()
            smtp.login(SMTP_USER, SMTP_PASSWORD)
            smtp.send_message(msg)
        return {"message": "Signup recorded"}
    except Exception as e:
        raise HTTPException(500, f"Email send failed: {e}")
