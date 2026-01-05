import { apiGet } from "../../../lib/api";
import SubmitForm from "./submit-form";

type Submission = {
  id: number;
  candidate_id: number;
  vote: number;
  comment: string;
  created_at: string;
};

export default async function CandidatePage({ params }: { params: { id: string } }) {
  const candidateId = Number(params.id);

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
