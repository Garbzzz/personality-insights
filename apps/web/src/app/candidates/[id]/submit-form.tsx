"use client";

import { useState } from "react";
import { apiPost } from "../../../lib/api";

export default function SubmitForm({ candidateId }: { candidateId: number }) {
  const [vote, setVote] = useState<number>(0);
  const [comment, setComment] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    await apiPost(`/candidates/${candidateId}/submissions`, { vote, comment });

    setMsg("Submitted! Refreshing...");
    window.location.reload();
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 8, maxWidth: 520 }}>
      <label>
        Vote:
        <select value={vote} onChange={(e) => setVote(Number(e.target.value))}>
          <option value={1}>+1 (Yes)</option>
          <option value={0}>0 (Neutral)</option>
          <option value={-1}>-1 (No)</option>
        </select>
      </label>

      <label>
        Notes:
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
        />
      </label>

      <button type="submit">Submit</button>
      {msg && <p>{msg}</p>}
    </form>
  );
}
