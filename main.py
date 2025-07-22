import os
import json
from json import JSONDecodeError
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from openai import ChatCompletion
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

app = FastAPI()

# CORS (as before)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],    # lock this to your frontend in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1) Your existing “get 3 movies” endpoint
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
    content = resp.choices[0].message.content

    try:
        parsed = json.loads(content)
    except JSONDecodeError as e:
        raise HTTPException(status_code=500, detail=f"Invalid JSON from GPT: {e.msg}")

    movies = parsed.get("movies")
    if not isinstance(movies, list):
        raise HTTPException(status_code=500, detail="`movies` is not a list")

    return {"movies": movies[:3]}


# 2) New “submit email” endpoint
class EmailRequest(BaseModel):
    email: EmailStr

def send_forward_email(user_email: str):
    """Fire‑and‑forget: forward user_email to your inbox via SendGrid."""
    message = Mail(
        from_email="no-reply@yourdomain.com",
        to_emails="safeharbouragent@gmail.com",
        subject="🎬 New Movie App Email Signup",
        html_content=f"<p>New signup: {user_email}</p>"
    )
    sg = SendGridAPIClient(os.getenv("SENDGRID_API_KEY"))
    sg.send(message)

@app.post("/subscribe")
async def subscribe(req: EmailRequest, bg: BackgroundTasks):
    # Validate + forward
    bg.add_task(send_forward_email, req.email)
    return {"status": "ok", "message": "Thanks! We’ll be in touch."}
