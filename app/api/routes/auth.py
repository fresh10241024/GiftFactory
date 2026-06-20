from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional
from app.db import supabase

router = APIRouter(prefix="/auth", tags=["auth"])


class EmailRequest(BaseModel):
    email: str


class OTPVerifyRequest(BaseModel):
    email: str
    code: str


class PasswordLoginRequest(BaseModel):
    email: str
    password: str


class SetPasswordRequest(BaseModel):
    password: str


@router.post("/send-otp")
async def send_otp(body: EmailRequest):
    from app.config import settings
    redirect_url = settings.frontend_url or "https://gift-factory-1j7w.vercel.app"
    try:
        supabase.auth.sign_in_with_otp({
            "email": body.email,
            "options": {"email_redirect_to": redirect_url}
        })
        return {"message": "登录链接已发送"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/verify-otp")
async def verify_otp(body: OTPVerifyRequest):
    try:
        res = supabase.auth.verify_otp({
            "email": body.email,
            "token": body.code,
            "type": "email"
        })
        if not res.session:
            raise HTTPException(status_code=401, detail="验证码无效或已过期")
        return {
            "token": res.session.access_token,
            "userId": res.user.id,
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="验证码无效或已过期")


@router.post("/login")
async def login(body: PasswordLoginRequest):
    try:
        res = supabase.auth.sign_in_with_password({
            "email": body.email,
            "password": body.password
        })
        if not res.session:
            raise HTTPException(status_code=401, detail="邮箱或密码错误")
        return {
            "token": res.session.access_token,
            "userId": res.user.id,
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="邮箱或密码错误")


@router.post("/set-password")
async def set_password(body: SetPasswordRequest, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="未登录")
    token = authorization.split(" ", 1)[1]
    try:
        user_resp = supabase.auth.get_user(token)
        if not user_resp.user:
            raise HTTPException(status_code=401, detail="Token 无效")
        supabase.auth.admin.update_user_by_id(
            user_resp.user.id,
            {"password": body.password}
        )
        return {"message": "密码设置成功"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/logout")
async def logout():
    try:
        supabase.auth.sign_out()
    except Exception:
        pass
    return {"message": "已退出"}
