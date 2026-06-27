"""
Gift question bank — selects the next question to ask based on what's been collected.

Each question targets one "slot" in the gift state. The selection pipeline:
  1. Find the highest-priority unfilled slot
  2. Filter questions for that slot
  3. Exclude already-asked questions
  4. Weighted random sample

Slot priority: recipient → song → memory → message → relationship → occasion → emotion → detail

"detail" is an open-ended enrichment slot asked after core slots are filled.
At turn 10 the backend forces ready=true regardless of slot fill status.
"""

from dataclasses import dataclass
from typing import List, Optional, Set
import random


@dataclass
class GiftQuestion:
    text: str
    slot: str     # recipient | song | memory | message | relationship | occasion | emotion | detail
    weight: float = 1.0


# Maps state dict keys → slot names
STATE_TO_SLOT = {
    "recipient_name": "recipient",
    "song":           "song",
    "key_scene":      "memory",
    "user_own_words": "message",
    "relationship":   "relationship",
    "occasion":       "occasion",
    "core_emotion":   "emotion",
}

SLOT_PRIORITY = [
    "recipient",
    "song",
    "memory",
    "message",
    "relationship",
    "occasion",
    "emotion",
    "detail",
]

MAX_TURNS = 10

_QUESTIONS: List[GiftQuestion] = [

    # ── Recipient ─────────────────────────────────────────────────────────
    GiftQuestion("Who's this gift for?",               slot="recipient", weight=2.0),
    GiftQuestion("Who are you thinking about?",        slot="recipient"),
    GiftQuestion("Who's on your mind right now?",      slot="recipient"),

    # ── Song ─────────────────────────────────────────────────────────────
    GiftQuestion("Is there a song that makes you think of them?",       slot="song", weight=1.5),
    GiftQuestion("What song reminds you of this person?",               slot="song"),
    GiftQuestion("What would be the soundtrack to your relationship?",  slot="song"),
    GiftQuestion("Any music that feels like them?",                     slot="song"),
    GiftQuestion("Does a song come to mind when you think of them?",    slot="song"),
    GiftQuestion("What song plays when you miss them?",                 slot="song"),

    # ── Memory ────────────────────────────────────────────────────────────
    GiftQuestion("Is there a moment you two shared that you'll never forget?",      slot="memory", weight=1.5),
    GiftQuestion("Tell me about a specific moment — where were you, what were you doing?", slot="memory"),
    GiftQuestion("What's a memory that captures how you feel about them?",          slot="memory"),
    GiftQuestion("When did you last feel really close to them?",                    slot="memory"),
    GiftQuestion("Is there a place that's kind of 'yours'?",                        slot="memory"),
    GiftQuestion("What's a moment with them you'd want to keep forever?",           slot="memory"),
    GiftQuestion("Walk me through a day or moment with them.",                      slot="memory"),

    # ── Message ───────────────────────────────────────────────────────────
    GiftQuestion("If you could say one thing to them right now, what would it be?", slot="message", weight=1.5),
    GiftQuestion("What's something you've always wanted to tell them?",             slot="message"),
    GiftQuestion("What do you most want them to know?",                             slot="message"),
    GiftQuestion("What would your message to them be — just one sentence?",         slot="message"),
    GiftQuestion("What's the thing you've never quite found the right words for?",  slot="message"),
    GiftQuestion("If you wrote them a note right now, what would it say?",          slot="message"),

    # ── Relationship ──────────────────────────────────────────────────────
    GiftQuestion("How long have you two known each other?",    slot="relationship"),
    GiftQuestion("How would you describe your bond?",          slot="relationship"),
    GiftQuestion("What does this person mean to you?",         slot="relationship"),
    GiftQuestion("What kind of relationship do you share?",    slot="relationship"),

    # ── Occasion ──────────────────────────────────────────────────────────
    GiftQuestion("What's the occasion?",                                    slot="occasion"),
    GiftQuestion("Is there something specific you're celebrating?",         slot="occasion"),
    GiftQuestion("What's making right now feel like the right moment?",     slot="occasion"),
    GiftQuestion("What's the reason for this gift?",                        slot="occasion"),

    # ── Emotion ───────────────────────────────────────────────────────────
    GiftQuestion("What feeling do you most want this gift to carry?",   slot="emotion"),
    GiftQuestion("If this gift had a mood, what would it be?",          slot="emotion"),
    GiftQuestion("What do you want them to feel when they open this?",  slot="emotion"),
    GiftQuestion("What's the main vibe you're going for?",              slot="emotion"),

    # ── Detail (enrichment, asked after core slots filled) ────────────────
    GiftQuestion("Is there a color, place, or thing that's totally them?",                     slot="detail"),
    GiftQuestion("What's something small about them that others might miss?",                  slot="detail"),
    GiftQuestion("What would you want a stranger to understand about this person?",            slot="detail"),
    GiftQuestion("Is there an inside joke or detail that makes your relationship unique?",     slot="detail"),
    GiftQuestion("What makes them, them — in one breath?",                                     slot="detail"),
    GiftQuestion("Anything else I should know to make this perfect?",                          slot="detail"),
    GiftQuestion("What's a little thing they do that you love?",                               slot="detail"),
    GiftQuestion("Describe them in three words.",                                              slot="detail"),
]


class QuestionBank:
    def __init__(self):
        self._questions = _QUESTIONS

    def next(self, state: dict, asked: Set[str] = None) -> Optional[GiftQuestion]:
        asked = asked or set()
        filled = {slot for key, slot in STATE_TO_SLOT.items() if state.get(key)}

        target = None
        for slot in SLOT_PRIORITY:
            if slot == "detail":
                if len(filled) >= 4:
                    target = slot
                    break
            elif slot not in filled:
                target = slot
                break

        if not target:
            return None

        pool = [q for q in self._questions if q.slot == target and q.text not in asked]
        if not pool:
            pool = [q for q in self._questions if q.slot == target]
        if not pool:
            return None

        weights = [q.weight for q in pool]
        return random.choices(pool, weights=weights, k=1)[0]
