"use client";

import Link from "next/link";
import { useState } from "react";
import { api, type Page } from "@/lib/api";
import { useLiveRefresh } from "@/lib/live";
import { type SouqAd } from "@/lib/souq";
import { Shell } from "@/components/shell";
import { PageHeader, Thumb, money } from "@/components/ui";

const QUEUES = [
  ["awaiting_approval", "New ads"],
  ["pending", "Pending"],
  ["declined", "Declined"],
] as const;

export default function ApprovalsPage() {
  const [status, setStatus] = useState("awaiting_approval");
  const [q, setQ] = useState("");
  const [data, setData] = useState<Page<SouqAd> | null>(null);

  async function load(nextStatus = status, query = q) {
    const params = new URLSearchParams({
      status: nextStatus,
      limit: "40",
      ...(query ? { q: query } : {}),
    });
    setData(await api(`/admin/souq/ads?${params}`));
  }

  useLiveRefresh(() => load(), 3000);

  async function act(id: string, action: "approve" | "decline" | "pending") {
    await api(`/admin/souq/ads/${id}/${action}`, { method: "POST" });
    await load();
  }

  return (
    <Shell>
      <PageHeader
        kicker="Queue"
        title="Approvals"
        hint="New seller ads stay hidden until you approve them. Once approved, they appear in the public Souq list."
      />
      <div className="flex flex-wrap items-center gap-2">
        {QUEUES.map(([value, label]) => (
          <button
            key={value}
            className={`btn ${status === value ? "btn-green" : "btn-ghost"}`}
            onClick={() => {
              setStatus(value);
              load(value);
            }}
          >
            {label}
          </button>
        ))}
        <input
          className="field ml-auto max-w-xs"
          placeholder="Search this queue"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(status, q)}
        />
      </div>
      <div className="mt-6 grid gap-4">
        {(data?.items || []).length === 0 ? (
          <div className="panel p-8 text-muted">Nothing in this queue.</div>
        ) : (
          (data?.items || []).map((ad) => (
            <article key={ad.id} className="panel flex items-start gap-5 p-5">
              <Link href={`/souq/${ad.id}`}>
                <Thumb src={ad.images?.[0]} large />
              </Link>
              <div className="min-w-0 flex-1">
                <p className="eyebrow">{ad.categoryId}</p>
                <Link href={`/souq/${ad.id}`} className="mt-1 block text-lg font-semibold tracking-tight hover:text-gold">
                  {ad.title}
                </Link>
                <p className="mt-1 text-sm text-muted">
                  {[ad.subtitle, ad.city, ad.seller?.name, money(ad.price)].filter(Boolean).join(" · ")}
                </p>
                {ad.description ? (
                  <p className="mt-2 line-clamp-2 text-sm leading-6">{ad.description}</p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/souq/${ad.id}`} className="btn btn-ghost">
                    Details
                  </Link>
                  <button className="btn btn-green" onClick={() => act(ad.id, "approve")}>
                    Approve
                  </button>
                  <button className="btn btn-gold" onClick={() => act(ad.id, "pending")}>
                    Pending
                  </button>
                  <button className="btn btn-danger" onClick={() => act(ad.id, "decline")}>
                    Decline
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </Shell>
  );
}
