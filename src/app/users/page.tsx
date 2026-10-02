"use client";

import Link from "next/link";
import { useState } from "react";
import { api, type Page } from "@/lib/api";
import { useLiveRefresh } from "@/lib/live";
import { Shell } from "@/components/shell";
import { PageHeader, Thumb, prettyDate, prettyGender } from "@/components/ui";

type User = {
  id: string;
  name: string;
  email: string;
  dateOfBirth: string;
  gender: string;
  avatar: string;
  provider: string;
  googleId: string;
  createdAt: string;
};

export default function UsersPage() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const [data, setData] = useState<Page<User> | null>(null);

  async function load(next = 0, query = q) {
    setData(await api(`/admin/users?q=${encodeURIComponent(query)}&page=${next}&limit=30`));
    setPage(next);
  }

  useLiveRefresh(() => load(page, q), 4000);

  return (
    <Shell>
      <PageHeader
        kicker="Accounts"
        title="Users"
        hint="Name, email, gender, birth date, and sign-in details for every account."
      />
      <div className="flex gap-3">
        <input
          className="field max-w-md"
          placeholder="Search name, email, or user ID"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(0, q)}
        />
        <button className="btn btn-ghost" onClick={() => load(0, q)}>
          Search
        </button>
      </div>
      <div className="panel table-wrap mt-6">
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>Email</th>
              <th>Gender</th>
              <th>Birth date</th>
              <th>Signed in</th>
              <th>Joined</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(data?.items || []).map((user) => (
              <tr key={user.id}>
                <td>
                  <Thumb src={user.avatar} />
                </td>
                <td>
                  <Link href={`/users/${user.id}`} className="font-semibold hover:text-gold">
                    {user.name || "—"}
                  </Link>
                  <p className="mt-1 text-xs text-muted">{user.id}</p>
                </td>
                <td>{user.email || "—"}</td>
                <td>{prettyGender(user.gender)}</td>
                <td>{prettyDate(user.dateOfBirth)}</td>
                <td className="capitalize">{user.provider || "—"}</td>
                <td>{prettyDate(user.createdAt)}</td>
                <td>
                  <Link className="text-green" href={`/users/${user.id}`}>
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-between px-4 py-3 text-sm text-muted">
          <span>{data?.total ?? 0} users</span>
          <div className="flex gap-2">
            <button className="btn btn-ghost" disabled={page === 0} onClick={() => load(page - 1)}>
              Prev
            </button>
            <button
              className="btn btn-ghost"
              disabled={(page + 1) * 30 >= (data?.total || 0)}
              onClick={() => load(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </Shell>
  );
}
