from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from app.db import supabase

router = APIRouter(prefix="/auth", tags=["auth"])


class AuthRequest(BaseModel):
    email: str
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str


def _session_response(res):
    return {
        "token": res.session.access_token,
        "refresh_token": res.session.refresh_token,
        "userId": res.user.id,
    }


@router.post("/signin")
async def signin(body: AuthRequest):
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    # Try registration — only return early if we get a live session back
    try:
        reg = supabase.auth.sign_up({"email": body.email, "password": body.password})
        if reg.user and reg.session:
            return {**_session_response(reg), "action": "register"}
        # No session: either email confirmation required or existing email — fall through to login
    except Exception:
        pass  # Any error (including "already registered") → fall through to login

    # Login (also handles: existing user, or newly registered user when confirmation is OFF)
    try:
        res = supabase.auth.sign_in_with_password({"email": body.email, "password": body.password})
        if res.session:
            return {**_session_response(res), "action": "login"}
        raise HTTPException(status_code=401, detail="Incorrect password")
    except HTTPException:
        raise
    except Exception as e:
        msg = str(e).lower()
        if "not confirmed" in msg or "email" in msg:
            raise HTTPException(status_code=400, detail="Please check your email to confirm your account first")
        raise HTTPException(status_code=401, detail="Incorrect password")


@router.post("/login")
@router.post("/register")
async def login_or_register(body: AuthRequest):
    """Alias endpoints for old frontend — delegates to signin."""
    return await signin(body)


@router.post("/refresh")
async def refresh(body: RefreshRequest):
    try:
        res = supabase.auth.refresh_session(body.refresh_token)
        if not res.session:
            raise HTTPException(status_code=401, detail="Session expired, please log in again")
        return _session_response(res)
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Session expired, please log in again")


@router.post("/logout")
async def logout():
    try:
        supabase.auth.sign_out()
    except Exception:
        pass
    return {"message": "Logged out"}
