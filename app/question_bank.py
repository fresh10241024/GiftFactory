"""
Gift question bank — 6 psychological entry points.

Instead of asking for specific data fields (song / memory / occasion),
questions are organized by HOW people access their feelings, based on
cognitive interview research and narrative psychology:

  recipient    → always first; establishes who this is for
  scene        → sensory context reinstatement; unlocks episodic memory
  unspoken     → surfaces things people have been meaning to say
  symbol       → evocative anchor: song, place, smell, color, object
  emotion      → the core feeling only this person triggers
  observation  → small behavioral details that reveal real knowing
  contrast     → what makes this relationship singular (enrichment)

Different people have different access channels — one person connects
through music, another through a specific place, another through what
they notice. All channels produce rich content for gift generation.

Backend injects {NEXT_FOCUS} into the system prompt:
  - One-line description of what to collect
  - 3–5 example phrasings (Claude can use, adapt, or riff on these
    based on what the user has already shared in the conversation)

Claude reads the full conversation and generates the most contextually
appropriate question. The bank is a quality guardrail, not a script.
"""

from dataclasses import dataclass, field
from typing import List, Optional, Set


MAX_TURNS = 10


@dataclass
class Slot:
    name: str
    focus: str
    examples: List[str]
    state_keys: List[str]   # state fields that indicate this slot is filled
    any_key: bool = False   # if True, filled when ANY key is present (not all)


_SLOTS: List[Slot] = [

    Slot(
        name="recipient",
        focus="Who is this gift for — name, nickname, or who they are to the user",
        examples=[
            "Who's this for?",
            "Who are you making this for?",
            "Who's on your mind?",
        ],
        state_keys=["recipient_name"],
    ),

    Slot(
        name="scene",
        focus="A specific moment, place, or scene with this person — concrete sensory details",
        examples=[
            "Where were you the last time you felt really close to them?",
            "Walk me through a moment with them — where were you, what were you doing?",
            "Is there a place that's kind of 'yours'?",
            "What's a scene from your time together you could close your eyes and see?",
            "What were you doing the first time you realized how much they mattered?",
        ],
        state_keys=["key_scene"],
    ),

    Slot(
        name="unspoken",
        focus="Something the user has been meaning to say — the core message of this gift",
        examples=[
            "What's something you've thought a hundred times but never said out loud?",
            "If they could read one sentence right now, what would it be?",
            "What do you wish they knew?",
            "What's the thing you always mean to say but never quite find the moment for?",
            "If you could leave them a note they'd find years from now, what would it say?",
        ],
        state_keys=["user_own_words"],
    ),

    Slot(
        name="symbol",
        focus="An evocative anchor: a song, place, smell, color, season, or object associated with them",
        examples=[
            "Is there a song, place, or smell that instantly makes you think of them?",
            "What do you see, hear, or smell that makes you immediately think of them?",
            "Is there something — a place, a season, a song — that's become theirs in your mind?",
            "What object or place is just... them?",
            "What sensory thing carries them for you — a smell, a color, a sound, a song?",
        ],
        state_keys=["song", "symbol"],
        any_key=True,
    ),

    Slot(
        name="emotion",
        focus="The specific feeling this person gives the user — something only they trigger",
        examples=[
            "What does being around them do to you?",
            "What feeling do you only have with them?",
            "What's the mood when you're together?",
            "What do you want them to feel when they see this?",
        ],
        state_keys=["core_emotion"],
    ),

    Slot(
        name="observation",
        focus="A small, specific thing they do — the kind of detail only someone who really knows them would notice",
        examples=[
            "What's something they do that nobody else would notice?",
            "What's a habit or gesture that's totally them?",
            "What's the first thing you picture when you think of them?",
            "What small thing they do do you love most?",
        ],
        state_keys=["observation"],
    ),

    Slot(
        name="contrast",
        focus="What makes this relationship singular — what they bring out in the user that nobody else does",
        examples=[
            "What do they bring out in you that nobody else does?",
            "What's different about who you are when you're around them?",
            "What makes them different from anyone else you know?",
            "What does your relationship have that's just yours?",
        ],
        state_keys=[],  # enrichment — never "filled", asked after ≥4 core slots
    ),
]

_SLOT_MAP = {s.name: s for s in _SLOTS}
_PRIORITY = [s.name for s in _SLOTS]


def _is_filled(slot: Slot, state: dict) -> bool:
    if not slot.state_keys:
        return False
    if slot.any_key:
        return any(state.get(k) for k in slot.state_keys)
    return all(state.get(k) for k in slot.state_keys)


def next_slot(state: dict) -> Optional[Slot]:
    """Return the highest-priority unfilled slot, or None if all core slots are done."""
    filled_count = sum(1 for s in _SLOTS if s.state_keys and _is_filled(s, state))

    for name in _PRIORITY:
        slot = _SLOT_MAP[name]
        if name == "contrast":
            # Only ask after ≥4 core slots are collected
            if filled_count >= 4:
                return slot
        elif not _is_filled(slot, state):
            return slot

    return None


def build_focus_injection(slot: Slot) -> str:
    examples = "\n".join(f'  • "{e}"' for e in slot.examples)
    return (
        f"【NEXT FOCUS】\n"
        f"Collect: {slot.focus}\n"
        f"Example phrasings — use, adapt, or riff on these based on what the user has shared:\n"
        f"{examples}"
    )
