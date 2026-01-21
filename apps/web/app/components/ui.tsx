import Link from "next/link";

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "rounded-2xl border border-white/10 bg-white/5 backdrop-blur",
        "shadow-[0_10px_30px_rgba(0,0,0,0.25)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function CardBody({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={["p-6", className].join(" ")}>{children}</div>;
}

export function Button({
  children,
  className = "",
  type = "button",
  onClick,
  variant = "primary",
  href,
}: {
  children: React.ReactNode;
  className?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  variant?: "primary" | "ghost" | "outline";
  href?: string;
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition";
  const styles =
    variant === "primary"
      ? "bg-slate-200 text-slate-900 hover:bg-white"
      : variant === "outline"
      ? "border border-white/15 bg-transparent text-slate-100 hover:bg-white/10"
      : "bg-transparent text-slate-200 hover:text-white";

  const cls = [base, styles, className].join(" ");

  if (href) return <Link href={href} className={cls}>{children}</Link>;
  return (
    <button type={type} onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
      {children}
    </span>
  );
}

export function Badge({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "pos" | "neu" | "neg";
}) {
  const tones =
    tone === "pos"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
      : tone === "neu"
      ? "border-amber-500/20 bg-amber-500/10 text-amber-200"
      : "border-rose-500/20 bg-rose-500/10 text-rose-200";

  return (
    <div className={["rounded-2xl border p-4", tones].join(" ")}>
      <div className="text-xs opacity-80">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
