import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Card, CardBody } from "../components/ui";

export default function EventsPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(1200px_600px_at_20%_10%,rgba(148,163,184,0.18),transparent),radial-gradient(900px_500px_at_80%_30%,rgba(59,130,246,0.10),transparent),linear-gradient(to_bottom,#0b1220,#070b13)] text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-sm text-slate-300 hover:text-white">
            ← Home
          </Link>

          {/* Clerk user menu includes Sign out */}
          <UserButton afterSignOutUrl="/" />
        </div>

        <h1 className="mt-8 text-4xl font-extrabold tracking-tight">Events</h1>
        <p className="mt-2 text-slate-300">
          Private, invite-only events live here (rush cycles, hiring panels, etc.).
        </p>

        <div className="mt-8">
          <Card>
            <CardBody>
              <div className="text-lg font-bold">Coming next</div>
              <ul className="mt-3 list-disc pl-5 text-slate-200">
                <li>Create event</li>
                <li>Invite members (link or email)</li>
                <li>Event-scoped candidates & submissions</li>
              </ul>

              <p className="mt-4 text-sm text-slate-300">
                For now, you can still use the existing candidates pages:
              </p>

              <Link
                href="/candidates"
                className="mt-3 inline-block text-sm font-semibold text-slate-100 underline underline-offset-4 hover:text-white"
              >
                Go to Candidates →
              </Link>
            </CardBody>
          </Card>
        </div>
      </div>
    </main>
  );
}
