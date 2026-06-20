from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse
from app.db import supabase

router = APIRouter(prefix="/gifts", tags=["gifts"])


@router.get("/{slug}", response_class=HTMLResponse)
async def get_gift(slug: str):
    result = supabase.table("gifts").select("slug, html").eq("slug", slug).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Gift not found")
    return HTMLResponse(content=result.data[0]["html"])
