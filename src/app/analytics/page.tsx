"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { api, type Page } from "@/lib/api";
import { Shell } from "@/components/shell";
import { PageHeader } from "@/components/ui";
import { useLiveRefresh } from "@/lib/live";

type Row = { events: number; uniqueUsers: number };
type Summary = {
  days: number;
  users: {
    accounts: number;
    deletedPending: number;
    uniqueActive: number;
    uniqueSignedIn: number;
  };
  auth: {
    logins: number;
    uniqueLogins: number;
    registers: number;
    signouts: number;
    uniqueSignouts: number;
    profileCompletions: number;
    deletes: number;
    restores: number;
  };
  bySection: Array<{ section: string } & Row>;
  byEvent: Array<{ name: string } & Row>;
  byDay: Array<{ day: string; events: number; uniqueUsers: number; logins: number }>;
  topTargets: Array<{ id: string; title: string; section: string } & Row>;
  coupons: Array<{ id: string; title: string } & Row>;
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

function Stat({ label, value, hint }: { label: string; value?: number; hint?: string }) {
  return (
    <div className="panel p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="display mt-2 text-[28px]">{value ?? "—"}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [events, setEvents] = useState<Page<EventRow> | null>(null);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    const [nextSummary, nextEvents] = await Promise.all([
      api<Summary>("/admin/analytics/summary?days=7"),
      api<Page<EventRow>>(`/admin/analytics/events?limit=30&q=${encodeURIComponent(q)}`),
    ]);
    setSummary(nextSummary);
    setEvents(nextEvents);
  }, [q]);

  const updatedAt = useLiveRefresh(load, 4000);
  const dayMax = Math.max(1, ...(summary?.byDay.map((item) => item.uniqueUsers) || [1]));
  const sectionMax = Math.max(1, ...(summary?.bySection.map((item) => item.uniqueUsers) || [1]));

  return (
    <Shell>
      <PageHeader
        kicker="Engagement"
        title="Analytics"
        hint="Unique people, not repeat taps. The same user clicking Daily in KSA ten times still counts as one unique user."
      />
      <p className="live mb-5">
        <i />
        Live · unique users over 7 days
        <span className="font-medium text-muted"> · {new Date(updatedAt).toLocaleTimeString()}</span>
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Unique people active" value={summary?.users.uniqueActive} hint="Signed-in + guests, de-duplicated" />
        <Stat label="Unique signed-in" value={summary?.users.uniqueSignedIn} hint="Accounts that actually used the app" />
        <Stat label="Unique logins" value={summary?.auth.uniqueLogins} hint={`${summary?.auth.logins ?? 0} login events`} />
        <Stat label="Unique sign-outs" value={summary?.auth.uniqueSignouts} hint={`${summary?.auth.signouts ?? 0} sign-out events`} />
        <Stat label="New accounts" value={summary?.auth.registers} />
        <Stat label="Profiles completed" value={summary?.auth.profileCompletions} />
        <Stat label="Accounts deleted" value={summary?.auth.deletes} hint={`${summary?.auth.restores ?? 0} restored`} />
        <Stat label="Live accounts" value={summary?.users.accounts} hint={`${summary?.users.deletedPending ?? 0} in 15-day restore`} />
      </div>

      <section className="panel mt-4 p-5">
        <h2 className="text-lg font-semibold tracking-tight">Unique people per day</h2>
        <div className="mt-5 flex h-36 items-end gap-1">
          {(summary?.byDay || []).length === 0 ? (
            <p className="text-sm text-muted">No engagement yet. Use the app to start the log.</p>
          ) : (
            (summary?.byDay || []).map((item) => (
              <div key={item.day} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-green"
                  style={{ height: `${Math.max(8, (item.uniqueUsers / dayMax) * 100)}%` }}
                  title={`${item.day}: ${item.uniqueUsers} unique · ${item.events} events · ${item.logins} logins`}
                />
                <span className="text-[10px] text-muted">{item.day.slice(5)}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="panel p-5">
          <h2 className="text-lg font-semibold tracking-tight">Sections · unique users</h2>
          <div className="mt-4 space-y-3">
            {(summary?.bySection || []).map((item) => (
              <div key={item.section}>
                <div className="flex justify-between text-sm">
                  <span>{item.section}</span>
                  <span>
                    {item.uniqueUsers} people
                    <span className="text-muted"> · {item.events} taps</span>
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-paper">
                  <div className="h-2 rounded-full bg-green" style={{ width: `${(item.uniqueUsers / sectionMax) * 100}%` }} />
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
                <th>Unique</th>
                <th>Taps</th>
              </tr>
            </thead>
            <tbody>
              {(summary?.topTargets || []).map((item) => (
                <tr key={`${item.id}-${item.section}`}>
                  <td>{item.title || item.id}</td>
                  <td>{item.section}</td>
                  <td>{item.uniqueUsers}</td>
                  <td className="text-muted">{item.events}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <section className="panel mt-4 p-5">
        <h2 className="text-lg font-semibold tracking-tight">Coupons used</h2>
        <table className="mt-3">
          <thead>
            <tr>
              <th>Code</th>
              <th>Unique people</th>
              <th>Copies</th>
            </tr>
          </thead>
          <tbody>
            {(summary?.coupons || []).length === 0 ? (
              <tr>
                <td colSpan={3} className="text-sm text-muted">No coupon copies yet.</td>
              </tr>
            ) : (
              (summary?.coupons || []).map((item) => (
                <tr key={item.id}>
                  <td>{item.title || item.id}</td>
                  <td>{item.uniqueUsers}</td>
                  <td className="text-muted">{item.events}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

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
                <td className="text-xs">{row.email || row.user_id || row.device_id || "guest"}</td>
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
