"use client";

import { useEffect, useMemo, useState } from "react";

type Phase = "typing" | "pausing" | "deleting";

export default function TypedTitle({
  text,
  typeMs = 65,
  deleteMs = 30,
  pauseMs = 1400,
}: {
  text: string;
  typeMs?: number;
  deleteMs?: number;
  pauseMs?: number;
}) {
  const [i, setI] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing");
  const [cursor, setCursor] = useState(true);

  useEffect(() => {
    const c = setInterval(() => setCursor((v) => !v), 450);
    return () => clearInterval(c);
  }, []);

  useEffect(() => {
    if (phase === "typing") {
      if (i >= text.length) {
        const t = setTimeout(() => setPhase("pausing"), pauseMs);
        return () => clearTimeout(t);
      }
      const t = setTimeout(() => setI((p) => p + 1), typeMs);
      return () => clearTimeout(t);
    }

    if (phase === "pausing") {
      const t = setTimeout(() => setPhase("deleting"), pauseMs);
      return () => clearTimeout(t);
    }

    // deleting
    if (i <= 0) {
      const t = setTimeout(() => setPhase("typing"), 350);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setI((p) => p - 1), deleteMs);
    return () => clearTimeout(t);
  }, [phase, i, text.length, typeMs, deleteMs, pauseMs]);

  const shown = useMemo(() => text.slice(0, i), [text, i]);

  return (
    <span className="inline-flex items-baseline">
      <span>{shown}</span>
      <span className={["ml-1 inline-block w-2", cursor ? "opacity-100" : "opacity-0"].join(" ")}>
        |
      </span>
    </span>
  );
}
