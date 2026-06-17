"use client";

import { useEffect } from "react";

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[portal]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="text-center space-y-5 max-w-sm">
        <h2 className="text-3xl font-black text-red-400">Portal error</h2>
        <p className="text-zinc-400 text-sm">
          Something went wrong loading your profile. Please try again.
        </p>
        <button
          onClick={reset}
          className="rounded-2xl bg-purple-500 hover:bg-purple-400 transition text-white font-bold px-6 py-2.5 text-sm"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
