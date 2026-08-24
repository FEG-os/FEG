import { signIn } from "./actions";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const params = await searchParams;
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <main className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-ink mb-1">Household Ledger</h1>
        <p className="text-sm text-ink-soft mb-6">Sign in to continue.</p>

        {error && (
          <div className="mb-4 rounded border border-crit/30 bg-crit-bg px-3 py-2 text-sm text-crit">
            {error === "not_staff"
              ? "That account isn't set up as staff yet."
              : error}
          </div>
        )}

        <form action={signIn} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="email" className="text-xs font-medium text-ink-soft">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="password" className="text-xs font-medium text-ink-soft">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="rounded border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </div>
          <button
            type="submit"
            className="mt-2 rounded bg-accent px-3 py-2 text-sm font-medium text-accent-ink hover:opacity-90"
          >
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}
