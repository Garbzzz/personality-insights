from __future__ import annotations

import os
from typing import List, Optional, Tuple

from qdrant_client import QdrantClient
from qdrant_client.http import models as qm

QDRANT_URL = os.getenv("QDRANT_URL", "http://127.0.0.1:6333")
COLLECTION = "traits_v1"
VECTOR_SIZE = 384  # all-MiniLM-L6-v2 outputs 384 dims

_client = QdrantClient(url=QDRANT_URL)

def ensure_collection():
    existing = [c.name for c in _client.get_collections().collections]
    if COLLECTION in existing:
        return
    _client.create_collection(
        collection_name=COLLECTION,
        vectors_config=qm.VectorParams(size=VECTOR_SIZE, distance=qm.Distance.COSINE),
    )

from qdrant_client.http import models as qm

def search_trait(vector: List[float], limit: int = 1) -> List[qm.ScoredPoint]:
    ensure_collection()

    res = _client.query_points(
        collection_name=COLLECTION,
        query=vector,
        limit=limit,
        with_payload=True,
    )
    # res is a QueryResponse with .points
    return list(res.points)

def upsert_trait(point_id: int, vector: List[float], label: str):
    ensure_collection()
    _client.upsert(
        collection_name=COLLECTION,
        points=[
            qm.PointStruct(
                id=point_id,
                vector=vector,
                payload={"label": label},
            )
        ],
    )
def reset_collection():
    existing = [c.name for c in _client.get_collections().collections]
    if COLLECTION in existing:
        _client.delete_collection(collection_name=COLLECTION)
    ensure_collection()
