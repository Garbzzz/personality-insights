"use client";

import { useEffect, useMemo, useState } from "react";

export default function TypedTitle({
  text,
  speedMs = 65,
}: {
  text: string;
  speedMs?: number;
}) {
  const [i, setI] = useState(0);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const t = setInterval(() => {
      setI((prev) => (prev < text.length ? prev + 1 : prev));
    }, speedMs);
    return () => clearInterval(t);
  }, [text, speedMs]);

  useEffect(() => {
    const c = setInterval(() => setShowCursor((v) => !v), 500);
    return () => clearInterval(c);
  }, []);

  const shown = useMemo(() => text.slice(0, i), [text, i]);

  return (
    <div className="flex items-baseline gap-1">
      <span>{shown}</span>
      <span className={["inline-block w-2", showCursor ? "opacity-100" : "opacity-0"].join(" ")}>
        |
      </span>
    </div>
  );
}
