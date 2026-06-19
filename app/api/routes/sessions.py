import re
import json
import uuid
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from anthropic import Anthropic
from app.db import supabase
from app.config import settings
from app.prompts import CONVERSATION_SYSTEM, GENERATE_CONFIG_PROMPT

router = APIRouter(prefix="/sessions", tags=["sessions"])
client = Anthropic(api_key=settings.anthropic_api_key)


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

    response = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        system=CONVERSATION_SYSTEM,
        messages=messages
    )
    raw_reply = response.content[0].text

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

    return {
        "reply": reply,
        "ready": ready,
        "state": state
    }


@router.post("/{session_id}/generate")
async def generate_gift(session_id: str):
    result = supabase.table("sessions").select("*").eq("id", session_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Session not found")
    session = result.data[0]

    state = session.get("style_summary", {})
    prompt = GENERATE_CONFIG_PROMPT.format(state=json.dumps(state, ensure_ascii=False))

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]
    )

    config_text = response.content[0].text.strip()
    config = json.loads(config_text)

    # 生成唯一 slug
    slug = str(uuid.uuid4())[:8]

    supabase.table("gifts").insert({
        "id": str(uuid.uuid4()),
        "session_id": session_id,
        "slug": slug,
        "config": config
    }).execute()

    supabase.table("sessions").update({"status": "done"}).eq("id", session_id).execute()

    return {"slug": slug, "config": config}


@router.get("/{session_id}/messages")
async def get_messages(session_id: str):
    result = supabase.table("messages") \
        .select("role, content, created_at") \
        .eq("session_id", session_id) \
        .order("created_at") \
        .execute()
    return {"messages": result.data}
