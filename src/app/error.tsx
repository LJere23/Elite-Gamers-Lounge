"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-5xl font-black text-red-400">Something went wrong</h1>
        <p className="text-zinc-400">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="rounded-2xl bg-cyan-500 hover:bg-cyan-400 transition text-black font-bold px-8 py-3"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
