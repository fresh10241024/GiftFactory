from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.routes import sessions, gifts, auth

app = FastAPI(title="Gift Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sessions.router)
app.include_router(gifts.router)
app.include_router(auth.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
