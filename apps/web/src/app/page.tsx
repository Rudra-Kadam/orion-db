import Link from 'next/link';
import {
  Database,
  ShieldCheck,
  Zap,
  HardDrive,
  Code2,
  Boxes,
  ArrowUpRight,
} from 'lucide-react';

const features = [
  {
    title: 'Postgres Database',
    description:
      'Every project is a full Postgres database. Portable, extensible, and ready to query.',
    icon: Database,
  },
  {
    title: 'Authentication',
    description:
      'Add user sign ups and logins. Email, magic link, and OAuth providers built in.',
    icon: ShieldCheck,
  },
  {
    title: 'Realtime',
    description:
      'Build multiplayer experiences with real-time data synchronization.',
    icon: Zap,
  },
  {
    title: 'Storage',
    description:
      'Store, organize, and serve large files — from avatars to videos.',
    icon: HardDrive,
  },
  {
    title: 'Data APIs',
    description:
      'Instant ready-to-use REST APIs for every table in your project.',
    icon: Code2,
  },
  {
    title: 'JavaScript SDK',
    description:
      'Query your backend from any app with the official Orion client library.',
    icon: Boxes,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1c1c1c]">
      {/* Nav */}
      <header className="border-b border-[#e6e6e6] bg-[#fafafa]/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-2.5">
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6 text-[#3ecf8e]"
                fill="currentColor"
                aria-hidden
              >
                <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
              </svg>
              <span className="text-lg font-semibold tracking-tight">
                orion
              </span>
            </Link>
            <nav className="hidden items-center gap-6 text-sm text-[#5c5c5c] md:flex">
              <span className="cursor-default hover:text-[#1c1c1c]">
                Product
              </span>
              <span className="cursor-default hover:text-[#1c1c1c]">
                Developers
              </span>
              <span className="cursor-default hover:text-[#1c1c1c]">
                Pricing
              </span>
              <span className="cursor-default hover:text-[#1c1c1c]">Docs</span>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm text-[#5c5c5c] hover:text-[#1c1c1c] sm:inline"
            >
              Sign in
            </Link>
            <Link
              href="/dashboard"
              className="rounded-md bg-[#3ecf8e] px-4 py-2 text-sm font-medium text-[#1c1c1c] transition hover:bg-[#38bc81]"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="mx-auto max-w-7xl px-6 pb-24 pt-16 lg:px-8 lg:pt-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 lg:items-start">
          <div>
            <h1 className="text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Build in a weekend
              <br />
              <span className="text-[#3ecf8e]">Scale to millions</span>
            </h1>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="rounded-md bg-[#3ecf8e] px-6 py-3 text-sm font-medium text-[#1c1c1c] transition hover:bg-[#38bc81]"
              >
                Start your project
              </Link>
              <Link
                href="https://www.youtube.com/@codewithlari"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-[#d4d4d4] bg-white px-6 py-3 text-sm font-medium text-[#1c1c1c] transition hover:border-[#a3a3a3] hover:bg-[#f5f5f5]"
              >
                Watch the tutorial
              </Link>
            </div>
          </div>
          <p className="max-w-md text-lg leading-relaxed text-[#5c5c5c] lg:pt-2 lg:text-xl">
            Start your project with a Postgres database. Add Authentication,
            Data APIs, Realtime, Storage, and a JavaScript SDK — all from one
            dashboard.
          </p>
        </div>

        {/* Feature grid */}
        <div className="mt-20 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative cursor-pointer overflow-hidden rounded-xl border border-[#e6e6e6] bg-white p-6 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-[#3ecf8e]/60 hover:shadow-[0_16px_36px_-8px_rgba(62,207,142,0.18)]"
              >
                {/* Background ambient spotlight gradient on hover */}
                <div className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br from-[#3ecf8e]/[0.08] via-transparent to-transparent" />

                {/* Animated top accent bar */}
                <div className="absolute inset-x-0 top-0 h-[2px] w-0 bg-gradient-to-r from-transparent via-[#3ecf8e] to-transparent transition-all duration-500 ease-out group-hover:w-full" />

                <div className="relative mb-5 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#3ecf8e]/10 text-[#3ecf8e] transition-all duration-300 ease-out group-hover:scale-110 group-hover:bg-[#3ecf8e] group-hover:text-[#1c1c1c] group-hover:shadow-[0_0_20px_rgba(62,207,142,0.45)]">
                    <Icon className="h-5 w-5 transition-transform duration-300 group-hover:rotate-6" />
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-[#3ecf8e] opacity-0 -translate-x-2 translate-y-2 transition-all duration-300 ease-out group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0" />
                </div>

                <h3 className="relative text-base font-semibold text-[#1c1c1c] transition-colors duration-200 group-hover:text-[#0b6343]">
                  {feature.title}
                </h3>
                <p className="relative mt-2 text-sm leading-relaxed text-[#5c5c5c] transition-colors duration-200 group-hover:text-[#2d2d2d]">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        <p className="mt-16 text-center text-sm text-[#8c8c8c]">
          Use one or all. Best-of-breed products. Integrated as a platform.
        </p>
      </main>
    </div>
  );
}
