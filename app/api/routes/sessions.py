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


def _check_session_access(session: dict, caller_user_id: Optional[str]):
    """If the session has an owner, the caller must match. Anonymous sessions are open."""
    owner = session.get("user_id")
    if owner and owner != caller_user_id:
        raise HTTPException(status_code=403, detail="Forbidden")


SESSION_LIMIT = 5

@router.post("")
async def create_session(authorization: Optional[str] = Header(None)):
    user_id = _get_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Login required to create a gift session")
    count = supabase.table("sessions").select("id", count="exact").eq("user_id", user_id).execute()
    if (count.count or 0) >= SESSION_LIMIT:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {SESSION_LIMIT} gifts can be saved. Please delete some in 'My Gifts' before creating new ones."
        )
    session_id = str(uuid.uuid4())
    supabase.table("sessions").insert({"id": session_id, "status": "chatting", "style_summary": {}, "user_id": user_id}).execute()
    return {"session_id": session_id}


@router.delete("/{session_id}")
async def delete_session(session_id: str, authorization: Optional[str] = Header(None)):
    user_id = _get_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not logged in")
    result = supabase.table("sessions").select("user_id").eq("id", session_id).execute()
    if not result.data or result.data[0].get("user_id") != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    supabase.table("gifts").delete().eq("session_id", session_id).execute()
    supabase.table("messages").delete().eq("session_id", session_id).execute()
    supabase.table("sessions").delete().eq("id", session_id).execute()
    return {"message": "Deleted"}


@router.get("/my")
async def my_sessions(authorization: Optional[str] = Header(None)):
    user_id = _get_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Not logged in")
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
async def chat(session_id: str, body: ChatRequest, authorization: Optional[str] = Header(None)):
    result = supabase.table("sessions").select("*").eq("id", session_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")
    session = result.data[0]
    _check_session_access(session, _get_user_id(authorization))

    # Pull history messages (last 10)
    history_result = supabase.table("messages") \
        .select("role, content") \
        .eq("session_id", session_id) \
        .order("created_at") \
        .limit(10) \
        .execute()
    history = history_result.data or []

    # Store user message
    supabase.table("messages").insert({
        "session_id": session_id,
        "role": "user",
        "content": body.message
    }).execute()

    # Call Claude
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

    # Parse state
    state = extract_state(raw_reply)
    reply = clean_reply(raw_reply)
    ready = state.get("ready", False) if state else False

    # Update session state
    if state:
        supabase.table("sessions").update({
            "style_summary": state,
            "status": "ready" if ready else "chatting"
        }).eq("id", session_id).execute()

    # Store AI message
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
async def upload_image(session_id: str, file: UploadFile = File(...), authorization: Optional[str] = Header(None)):
    result = supabase.table("sessions").select("*").eq("id", session_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")
    _check_session_access(result.data[0], _get_user_id(authorization))
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
                    {"type": "text", "text": "Describe the tone, scene and atmosphere of this photo in one sentence, within 20 words, in English."}
                ]
            }]
        )
        description = resp.content[0].text.strip()
    except Exception:
        description = f"A {file.filename or 'uploaded photo'}"

    updated_state = {**state, "photo_description": description}
    supabase.table("sessions").update({"style_summary": updated_state}).eq("id", session_id).execute()
    return {"success": True, "description": description}


@router.post("/{session_id}/plan")
async def create_plan(session_id: str, authorization: Optional[str] = Header(None)):
    result = supabase.table("sessions").select("*").eq("id", session_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")
    session = result.data[0]
    _check_session_access(session, _get_user_id(authorization))
    if not session.get("style_summary"):
        raise HTTPException(status_code=400, detail="Session not ready, keep chatting")

    state = session.get("style_summary", {})

    # 已有缓存的 plan，直接用，不重复调 AI
    if state.get("_plan") and state.get("_analysis"):
        plan = state["_plan"]
        frontend_plan = state["_analysis"]
        return {"plan": frontend_plan, "_full_plan": plan}

    prompt = PLAN_PROMPT.format(state=json.dumps(state, ensure_ascii=False))

    def _generate_plan(prompt):
        ds = _make_deepseek()
        if ds:
            try:
                r = ds.chat.completions.create(
                    model="deepseek-chat",
                    max_tokens=3000,
                    messages=[{"role": "user", "content": prompt}]
                )
                return r.choices[0].message.content.strip()
            except Exception as e:
                print(f"[deepseek plan] failed ({e}), falling back to Claude")
        r = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}]
        )
        return r.content[0].text.strip()

    try:
        plan_text = _generate_plan(prompt)
        match = re.search(r"\{[\s\S]*\}", plan_text)
        raw = match.group(0) if match else plan_text
        open_braces = raw.count('{') - raw.count('}')
        open_brackets = raw.count('[') - raw.count(']')
        if not raw.rstrip().endswith(('"', '}', ']')):
            raw += '"'
        raw += ']' * open_brackets + '}' * open_braces
        plan = json.loads(raw)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Plan generation failed: {str(e)}")

    # Build analysis display content
    scenes = plan.get("scenes", [])
    recipient = state.get("recipient_name", "Ta")
    s2 = next((s for s in scenes if s.get("act") == 2), scenes[1] if len(scenes) > 1 else {})
    s3 = next((s for s in scenes if s.get("act") == 3), scenes[2] if len(scenes) > 2 else {})
    style_name = plan.get("style_archetype", "").split(".")[-1].strip() if plan.get("style_archetype") else ""

    frontend_plan = {
        "title1": s2.get("headline") or f"About {recipient}",
        "text1": s2.get("body") or "",
        "title2": s3.get("headline") or "That Moment",
        "text2": s3.get("body") or "",
        "title3": plan.get("concept") or "This Gift",
        "text3": plan.get("atmosphere") or f"This is a {style_name} style gift, born for your story.",
    }

    # Store plan and analysis results in session for later display
    supabase.table("sessions").update({
        "style_summary": {**state, "_plan": plan, "_analysis": frontend_plan},
        "status": "ready"
    }).eq("id", session_id).execute()

    return {"plan": frontend_plan, "_full_plan": plan}


def extract_html(text: str) -> str:
    # Extract from markdown code block
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

    # Patch truncated HTML
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


@router.post("/{session_id}/summarize")
async def summarize_session(session_id: str):
    """Debug: synchronous return of AI text summary for this session, no HTML generation"""
    result = supabase.table("sessions").select("*").eq("id", session_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")
    state = result.data[0].get("style_summary") or {}
    plan = state.get("_plan", {})
    prompt = f"""Based on the following materials, write a gift summary under 100 words in English, describing what content and feel this gift website will present:

User Story: {json.dumps(state, ensure_ascii=False)}
Script Plan: {json.dumps(plan, ensure_ascii=False)}

Output only the summary text, no HTML."""
    try:
        raw = _call_claude(prompt)
        return {"summary": raw, "has_plan": bool(plan), "recipient": state.get("recipient_name")}
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@router.post("/{session_id}/generate")
async def generate_gift(session_id: str, background_tasks: BackgroundTasks, authorization: Optional[str] = Header(None)):
    result = supabase.table("sessions").select("*").eq("id", session_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")
    session = result.data[0]
    _check_session_access(session, _get_user_id(authorization))

    if session.get("status") == "done":
        existing = supabase.table("gifts").select("slug") \
            .eq("session_id", session_id).order("created_at", desc=True).limit(1).execute()
        if existing.data:
            return {"status": "done", "slug": existing.data[0]["slug"]}

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


GENERATION_TIMEOUT = 180  # Seconds: generation fails if it takes more than 3 minutes


@router.get("/{session_id}/gift")
async def get_gift_status(session_id: str, authorization: Optional[str] = Header(None)):
    result = supabase.table("sessions").select("*").eq("id", session_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")
    row = result.data[0]
    _check_session_access(row, _get_user_id(authorization))
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
                return {"status": "error", "error": f"Generation timed out ({int(elapsed)}s), please try again"}
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
