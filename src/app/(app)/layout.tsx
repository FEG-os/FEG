import Image from "next/image";
import Link from "next/link";
import { requireStaff } from "@/lib/staff";
import { signOut } from "@/app/login/actions";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const staff = await requireStaff();

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 flex items-center justify-between h-16">
          <nav className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2.5 mr-2">
              <Image src="/brand/feg-circle.png" alt="FEG" width={34} height={34} className="rounded-full" />
              <span className="flex flex-col leading-none">
                <span className="font-display text-sm tracking-wide text-ink">Flores Equity Group</span>
                <span className="brand-eyebrow mt-0.5">Household Ledger</span>
              </span>
            </Link>
            <Link href="/dashboard" className="text-sm text-ink-soft hover:text-accent-strong">
              Dashboard
            </Link>
            <Link href="/households" className="text-sm text-ink-soft hover:text-accent-strong">
              Households
            </Link>
            <Link href="/properties" className="text-sm text-ink-soft hover:text-accent-strong">
              Properties
            </Link>
            <Link href="/tasks" className="text-sm text-ink-soft hover:text-accent-strong">
              Tasks
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-ink-soft">{staff.full_name}</span>
            <form action={signOut}>
              <button className="text-sm text-ink-soft hover:text-accent-strong underline underline-offset-2">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
