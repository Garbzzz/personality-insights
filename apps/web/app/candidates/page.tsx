import Link from "next/link";
import { apiGet } from "@/lib/api";


type Candidate = { id: number; name: string; created_at: string };

export default async function CandidatesPage() {
  const candidates = await apiGet<Candidate[]>("/candidates");

  return (
    <main style={{ padding: 24 }}>
      <h1>Candidates</h1>

      {candidates.length === 0 ? (
        <p>No candidates yet. Create one in the backend (Swagger) first.</p>
      ) : (
        <ul>
          {candidates.map((c) => (
            <li key={c.id}>
              <Link href={`/candidates/${c.id}`}>{c.name}</Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
