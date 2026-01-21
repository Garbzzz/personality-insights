from __future__ import annotations
from typing import List
from sentence_transformers import SentenceTransformer

_MODEL = SentenceTransformer("all-MiniLM-L6-v2")

def embed_texts(texts: List[str]) -> List[List[float]]:
    # normalize_embeddings makes cosine similarity easier
    vectors = _MODEL.encode(texts, normalize_embeddings=True)
    return vectors.tolist()
