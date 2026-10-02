"use client";

import { Suspense, useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Shell } from "@/components/shell";
import { useLiveRefresh } from "@/lib/live";

type EventRow = {
  event_id: string;
  event_name: string;
  section: string;
  category: string;
  target_title: string;
  path: string;
  email: string;
  created_at: string;
};

function JourneyInner() {
  const search = useSearchParams();
  const userId = search.get("userId") || "";
  const deviceId = search.get("deviceId") || "";
  const [items, setItems] = useState<EventRow[]>([]);

  const load = useCallback(async () => {
    const query = userId ? `userId=${userId}` : `deviceId=${deviceId}`;
    const res = await api<{ items: EventRow[] }>(`/admin/analytics/journey?${query}`);
    setItems(res.items);
  }, [userId, deviceId]);

  useLiveRefresh(load, 2000);

  return (
    <Shell>
      <Link href="/analytics" className="text-sm text-gold">
        Back to analytics
      </Link>
      <h1 className="display mt-3">Journey</h1>
      <p className="mt-2 text-muted">{userId ? `User ${userId}` : `Device ${deviceId}`}</p>
      <p className="live mt-3">
        <i />
        Live journey
      </p>
      <div className="mt-8 space-y-3">
        {items.map((item) => (
          <div key={item.event_id} className="panel px-5 py-4">
            <p className="text-xs text-gold">{item.created_at.replace("T", " ").slice(0, 19)}</p>
            <p className="mt-1 font-medium">
              {item.event_name} · {item.section}
            </p>
            <p className="text-sm text-muted">
              {[item.category, item.target_title, item.path].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
        ))}
        {items.length === 0 ? <p className="text-muted">No events for this visitor yet.</p> : null}
      </div>
    </Shell>
  );
}

export default function JourneyPage() {
  return (
    <Suspense fallback={<div className="grid min-h-screen place-items-center">Loading journey…</div>}>
      <JourneyInner />
    </Suspense>
  );
}
