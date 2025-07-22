import os
import json
from json import JSONDecodeError

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from openai import ChatCompletion
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

# Load environment variables (if using .env)
# from dotenv import load_dotenv
# load_dotenv()

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
    email: EmailStr

# Background task to forward email via SendGrid
def send_forward_email(user_email: str):
    """
    Fire-and-forget: use SendGrid to forward the signup email to the designated inbox.
    """
    sg_api_key = os.getenv("SENDGRID_API_KEY")
    if not sg_api_key:
        print("⚠️ SENDGRID_API_KEY not set, cannot send email.")
        return

    message = Mail(
        from_email="no-reply@yourdomain.com",
        to_emails="safeharbouragent@gmail.com",
        subject="🎬 New Movie App Email Signup",
        html_content=f"<p>New signup: {user_email}</p>"
    )
    try:
        sg = SendGridAPIClient(sg_api_key)
        response = sg.send(message)
        print(f"✅ SendGrid response: {response.status_code}")
    except Exception as e:
        print(f"❌ SendGrid error: {e}")

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

# Endpoint: Collect and forward user email
@app.post("/subscribe")
async def subscribe(req: EmailRequest, bg: BackgroundTasks):
    bg.add_task(send_forward_email, req.email)
    return {"status": "ok", "message": "Thanks! We’ll be in touch."}
