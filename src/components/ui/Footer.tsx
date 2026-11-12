"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

export default function Footer() {
  // Client-only read, so the prerendered HTML matches the first client render.
  const year = useSyncExternalStore(
    noopSubscribe,
    () => new Date().getFullYear(),
    () => null,
  );

  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>&copy; Cinema View{year ? ` ${year}` : ""}</p>
        <p>Lihat kursimu sebelum memesan.</p>
      </div>
    </footer>
  );
}
