"use client";

import { useState } from "react";
import { api, type Page } from "@/lib/api";
import { useLiveRefresh } from "@/lib/live";
import { Shell } from "@/components/shell";
import { PageHeader } from "@/components/ui";

type Job = {
  id: string;
  title: string;
  category?: string;
  companyName?: string;
  city?: string;
  employmentType?: string;
  workMode?: string;
  salaryDisplay?: string;
  status?: string;
  source?: string;
  authorName?: string;
  applyUrl?: string;
  summary?: string;
  description?: string;
  datePosted?: string;
};

const QUEUES = [
  ["awaiting_approval", "New posts"],
  ["published", "Published"],
] as const;

export default function JobApprovalsPage() {
  const [status, setStatus] = useState("awaiting_approval");
  const [q, setQ] = useState("");
  const [data, setData] = useState<Page<Job> | null>(null);

  async function load(nextStatus = status, query = q) {
    const params = new URLSearchParams({
      status: nextStatus,
      limit: "40",
      ...(query ? { q: query } : {}),
    });
    setData(await api(`/admin/jobs?${params}`));
  }

  useLiveRefresh(() => load(), 3000);

  async function act(id: string, action: "approve" | "decline" | "pending") {
    await api(`/admin/jobs/${id}/${action}`, { method: "POST" });
    await load();
  }

  return (
    <Shell>
      <PageHeader
        kicker="Queue"
        title="Job posts"
        hint="Employer submissions stay hidden until you accept them. Decline removes the job."
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
          (data?.items || []).map((job) => (
            <article key={job.id} className="panel p-5">
              <p className="eyebrow">
                {[job.category, job.city, job.source, job.authorName, job.datePosted].filter(Boolean).join(" · ")}
              </p>
              <p className="mt-1 text-lg font-semibold tracking-tight">{job.title}</p>
              <p className="mt-1 text-sm text-muted">
                {[job.companyName, job.employmentType, job.workMode, job.salaryDisplay].filter(Boolean).join(" · ")}
              </p>
              {job.summary ? <p className="mt-2 line-clamp-4 text-sm leading-6">{job.summary}</p> : null}
              {job.applyUrl ? (
                <a href={job.applyUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-gold">
                  {job.applyUrl}
                </a>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="btn btn-green" onClick={() => act(job.id, "approve")}>
                  Approve
                </button>
                <button className="btn btn-gold" onClick={() => act(job.id, "pending")}>
                  Hold
                </button>
                <button className="btn btn-danger" onClick={() => act(job.id, "decline")}>
                  Decline
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </Shell>
  );
}
