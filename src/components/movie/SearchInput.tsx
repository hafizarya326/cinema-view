"use client";

export default function SearchInput({
  value,
  onChange,
  placeholder = "Cari film...",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex w-full items-center gap-2 rounded-2xl border border-border bg-surface px-3 py-2 focus-within:border-accent sm:max-w-sm">
      <svg
        viewBox="0 0 24 24"
        className="size-4 shrink-0 text-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
      />
    </label>
  );
}
