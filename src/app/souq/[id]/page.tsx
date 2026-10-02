"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api, mediaUrl } from "@/lib/api";
import { useLiveRefresh } from "@/lib/live";
import { specPairs, type SouqAd } from "@/lib/souq";
import { Shell } from "@/components/shell";
import { money } from "@/components/ui";

export default function SouqAdPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [ad, setAd] = useState<SouqAd | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    subtitle: "",
    description: "",
    city: "",
    price: "" as string | number,
    image: "",
    video: "",
  });

  async function load() {
    const next = await api<SouqAd>(`/admin/souq/ads/${params.id}`);
    setAd(next);
    if (!editing) {
      setDraft({
        title: next.title,
        subtitle: next.subtitle || "",
        description: next.description || "",
        city: next.city,
        price: next.price ?? "",
        image: next.images?.[0] || "",
        video: next.video || "",
      });
    }
  }

  useLiveRefresh(() => load().catch((err) => setError(err instanceof Error ? err.message : "Ad not found")), 3000);

  async function act(action: "approve" | "decline" | "pending") {
    await api(`/admin/souq/ads/${params.id}/${action}`, { method: "POST" });
    await load();
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api(`/admin/souq/ads/${params.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: draft.title,
          subtitle: draft.subtitle,
          description: draft.description,
          city: draft.city,
          price: draft.price === "" ? null : Number(draft.price),
          video: draft.video,
          image: draft.image,
        }),
      });
      setEditing(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  if (!ad && !error) {
    return (
      <Shell>
        <p className="text-muted">Opening ad…</p>
      </Shell>
    );
  }

  if (!ad) {
    return (
      <Shell>
        <Link href="/souq" className="text-sm text-gold">
          Back to Souq
        </Link>
        <p className="mt-4 text-danger">{error}</p>
      </Shell>
    );
  }

  const photos = ad.images || [];
  const specs = specPairs(ad);
  const place = [ad.city, ad.district].filter(Boolean).join(" · ");

  return (
    <Shell>
      <Link href="/souq" className="text-sm text-gold">
        Back to Souq
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow">{ad.categoryId}</p>
          <h1 className="display mt-2 max-w-3xl">{ad.title}</h1>
          {ad.subtitle ? <p className="lede mt-2">{ad.subtitle}</p> : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`pill pill-${ad.status}`}>{ad.status.replaceAll("_", " ")}</span>
          <button className="btn btn-green" onClick={() => act("approve")}>
            Approve
          </button>
          <button className="btn btn-gold" onClick={() => act("pending")}>
            Pending
          </button>
          <button className="btn btn-danger" onClick={() => act("decline")}>
            Decline
          </button>
        </div>
      </div>

      {error ? <p className="mt-4 text-danger">{error}</p> : null}

      <div className="mt-6 grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="panel overflow-hidden">
          {photos.length ? (
            <div>
              <img
                src={mediaUrl(photos[0])}
                alt=""
                className="ad-hero"
                referrerPolicy="no-referrer"
              />
              {photos.length > 1 ? (
                <div className="ad-strip">
                  {photos.map((src) => (
                    <img key={src} src={mediaUrl(src)} alt="" referrerPolicy="no-referrer" />
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="grid h-64 place-items-center text-muted">No photos</div>
          )}
          {ad.video ? (
            <p className="border-t border-line px-5 py-3 text-sm">
              Video ·{" "}
              <a className="text-gold" href={mediaUrl(ad.video)} target="_blank" rel="noreferrer">
                {ad.video}
              </a>
            </p>
          ) : null}
        </section>

        <section className="panel p-6">
          <p className="text-3xl font-semibold tracking-tight">{money(ad.price) || "No price"}</p>
          <p className="mt-2 text-sm text-muted">
            {[place, ad.source, `${ad.views} views`, `${ad.favoritesCount ?? 0} saved`, ad.createdAt]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {specs.length ? (
            <dl className="spec-grid mt-5">
              {specs.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          <div className="mt-6 rounded-[16px] border border-line p-4">
            <p className="eyebrow">Seller</p>
            <p className="mt-2 font-semibold">{ad.seller?.name || "Seller"}</p>
            <p className="mt-1 text-sm text-muted">{ad.seller?.id || "—"}</p>
            {ad.seller?.phone ? <p className="mt-1 text-sm">{ad.seller.phone}</p> : null}
          </div>
          {ad.originalUrl ? (
            <a className="mt-4 inline-block text-sm text-gold" href={ad.originalUrl} target="_blank" rel="noreferrer">
              Original listing
            </a>
          ) : null}
        </section>
      </div>

      <section className="panel mt-5 p-6">
        <h2 className="text-lg font-semibold tracking-tight">Description</h2>
        <p className="mt-3 whitespace-pre-wrap leading-7 text-[15px]">
          {ad.description?.trim() || "No description."}
        </p>
      </section>

      <section className="panel mt-5 p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">Edit</h2>
          <button className="btn btn-ghost" onClick={() => setEditing((on) => !on)}>
            {editing ? "Hide" : "Edit fields"}
          </button>
        </div>
        {editing ? (
          <form onSubmit={save} className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="text-sm md:col-span-2">
              Title
              <input className="field mt-2" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </label>
            <label className="text-sm md:col-span-2">
              Subtitle
              <input
                className="field mt-2"
                value={draft.subtitle}
                onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
              />
            </label>
            <label className="text-sm md:col-span-2">
              Description
              <textarea
                className="field mt-2 min-h-32"
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </label>
            <label className="text-sm">
              City
              <input className="field mt-2" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
            </label>
            <label className="text-sm">
              Price
              <input
                className="field mt-2"
                value={draft.price}
                onChange={(e) => setDraft({ ...draft, price: e.target.value })}
              />
            </label>
            <label className="text-sm md:col-span-2">
              First image URL
              <input className="field mt-2" value={draft.image} onChange={(e) => setDraft({ ...draft, image: e.target.value })} />
            </label>
            <label className="text-sm md:col-span-2">
              Video URL
              <input className="field mt-2" value={draft.video} onChange={(e) => setDraft({ ...draft, video: e.target.value })} />
            </label>
            <div className="flex gap-3 md:col-span-2">
              <button className="btn btn-green">Save</button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={async () => {
                  if (!confirm("Delete this ad?")) return;
                  await api(`/admin/souq/ads/${ad.id}`, { method: "DELETE" });
                  router.push("/souq");
                }}
              >
                Delete
              </button>
            </div>
          </form>
        ) : null}
      </section>
    </Shell>
  );
}
