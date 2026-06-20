import re
import json
import uuid
import time
import traceback
from fastapi import APIRouter, HTTPException, BackgroundTasks
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
        return OpenAI(api_key=settings.deepseek_api_key, base_url="https://api.deepseek.com", timeout=300.0)
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


@router.post("")
async def create_session():
    session_id = str(uuid.uuid4())
    supabase.table("sessions").insert({
        "id": session_id,
        "status": "chatting",
        "style_summary": {}
    }).execute()
    return {"session_id": session_id}


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

    supabase.table("sessions").update({"style_summary": {**state, "_plan": plan}}).eq("id", session_id).execute()
    return {"plan": plan}


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
        r = ds.chat.completions.create(
            model="deepseek-chat",
            max_tokens=6000,
            messages=[{"role": "user", "content": prompt}]
        )
        return r.choices[0].message.content
    response = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=3500,
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

    supabase.table("sessions").update({
        "status": "generating",
        "updated_at": "now()"
    }).eq("id", session_id).execute()
    background_tasks.add_task(_run_generation, session_id, state, plan)
    return {"status": "generating"}


GENERATION_TIMEOUT = 660  # 秒：300s 第一次 + 5s 间隔 + 300s 重试 + 余量


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
