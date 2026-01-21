from __future__ import annotations

import re
from dataclasses import dataclass
from typing import List, Tuple, Dict

import spacy
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

# Load once at import (fine for dev + small apps)
_NLP = spacy.load("en_core_web_sm")
_VADER = SentimentIntensityAnalyzer()

# Basic cleanup + normalization helpers
_punct_re = re.compile(r"[^\w\s-]")


def normalize_phrase(s: str) -> str:
    s = s.strip().lower()
    s = _punct_re.sub("", s)
    s = re.sub(r"\s+", " ", s)
    return s


def sentence_polarity(sentence: str) -> int:
    #
    #Returns:
    #  +1 for positive
    #  -1 for negative
    #  0 for neutral
    #
    scores = _VADER.polarity_scores(sentence)
    compound = scores["compound"]

    # thresholds: tweak later
    if compound >= 0.15:
        return 1
    if compound <= -0.15:
        return -1
    return 0


def extract_candidate_phrases(sentence: str) -> List[str]:
    #
    #Extracts trait-like phrases from a sentence using noun chunks.
    #Example: "very funny and outgoing" -> ["funny", "outgoing"]
    #
    doc = _NLP(sentence)

    phrases: List[str] = []

    # Noun chunks are a good baseline for "traits" / "issues"
    for chunk in doc.noun_chunks:
        text = normalize_phrase(chunk.text)
        if not text:
            continue
        # Drop super-generic chunks
        if text in {"he", "she", "they", "him", "her", "them", "person", "guy", "kid", "student"}:
            continue
        # Avoid chunks that are too long
        if len(text.split()) > 5:
            continue
        phrases.append(text)

    # Fallback: grab adjective tokens (often traits)
    for token in doc:
        if token.pos_ == "ADJ":
            text = normalize_phrase(token.lemma_)
            if text and text not in phrases:
                phrases.append(text)

    # Dedup while preserving order
    seen = set()
    out = []
    for p in phrases:
        if p not in seen:
            seen.add(p)
            out.append(p)
    return out


def split_on_contrast(text: str) -> List[str]:
    # split on common contrast markers
    # keep it simple; we can refine later
    parts = re.split(r"\b(but|however|though|although|sometimes)\b", text, flags=re.IGNORECASE)
    # re.split keeps the separators; rebuild into chunks
    chunks: List[str] = []
    buf = ""
    for p in parts:
        p = p.strip()
        if not p:
            continue
        if p.lower() in {"but", "however", "though", "although", "sometimes"}:
            # start a new chunk
            if buf.strip():
                chunks.append(buf.strip())
            buf = ""
        else:
            if buf:
                buf += " " + p
            else:
                buf = p
    if buf.strip():
        chunks.append(buf.strip())
    return chunks


def extract_candidate_phrases(sentence: str) -> List[str]:
    doc = _NLP(sentence)
    phrases: List[str] = []

    # noun chunks
    for chunk in doc.noun_chunks:
        text = normalize_phrase(chunk.text)
        if not text:
            continue
        if text in {"he", "she", "they", "him", "her", "them", "person", "guy", "kid", "student", "people"}:
            continue
        if len(text.split()) > 5:
            continue
        phrases.append(text)

    # adjectives
    for token in doc:
        if token.pos_ == "ADJ":
            text = normalize_phrase(token.lemma_)
            if text and text not in phrases:
                phrases.append(text)

    # slang/descriptive nouns fallback (ex: "chiller")
    for token in doc:
        if token.pos_ in {"NOUN", "PROPN"}:
            t = normalize_phrase(token.text)
            if not t:
                continue
            if len(t) <= 2:
                continue
            # heuristic: descriptive "-er" nouns often represent traits (chiller/talker)
            if t.endswith("er") and t not in phrases:
                phrases.append(t)

    # dedup
    seen = set()
    out = []
    for p in phrases:
        if p not in seen:
            seen.add(p)
            out.append(p)
    return out


def analyze_comment(comment: str, vote: int) -> List[Tuple[int, str, str]]:
    comment = (comment or "").strip()
    if not comment:
        return []

    # NEW: If the comment is super short (e.g. "chiller", "outgoing", "rude"),
    # treat it as a direct trait and trust the vote polarity.
    # This fixes slang / one-word feedback that spaCy may not chunk well.
    if len(comment.split()) <= 3:
        if vote == 1:
            return [(1, comment, comment)]
        if vote == -1:
            return [(-1, comment, comment)]
        return []

    doc = _NLP(comment)
    results: List[Tuple[int, str, str]] = []

    for sent in doc.sents:
        s = sent.text.strip()
        if not s:
            continue

        chunks = split_on_contrast(s)
        for chunk in chunks:
            pol = sentence_polarity(chunk)

            # if user voted -1 and sentiment is neutral, treat as negative
            if pol == 0 and vote == -1:
                pol = -1

            if pol == 0:
                continue

            phrases = extract_candidate_phrases(chunk)
            for ph in phrases:
                if len(ph) <= 2:
                    continue
                results.append((pol, ph, chunk))

    return results


_STOP_WORDS = {
    "very", "really", "pretty", "kind", "sort", "somewhat", "sometimes",
    "guy", "person", "kid", "student", "dude", "man", "woman"
}
# Map variants/synonyms -> canonical trait label
# Keep this small + intentional (easy to explain + avoids bad merges)
# ----------------------------
# Trait normalization
# ----------------------------

# Multi-word phrases first (most precise)
_PHRASE_MAP = {
    # communication style / respect
    "talks over people": "interrupts",
    "talks over others": "interrupts",
    "talks over": "interrupts",
    "cuts people off": "interrupts",
    "cuts others off": "interrupts",
    "interrupts people": "interrupts",
    "interrupts others": "interrupts",
    "doesnt listen": "poor listener",
    "doesn't listen": "poor listener",
    "not a good listener": "poor listener",
    "poor listener": "poor listener",
    "doesnt listen well": "poor listener",
    "doesn't listen well": "poor listener",

    "came across disrespectful": "rude",
    "was disrespectful": "rude",
    "acted disrespectful": "rude",
    "rude to people": "rude",
    "rude to others": "rude",
    "mean to people": "mean",
    "mean to others": "mean",
    "talks down to people": "condescending",
    "talks down to others": "condescending",
    "looked down on people": "condescending",
    "looked down on others": "condescending",

    # teamwork / social
    "easy to talk to": "approachable",
    "easy to speak with": "approachable",
    "easy to communicate with": "approachable",
    "good to talk to": "approachable",

    "gets along with others": "team player",
    "works well with others": "team player",
    "good with others": "team player",
    "good teammate": "team player",
    "team player": "team player",

    "good leader": "leadership",
    "natural leader": "leadership",
    "shows leadership": "leadership",

    # vibe / energy
    "laid back": "chill",
    "easygoing": "chill",
    "easy going": "chill",
    "go with the flow": "chill",
    "lowkey": "chill",

    # reliability
    "shows up on time": "punctual",
    "always on time": "punctual",
    "on time": "punctual",

    "hard working": "hardworking",
    "works hard": "hardworking",
    "puts in effort": "hardworking",
    "high effort": "hardworking",

    "didnt try": "low effort",
    "didn't try": "low effort",
    "low effort": "low effort",
    "seemed lazy": "lazy",

    # social dominance
    "takes over conversations": "dominates conversation",
    "dominates conversations": "dominates conversation",
    "dominates conversation": "dominates conversation",

    # positivity / friendliness
    "very nice guy": "nice",
    "nice guy": "nice",
    "nice person": "nice",
    "really nice": "nice",
    "super nice": "nice",

    "very friendly": "friendly",
    "super friendly": "friendly",
    "really friendly": "friendly",
    "friendly guy": "friendly",
    "friendly person": "friendly",

    # confidence / behavior
    "too confident": "arrogant",
    "overconfident": "arrogant",
    "full of himself": "arrogant",
    "full of herself": "arrogant",
    "acts better than others": "arrogant",

    # maturity
    "immature behavior": "immature",
    "acts immature": "immature",
    "seemed immature": "immature",

    # boring / indifferent
    "kind of boring": "boring",
    "pretty boring": "boring",
    "seemed boring": "boring",
}

# Single-word mapping (less precise, so keep conservative)
_WORD_MAP = {
    # positives
    "friendly": "friendly",
    "nice": "nice",
    "kind": "nice",
    "sweet": "nice",
    "polite": "polite",
    "respectful": "respectful",
    "funny": "funny",
    "hilarious": "funny",
    "humorous": "funny",
    "outgoing": "outgoing",
    "social": "outgoing",
    "confident": "confident",
    "approachable": "approachable",
    "chill": "chill",
    "chiller": "chill",
    "easygoing": "chill",
    "laidback": "chill",
    "hardworking": "hardworking",
    "reliable": "reliable",
    "punctual": "punctual",
    "helpful": "helpful",
    "supportive": "supportive",
    "motivated": "motivated",
    "driven": "motivated",
    "smart": "smart",
    "intelligent": "smart",
    "curious": "curious",

    # negatives
    "rude": "rude",
    "disrespectful": "rude",
    "mean": "mean",
    "annoying": "annoying",
    "arrogant": "arrogant",
    "condescending": "condescending",
    "dismissive": "dismissive",
    "lazy": "lazy",
    "boring": "boring",
    "immature": "immature",
    "awkward": "awkward",
    "quiet": "quiet",  # neutral-ish trait; keep but use with caution
    "shy": "shy",
    "aggressive": "aggressive",
    "argumentative": "argumentative",
    "unreliable": "unreliable",
    "inconsistent": "unreliable",
    "late": "unpunctual",
    "unpunctual": "unpunctual",
    "interrupts": "interrupts",
}

def apply_synonyms(trait: str) -> str:
    t = normalize_phrase(trait)

    # phrase map first
    if t in _PHRASE_MAP:
        return _PHRASE_MAP[t]

    # then single word map (only if it's exactly one word)
    if " " not in t and t in _WORD_MAP:
        return _WORD_MAP[t]

    return t


def canonicalize(trait: str) -> str:
    """
    Normalizes traits (e.g., 'very nice guy' -> 'nice'),
    then applies a controlled synonym map (e.g., 'friendly' -> 'nice').
    """
    doc = _NLP(trait)
    tokens = []
    for t in doc:
        if t.is_stop:
            continue
        lemma = normalize_phrase(t.lemma_)
        if not lemma or lemma in _STOP_WORDS:
            continue
        tokens.append(lemma)

    if len(tokens) == 0:
        cleaned = normalize_phrase(trait)
    elif len(tokens) == 1:
        cleaned = tokens[0]
    else:
        cleaned = " ".join(tokens[:3])  # cap length

    # Apply synonym map (controlled merges)
    return apply_synonyms(cleaned)
from embeddings import embed_texts
from qdrant_utils import search_trait, upsert_trait

import random
_NEXT_ID = random.randint(100000, 999999)


def group_trait(trait: str, threshold: float = 0.75) -> str:
    global _NEXT_ID

    vec = embed_texts([trait])[0]
    hits = search_trait(vec, limit=1)

    if hits and hits[0].score is not None and hits[0].score >= threshold:
        payload = hits[0].payload or {}
        label = payload.get("label")

        print(f"[group_trait] '{trait}' -> '{label}' score={hits[0].score:.3f}")
        if isinstance(label, str) and label:
            return label

    # new trait cluster
    point_id = _NEXT_ID
    _NEXT_ID += 1
    upsert_trait(point_id, vec, trait)
    print(f"[group_trait] NEW CLUSTER '{trait}' id={point_id}")
    return trait


def build_profile(submissions: List[Tuple[int, str]], top_k: int = 8) -> Dict:
    """
    submissions: list of (vote, comment)
    """
    pos_counts: Dict[str, int] = {}
    neg_counts: Dict[str, int] = {}
    pos_examples: Dict[str, List[str]] = {}
    neg_examples: Dict[str, List[str]] = {}

    for vote, comment in submissions:
        if not comment.strip():
            continue

        if vote == 0:
            continue
        for pol, trait, evidence in analyze_comment(comment, vote):
            trait = canonicalize(trait)

            # If you're also doing Qdrant grouping, keep this:
            try:
                trait = group_trait(trait)
            except Exception:
                pass

            if pol > 0:
                pos_counts[trait] = pos_counts.get(trait, 0) + 1
                pos_examples.setdefault(trait, [])
                if len(pos_examples[trait]) < 3 and evidence not in pos_examples[trait]:
                    pos_examples[trait].append(evidence)
            else:
                neg_counts[trait] = neg_counts.get(trait, 0) + 1
                neg_examples.setdefault(trait, [])
                if len(neg_examples[trait]) < 3 and evidence not in neg_examples[trait]:
                    neg_examples[trait].append(evidence)

    positives = sorted(pos_counts.items(), key=lambda x: (-x[1], x[0]))[:top_k]
    negatives = sorted(neg_counts.items(), key=lambda x: (-x[1], x[0]))[:top_k]

    return {
        "positives": [
            {"label": label, "count": count, "examples": pos_examples.get(label, [])}
            for label, count in positives
        ],
        "negatives": [
            {"label": label, "count": count, "examples": neg_examples.get(label, [])}
            for label, count in negatives
        ],
    }

