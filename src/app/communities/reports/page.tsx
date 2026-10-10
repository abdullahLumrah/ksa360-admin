"use client";

import { useState } from "react";
import { api, type Page } from "@/lib/api";
import { useLiveRefresh } from "@/lib/live";
import { Shell } from "@/components/shell";
import { PageHeader } from "@/components/ui";

type SnapshotComment = {
  id?: string;
  authorName?: string;
  body?: string;
  parentId?: string;
  replies?: SnapshotComment[];
};

type Snapshot = {
  communityId?: string;
  communityName?: string;
  post?: { id?: string; body?: string; authorName?: string };
  comment?: { id?: string; body?: string; authorName?: string; parentId?: string };
  comments?: SnapshotComment[];
};

type Report = {
  id: string;
  reporterName?: string;
  targetType?: string;
  targetId?: string;
  reportedUserName?: string;
  reportedUserId?: string;
  communityId?: string;
  communityName?: string;
  reason?: string;
  details?: string;
  status?: string;
  adminNote?: string;
  snapshot?: Snapshot | null;
  createdAt?: string;
};

const QUEUES = [
  ["open", "Open"],
  ["reviewing", "Reviewing"],
  ["resolved", "Resolved"],
  ["dismissed", "Dismissed"],
  ["all", "All"],
] as const;

function CommentBlock({
  comment,
  highlightId,
}: {
  comment: SnapshotComment;
  highlightId?: string;
}) {
  const on = comment.id && comment.id === highlightId;
  return (
    <div className={`rounded-xl border px-3 py-2 ${on ? "border-amber-400 bg-amber-50" : "border-black/10 bg-black/[0.02]"}`}>
      <p className="text-xs font-semibold">
        {comment.authorName || "Member"}
        {on ? " · reported" : ""}
      </p>
      <p className="mt-1 text-sm leading-6 whitespace-pre-wrap">{comment.body}</p>
      {comment.replies?.length ? (
        <div className="mt-2 ml-4 grid gap-2">
          {comment.replies.map((reply) => (
            <CommentBlock key={reply.id} comment={reply} highlightId={highlightId} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function CommunityReportsPage() {
  const [status, setStatus] = useState("open");
  const [q, setQ] = useState("");
  const [data, setData] = useState<Page<Report> | null>(null);

  async function load(nextStatus = status, query = q) {
    const params = new URLSearchParams({
      status: nextStatus,
      limit: "40",
      ...(query ? { q: query } : {}),
    });
    setData(await api(`/admin/community-reports?${params}`));
  }

  useLiveRefresh(() => load(), 4000);

  async function setReport(id: string, next: string, note = "") {
    await api(`/admin/community-reports/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: next, adminNote: note }),
    });
    await load();
  }

  async function keep(report: Report) {
    if (!confirm("Keep this content? It stays live and the report is closed.")) return;
    await setReport(report.id, "dismissed", "Kept");
  }

  async function remove(report: Report) {
    const kind = report.targetType === "comment" ? "comment/reply" : report.targetType;
    if (!confirm(`Delete this ${kind}? This hides it from the app.`)) return;
    if (report.targetType === "post" && report.targetId) {
      await api(`/admin/community-posts/${report.targetId}`, { method: "DELETE" });
      await setReport(report.id, "resolved", "Deleted");
      return;
    }
    if (report.targetType === "comment" && report.targetId) {
      await api(`/admin/community-comments/${report.targetId}`, { method: "DELETE" });
      await setReport(report.id, "resolved", "Deleted");
      return;
    }
    if (report.targetType === "community" && report.targetId) {
      await api(`/admin/communities/${report.targetId}`, { method: "DELETE" });
      await setReport(report.id, "resolved", "Deleted");
      return;
    }
    await setReport(report.id, "resolved", "Deleted");
  }

  return (
    <Shell>
      <PageHeader
        kicker="Safety"
        title="Community reports"
        hint="Reported posts, comments, and replies land here with the full thread. Keep the content or delete it."
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
          placeholder="Search reason, people…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(status, q)}
        />
      </div>
      <div className="mt-6 grid gap-4">
        {(data?.items || []).length === 0 ? (
          <div className="panel p-8 text-muted">No reports in this queue.</div>
        ) : (
          (data?.items || []).map((report) => {
            const snap = report.snapshot;
            const highlightId = report.targetType === "comment" ? report.targetId : undefined;
            return (
              <article key={report.id} className="panel p-5">
                <p className="eyebrow">
                  {[
                    report.targetType,
                    report.reason,
                    report.createdAt,
                    report.status,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p className="mt-1 text-lg font-semibold tracking-tight">
                  {report.reportedUserName || report.targetId || "Report"}
                </p>
                <p className="mt-1 text-sm text-muted">
                  Reporter: {report.reporterName || "—"}
                  {snap?.communityName || report.communityName
                    ? ` · ${snap?.communityName || report.communityName}`
                    : ""}
                </p>
                {report.details ? (
                  <p className="mt-2 text-sm leading-6">{report.details}</p>
                ) : null}

                {snap?.post ? (
                  <div className="mt-4 rounded-2xl border border-black/10 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted">Post</p>
                    <p className="mt-1 text-sm font-semibold">{snap.post.authorName}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{snap.post.body}</p>
                    {snap.comments?.length ? (
                      <div className="mt-3 grid gap-2">
                        <p className="text-xs uppercase tracking-wide text-muted">Comments</p>
                        {snap.comments.map((comment) => (
                          <CommentBlock
                            key={comment.id}
                            comment={comment}
                            highlightId={highlightId}
                          />
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-muted">No comments on this post.</p>
                    )}
                  </div>
                ) : snap?.comment ? (
                  <div className="mt-4 rounded-2xl border border-amber-400 bg-amber-50 p-4">
                    <p className="text-xs uppercase tracking-wide">Reported {snap.comment.parentId ? "reply" : "comment"}</p>
                    <p className="mt-1 text-sm font-semibold">{snap.comment.authorName}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6">{snap.comment.body}</p>
                  </div>
                ) : null}

                {report.adminNote ? (
                  <p className="mt-2 text-xs text-muted">Note: {report.adminNote}</p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button className="btn btn-ghost" onClick={() => setReport(report.id, "reviewing")}>
                    Reviewing
                  </button>
                  <button className="btn btn-green" onClick={() => keep(report)}>
                    Keep
                  </button>
                  <button className="btn btn-danger" onClick={() => remove(report)}>
                    Delete
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </Shell>
  );
}
