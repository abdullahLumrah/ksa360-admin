"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, clearToken, getToken } from "@/lib/api";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/analytics", label: "Analytics" },
  { href: "/eat", label: "Eat" },
  { href: "/play", label: "Play" },
  { href: "/care", label: "Care" },
  { href: "/guides", label: "Guides" },
  { href: "/guides/approvals", label: "Guide queue" },
  { href: "/souq", label: "Souq" },
  { href: "/souq/approvals", label: "Approvals" },
  { href: "/jobs", label: "Jobs" },
  { href: "/jobs/approvals", label: "Job queue" },
  { href: "/communities", label: "Communities" },
  { href: "/communities/reports", label: "Reports" },
  { href: "/users", label: "Users" },
  { href: "/push", label: "Push" },
];

function navActive(path: string, href: string) {
  if (href === "/") return path === "/";
  if (href === "/souq") return path === "/souq" || (path.startsWith("/souq/") && !path.startsWith("/souq/approvals"));
  if (href === "/jobs") return path === "/jobs" || (path.startsWith("/jobs/") && !path.startsWith("/jobs/approvals"));
  if (href === "/communities") {
    return path === "/communities" || (path.startsWith("/communities/") && !path.startsWith("/communities/reports"));
  }
  if (href === "/guides") return path === "/guides";
  return path === href || path.startsWith(`${href}/`);
}

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [awaiting, setAwaiting] = useState(0);
  const [awaitingPosts, setAwaitingPosts] = useState(0);
  const [awaitingJobs, setAwaitingJobs] = useState(0);
  const [openReports, setOpenReports] = useState(0);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    api<{ admin: { email: string } }>("/admin/me")
      .then((data) => {
        setEmail(data.admin.email);
        setReady(true);
      })
      .catch(() => router.replace("/login"));
    api<{
      awaiting: number;
      awaitingPosts: number;
      awaitingJobs: number;
      openReports: number;
    }>("/admin/overview")
      .then((data) => {
        setAwaiting(data.awaiting || 0);
        setAwaitingPosts(data.awaitingPosts || 0);
        setAwaitingJobs(data.awaitingJobs || 0);
        setOpenReports(data.openReports || 0);
      })
      .catch(() => {});
  }, [router]);

  if (!ready) {
    return <div className="grid min-h-screen place-items-center text-muted">Opening desk…</div>;
  }

  return (
    <div className="mx-auto grid min-h-screen max-w-[1480px] grid-cols-[228px_1fr]">
      <aside className="sticky top-0 flex h-screen flex-col border-r border-line px-4 py-6">
        <p className="eyebrow px-2">KSA 360</p>
        <p className="display mt-1 px-2 text-[26px]">Admin</p>
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const on = navActive(path, item.href);
            return (
              <Link key={item.href} href={item.href} className={`nav-link ${on ? "is-on" : ""}`}>
                <span>{item.label}</span>
                {item.href === "/souq/approvals" && awaiting > 0 ? (
                  <em className="nav-badge not-italic">{awaiting}</em>
                ) : null}
                {item.href === "/guides/approvals" && awaitingPosts > 0 ? (
                  <em className="nav-badge not-italic">{awaitingPosts}</em>
                ) : null}
                {item.href === "/jobs/approvals" && awaitingJobs > 0 ? (
                  <em className="nav-badge not-italic">{awaitingJobs}</em>
                ) : null}
                {item.href === "/communities/reports" && openReports > 0 ? (
                  <em className="nav-badge not-italic">{openReports}</em>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="px-2 text-xs text-muted">
          <p className="truncate">{email}</p>
          <button
            className="mt-2 font-semibold text-gold"
            onClick={() => {
              clearToken();
              router.replace("/login");
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="min-w-0 px-8 py-8">{children}</main>
    </div>
  );
}
