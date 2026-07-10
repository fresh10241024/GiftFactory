from pydantic import BaseModel
from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse
from app.db import supabase
from app.gift_manifest import (
    ManifestValidationError,
    build_manifest_html,
    build_mock_gift_manifest,
    validate_gift_manifest,
)

router = APIRouter(prefix="/gifts", tags=["gifts"])


class GiftManifestPatchRequest(BaseModel):
    config: dict


@router.get("/{slug}/config")
async def get_gift_config(slug: str):
    result = supabase.table("gifts").select("*").eq("slug", slug).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Gift not found")

    gift = result.data[0]
    stored_config = gift.get("config")
    if stored_config:
        try:
            return validate_gift_manifest(stored_config)
        except ManifestValidationError:
            pass

    session_id = gift.get("session_id")
    session = None
    if session_id:
        session_result = supabase.table("sessions").select("style_summary").eq("id", session_id).limit(1).execute()
        if session_result.data:
            session = session_result.data[0]

    return build_mock_gift_manifest(slug, session)


@router.patch("/{slug}/config")
async def patch_gift_config(slug: str, body: GiftManifestPatchRequest):
    result = supabase.table("gifts").select("*").eq("slug", slug).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Gift not found")

    try:
        manifest = validate_gift_manifest(body.config)
    except ManifestValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    html = build_manifest_html(manifest, slug=slug)
    supabase.table("gifts").update({
        "config": manifest,
        "html": html,
    }).eq("slug", slug).execute()
    return {"status": "ok", "slug": slug, "config": manifest}


@router.get("/{slug}", response_class=HTMLResponse)
async def get_gift(slug: str):
    result = supabase.table("gifts").select("slug, html").eq("slug", slug).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Gift not found")
    return HTMLResponse(content=result.data[0]["html"])
