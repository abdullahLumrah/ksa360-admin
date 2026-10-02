"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { api, setToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@ksa360.app");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api<{ token: string }>("/admin/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-6">
      <form onSubmit={onSubmit} className="panel w-full max-w-md p-8">
        <p className="eyebrow">KSA 360 operations</p>
        <h1 className="display mt-2">Sign in</h1>
        <p className="mt-3 text-sm text-muted">
          Only the configured operations account can open Eat, Play, Guides, Souq, users, and analytics.
        </p>
        <label className="mt-8 block text-sm">
          Email
          <input className="field mt-2" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="mt-4 block text-sm">
          Password
          <input
            className="field mt-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
        <button className="btn btn-green mt-6 w-full" disabled={busy}>
          {busy ? "Checking…" : "Enter"}
        </button>
      </form>
    </div>
  );
}
