"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="panel max-w-lg p-8">
        <p className="eyebrow">Admin</p>
        <h1 className="display mt-2">This page hit a snag</h1>
        <p className="mt-3 text-sm text-muted">{error.message || "The screen failed to render."}</p>
        <button className="btn btn-green mt-6" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
