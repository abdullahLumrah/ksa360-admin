"use client";

import { useState } from "react";
import { api, mediaUrl, type Page } from "@/lib/api";
import { useLiveRefresh } from "@/lib/live";
import { Shell } from "@/components/shell";
import { PageHeader, Thumb } from "@/components/ui";

type GuidePost = {
  id: string;
  title: string;
  excerpt?: string;
  description?: string;
  image?: string;
  date?: string;
  status?: string;
  source?: string;
  authorName?: string;
};

const QUEUES = [
  ["awaiting_approval", "New posts"],
  ["published", "Published"],
] as const;

export default function GuideApprovalsPage() {
  const [status, setStatus] = useState("awaiting_approval");
  const [q, setQ] = useState("");
  const [data, setData] = useState<Page<GuidePost> | null>(null);

  async function load(nextStatus = status, query = q) {
    const params = new URLSearchParams({
      status: nextStatus,
      limit: "40",
      ...(query ? { q: query } : {}),
    });
    setData(await api(`/admin/posts?${params}`));
  }

  useLiveRefresh(() => load(), 3000);

  async function act(id: string, action: "approve" | "decline" | "pending") {
    await api(`/admin/posts/${id}/${action}`, { method: "POST" });
    await load();
  }

  return (
    <Shell>
      <PageHeader
        kicker="Queue"
        title="Guide posts"
        hint="App submissions stay hidden until you accept them. Decline removes the post."
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
          (data?.items || []).map((post) => (
            <article key={post.id} className="panel flex items-start gap-5 p-5">
              <Thumb src={mediaUrl(post.image)} large />
              <div className="min-w-0 flex-1">
                <p className="eyebrow">{[post.source, post.authorName, post.date].filter(Boolean).join(" · ")}</p>
                <p className="mt-1 text-lg font-semibold tracking-tight">{post.title}</p>
                {post.excerpt ? (
                  <p className="mt-2 line-clamp-4 text-sm leading-6">{post.excerpt}</p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="btn btn-green" onClick={() => act(post.id, "approve")}>
                    Approve
                  </button>
                  <button className="btn btn-gold" onClick={() => act(post.id, "pending")}>
                    Hold
                  </button>
                  <button className="btn btn-danger" onClick={() => act(post.id, "decline")}>
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
