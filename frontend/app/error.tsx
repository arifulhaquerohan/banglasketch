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
    <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-4 py-24 bg-[#F5F2EB]">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[30rem] w-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/5 blur-[120px]" />
      <div className="relative w-full max-w-md rounded-3xl border border-[#DED5C7] bg-[#FCFAF7] p-8 text-center shadow-xl sm:p-10">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-200 bg-red-50 text-red-600 shadow-xs">
          <FiAlertCircle aria-hidden="true" size={30} />
        </div>
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#586348]">Temporary Interruption</p>
        <h1 className="mb-3 text-2xl font-serif font-bold text-[#242824] sm:text-3xl">Something Went Wrong</h1>
        <p className="text-sm leading-relaxed text-[#5A625A]">
          An unexpected error interrupted this page. You can try again now, return home, or contact us if the problem continues.
        </p>
        {error.digest && (
          <p className="mt-4 rounded-xl border border-[#DED5C7] bg-[#EDE7DE] px-3 py-2 font-mono text-[11px] text-[#5A625A]">
            Error reference: {error.digest}
          </p>
        )}

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="btn btn-primary py-3 text-sm shadow-xs"
          >
            <FiRefreshCw aria-hidden="true" size={15} /> Try Again
          </button>
          <Link href="/" className="btn btn-secondary py-3 text-sm">
            <FiHome aria-hidden="true" size={15} /> Back to Home
          </Link>
        </div>

        <p className="mt-6 text-xs text-[#737D73]">
          Need help?{" "}
          <Link href="/contact" className="inline-flex items-center gap-1 font-semibold text-[#586348] hover:text-[#242824] transition-colors">
            Contact our studio <FiMail aria-hidden="true" size={12} />
          </Link>
        </p>
      </div>
    </div>
  );
}
