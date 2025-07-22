import json
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
import openai
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig

# ------------------ Config ------------------

openai.api_key = os.getenv("OPENAI_API_KEY")

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD"),
    MAIL_FROM="safeharbouragent@gmail.com",
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_TLS=True,
    MAIL_SSL=False,
    USE_CREDENTIALS=True
)

# ------------------ App Setup ------------------

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # You can lock this down to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------ Models ------------------

class RecommendRequest(BaseModel):
    mood: str

class Movie(BaseModel):
    title: str
    year: int
    description: str

class RecommendResponse(BaseModel):
    movies: list[Movie]

class EmailRequest(BaseModel):
    email: EmailStr

# ------------------ Endpoints ------------------

@app.post("/recommend", response_model=RecommendResponse)
async def recommend(req: RecommendRequest):
    if not req.mood.strip():
        raise HTTPException(status_code=400, detail="Mood must be non-empty")

    prompt = (
        "You are a movie expert recommending unique films. "
        "Only reply with JSON in this exact format:\n"
        '{ "movies": [ { "title": "string", "year": int, "description": "string" }, ... ] }\n'
        f"User mood: \"{req.mood}\".\n"
        "Do NOT include mainstream, overhyped, or blockbuster movies. Choose hidden gems, indie, foreign, or underappreciated films with high ratings."
    )

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=400,
        )

        raw = response.choices[0].message.content
        print("GPT raw response:", raw)

        data = json.loads(raw)

        if "movies" not in data or not isinstance(data["movies"], list):
            raise ValueError("GPT response missing `movies` list")

        return data

    except json.JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Invalid JSON from GPT: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/join")
async def join_email_list(req: EmailRequest):
    try:
        message = MessageSchema(
            subject="New Email Signup",
            recipients=["safeharbouragent@gmail.com"],
            body=f"New user signed up with email: {req.email}",
            subtype="plain"
        )
        fm = FastMail(conf)
        await fm.send_message(message)
        return {"message": "Email received successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")
