import TypedTitle from "../../components/TypedTitle";
import { Card, CardBody, Button } from "../../components/ui";
import { SignIn } from "@clerk/nextjs";

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

              <div className="mt-6 flex justify-center">
                <div className="w-full max-w-md">
                  <SignIn
                    routing="path"
                    path="/login"
                    forceRedirectUrl="/events"
                    appearance={{
                      elements: {
                        card: "bg-transparent shadow-none p-0 w-full",
                        header: "hidden",
                        footer: "hidden",
                        formButtonPrimary:
                          "bg-slate-200 text-slate-900 hover:bg-white rounded-xl",
                        formFieldInput:
                          "rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-white/15",
                        formFieldLabel: "text-sm text-slate-200",
                        dividerLine: "bg-white/10",
                        dividerText: "text-slate-400",
                      },
                    }}
                  />
                </div>
              </div>
              <div className="pt-6 text-center">
                <Button href="/" variant="ghost">
                  Back Home
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>
    </main>
  );
}
