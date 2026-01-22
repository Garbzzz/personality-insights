import Link from "next/link";
import { Button } from "../components/ui";
import CandidatesClient from "./candidates-client";
import { UserButton } from "@clerk/nextjs";

export default function CandidatesPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(1200px_600px_at_20%_10%,rgba(148,163,184,0.18),transparent),radial-gradient(900px_500px_at_80%_30%,rgba(59,130,246,0.10),transparent),linear-gradient(to_bottom,#0b1220,#070b13)] text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-slate-300 hover:text-white">
            ← Back to Home
          </Link>
          <Button href="/submit" className="bg-slate-200 text-slate-900 hover:bg-white">
            Submit Vote
          </Button>
        </div>

        <h1 className="mt-8 text-4xl font-extrabold tracking-tight">Candidates</h1>
        <p className="mt-2 text-slate-300">View all candidates and their feedback ratings</p>

        <CandidatesClient />
      </div>
    </main>
  );
}
