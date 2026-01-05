import { apiGet } from "@/lib/api";
import SubmitForm from "./submit-form";

type Submission = {
  id: number;
  candidate_id: number;
  vote: number;
  comment: string;
  created_at: string;
};

export default async function CandidatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // ✅ unwrap promise
  const candidateId = Number(id);

  if (!Number.isFinite(candidateId)) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Bad candidate id</h1>
        <p>id: {id}</p>
      </main>
    );
  }

  const submissions = await apiGet<Submission[]>(
    `/candidates/${candidateId}/submissions`
  );

  return (
    <main style={{ padding: 24 }}>
      <h1>Candidate #{candidateId}</h1>

      <SubmitForm candidateId={candidateId} />

      <h2 style={{ marginTop: 24 }}>Submissions</h2>
      <ul>
        {submissions.map((s) => (
          <li key={s.id}>
            <b>{s.vote}</b> — {s.comment}
          </li>
        ))}
      </ul>
    </main>
  );
}
