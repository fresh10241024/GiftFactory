from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from app.db import supabase

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/register")
async def register(body: RegisterRequest):
    if len(body.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    try:
        res = supabase.auth.admin.create_user({
            "email": body.email,
            "password": body.password,
            "email_confirm": True
        })
        if not res.user:
            raise HTTPException(status_code=400, detail="Registration failed")
        # Auto login after register
        login_res = supabase.auth.sign_in_with_password({
            "email": body.email,
            "password": body.password
        })
        return {
            "token": login_res.session.access_token,
            "refresh_token": login_res.session.refresh_token,
            "userId": login_res.user.id,
        }
    except HTTPException:
        raise
    except Exception as e:
        msg = str(e)
        if "already registered" in msg or "already been registered" in msg or "User already registered" in msg:
            raise HTTPException(status_code=400, detail="This email is already registered")
        raise HTTPException(status_code=400, detail="Registration failed, please try again")


@router.post("/login")
async def login(body: LoginRequest):
    try:
        res = supabase.auth.sign_in_with_password({
            "email": body.email,
            "password": body.password
        })
        if not res.session:
            raise HTTPException(status_code=401, detail="Incorrect email or password")
        return {
            "token": res.session.access_token,
            "refresh_token": res.session.refresh_token,
            "userId": res.user.id,
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Incorrect email or password")


@router.post("/refresh")
async def refresh(body: RefreshRequest):
    try:
        res = supabase.auth.refresh_session(body.refresh_token)
        if not res.session:
            raise HTTPException(status_code=401, detail="Session expired, please log in again")
        return {
            "token": res.session.access_token,
            "refresh_token": res.session.refresh_token,
            "userId": res.user.id,
        }
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
