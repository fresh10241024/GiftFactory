from __future__ import annotations

from copy import deepcopy
from typing import Any

from app.config import settings

DEFAULT_ASSET_NAMES = ["1.webp", "2.webp", "3.webp", "4.webp", "5.webp"]


def _frontend_asset_url(filename: str) -> str:
    base = settings.frontend_url.rstrip("/")
    return f"{base}/{filename.lstrip('/')}"


def _normalize_asset_path(value: Any) -> Any:
    if isinstance(value, str) and value.startswith(("./", "/")):
        return _frontend_asset_url(value)
    return value


def _normalize_manifest_assets(manifest: dict) -> dict:
    normalized = deepcopy(manifest)
    blocks = normalized.get("blocks")
    if not isinstance(blocks, list):
        return normalized

    for block in blocks:
        if not isinstance(block, dict):
            continue

        data = block.get("data")
        if not isinstance(data, dict):
            continue

        block_name = block.get("block")
        if block_name == "opening-title":
            data["image"] = _normalize_asset_path(data.get("image"))
        elif block_name == "photo-exploration-ui":
            photos = data.get("photos")
            if isinstance(photos, list):
                for photo in photos:
                    if isinstance(photo, dict):
                        photo["src"] = _normalize_asset_path(photo.get("src"))
        elif block_name == "closing-memory-fall":
            images = data.get("images")
            if isinstance(images, list):
                data["images"] = [_normalize_asset_path(image) for image in images]

    return normalized


def _build_manifest(state: dict[str, Any]) -> dict:
    recipient_name = state.get("recipient_name") or "小林"
    sender_name = state.get("sender_name") or "晓明"
    occasion = state.get("occasion") or "birthday"

    return {
        "version": "1.0",
        "meta": {
            "language": "zh",
            "theme": "dark-memory",
            "title": "A small gallery of us",
            "recipientName": recipient_name,
            "senderName": sender_name,
            "occasion": occasion,
            "createdBy": "ai",
        },
        "blocks": [
            {
                "id": "opening-1",
                "block": "opening-title",
                "data": {
                    "headline": "For the one who stayed",
                    "subheadline": "A small website made from the moments that kept returning.",
                    "kicker": "Gift Factory presents",
                    "image": _frontend_asset_url("1.webp"),
                    "imageAlt": "Opening memory",
                    "accentColor": "#b7ff4a",
                },
            },
            {
                "id": "photo-stage-1",
                "block": "photo-exploration-ui",
                "data": {
                    "photos": [
                        {
                            "src": _frontend_asset_url("1.webp"),
                            "alt": "Warm morning memory",
                            "title": "The Summer We Kept",
                            "eyebrow": "MEMORY 01",
                            "summary": "A quiet afternoon folded into light, color, and the small details that stayed.",
                            "detail": "那天其实没有发生什么惊天动地的事情，但正因为这样，它才像一张真正属于我们的照片。光线、空气、走过的路，还有你说话时很轻的语气，都被留在这里。",
                            "primaryColor": "#9cc9ff",
                        },
                        {
                            "src": _frontend_asset_url("2.webp"),
                            "alt": "Soft outdoor light",
                            "title": "Blue Hour Promise",
                            "eyebrow": "MEMORY 02",
                            "summary": "A frame for the promise to meet again when the sky turns blue.",
                            "detail": "有些回忆不需要被解释得太完整，只要一个颜色、一个地点、一个当时没有说出口的念头，就足够把人带回去。",
                            "primaryColor": "#86dec7",
                        },
                        {
                            "src": _frontend_asset_url("3.webp"),
                            "alt": "Blue-toned scene",
                            "title": "After the Rain",
                            "eyebrow": "MEMORY 03",
                            "summary": "The kind of stillness that arrives after laughter, weather, and long walks.",
                            "detail": "雨停以后，很多东西都变得安静。我们好像也没有刻意记住什么，但后来想起来，偏偏是这种安静最清楚。",
                            "primaryColor": "#b8a5ff",
                        },
                        {
                            "src": _frontend_asset_url("4.webp"),
                            "alt": "Quiet frame",
                            "title": "Quiet Frame",
                            "eyebrow": "MEMORY 04",
                            "summary": "A small cinematic pause before the evening changed color.",
                            "detail": "这张照片像一小段暂停。它没有催促任何事情发生，只是把那个瞬间放慢，留给以后慢慢看。",
                            "primaryColor": "#f2b48d",
                        },
                        {
                            "src": _frontend_asset_url("5.webp"),
                            "alt": "Muted cinematic moment",
                            "title": "Last Light",
                            "eyebrow": "MEMORY 05",
                            "summary": "The final glow before the day turned into something softer.",
                            "detail": "最后一点光落下来的时候，很多普通的东西都会突然变得郑重。也许礼物最重要的部分，就是把这种郑重留下来。",
                            "primaryColor": "#dbe981",
                        },
                    ]
                },
            },
            {
                "id": "closing-1",
                "block": "closing-memory-fall",
                "data": {
                    "headline": "Keep this close",
                    "message": "Some memories do not end. They keep finding their way back into view.",
                    "signature": f"From {sender_name}",
                    "images": [_frontend_asset_url(name) for name in DEFAULT_ASSET_NAMES],
                    "accentColor": "#f2b48d",
                },
            },
        ],
    }


def build_gift_manifest(state: dict | None = None, plan: dict | None = None, slug: str | None = None) -> dict:
    # MVP: keep the approved-block manifest structure static for now, but
    # thread through state/plan so we can evolve this into a real mapper next.
    _ = plan, slug
    return _normalize_manifest_assets(_build_manifest((state or {})))


def build_mock_gift_manifest(slug: str, session: dict | None = None) -> dict:
    state = (session or {}).get("style_summary") or {}
    return build_gift_manifest(state=state, slug=slug)


def normalize_gift_manifest(value: Any) -> dict | None:
    if not isinstance(value, dict):
        return None
    if value.get("version") != "1.0":
        return None
    blocks = value.get("blocks")
    if not isinstance(blocks, list):
        return None
    return _normalize_manifest_assets(value)
