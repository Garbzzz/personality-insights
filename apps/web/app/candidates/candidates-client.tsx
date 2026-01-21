"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { Badge, Button, Card, CardBody, Pill } from "../components/ui";

type Candidate = { id: number; name: string; created_at: string };
type Submission = { id: number; candidate_id: number; vote: number; comment: string; created_at: string };

function approval(yes: number, no: number) {
  const denom = yes + no;
  if (denom === 0) return 0;
  return Math.round((yes / denom) * 100);
}

export default function CandidatesClient() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [subsById, setSubsById] = useState<Record<number, Submission[]>>({});
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    setMsg(null);
    const list = await apiGet<Candidate[]>("/candidates");
    setCandidates(list);

    // fetch submissions for each candidate (simple + works with current backend)
    const entries = await Promise.all(
      list.map(async (c) => [c.id, await apiGet<Submission[]>(`/candidates/${c.id}/submissions`)] as const)
    );
    const map: Record<number, Submission[]> = {};
    for (const [id, subs] of entries) map[id] = subs;
    setSubsById(map);
  }

  useEffect(() => {
    let alive = true;
  
    (async () => {
      try {
        await load();
      } catch (err: unknown) {
        if (!alive) return;
        const msg =
          err instanceof Error ? err.message : typeof err === "string" ? err : "Failed to load";
        setMsg(msg);
      }
    })();
  
    return () => {
      alive = false;
    };
  }, []);
  
  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    await apiPost("/candidates", { name });
    setNewName("");
    await load();
  }

  function startEdit(c: Candidate) {
    setEditingId(c.id);
    setEditName(c.name);
  }

  async function saveEdit() {
    if (editingId == null) return;
    const name = editName.trim();
    if (!name) return;
    await apiPatch(`/candidates/${editingId}`, { name });
    setEditingId(null);
    setEditName("");
    await load();
  }

  async function removeCandidate(id: number) {
    const ok = confirm("Delete this candidate? This will also delete all submissions for them.");
    if (!ok) return;
    await apiDelete(`/candidates/${id}`);
    await load();
  }

  return (
    <>
      {/* Create */}
      <form onSubmit={onCreate} className="mt-6 flex flex-wrap items-center gap-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New candidate name"
          className="min-w-[260px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-white/15"
        />
        <Button type="submit" className="bg-slate-200 text-slate-900 hover:bg-white">
          Add Candidate
        </Button>
        {msg ? <span className="text-sm text-slate-300">{msg}</span> : null}
      </form>

      {/* List */}
      <div className="mt-8 grid gap-5">
        {candidates.map((c) => {
          const subs = subsById[c.id] ?? [];
          const yes = subs.filter((s) => s.vote === 1).length;
          const neu = subs.filter((s) => s.vote === 0).length;
          const no = subs.filter((s) => s.vote === -1).length;
          const pct = approval(yes, no);

          const isEditing = editingId === c.id;

          return (
            <Card key={c.id}>
              <CardBody>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-white/5 ring-1 ring-white/10" />
                    <div>
                      <div className="text-xl font-bold">
                        <Link href={`/candidates/${c.id}`} className="hover:underline">
                          {c.name}
                        </Link>
                      </div>
                      <div className="text-sm text-slate-300">Candidate</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Pill>{subs.length} votes</Pill>
                    <Button variant="outline" onClick={() => startEdit(c)}>
                      Edit
                    </Button>
                    <Button variant="outline" onClick={() => removeCandidate(c.id)}>
                      Delete
                    </Button>
                  </div>
                </div>

                {/* Edit row */}
                {isEditing ? (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="min-w-[280px] rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-white/15"
                    />
                    <Button onClick={saveEdit} className="bg-slate-200 text-slate-900 hover:bg-white">
                      Save
                    </Button>
                    <Button variant="ghost" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                ) : null}

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <Badge label="Positive" value={yes} tone="pos" />
                  <Badge label="Neutral" value={neu} tone="neu" />
                  <Badge label="Negative" value={no} tone="neg" />
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <span>Approval Rating</span>
                    <span className="font-semibold text-slate-100">{pct}%</span>
                  </div>
                  <div className="mt-2 h-2 w-full rounded-full bg-white/10">
                    <div
                      className="h-2 rounded-full bg-emerald-400/80"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </>
  );
}
