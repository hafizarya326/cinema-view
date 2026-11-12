import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/movies", label: "Movies" },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <nav className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-4 sm:h-16 sm:gap-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-6 place-items-center rounded-md bg-accent text-xs text-foreground">
            CV
          </span>
          Cinema View
        </Link>

        <ul className="flex items-center gap-4 text-sm text-muted sm:gap-6">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="inline-flex min-h-10 items-center transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <button
          type="button"
          aria-label="Cari film"
          className="ml-auto grid size-10 place-items-center rounded-full border border-border text-muted transition-colors hover:text-foreground"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </button>
      </nav>
    </header>
  );
}
