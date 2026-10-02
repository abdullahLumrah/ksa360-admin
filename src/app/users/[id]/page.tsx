"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api, mediaUrl } from "@/lib/api";
import { Shell } from "@/components/shell";
import { prettyDate, prettyGender } from "@/components/ui";

type Detail = {
  user: {
    id: string;
    name: string;
    email: string;
    dateOfBirth: string;
    gender: string;
    avatar: string;
    provider: string;
    googleId: string;
    createdAt: string;
    updatedAt: string;
  };
  sessions: Array<{ jti: string; expiresAt: number; revoked: boolean; createdAt: string }>;
  ads: Array<{ ad_id: string; title: string; status: string; views: number }>;
};

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 break-all text-[15px] font-medium">{value?.trim() ? value : "—"}</p>
    </div>
  );
}

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<Detail | null>(null);

  useEffect(() => {
    api<Detail>(`/admin/users/${params.id}`).then(setData).catch(() => {});
  }, [params.id]);

  const user = data?.user;
  const photo = mediaUrl(user?.avatar);

  return (
    <Shell>
      <Link href="/users" className="text-sm text-gold">
        Back to users
      </Link>
      <div className="mt-4 flex items-start gap-5">
        <span className="thumb-box thumb-lg">
          {photo ? <img src={photo} alt="" referrerPolicy="no-referrer" /> : null}
        </span>
        <div>
          <p className="eyebrow">Account</p>
          <h1 className="display mt-2">{user?.name || "User"}</h1>
          <p className="mt-2 text-muted">{user?.email || "No email"}</p>
        </div>
      </div>
      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <section className="panel p-6">
          <h2 className="text-lg font-semibold tracking-tight">Profile</h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Field label="Name" value={user?.name} />
            <Field label="Email" value={user?.email} />
            <Field label="Gender" value={prettyGender(user?.gender)} />
            <Field label="Birth date" value={prettyDate(user?.dateOfBirth)} />
            <Field label="Signed in with" value={user?.provider} />
            <Field label="Google ID" value={user?.googleId} />
            <Field label="User ID" value={user?.id} />
            <Field label="Joined" value={prettyDate(user?.createdAt)} />
            <Field label="Updated" value={prettyDate(user?.updatedAt)} />
            <Field label="Avatar URL" value={user?.avatar} />
          </div>
          <Link className="btn btn-ghost mt-6 inline-block" href={`/analytics/journey?userId=${user?.id || ""}`}>
            View journey
          </Link>
        </section>
        <section className="panel p-6">
          <h2 className="text-lg font-semibold tracking-tight">Sessions / tokens</h2>
          {(data?.sessions || []).length === 0 ? (
            <p className="mt-4 text-muted">No sessions.</p>
          ) : (
            <table className="mt-3">
              <thead>
                <tr>
                  <th>JTI</th>
                  <th>Created</th>
                  <th>Revoked</th>
                </tr>
              </thead>
              <tbody>
                {(data?.sessions || []).map((session) => (
                  <tr key={session.jti}>
                    <td className="text-xs">{session.jti}</td>
                    <td>{prettyDate(session.createdAt)}</td>
                    <td>{session.revoked ? "yes" : "active"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
      <section className="panel mt-4 p-6">
        <h2 className="text-lg font-semibold tracking-tight">Ads placed</h2>
        {(data?.ads || []).length === 0 ? (
          <p className="mt-3 text-muted">No Souq ads.</p>
        ) : (
          <table className="mt-3">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Views</th>
              </tr>
            </thead>
            <tbody>
              {data?.ads.map((ad) => (
                <tr key={ad.ad_id}>
                  <td>
                    <Link href={`/souq/${ad.ad_id}`} className="hover:text-gold">
                      {ad.title}
                    </Link>
                  </td>
                  <td>{ad.status}</td>
                  <td>{ad.views}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </Shell>
  );
}
