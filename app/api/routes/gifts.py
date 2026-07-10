from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse
from app.db import supabase
from app.gift_manifest import build_mock_gift_manifest, normalize_gift_manifest

router = APIRouter(prefix="/gifts", tags=["gifts"])


@router.get("/{slug}/config")
async def get_gift_config(slug: str):
    result = supabase.table("gifts").select("*").eq("slug", slug).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Gift not found")

    gift = result.data[0]
    stored_config = normalize_gift_manifest(gift.get("config"))
    if stored_config:
        return stored_config

    session_id = gift.get("session_id")
    session = None
    if session_id:
        session_result = supabase.table("sessions").select("style_summary").eq("id", session_id).limit(1).execute()
        if session_result.data:
            session = session_result.data[0]

    return build_mock_gift_manifest(slug, session)


@router.get("/{slug}", response_class=HTMLResponse)
async def get_gift(slug: str):
    result = supabase.table("gifts").select("slug, html").eq("slug", slug).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Gift not found")
    return HTMLResponse(content=result.data[0]["html"])
