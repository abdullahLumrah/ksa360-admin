"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { api, type Page } from "@/lib/api";
import { Shell } from "@/components/shell";
import { PageHeader } from "@/components/ui";
import { useLiveRefresh } from "@/lib/live";

type Summary = {
  bySection: Array<{ section: string; n: number }>;
  byEvent: Array<{ name: string; n: number }>;
  byDay: Array<{ day: string; n: number }>;
  topTargets: Array<{ id: string; title: string; section: string; n: number }>;
};

type EventRow = {
  event_id: string;
  event_name: string;
  section: string;
  category: string;
  target_title: string;
  email: string;
  user_id: string;
  device_id: string;
  created_at: string;
};

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [events, setEvents] = useState<Page<EventRow> | null>(null);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    const [nextSummary, nextEvents] = await Promise.all([
      api<Summary>("/admin/analytics/summary"),
      api<Page<EventRow>>(`/admin/analytics/events?limit=30&q=${encodeURIComponent(q)}`),
    ]);
    setSummary(nextSummary);
    setEvents(nextEvents);
  }, [q]);

  const updatedAt = useLiveRefresh(load, 2000);

  const max = Math.max(1, ...(summary?.bySection.map((item) => item.n) || [1]));
  const dayMax = Math.max(1, ...(summary?.byDay.map((item) => item.n) || [1]));

  return (
    <Shell>
      <PageHeader
        kicker="Signals"
        title="Analytics"
        hint="Basic app events: section opens, category taps, and item opens. Signed-in users keep email; guests are a device ID."
      />
      <p className="live mb-5">
        <i />
        Live · updates every few seconds
        <span className="font-medium text-muted">
          · {new Date(updatedAt).toLocaleTimeString()}
        </span>
      </p>
      <section className="panel p-5">
        <h2 className="text-lg font-semibold tracking-tight">Daily events</h2>
        <div className="mt-5 flex h-36 items-end gap-1">
          {(summary?.byDay || []).length === 0 ? (
            <p className="text-sm text-muted">No events yet. Open sections in the app to start the log.</p>
          ) : (
            (summary?.byDay || []).map((item) => (
              <div key={item.day} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-green"
                  style={{ height: `${Math.max(8, (item.n / dayMax) * 100)}%` }}
                  title={`${item.day}: ${item.n}`}
                />
                <span className="text-[10px] text-muted">{item.day.slice(5)}</span>
              </div>
            ))
          )}
        </div>
      </section>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="panel p-5">
          <h2 className="text-lg font-semibold tracking-tight">Sections · 7 days</h2>
          <div className="mt-4 space-y-3">
            {(summary?.bySection || []).length === 0 ? (
              <p className="text-sm text-muted">No section events yet.</p>
            ) : null}
            {(summary?.bySection || []).map((item) => (
              <div key={item.section}>
                <div className="flex justify-between text-sm">
                  <span>{item.section || "unknown"}</span>
                  <span>{item.n}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-paper">
                  <div className="h-2 rounded-full bg-green" style={{ width: `${(item.n / max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="panel p-5">
          <h2 className="text-lg font-semibold tracking-tight">Opened items</h2>
          <table className="mt-3">
            <thead>
              <tr>
                <th>Item</th>
                <th>Section</th>
                <th>Opens</th>
              </tr>
            </thead>
            <tbody>
              {(summary?.topTargets || []).map((item) => (
                <tr key={`${item.id}-${item.section}`}>
                  <td>{item.title || item.id}</td>
                  <td>{item.section}</td>
                  <td>{item.n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
      <section className="panel mt-4 p-5">
        <div className="flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Event log</h2>
          <div className="flex gap-2">
            <input className="field w-64" placeholder="Search events, email, device" value={q} onChange={(e) => setQ(e.target.value)} />
            <button
              className="btn btn-ghost"
              onClick={async () => setEvents(await api(`/admin/analytics/events?q=${encodeURIComponent(q)}`))}
            >
              Search
            </button>
          </div>
        </div>
        <table className="mt-4">
          <thead>
            <tr>
              <th>Event</th>
              <th>Section</th>
              <th>Who</th>
              <th>When</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(events?.items || []).map((row) => (
              <tr key={row.event_id}>
                <td>
                  {row.event_name}
                  <div className="text-xs text-muted">{row.target_title || row.category}</div>
                </td>
                <td>{row.section}</td>
                <td className="text-xs">
                  {row.email || row.user_id || row.device_id || "guest"}
                </td>
                <td className="text-xs text-muted">{row.created_at.replace("T", " ").slice(0, 16)}</td>
                <td>
                  <Link
                    className="text-green"
                    href={
                      row.user_id
                        ? `/analytics/journey?userId=${row.user_id}`
                        : `/analytics/journey?deviceId=${row.device_id}`
                    }
                  >
                    Journey
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </Shell>
  );
}
