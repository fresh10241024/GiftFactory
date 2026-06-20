import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.db import supabase

router = APIRouter(prefix="/auth", tags=["auth"])


class AuthRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    confirmPassword: str = ""


@router.post("/register")
async def register(body: RegisterRequest):
    if body.confirmPassword and body.password != body.confirmPassword:
        raise HTTPException(status_code=400, detail="Passwords do not match")
    try:
        res = supabase.auth.sign_up({"email": body.email, "password": body.password})
        user = res.user
        if not user:
            raise HTTPException(status_code=400, detail="Registration failed")
        return {"message": "Registration successful", "userId": user.id}
    except Exception as e:
        msg = str(e)
        if "already registered" in msg.lower() or "already exists" in msg.lower():
            raise HTTPException(status_code=400, detail="Email already exists")
        raise HTTPException(status_code=400, detail=msg)


@router.post("/login")
async def login(body: AuthRequest):
    try:
        res = supabase.auth.sign_in_with_password({"email": body.email, "password": body.password})
        session = res.session
        user = res.user
        if not session:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        return {
            "message": "Login successful",
            "token": session.access_token,
            "userId": user.id,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials")


@router.post("/logout")
async def logout():
    try:
        supabase.auth.sign_out()
    except Exception:
        pass
    return {"message": "Logged out"}
