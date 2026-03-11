"use client";
import TypedTitle from "./components/TypedTitle";
import { Card, CardBody, Button } from "./components/ui";
import { SignedIn, SignedOut, useUser } from "@clerk/nextjs";

const DEV_EMAIL = "seangarbarini@gmail.com";
export default function Home() {
  const { user } = useUser();
  const isDev = user?.emailAddresses.some((e) => e.emailAddress === DEV_EMAIL) ?? false;

  return (
    <main className="min-h-screen bg-[radial-gradient(1200px_600px_at_20%_10%,rgba(148,163,184,0.18),transparent),radial-gradient(900px_500px_at_80%_30%,rgba(59,130,246,0.10),transparent),linear-gradient(to_bottom,#0b1220,#070b13)] text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-14">
        <h1 className="text-center text-5xl font-extrabold tracking-tight sm:text-6xl">
          <TypedTitle text="Candidate Critic" />
        </h1>

        <div className="mt-10 w-full max-w-xl">
          <Card>
            <CardBody>
              <div className="mt-1 text-sm text-slate-300 text-center">
                Sign in to access private events and submit votes.
              </div>

              <div className="mt-6 grid gap-3">
                <SignedOut>
                  <Button href="/login" className="w-full bg-slate-200 text-slate-900 hover:bg-white">
                    Log in
                  </Button>
                  <Button href="/signup" variant="outline" className="w-full">
                    Sign up
                  </Button>
                </SignedOut>

                <SignedIn>
                  <Button href="/events" className="w-full bg-slate-200 text-slate-900 hover:bg-white">
                    Go to Events
                  </Button>
                  {isDev && (
                    <div className="pt-2 text-center">
                      <Button href="/candidates" variant="ghost">
                        View Candidates (dev)
                      </Button>
                    </div>
                  )}
                </SignedIn>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </main>
  );
}
