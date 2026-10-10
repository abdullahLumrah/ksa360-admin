"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { api, type Page } from "@/lib/api";
import { useLiveRefresh } from "@/lib/live";
import { Shell } from "@/components/shell";
import { PageHeader, prettyDate } from "@/components/ui";

type PushJob = {
  id: string;
  title: string;
  body: string;
  platform: string;
  userId: string;
  sendAt: string;
  status: string;
  tokenCount: number;
  sentCount: number;
  failedCount: number;
  error: string;
  createdBy: string;
  createdAt: string;
};

type PushDesk = Page<PushJob> & {
  tokens: { total: number; android: number; ios: number };
  fcmReady: boolean;
};

function localInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultSchedule() {
  return localInputValue(new Date(Date.now() + 10 * 60 * 1000));
}

export default function PushPage() {
  const [data, setData] = useState<PushDesk | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [platform, setPlatform] = useState("all");
  const [when, setWhen] = useState<"now" | "later">("now");
  const [sendAt, setSendAt] = useState(defaultSchedule);
  const [userId, setUserId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setData(await api<PushDesk>("/admin/push?limit=40"));
  }, []);

  useLiveRefresh(load, 5000);

  const tokens = data?.tokens || { total: 0, android: 0, ios: 0 };
  const preview = useMemo(
    () => (when === "now" ? "Send now" : prettyDate(new Date(sendAt).toISOString())),
    [when, sendAt],
  );

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const job = await api<PushJob>("/admin/push", {
        method: "POST",
        body: JSON.stringify({
          title,
          body,
          platform,
          userId: userId.trim() || undefined,
          sendAt: when === "later" ? new Date(sendAt).toISOString() : undefined,
        }),
      });
      setNotice(
        job.status === "pending"
          ? `Scheduled for ${prettyDate(job.sendAt)}.`
          : `Sent to ${job.sentCount} of ${job.tokenCount} devices.`,
      );
      setTitle("");
      setBody("");
      setUserId("");
      setWhen("now");
      setSendAt(defaultSchedule());
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send");
    } finally {
      setBusy(false);
    }
  }

  async function cancel(id: string) {
    setError("");
    try {
      await api(`/admin/push/${id}/cancel`, { method: "POST" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not cancel");
    }
  }

  return (
    <Shell>
      <PageHeader
        kicker="Alerts"
        title="Push"
        hint="Send a notification to the KSA 360 app now, or pick a time. Choose Android, iOS, or both. Rebuild the mobile app and allow notifications before a device can receive one."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="panel p-5">
          <p className="text-sm text-muted">Devices</p>
          <p className="display mt-3 text-[28px]">{data ? tokens.total : "—"}</p>
        </div>
        <div className="panel p-5">
          <p className="text-sm text-muted">Android</p>
          <p className="display mt-3 text-[28px]">{data ? tokens.android : "—"}</p>
        </div>
        <div className="panel p-5">
          <p className="text-sm text-muted">iOS</p>
          <p className="display mt-3 text-[28px]">{data ? tokens.ios : "—"}</p>
        </div>
        <div className="panel p-5">
          <p className="text-sm text-muted">Firebase</p>
          <p className="mt-3 text-lg font-semibold">
            {data ? (data.fcmReady ? "Ready" : "Needs service account") : "—"}
          </p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="panel mt-6 p-6">
        <h2 className="text-lg font-semibold tracking-tight">Compose</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block text-sm">
            Title
            <input
              className="field mt-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="KSA 360"
              required
            />
          </label>
          <label className="block text-sm">
            Optional user ID
            <input
              className="field mt-2"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Leave blank to send to everyone"
            />
          </label>
        </div>
        <label className="mt-4 block text-sm">
          Body
          <textarea
            className="field mt-2 min-h-28"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What should people see?"
            required
          />
        </label>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <fieldset className="text-sm">
            <legend>Platform</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                ["all", "All devices"],
                ["android", "Android only"],
                ["ios", "iOS only"],
              ].map(([value, label]) => (
                <label
                  key={value}
                  className={`btn ${platform === value ? "btn-gold" : "btn-ghost"}`}
                >
                  <input
                    type="radio"
                    className="sr-only"
                    name="platform"
                    value={value}
                    checked={platform === value}
                    onChange={() => setPlatform(value)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="text-sm">
            <legend>When</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              <label className={`btn ${when === "now" ? "btn-gold" : "btn-ghost"}`}>
                <input
                  type="radio"
                  className="sr-only"
                  name="when"
                  checked={when === "now"}
                  onChange={() => setWhen("now")}
                />
                Send now
              </label>
              <label className={`btn ${when === "later" ? "btn-gold" : "btn-ghost"}`}>
                <input
                  type="radio"
                  className="sr-only"
                  name="when"
                  checked={when === "later"}
                  onChange={() => setWhen("later")}
                />
                Schedule
              </label>
            </div>
            {when === "later" ? (
              <input
                className="field mt-3"
                type="datetime-local"
                value={sendAt}
                onChange={(e) => setSendAt(e.target.value)}
                required
              />
            ) : (
              <p className="mt-3 text-sm text-muted">{preview}</p>
            )}
          </fieldset>
        </div>
        {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
        {notice ? <p className="mt-4 text-sm text-green">{notice}</p> : null}
        <button className="btn btn-green mt-6" disabled={busy || !title.trim() || !body.trim()}>
          {busy ? "Sending…" : when === "later" ? "Schedule push" : "Send push"}
        </button>
      </form>

      <section className="panel table-wrap mt-6">
        <div className="p-6 pb-0">
          <h2 className="text-lg font-semibold tracking-tight">Recent and scheduled</h2>
        </div>
        <table>
          <thead>
            <tr>
              <th>Status</th>
              <th>Title</th>
              <th>Platform</th>
              <th>Send at</th>
              <th>Result</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(data?.items || []).length === 0 ? (
              <tr>
                <td colSpan={6} className="text-muted">
                  No pushes yet.
                </td>
              </tr>
            ) : (
              (data?.items || []).map((job) => (
                <tr key={job.id}>
                  <td className="capitalize">{job.status}</td>
                  <td>
                    <p className="font-semibold">{job.title}</p>
                    <p className="mt-1 text-xs text-muted">{job.body}</p>
                    {job.userId ? (
                      <p className="mt-1 text-xs text-muted">User {job.userId}</p>
                    ) : null}
                    {job.error ? <p className="mt-1 text-xs text-danger">{job.error}</p> : null}
                  </td>
                  <td className="capitalize">{job.platform}</td>
                  <td className="text-muted">{prettyDate(job.sendAt)}</td>
                  <td className="text-muted">
                    {job.status === "pending" || job.status === "cancelled"
                      ? "—"
                      : `${job.sentCount}/${job.tokenCount}`}
                  </td>
                  <td>
                    {job.status === "pending" ? (
                      <button className="btn btn-ghost" type="button" onClick={() => cancel(job.id)}>
                        Cancel
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </Shell>
  );
}
