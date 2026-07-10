from __future__ import annotations

from copy import deepcopy
from dataclasses import dataclass, field
from threading import RLock
from time import time
from typing import Any


@dataclass
class SessionCacheEntry:
    state: dict[str, Any] = field(default_factory=dict)
    messages: list[dict[str, str]] = field(default_factory=list)
    status: str | None = None
    updated_at: float = field(default_factory=time)


_CACHE: dict[str, SessionCacheEntry] = {}
_LOCK = RLock()


def ensure_session_cache(
    session_id: str,
    *,
    state: dict[str, Any] | None = None,
    status: str | None = None,
    messages: list[dict[str, str]] | None = None,
) -> SessionCacheEntry:
    with _LOCK:
        entry = _CACHE.get(session_id)
        if entry is None:
            entry = SessionCacheEntry()
            _CACHE[session_id] = entry

        if state is not None:
            entry.state = deepcopy(state)
        if status is not None:
            entry.status = status
        if messages is not None:
            entry.messages = deepcopy(messages)

        entry.updated_at = time()
        return entry


def get_session_cache(session_id: str) -> SessionCacheEntry | None:
    with _LOCK:
        entry = _CACHE.get(session_id)
        return deepcopy(entry) if entry else None


def drop_session_cache(session_id: str) -> None:
    with _LOCK:
        _CACHE.pop(session_id, None)


def set_session_state(session_id: str, state: dict[str, Any]) -> SessionCacheEntry:
    return ensure_session_cache(session_id, state=state)


def merge_session_state(session_id: str, patch: dict[str, Any]) -> SessionCacheEntry:
    with _LOCK:
        entry = _CACHE.get(session_id) or SessionCacheEntry()
        entry.state = {**entry.state, **patch}
        entry.updated_at = time()
        _CACHE[session_id] = entry
        return deepcopy(entry)


def set_session_status(session_id: str, status: str) -> SessionCacheEntry:
    return ensure_session_cache(session_id, status=status)


def append_session_message(session_id: str, role: str, content: str) -> SessionCacheEntry:
    with _LOCK:
        entry = _CACHE.get(session_id) or SessionCacheEntry()
        entry.messages.append({"role": role, "content": content})
        entry.updated_at = time()
        _CACHE[session_id] = entry
        return deepcopy(entry)


def get_session_state(session_id: str, fallback: dict[str, Any] | None = None) -> dict[str, Any]:
    entry = get_session_cache(session_id)
    if entry and entry.state is not None:
        return entry.state
    return deepcopy(fallback or {})


def get_session_messages(session_id: str) -> list[dict[str, str]]:
    entry = get_session_cache(session_id)
    return entry.messages if entry else []
