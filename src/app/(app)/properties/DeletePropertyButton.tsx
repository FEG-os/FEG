"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeletePropertyButton({
  propertyName,
  onDelete,
  redirectTo,
}: {
  propertyName: string;
  onDelete: () => Promise<void>;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (!confirm(`Delete "${propertyName}"? This can't be undone.`)) return;
    setPending(true);
    setError(null);
    try {
      await onDelete();
      if (redirectTo) router.push(redirectTo);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't delete this property.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="text-xs font-medium text-crit hover:opacity-80 disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Delete"}
      </button>
      {error && <p className="text-xs text-crit text-right max-w-[14rem]">{error}</p>}
    </div>
  );
}
