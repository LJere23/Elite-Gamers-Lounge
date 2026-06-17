"use client";

import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin]", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="text-center space-y-5 max-w-sm">
        <h2 className="text-3xl font-black text-red-400">Page error</h2>
        <p className="text-zinc-400 text-sm">
          This admin page encountered an error. Your data is safe.
        </p>
        <button
          onClick={reset}
          className="rounded-2xl bg-cyan-400 hover:bg-cyan-300 transition text-black font-bold px-6 py-2.5 text-sm"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
