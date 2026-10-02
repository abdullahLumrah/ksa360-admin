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
  { href: "/guides", label: "Guides" },
  { href: "/souq", label: "Souq" },
  { href: "/souq/approvals", label: "Approvals" },
  { href: "/users", label: "Users" },
];

function navActive(path: string, href: string) {
  if (href === "/") return path === "/";
  if (href === "/souq") return path === "/souq" || (path.startsWith("/souq/") && !path.startsWith("/souq/approvals"));
  return path === href || path.startsWith(`${href}/`);
}

export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [awaiting, setAwaiting] = useState(0);

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
    api<{ awaiting: number }>("/admin/overview")
      .then((data) => setAwaiting(data.awaiting || 0))
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
