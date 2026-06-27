"""
Gift question bank — determines WHAT to collect next; Claude decides HOW to ask it.

The bank picks the next unfilled slot and provides:
  - A one-line focus description (injected into the system prompt)
  - 2–4 example phrasings for that slot (Claude can use, adapt, or riff on them)

Claude reads the full conversation context and generates the question in the most
contextually appropriate way. The bank is a quality guardrail, not a script.

Slot priority: recipient → song → memory → message → relationship → occasion → emotion → detail

MAX_TURNS = 10: at turn 10 the backend forces ready=true regardless of slot fill status.
"""

from dataclasses import dataclass, field
from typing import List, Optional, Set


MAX_TURNS = 10


@dataclass
class Slot:
    name: str
    focus: str              # one-line description of what to collect
    examples: List[str]     # quality example phrasings (Claude can adapt)
    state_keys: List[str]   # state dict keys that indicate this slot is filled


_SLOTS: List[Slot] = [
    Slot(
        name="recipient",
        focus="Who is this gift for? (name or nickname)",
        examples=[
            "Who's this gift for?",
            "Who are you thinking about?",
            "Who's on your mind?",
        ],
        state_keys=["recipient_name"],
    ),
    Slot(
        name="song",
        focus="A song that reminds them of each other, or that captures the relationship",
        examples=[
            "Is there a song that makes you think of them?",
            "What song reminds you of this person?",
            "What would be the soundtrack to your relationship?",
            "Does a song come to mind when you think of them?",
        ],
        state_keys=["song"],
    ),
    Slot(
        name="memory",
        focus="A specific shared moment, place, or scene — concrete details make the gift vivid",
        examples=[
            "Is there a moment you two shared that you'll never forget?",
            "Tell me about a specific moment — where were you, what were you doing?",
            "When did you last feel really close to them?",
            "Is there a place that's kind of 'yours'?",
        ],
        state_keys=["key_scene"],
    ),
    Slot(
        name="message",
        focus="The user's own words — something they want to say to this person",
        examples=[
            "If you could say one thing to them right now, what would it be?",
            "What's something you've always wanted to tell them?",
            "What do you most want them to know?",
            "What's the thing you've never quite found the right words for?",
        ],
        state_keys=["user_own_words"],
    ),
    Slot(
        name="relationship",
        focus="How they know this person — the nature of their connection",
        examples=[
            "How long have you two known each other?",
            "How would you describe your bond?",
            "What does this person mean to you?",
        ],
        state_keys=["relationship"],
    ),
    Slot(
        name="occasion",
        focus="The reason for the gift — what's being celebrated or marked",
        examples=[
            "What's the occasion?",
            "Is there something specific you're celebrating?",
            "What's making right now feel like the right moment?",
        ],
        state_keys=["occasion"],
    ),
    Slot(
        name="emotion",
        focus="The core feeling or mood they want the gift to carry",
        examples=[
            "What feeling do you most want this gift to carry?",
            "If this gift had a mood, what would it be?",
            "What do you want them to feel when they see this?",
        ],
        state_keys=["core_emotion"],
    ),
    Slot(
        name="detail",
        focus="A small, specific detail that makes this person uniquely them",
        examples=[
            "Is there a color, place, or thing that's totally them?",
            "What's something small about them that others might miss?",
            "What makes them, them — in one breath?",
            "Anything else I should know to make this perfect?",
        ],
        state_keys=[],  # enrichment slot — never "filled"
    ),
]

_SLOT_MAP = {s.name: s for s in _SLOTS}
_PRIORITY = [s.name for s in _SLOTS]


def next_slot(state: dict) -> Optional[Slot]:
    """Return the highest-priority unfilled slot, or None if all core slots are done."""
    filled = {
        slot.name
        for slot in _SLOTS
        if slot.state_keys and all(state.get(k) for k in slot.state_keys)
    }

    for name in _PRIORITY:
        slot = _SLOT_MAP[name]
        if name == "detail":
            # Ask detail questions only after ≥4 core slots are collected
            if len(filled) >= 4:
                return slot
        elif name not in filled:
            return slot

    return None


def build_focus_injection(slot: Slot) -> str:
    """Build the NEXT FOCUS block to inject into the system prompt."""
    examples = "\n".join(f'  • "{e}"' for e in slot.examples)
    return (
        f"【NEXT FOCUS】\n"
        f"Collect: {slot.focus}\n"
        f"Example phrasings (use, adapt, or riff on these based on context):\n"
        f"{examples}"
    )
