import { apiGet } from "@/lib/api";
import SubmitForm from "./submit-form";

type Submission = {
  id: number;
  candidate_id: number;
  vote: number;
  comment: string;
  created_at: string;
};

type Profile = {
  candidate_id: number;
  vote_summary: { yes: number; neutral: number; no: number; score: number };
  positives: { label: string; count: number; examples: string[] }[];
  negatives: { label: string; count: number; examples: string[] }[];
};

export default async function CandidatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  let profile: Profile | null = null;
  try {
    profile = await apiGet<Profile>(`/candidates/${candidateId}/profile`);
  } catch {
    profile = null;
  }

  return (
    <main style={{ padding: 24, maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, marginBottom: 10 }}>Candidate #{candidateId}</h1>

      <SubmitForm candidateId={candidateId} />

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Profile</h2>

        {!profile ? (
          <p style={{ opacity: 0.8 }}>
            Profile endpoint not ready yet (once /profile is implemented, this will
            populate).
          </p>
        ) : (
          <>
            {/* Vote summary card */}
            <div
              style={{
                border: "1px solid #ddd",
                borderRadius: 12,
                padding: 12,
                marginBottom: 14,
              }}
            >
              <b>Votes:</b> Yes {profile.vote_summary.yes} | Neutral{" "}
              {profile.vote_summary.neutral} | No {profile.vote_summary.no} |{" "}
              <b>Score:</b> {profile.vote_summary.score}
            </div>

            {/* Traits cards */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
              }}
            >
              <div
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <h3 style={{ marginTop: 0 }}>Top Positives</h3>

                {profile.positives.length === 0 ? (
                  <p style={{ opacity: 0.7 }}>No positive traits yet.</p>
                ) : (
                  <ul style={{ paddingLeft: 18 }}>
                    {profile.positives.map((t) => (
                      <li key={t.label} style={{ marginBottom: 8 }}>
                        <b>{t.label}</b> ({t.count})

                        {t.examples?.length ? (
                          <details style={{ marginTop: 6 }}>
                            <summary>evidence</summary>
                            <ul style={{ paddingLeft: 18 }}>
                              {t.examples.map((ex, i) => (
                                <li key={i} style={{ opacity: 0.9 }}>
                                  {ex}
                                </li>
                              ))}
                            </ul>
                          </details>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 12,
                  padding: 12,
                }}
              >
                <h3 style={{ marginTop: 0 }}>Top Concerns</h3>

                {profile.negatives.length === 0 ? (
                  <p style={{ opacity: 0.7 }}>No concerns yet.</p>
                ) : (
                  <ul style={{ paddingLeft: 18 }}>
                    {profile.negatives.map((t) => (
                      <li key={t.label} style={{ marginBottom: 8 }}>
                        <b>{t.label}</b> ({t.count})

                        {t.examples?.length ? (
                          <details style={{ marginTop: 6 }}>
                            <summary>evidence</summary>
                            <ul style={{ paddingLeft: 18 }}>
                              {t.examples.map((ex, i) => (
                                <li key={i} style={{ opacity: 0.9 }}>
                                  {ex}
                                </li>
                              ))}
                            </ul>
                          </details>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </section>

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
