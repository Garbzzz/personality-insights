"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { Button, Card } from "../components/ui";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

type Candidate = { id: number; name: string; created_at: string };

function VoteTile({
  label,
  value,
  selected,
  onClick,
}: {
  label: string;
  value: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex h-28 w-full flex-col items-center justify-center gap-2 rounded-2xl border",
        "bg-white/5 backdrop-blur transition",
        selected
          ? "border-white/25 ring-2 ring-white/10"
          : "border-white/10 hover:border-white/20",
      ].join(" ")}
    >
      <div className="text-3xl">
        {value === 1 ? "👍" : value === 0 ? "—" : "👎"}
      </div>
      <div className="text-sm font-semibold text-slate-200">{label}</div>
    </button>
  );
}

export default function SubmitVoteForm({
  initialCandidateId,
  from,
}: {
  initialCandidateId: number | null;
  from: string | null;
}) {
  const { user, isLoaded } = useUser();
  const userId = user?.id ?? "";
  const headers: Record<string, string> = userId
  ? { "X-User-Id": userId }
  : {};

  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candidateId, setCandidateId] = useState<number | "">(
    initialCandidateId ?? ""
  );
  const [vote, setVote] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!userId) return;
  
    apiGet<Candidate[]>("/candidates", { headers })
      .then((list) => {
        setCandidates(list);
  
        if (initialCandidateId != null) {
          const exists = list.some((c) => c.id === initialCandidateId);
          if (exists) setCandidateId(initialCandidateId);
        }
      })
      .catch(() => setCandidates([]));
  }, [initialCandidateId, isLoaded, userId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    if (candidateId === "") {
      setMsg("Please select a candidate.");
      return;
    }

    try {
      await apiPost(
        `/candidates/${candidateId}/submissions`,
        {
          vote,
          comment: comment.trim() ? comment : "",
        },
        { headers }
      );

      setMsg("Submitted!");
      setComment("");
      if (from) {
        router.push(from);
      } else {
        router.refresh();
      }
    } catch {
      setMsg("Failed to submit. Please try again.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-6">
      <div className="grid gap-2">
        <label className="text-sm font-semibold text-slate-200">
          Select Candidate
        </label>
        <select
          className="select-field"
          value={candidateId}
          onChange={(e) => setCandidateId(Number(e.target.value))}
        >
          <option value="">Choose a candidate</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-semibold text-slate-200">Vote Type</label>
        <div className="grid grid-cols-3 gap-3">
          <VoteTile
            label="Positive"
            value={1}
            selected={vote === 1}
            onClick={() => setVote(1)}
          />
          <VoteTile
            label="Neutral"
            value={0}
            selected={vote === 0}
            onClick={() => setVote(0)}
          />
          <VoteTile
            label="Negative"
            value={-1}
            selected={vote === -1}
            onClick={() => setVote(-1)}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-semibold text-slate-200">
          Note <span className="text-slate-400">(Optional)</span>
        </label>
        <textarea
          className="min-h-[140px] rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-slate-100 outline-none focus:ring-2 focus:ring-white/15"
          placeholder="Share your thoughts about this candidate..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      <Button
        type="submit"
        className="h-12 w-full bg-slate-200 text-slate-900 hover:bg-white"
      >
        Submit Vote
      </Button>

      {msg ? <div className="text-sm text-slate-200">{msg}</div> : null}
    </form>
  );
}