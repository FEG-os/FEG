import Link from "next/link";
import { requireStaff } from "@/lib/staff";
import { signOut } from "@/app/login/actions";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const staff = await requireStaff();

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto max-w-6xl px-4 flex items-center justify-between h-14">
          <nav className="flex items-center gap-5">
            <Link href="/dashboard" className="font-semibold text-ink mr-2">
              Household Ledger
            </Link>
            <Link href="/dashboard" className="text-sm text-ink-soft hover:text-ink">
              Dashboard
            </Link>
            <Link href="/households" className="text-sm text-ink-soft hover:text-ink">
              Households
            </Link>
            <Link href="/properties" className="text-sm text-ink-soft hover:text-ink">
              Properties
            </Link>
            <Link href="/tasks" className="text-sm text-ink-soft hover:text-ink">
              Tasks
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-sm text-ink-soft">{staff.full_name}</span>
            <form action={signOut}>
              <button className="text-sm text-ink-soft hover:text-ink underline underline-offset-2">
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
