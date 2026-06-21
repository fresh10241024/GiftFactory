from pathlib import Path

_dir = Path(__file__).parent / "prompts"

def _load(name: str) -> str:
    return (_dir / name).read_text(encoding="utf-8")

CONVERSATION_SYSTEM = _load("conversation.md")
PLAN_PROMPT = _load("plan.md")
GENERATE_WEBSITE_PROMPT = _load("generate.md")

# Legacy — not used in prompts anymore but kept to avoid import errors
DESIGN_SKILLS = ""
