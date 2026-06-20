import re
import json
import uuid
import time
import base64
import traceback
from fastapi import APIRouter, HTTPException, BackgroundTasks, UploadFile, File, Header
from typing import Optional
from pydantic import BaseModel
from anthropic import Anthropic
from openai import OpenAI
from app.db import supabase
from app.config import settings
from app.prompts import CONVERSATION_SYSTEM, GENERATE_WEBSITE_PROMPT, PLAN_PROMPT, DESIGN_SKILLS

router = APIRouter(prefix="/sessions", tags=["sessions"])
client = Anthropic(api_key=settings.anthropic_api_key, base_url=settings.anthropic_base_url, timeout=300.0)

def _make_deepseek():
    if settings.deepseek_api_key:
        return OpenAI(api_key=settings.deepseek_api_key, base_url="https://api.deepseek.com", timeout=60.0)
    return None


class ChatRequest(BaseModel):
    message: str


def extract_state(text: str) -> dict | None:
    match = re.search(r"<state>(.*?)</state>", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1).strip())
        except Exception:
            return None
    return None


def clean_reply(text: str) -> str:
    text = re.sub(r"<state>.*?</state>", "", text, flags=re.DOTALL)
    return text.strip()


def _get_user_id(authorization: Optional[str]) -> Optional[str]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    try:
        token = authorization.split(" ", 1)[1]
        user = supabase.auth.get_user(token)
        return str(user.user.id) if user.user else None
    except Exception:
        return None


SESSION_LIMIT = 5

@router.post("")
async def create_session(authorization: Optional[str] = Header(None)):
    session_id = str(uuid.uuid4())
    user_id = _get_user_id(authorization)
    if user_id:
        count = supabase.table("sessions").select("id", count="exact").eq("user_id", user_id).execute()
        if (count.count or 0) >= SESSION_LIMIT:
            raise HTTPException(
                status_code=400,
                detail=f"最多同时保存 {SESSION_LIMIT} 个礼物，请先在「我的礼物」中删除一些再新建"
            )
    row = {"id": session_id, "status": "chatting", "style_summary": {}}
    if user_id:
        row["user_id"] = user_id
    supabase.table("sessions").insert(row).execute()
    return {"session_id": session_id}


@router.delete("/{session_id}")
async def delete_session(session_id: str, authorization: Optional[str] = Header(None)):
    user_id = _get_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="未登录")
    result = supabase.table("sessions").select("user_id").eq("id", session_id).execute()
    if not result.data or result.data[0].get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="无权删除")
    supabase.table("gifts").delete().eq("session_id", session_id).execute()
    supabase.table("messages").delete().eq("session_id", session_id).execute()
    supabase.table("sessions").delete().eq("id", session_id).execute()
    return {"message": "已删除"}


@router.get("/my")
async def my_sessions(authorization: Optional[str] = Header(None)):
    user_id = _get_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="未登录")
    rows = (
        supabase.table("sessions")
        .select("id, status, style_summary, created_at, updated_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(20)
        .execute()
    )
    sessions = []
    for r in rows.data:
        state = r.get("style_summary") or {}
        analysis = state.get("_analysis", {})
        sessions.append({
            "id": r["id"],
            "status": r["status"],
            "recipient": state.get("recipient_name", ""),
            "occasion": state.get("occasion", ""),
            "created_at": r["created_at"],
            "analysis_title": analysis.get("title1", ""),
        })
    return {"sessions": sessions}


@router.post("/{session_id}/chat")
async def chat(session_id: str, body: ChatRequest):
    # 验证 session 存在
    result = supabase.table("sessions").select("*").eq("id", session_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")
    session = result.data[0]

    # 拉取历史消息（最近 10 条）
    history_result = supabase.table("messages") \
        .select("role, content") \
        .eq("session_id", session_id) \
        .order("created_at") \
        .limit(10) \
        .execute()
    history = history_result.data or []

    # 存用户消息
    supabase.table("messages").insert({
        "session_id": session_id,
        "role": "user",
        "content": body.message
    }).execute()

    # 调用 Claude
    messages = [{"role": m["role"], "content": m["content"]} for m in history]
    messages.append({"role": "user", "content": body.message})

    try:
        response = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=1024,
            system=CONVERSATION_SYSTEM,
            messages=messages
        )
        raw_reply = response.content[0].text
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"AI error: {str(e)}")

    # 解析 state
    state = extract_state(raw_reply)
    reply = clean_reply(raw_reply)
    ready = state.get("ready", False) if state else False

    # 更新 session state
    if state:
        supabase.table("sessions").update({
            "style_summary": state,
            "status": "ready" if ready else "chatting"
        }).eq("id", session_id).execute()

    # 存 AI 消息
    supabase.table("messages").insert({
        "session_id": session_id,
        "role": "assistant",
        "content": raw_reply
    }).execute()

    mood = (state or {}).get("mood", {"bg": "#0a0a0f", "accent": "#a0a0c0", "particle": "float"})
    return {
        "reply": reply,
        "ready": ready,
        "state": state,
        "mood": mood
    }


@router.post("/{session_id}/upload")
async def upload_image(session_id: str, file: UploadFile = File(...)):
    result = supabase.table("sessions").select("style_summary").eq("id", session_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")
    state = result.data[0].get("style_summary") or {}

    image_data = await file.read()
    b64 = base64.standard_b64encode(image_data).decode("utf-8")
    media_type = file.content_type or "image/jpeg"

    try:
        resp = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=200,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "image", "source": {"type": "base64", "media_type": media_type, "data": b64}},
                    {"type": "text", "text": "用一句话描述这张照片的色调、场景和氛围，20字以内，中文。"}
                ]
            }]
        )
        description = resp.content[0].text.strip()
    except Exception:
        description = f"一张{file.filename or '上传的照片'}"

    updated_state = {**state, "photo_description": description}
    supabase.table("sessions").update({"style_summary": updated_state}).eq("id", session_id).execute()
    return {"success": True, "description": description}


@router.post("/{session_id}/plan")
async def create_plan(session_id: str):
    result = supabase.table("sessions").select("*").eq("id", session_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")
    session = result.data[0]
    if not session.get("style_summary"):
        raise HTTPException(status_code=400, detail="Session not ready, keep chatting")

    state = session.get("style_summary", {})
    prompt = PLAN_PROMPT.format(state=json.dumps(state, ensure_ascii=False))

    try:
        ds = _make_deepseek()
        if ds:
            r = ds.chat.completions.create(
                model="deepseek-chat",
                max_tokens=3000,
                messages=[{"role": "user", "content": prompt}]
            )
            plan_text = r.choices[0].message.content.strip()
        else:
            r = client.messages.create(
                model="claude-sonnet-4-6",
                max_tokens=1500,
                messages=[{"role": "user", "content": prompt}]
            )
            plan_text = r.content[0].text.strip()
        match = re.search(r"\{[\s\S]*\}", plan_text)
        raw = match.group(0) if match else plan_text
        # 修补截断的 JSON：补全未闭合字符串和括号
        open_braces = raw.count('{') - raw.count('}')
        open_brackets = raw.count('[') - raw.count(']')
        if not raw.rstrip().endswith(('"', '}', ']')):
            raw += '"'
        raw += ']' * open_brackets + '}' * open_braces
        plan = json.loads(raw)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Plan generation failed: {str(e)}")

    # 构建 analysis 展示内容
    scenes = plan.get("scenes", [])
    recipient = state.get("recipient_name", "Ta")
    s2 = next((s for s in scenes if s.get("act") == 2), scenes[1] if len(scenes) > 1 else {})
    s3 = next((s for s in scenes if s.get("act") == 3), scenes[2] if len(scenes) > 2 else {})
    style_name = plan.get("style_archetype", "").split(".")[-1].strip() if plan.get("style_archetype") else ""

    frontend_plan = {
        "title1": s2.get("headline") or f"关于 {recipient}",
        "text1": s2.get("body") or "",
        "title2": s3.get("headline") or "那个时刻",
        "text2": s3.get("body") or "",
        "title3": plan.get("concept") or "这份礼物",
        "text3": plan.get("atmosphere") or f"这是一份{style_name}风格的礼物，为你们的故事而生。",
    }

    # 把 plan 和 analysis 结果都存进 session，方便后续展示
    supabase.table("sessions").update({
        "style_summary": {**state, "_plan": plan, "_analysis": frontend_plan},
        "status": "ready"
    }).eq("id", session_id).execute()

    return {"plan": frontend_plan, "_full_plan": plan}


def extract_html(text: str) -> str:
    # 从 markdown 代码块提取
    match = re.search(r"```(?:html)?\s*([\s\S]*?)```", text)
    html = match.group(1).strip() if match else None

    if not html:
        stripped = text.strip()
        if stripped.startswith("<!DOCTYPE") or stripped.startswith("<html"):
            html = stripped
        else:
            idx = text.find("<!DOCTYPE")
            if idx == -1:
                idx = text.find("<html")
            if idx != -1:
                html = text[idx:].strip()

    if not html:
        raise HTTPException(status_code=502, detail=f"AI returned invalid HTML. Preview: {text[:300]}")

    # 修补截断的 HTML
    if not html.rstrip().endswith("</html>"):
        if "</body>" not in html:
            html += "\n</body>"
        html += "\n</html>"

    return html


def _call_claude(prompt: str) -> str:
    ds = _make_deepseek()
    if ds:
        try:
            r = ds.chat.completions.create(
                model="deepseek-chat",
                max_tokens=4000,
                messages=[{"role": "user", "content": prompt}]
            )
            return r.choices[0].message.content
        except Exception as e:
            print(f"[deepseek] failed ({e}), falling back to Claude")
    response = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=4000,
        messages=[{"role": "user", "content": prompt}]
    )
    return response.content[0].text


def _run_generation(session_id: str, state: dict, plan: dict):
    keywords = plan.get("unsplash_keywords") or ",".join(filter(None, [
        state.get("scene_detail", {}).get("place", ""),
        state.get("core_emotion", "")
    ])) or "nature,beautiful"
    prompt = GENERATE_WEBSITE_PROMPT.format(
        state=json.dumps(state, ensure_ascii=False),
        plan=json.dumps(plan, ensure_ascii=False),
        skills=DESIGN_SKILLS,
        keywords=keywords
    )
    last_error = None
    for attempt in range(1, 3):
        try:
            print(f"[generation] session={session_id} attempt={attempt} start")
            t0 = time.time()
            raw = _call_claude(prompt)
            print(f"[generation] session={session_id} attempt={attempt} claude_ok elapsed={time.time()-t0:.1f}s len={len(raw)}")
            html = extract_html(raw)
            slug = str(uuid.uuid4())[:8]
            supabase.table("gifts").insert({
                "id": str(uuid.uuid4()),
                "session_id": session_id,
                "slug": slug,
                "html": html
            }).execute()
            supabase.table("sessions").update({"status": "done"}).eq("id", session_id).execute()
            print(f"[generation] session={session_id} done slug={slug}")
            return
        except Exception as e:
            last_error = str(e)
            print(f"[generation] session={session_id} attempt={attempt} FAILED: {last_error}")
            traceback.print_exc()
            if attempt < 2:
                time.sleep(5)
    supabase.table("sessions").update({
        "status": "error",
        "style_summary": {**state, "_error": last_error}
    }).eq("id", session_id).execute()
    print(f"[generation] session={session_id} all attempts failed")


@router.post("/{session_id}/generate")
async def generate_gift(session_id: str, background_tasks: BackgroundTasks):
    result = supabase.table("sessions").select("*").eq("id", session_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")
    session = result.data[0]

    if session.get("status") == "done":
        existing = supabase.table("gifts").select("slug") \
            .eq("session_id", session_id).order("created_at", desc=True).limit(1).execute()
        if existing.data:
            return {"status": "done", "slug": existing.data[0]["slug"]}

    if session.get("status") == "generating":
        return {"status": "generating"}

    if not session.get("style_summary"):
        raise HTTPException(status_code=400, detail="Session not ready, keep chatting")

    state = dict(session.get("style_summary", {}))
    plan = state.pop("_plan", {})

    from datetime import datetime, timezone
    supabase.table("sessions").update({
        "status": "generating",
        "updated_at": datetime.now(timezone.utc).isoformat()
    }).eq("id", session_id).execute()
    background_tasks.add_task(_run_generation, session_id, state, plan)
    return {"status": "generating"}


GENERATION_TIMEOUT = 180  # 秒：生成超过3分钟判定失败


@router.get("/{session_id}/gift")
async def get_gift_status(session_id: str):
    result = supabase.table("sessions").select("status, updated_at, style_summary").eq("id", session_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")
    row = result.data[0]
    status = row["status"]

    if status == "generating":
        updated_at = row.get("updated_at")
        if updated_at:
            from datetime import datetime, timezone
            started = datetime.fromisoformat(updated_at.replace("Z", "+00:00"))
            elapsed = (datetime.now(timezone.utc) - started).total_seconds()
            if elapsed > GENERATION_TIMEOUT:
                supabase.table("sessions").update({
                    "status": "error",
                    "style_summary": {**(row.get("style_summary") or {}), "_error": f"timeout after {int(elapsed)}s"}
                }).eq("id", session_id).execute()
                return {"status": "error", "error": f"生成超时（{int(elapsed)}秒），请重试"}
        return {"status": "generating"}

    if status == "done":
        existing = supabase.table("gifts").select("slug") \
            .eq("session_id", session_id).order("created_at", desc=True).limit(1).execute()
        if existing.data:
            return {"status": "done", "slug": existing.data[0]["slug"]}

    if status == "error":
        err = (row.get("style_summary") or {}).get("_error", "unknown")
        return {"status": "error", "error": err}

    return {"status": "generating"}



@router.get("/{session_id}/messages")
async def get_messages(session_id: str):
    result = supabase.table("messages") \
        .select("role, content, created_at") \
        .eq("session_id", session_id) \
        .order("created_at") \
        .execute()
    return {"messages": result.data}
