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
    if compound >= 0.25:
        return 1
    if compound <= -0.25:
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


def analyze_comment(comment: str) -> List[Tuple[int, str, str]]:
    doc = _NLP(comment)
    results: List[Tuple[int, str, str]] = []

    for sent in doc.sents:
        s = sent.text.strip()
        if not s:
            continue

        # NEW: split sentence on contrast markers and score each chunk separately
        chunks = split_on_contrast(s)
        for chunk in chunks:
            pol = sentence_polarity(chunk)
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
_SYNONYM_MAP = {
    # positive cluster
    "friendly": "nice",
    "kind": "nice",
    "pleasant": "nice",

    # chill cluster
    "chiller": "chill",
    "chill": "chill",
    "chill person": "chill",
    "laid back": "chill",
    "easygoing": "chill",

    # common negatives
    "annoying": "annoying",
    "interrupts": "talks over people",
    "talks over people": "talks over people",
    "talk over people": "talks over people",
}

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
    return _SYNONYM_MAP.get(cleaned, cleaned)

def build_profile(submission_comments: List[str], top_k: int = 8) -> Dict:
    #
    #Aggregates all extracted traits into ranked positives/negatives with examples.
    #
    pos_counts: Dict[str, int] = {}
    neg_counts: Dict[str, int] = {}
    pos_examples: Dict[str, List[str]] = {}
    neg_examples: Dict[str, List[str]] = {}

    for comment in submission_comments:
        for pol, trait, evidence in analyze_comment(comment):
            trait = canonicalize(trait)

            if pol > 0:
                pos_counts[trait] = pos_counts.get(trait, 0) + 1
                pos_examples.setdefault(trait, [])
                if len(pos_examples[trait]) < 3 and evidence not in pos_examples[trait]:
                    pos_examples[trait].append(evidence)
            elif pol < 0:
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
