from __future__ import annotations

import html as html_lib
import json
import re
from copy import deepcopy
from functools import lru_cache
from pathlib import Path
from typing import Any

from app.config import settings

ROOT_DIR = Path(__file__).resolve().parents[1]
REGISTRY_PATH = ROOT_DIR / "fronted.hy" / "blocks" / "registry.json"
APPROVED_BLOCK_ORDER = ["opening-title", "photo-exploration-ui", "closing-memory-fall"]
CANONICAL_BLOCK_IDS = {
    "opening-title": "opening-1",
    "photo-exploration-ui": "photo-stage-1",
    "closing-memory-fall": "closing-1",
}
DEFAULT_ASSET_NAMES = ["1.webp", "2.webp", "3.webp", "4.webp", "5.webp"]


class ManifestValidationError(ValueError):
    pass


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


@lru_cache(maxsize=1)
def load_registry() -> dict:
    return json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))


def get_approved_registry_blocks() -> list[dict]:
    registry = load_registry()
    blocks = registry.get("blocks", [])
    if not isinstance(blocks, list):
        return []
    return [block for block in blocks if isinstance(block, dict) and block.get("status") == "approved"]


def get_registry_block_ids() -> set[str]:
    return {block["id"] for block in get_approved_registry_blocks() if isinstance(block.get("id"), str)}


def get_registry_block(block_id: str) -> dict | None:
    for block in get_approved_registry_blocks():
        if block.get("id") == block_id:
            return block
    return None


@lru_cache(maxsize=None)
def load_block_schema(block_id: str) -> dict:
    registry_block = get_registry_block(block_id)
    if not registry_block:
        raise ManifestValidationError(f"Block is not approved or missing from registry: {block_id}")

    schema_path = registry_block.get("schemaPath")
    if not isinstance(schema_path, str) or not schema_path:
        raise ManifestValidationError(f"Registry entry missing schemaPath for block: {block_id}")

    schema_file = ROOT_DIR / schema_path
    return json.loads(schema_file.read_text(encoding="utf-8"))


def build_manifest_prompt_payload(state: dict | None = None, plan: dict | None = None) -> dict[str, str]:
    approved_registry = load_registry()
    block_schemas = {block_id: load_block_schema(block_id) for block_id in APPROVED_BLOCK_ORDER}
    asset_pool = [_frontend_asset_url(name) for name in DEFAULT_ASSET_NAMES]
    return {
        "state": json.dumps(state or {}, ensure_ascii=False, indent=2),
        "plan": json.dumps(plan or {}, ensure_ascii=False, indent=2),
        "registry": json.dumps(approved_registry, ensure_ascii=False, indent=2),
        "schemas": json.dumps(block_schemas, ensure_ascii=False, indent=2),
        "asset_urls": json.dumps(asset_pool, ensure_ascii=False, indent=2),
    }


def _ensure_string(value: Any, path: str) -> str:
    if not isinstance(value, str):
        raise ManifestValidationError(f"{path} must be a string")
    if not value.strip():
        raise ManifestValidationError(f"{path} must not be empty")
    return value


def _validate_scalar(value: Any, spec: dict, path: str) -> None:
    type_name = spec.get("type")
    required = bool(spec.get("required"))

    if value is None:
        if required:
            raise ManifestValidationError(f"{path} is required")
        return

    if type_name == "string":
        _ensure_string(value, path)
        max_length = spec.get("maxLength")
        if isinstance(max_length, int) and len(value) > max_length:
            raise ManifestValidationError(f"{path} exceeds maxLength {max_length}")
    elif type_name == "color(hex)":
        if not isinstance(value, str) or not re.fullmatch(r"#[0-9A-Fa-f]{6}", value):
            raise ManifestValidationError(f"{path} must be a hex color like #aabbcc")
    elif type_name == "image":
        _ensure_string(value, path)
    else:
        raise ManifestValidationError(f"Unsupported slot type at {path}: {type_name}")


def _validate_value_against_spec(value: Any, spec: dict, path: str) -> None:
    type_name = spec.get("type")
    required = bool(spec.get("required"))

    if value is None:
        if required:
            raise ManifestValidationError(f"{path} is required")
        return

    if type_name in {"string", "color(hex)", "image"}:
        _validate_scalar(value, spec, path)
        return

    if type_name == "object":
        if not isinstance(value, dict):
            raise ManifestValidationError(f"{path} must be an object")
        return

    if type_name == "image[]":
        if not isinstance(value, list):
            raise ManifestValidationError(f"{path} must be an array")
        min_items = spec.get("min")
        max_items = spec.get("max")
        if isinstance(min_items, int) and len(value) < min_items:
            raise ManifestValidationError(f"{path} must contain at least {min_items} items")
        if isinstance(max_items, int) and len(value) > max_items:
            raise ManifestValidationError(f"{path} must contain at most {max_items} items")
        for index, item in enumerate(value):
            _ensure_string(item, f"{path}[{index}]")
        return

    if type_name == "object[]":
        if not isinstance(value, list):
            raise ManifestValidationError(f"{path} must be an array")
        min_items = spec.get("min")
        max_items = spec.get("max")
        if isinstance(min_items, int) and len(value) < min_items:
            raise ManifestValidationError(f"{path} must contain at least {min_items} items")
        if isinstance(max_items, int) and len(value) > max_items:
            raise ManifestValidationError(f"{path} must contain at most {max_items} items")

        item_shape = spec.get("itemShape")
        if not isinstance(item_shape, dict):
            raise ManifestValidationError(f"{path} is missing itemShape")

        for index, item in enumerate(value):
            if not isinstance(item, dict):
                raise ManifestValidationError(f"{path}[{index}] must be an object")
            _validate_object_shape(item, item_shape, f"{path}[{index}]")
        return

    raise ManifestValidationError(f"Unsupported slot type at {path}: {type_name}")


def _validate_object_shape(value: dict, shape: dict, path: str) -> None:
    allowed_keys = set(shape.keys())
    if set(value.keys()) - allowed_keys:
        extras = ", ".join(sorted(set(value.keys()) - allowed_keys))
        raise ManifestValidationError(f"{path} contains unsupported fields: {extras}")

    for key, spec in shape.items():
        _validate_value_against_spec(value.get(key), spec, f"{path}.{key}")


def _schema_allowed_keys(schema: dict) -> set[str]:
    slots = schema.get("slots", {})
    if not isinstance(slots, dict):
        raise ManifestValidationError("Schema slots must be an object")
    return set(slots.keys())


def validate_gift_manifest(value: Any) -> dict:
    if not isinstance(value, dict):
        raise ManifestValidationError("Manifest must be a JSON object")

    if value.get("version") != "1.0":
        raise ManifestValidationError('Manifest version must be exactly "1.0"')

    meta = value.get("meta")
    if not isinstance(meta, dict):
        raise ManifestValidationError("Manifest meta is required")

    allowed_meta_keys = {"language", "theme", "title", "recipientName", "senderName", "occasion", "createdBy"}
    if set(meta.keys()) - allowed_meta_keys:
        extras = ", ".join(sorted(set(meta.keys()) - allowed_meta_keys))
        raise ManifestValidationError(f"Manifest meta contains unsupported fields: {extras}")

    language = _ensure_string(meta.get("language"), "meta.language")
    if language not in {"zh", "en"}:
        raise ManifestValidationError('meta.language must be "zh" or "en"')
    _ensure_string(meta.get("theme"), "meta.theme")
    if meta.get("title") is not None:
        _ensure_string(meta.get("title"), "meta.title")
    if meta.get("recipientName") is not None:
        _ensure_string(meta.get("recipientName"), "meta.recipientName")
    if meta.get("senderName") is not None:
        _ensure_string(meta.get("senderName"), "meta.senderName")
    if meta.get("occasion") is not None:
        _ensure_string(meta.get("occasion"), "meta.occasion")
    if meta.get("createdBy") is not None and meta.get("createdBy") not in {"ai", "user", "mixed"}:
        raise ManifestValidationError('meta.createdBy must be "ai", "user", or "mixed"')

    blocks = value.get("blocks")
    if not isinstance(blocks, list) or not blocks:
        raise ManifestValidationError("Manifest blocks must be a non-empty array")
    if len(blocks) != 3:
        raise ManifestValidationError("Manifest blocks must contain exactly 3 approved blocks")

    expected_order = APPROVED_BLOCK_ORDER
    actual_order = []
    seen_ids: set[str] = set()

    for index, block in enumerate(blocks):
        if not isinstance(block, dict):
            raise ManifestValidationError(f"Block {index} must be an object")

        allowed_block_keys = {"id", "block", "data"}
        if set(block.keys()) - allowed_block_keys:
            extras = ", ".join(sorted(set(block.keys()) - allowed_block_keys))
            raise ManifestValidationError(f"Block {index} contains unsupported fields: {extras}")

        block_id = _ensure_string(block.get("id"), f"blocks[{index}].id")
        if block_id in seen_ids:
            raise ManifestValidationError(f"Duplicate block id: {block_id}")
        seen_ids.add(block_id)

        block_name = _ensure_string(block.get("block"), f"blocks[{index}].block")
        actual_order.append(block_name)
        if block_name not in get_registry_block_ids():
            raise ManifestValidationError(f"Block {block_name} is not approved")

        expected_block_id = CANONICAL_BLOCK_IDS.get(block_name)
        if expected_block_id and block_id != expected_block_id:
            raise ManifestValidationError(f"Block {block_name} must use canonical id {expected_block_id}")

        data = block.get("data")
        if not isinstance(data, dict):
            raise ManifestValidationError(f"blocks[{index}].data must be an object")

        schema = load_block_schema(block_name)
        allowed_keys = _schema_allowed_keys(schema)
        if set(data.keys()) - allowed_keys:
            extras = ", ".join(sorted(set(data.keys()) - allowed_keys))
            raise ManifestValidationError(f"blocks[{index}].data contains unsupported fields: {extras}")

        slots = schema["slots"]
        for slot_name, slot_spec in slots.items():
            _validate_value_against_spec(data.get(slot_name), slot_spec, f"blocks[{index}].data.{slot_name}")

    if actual_order != expected_order:
        raise ManifestValidationError(
            "Manifest blocks must be in approved order: opening-title, photo-exploration-ui, closing-memory-fall"
        )

    return _normalize_manifest_assets(value)


def extract_json_document(text: str) -> Any:
    if not isinstance(text, str) or not text.strip():
        raise ManifestValidationError("Model output is empty")

    stripped = text.strip()
    if stripped.startswith("```"):
        match = re.search(r"```(?:json)?\s*([\s\S]*?)```", stripped)
        if match:
            stripped = match.group(1).strip()

    start = stripped.find("{")
    end = stripped.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ManifestValidationError("Model output does not contain JSON")

    return json.loads(stripped[start : end + 1])


def build_mock_gift_manifest(slug: str, session: dict | None = None) -> dict:
    state = (session or {}).get("style_summary") or {}
    recipient_name = state.get("recipient_name") or "小林"
    sender_name = state.get("sender_name") or "晓明"
    occasion = state.get("occasion") or "birthday"

    manifest = {
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

    return _normalize_manifest_assets(manifest)


def build_manifest_html(manifest: dict, slug: str | None = None) -> str:
    validated = validate_gift_manifest(manifest)
    title = html_lib.escape(validated["meta"].get("title") or "Gift")
    recipient = html_lib.escape(validated["meta"].get("recipientName") or "someone special")
    blocks = validated.get("blocks", [])

    block_items = "\n".join(
        f"<li><strong>{html_lib.escape(block['block'])}</strong>: {html_lib.escape(block.get('id', ''))}</li>"
        for block in blocks
    )
    manifest_json = html_lib.escape(json.dumps(validated, ensure_ascii=False, indent=2))
    slug_note = f"<p>Slug: {html_lib.escape(slug)}</p>" if slug else ""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
  <style>
    body {{ margin: 0; font-family: Arial, sans-serif; background: #050609; color: #fff; }}
    main {{ max-width: 900px; margin: 0 auto; padding: 48px 24px 80px; }}
    pre {{ white-space: pre-wrap; word-break: break-word; background: rgba(255,255,255,0.06); padding: 24px; border-radius: 16px; }}
    ul {{ line-height: 1.8; }}
    .card {{ background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; padding: 24px; margin-top: 24px; }}
    a {{ color: #b7ff4a; }}
  </style>
</head>
<body>
  <main>
    <h1>{title}</h1>
    <p>A gift for {recipient}.</p>
    {slug_note}
    <div class="card">
      <h2>Approved blocks</h2>
      <ul>{block_items}</ul>
    </div>
    <div class="card">
      <h2>Manifest</h2>
      <pre>{manifest_json}</pre>
    </div>
  </main>
</body>
</html>"""
