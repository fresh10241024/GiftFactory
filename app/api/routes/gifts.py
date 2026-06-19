from fastapi import APIRouter, HTTPException
from app.db import supabase

router = APIRouter(prefix="/gifts", tags=["gifts"])


@router.get("/{slug}")
async def get_gift(slug: str):
    result = supabase.table("gifts").select("*").eq("slug", slug).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Gift not found")
    gift = result.data[0]
    return {"config": gift["config"], "slug": slug}
