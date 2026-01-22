import Link from "next/link";
import { Card, CardBody } from "../components/ui";
import SubmitVoteForm from "./submit-form";

export default function SubmitPage({
  searchParams,
}: {
  searchParams?: { candidateId?: string };
}) {
  const initialCandidateId = searchParams?.candidateId
    ? Number(searchParams.candidateId)
    : null;

  return (
    <main className="min-h-screen bg-[radial-gradient(1200px_600px_at_20%_10%,rgba(148,163,184,0.18),transparent),radial-gradient(900px_500px_at_80%_30%,rgba(59,130,246,0.10),transparent),linear-gradient(to_bottom,#0b1220,#070b13)] text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <Link href="/candidates" className="text-sm text-slate-300 hover:text-white">
          ← Back to Home
        </Link>

        <div className="mt-8 max-w-3xl">
          <Card>
            <CardBody>
              <h1 className="text-4xl font-extrabold tracking-tight">Submit Your Vote</h1>
              <p className="mt-2 text-slate-300">
                Select a candidate and share your feedback
              </p>

              <div className="mt-8">
                <SubmitVoteForm initialCandidateId={initialCandidateId} />
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </main>
  );
}

