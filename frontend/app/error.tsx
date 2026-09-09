"use client";

import { useEffect } from "react";
import Link from "next/link";
import { FiAlertCircle, FiHome, FiMail, FiRefreshCw } from "react-icons/fi";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error boundary caught:", error);
  }, [error]);

  return (
    <div className="relative flex min-h-[75vh] items-center justify-center overflow-hidden px-4 py-24">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/10 blur-[120px]" />
      <div className="relative w-full max-w-md rounded-3xl border border-[#c5a059]/30 bg-gradient-to-b from-[#0a2540] to-[#061a30] p-8 text-center shadow-2xl sm:p-10">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-red-400/40 bg-red-500/15 text-red-300 shadow-[0_0_35px_rgba(248,113,113,0.18)]">
          <FiAlertCircle aria-hidden="true" size={32} />
        </div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#c5a059]">Temporary problem</p>
        <h1 className="mb-3 text-2xl font-extrabold text-white sm:text-3xl">Something went wrong</h1>
        <p className="text-sm leading-relaxed text-gray-400">
          An unexpected error interrupted this page. You can try again now, return home, or contact us if the problem continues.
        </p>
        {error.digest && (
          <p className="mt-4 rounded-lg border border-white/5 bg-black/15 px-3 py-2 font-mono text-[11px] text-gray-500">
            Error reference: {error.digest}
          </p>
        )}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="btn btn-primary py-3 text-sm"
          >
            <FiRefreshCw aria-hidden="true" size={15} /> Try Again
          </button>
          <Link href="/" className="btn btn-secondary py-3 text-sm">
            <FiHome aria-hidden="true" size={15} /> Back to Home
          </Link>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          Need help?{" "}
          <Link href="/contact" className="inline-flex items-center gap-1 font-medium text-[#c5a059] hover:text-[#e07b2a]">
            Contact our team <FiMail aria-hidden="true" size={12} />
          </Link>
        </p>
      </div>
    </div>
  );
}
