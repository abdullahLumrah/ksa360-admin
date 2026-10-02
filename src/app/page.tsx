"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Shell } from "@/components/shell";
import { PageHeader } from "@/components/ui";
import { useLiveRefresh } from "@/lib/live";

type Overview = {
  restaurants: number;
  activities: number;
  posts: number;
  users: number;
  souqAds: number;
  awaiting: number;
  pending: number;
  events: number;
  eventsToday: number;
};

const CARDS = [
  ["Eat places", "restaurants", "/eat"],
  ["Play activities", "activities", "/play"],
  ["Guide posts", "posts", "/guides"],
  ["App users", "users", "/users"],
  ["Souq ads", "souqAds", "/souq"],
  ["Awaiting approval", "awaiting", "/souq/approvals"],
  ["Events today", "eventsToday", "/analytics"],
] as const;

export default function OverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [actions, setActions] = useState<Array<{ action: string; entity: string; entity_id: string; created_at: string }>>([]);

  const load = useCallback(async () => {
    const [next, nextActions] = await Promise.all([
      api<Overview>("/admin/overview"),
      api<{ items: typeof actions }>("/admin/actions?limit=8"),
    ]);
    setData(next);
    setActions(nextActions.items);
  }, []);

  useLiveRefresh(load, 4000);

  return (
    <Shell>
      <PageHeader
        kicker="Today"
        title="Overview"
        hint="Live counts from the KSA 360 database. Approve ads, edit Eat and Play, and follow a user journey from here."
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {CARDS.map(([label, key, href]) => (
          <Link key={key} href={href} className="panel p-5">
            <p className="text-sm text-muted">{label}</p>
            <p className="display mt-3 text-[28px]">{data ? data[key] : "—"}</p>
          </Link>
        ))}
      </div>
      <section className="panel mt-6 p-6">
        <h2 className="text-lg font-semibold tracking-tight">Recent admin actions</h2>
        <div className="mt-4">
          {actions.length === 0 ? (
            <p className="text-sm text-muted">No edits yet.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((item) => (
                  <tr key={`${item.created_at}-${item.entity_id}`}>
                    <td>{item.action}</td>
                    <td>
                      {item.entity} · {item.entity_id}
                    </td>
                    <td className="text-muted">{item.created_at.replace("T", " ").slice(0, 16)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </Shell>
  );
}
