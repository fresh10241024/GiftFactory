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
    """Try login first; if user not found, auto-register then login."""
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    try:
        res = supabase.auth.sign_in_with_password({
            "email": body.email,
            "password": body.password
        })
        if res.session:
            return {**_session_response(res), "action": "login"}
    except Exception as e:
        msg = str(e).lower()
        # Wrong password for existing user
        if "invalid login" in msg or "invalid credentials" in msg:
            raise HTTPException(status_code=401, detail="Incorrect password")
        # User not found → register
    try:
        reg = supabase.auth.admin.create_user({
            "email": body.email,
            "password": body.password,
            "email_confirm": True
        })
        if not reg.user:
            raise HTTPException(status_code=400, detail="Could not create account")
        res = supabase.auth.sign_in_with_password({
            "email": body.email,
            "password": body.password
        })
        return {**_session_response(res), "action": "register"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail="Sign in failed, please try again")


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
