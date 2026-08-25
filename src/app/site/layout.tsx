import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Flores Equity Group",
  description: "Quality rental homes, managed the right way.",
};

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-line">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <Image src="/brand/feg-circle.png" alt="Flores Equity Group" width={36} height={36} className="rounded-full shrink-0" priority />
            <span className="font-display text-sm tracking-wide text-ink whitespace-nowrap truncate">Flores Equity Group</span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-5 shrink-0">
            <a
              href="/#sell"
              className="hidden sm:inline text-xs font-medium text-ink-soft hover:text-accent transition-colors whitespace-nowrap"
            >
              Sell Your House
            </a>
            <a
              href="https://app.floresequity.com/login"
              className="shrink-0 rounded border border-line-strong px-3 py-1.5 text-xs font-medium text-ink hover:border-accent hover:text-accent transition-colors whitespace-nowrap"
            >
              <span className="hidden sm:inline">Resident &amp; Staff Login</span>
              <span className="sm:hidden">Login</span>
            </a>
          </div>
        </div>
      </header>

      {children}

      <footer className="border-t border-line mt-auto">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <p className="text-xs text-ink-soft">
            © {new Date().getFullYear()} Flores Equity Group. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-xs text-ink-soft">
            <a href="mailto:mylegacypros@gmail.com" className="hover:text-accent transition-colors">
              Contact
            </a>
            <a href="https://app.floresequity.com/login" className="hover:text-accent transition-colors">
              Resident Login
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
