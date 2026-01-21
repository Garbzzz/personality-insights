import TypedTitle from "../components/TypedTitle";
import { Card, CardBody, Button } from "../components/ui";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(1200px_600px_at_20%_10%,rgba(148,163,184,0.18),transparent),radial-gradient(900px_500px_at_80%_30%,rgba(59,130,246,0.10),transparent),linear-gradient(to_bottom,#0b1220,#070b13)] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-14">
        <h1 className="text-center text-5xl font-extrabold tracking-tight sm:text-6xl">
          <TypedTitle text="Candidate Critic" />
        </h1>

        <div className="mt-10 w-full max-w-xl">
          <Card>
            <CardBody>
              <div className="text-2xl font-bold">Welcome Back</div>
              <div className="mt-1 text-sm text-slate-300">
                Sign in to access the platform
              </div>

              <div className="mt-6 grid gap-3">
                <label className="grid gap-1 text-sm text-slate-200">
                  Email
                  <input
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-white/15"
                    placeholder="you@example.com"
                  />
                </label>

                <label className="grid gap-1 text-sm text-slate-200">
                  Password
                  <input
                    type="password"
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-white/15"
                    placeholder="••••••••"
                  />
                </label>

                <Button className="mt-2 w-full bg-slate-200 text-slate-900 hover:bg-white">
                  Sign In
                </Button>

                <div className="pt-2 text-center">
                  <Button href="/candidates" variant="ghost">
                    View Candidates
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </main>
  );
}
