"use client";

import { useState } from "react";
import { apiPost } from "@/lib/api";

export default function CreateCandidateForm() {
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setMsg("Name is required.");
      return;
    }

    await apiPost("/candidates", { name: trimmed });
    setName("");
    setMsg("Created! Refreshing...");
    window.location.reload();
  }

  return (
    <form
      onSubmit={onSubmit}
      style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        marginTop: 12,
      }}
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Candidate name (e.g., John Doe)"
        style={{ padding: 8, width: 320 }}
      />
      <button type="submit" style={{ padding: "8px 12px" }}>
        Create
      </button>
      {msg && <span style={{ marginLeft: 8 }}>{msg}</span>}
    </form>
  );
}
