"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { api, mediaUrl, type Page } from "@/lib/api";
import { useLiveRefresh } from "@/lib/live";
import { type SouqAd } from "@/lib/souq";
import { Shell } from "@/components/shell";
import { PageHeader, Thumb, money } from "@/components/ui";

type Category = { id: string; name: string };

export default function SouqPage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [data, setData] = useState<Page<SouqAd> | null>(null);
  const [page, setPage] = useState(0);
  const [edit, setEdit] = useState<SouqAd | null>(null);
  const [image, setImage] = useState("");
  const [error, setError] = useState("");

  async function load(next = page) {
    const params = new URLSearchParams({
      q,
      page: String(next),
      limit: "20",
      ...(category ? { category } : {}),
      ...(status ? { status } : {}),
    });
    setData(await api(`/admin/souq/ads?${params}`));
    setPage(next);
  }

  useLiveRefresh(() => load(page), 3000);

  useEffect(() => {
    api<{ items: Category[] }>("/admin/souq/categories")
      .then((res) => setCategories(res.items))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!edit) return;
    setError("");
    try {
      await api(`/admin/souq/ads/${edit.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: edit.title,
          subtitle: edit.subtitle,
          city: edit.city,
          price: edit.price,
          video: edit.video,
          image,
        }),
      });
      setEdit(null);
      await load(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  return (
    <Shell>
      <PageHeader
        kicker="Marketplace"
        title="Souq"
        hint="Every ad in the database — cars and the rest — by category and approval status."
      />
      <div className="flex flex-wrap gap-3">
        <input
          className="field max-w-sm"
          placeholder="Search title, make, city"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load(0)}
        />
        <select className="field max-w-48" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
        <select className="field max-w-48" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="approved">approved</option>
          <option value="awaiting_approval">awaiting approval</option>
          <option value="pending">pending</option>
          <option value="declined">declined</option>
          <option value="sold">sold</option>
          <option value="paused">paused</option>
        </select>
        <button className="btn btn-ghost" onClick={() => load(0)}>
          Search
        </button>
      </div>
      {error ? <p className="mt-4 text-danger">{error}</p> : null}
      <div className="panel table-wrap mt-6">
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Title</th>
              <th>Category</th>
              <th>Make</th>
              <th>City</th>
              <th>Status</th>
              <th>Views</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {(data?.items || []).map((ad) => (
              <tr key={ad.id}>
                <td>
                  <Link href={`/souq/${ad.id}`}>
                    <Thumb src={ad.images?.[0]} />
                  </Link>
                </td>
                <td>
                  <Link href={`/souq/${ad.id}`} className="title-clamp hover:text-gold">
                    {ad.title}
                  </Link>
                  {ad.price != null ? <p className="mt-1 text-xs text-muted">{money(ad.price)}</p> : null}
                </td>
                <td>{ad.categoryId}</td>
                <td>{ad.make || "—"}</td>
                <td>{ad.city}</td>
                <td>
                  <span className={`pill pill-${ad.status}`}>{ad.status.replaceAll("_", " ")}</span>
                </td>
                <td>{ad.views}</td>
                <td className="whitespace-nowrap text-right">
                  <Link href={`/souq/${ad.id}`} className="btn btn-ghost mr-2 inline-block">
                    Details
                  </Link>
                  <button
                    className="btn btn-ghost mr-2"
                    onClick={() => {
                      setEdit(ad);
                      setImage(ad.images?.[0] || "");
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={async () => {
                      if (!confirm("Delete this ad?")) return;
                      await api(`/admin/souq/ads/${ad.id}`, { method: "DELETE" });
                      load(page);
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-between px-4 py-3 text-sm text-muted">
          <span>{data?.total ?? 0} ads</span>
          <div className="flex gap-2">
            <button className="btn btn-ghost" disabled={page === 0} onClick={() => load(page - 1)}>
              Prev
            </button>
            <button
              className="btn btn-ghost"
              disabled={(page + 1) * 20 >= (data?.total || 0)}
              onClick={() => load(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
      {edit ? (
        <div className="fixed inset-0 z-20 grid place-items-center bg-ink/40 px-6">
          <form onSubmit={save} className="panel max-h-[90vh] w-full max-w-lg overflow-auto p-6">
            <h2 className="display text-[26px]">Edit ad</h2>
            {image ? (
              <img src={mediaUrl(image)} alt="" className="mt-4 h-40 w-full rounded-[20px] object-cover" />
            ) : null}
            <label className="mt-4 block text-sm">
              Title
              <input className="field mt-2" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
            </label>
            <label className="mt-4 block text-sm">
              Subtitle
              <input
                className="field mt-2"
                value={edit.subtitle || ""}
                onChange={(e) => setEdit({ ...edit, subtitle: e.target.value })}
              />
            </label>
            <label className="mt-4 block text-sm">
              City
              <input className="field mt-2" value={edit.city} onChange={(e) => setEdit({ ...edit, city: e.target.value })} />
            </label>
            <label className="mt-4 block text-sm">
              Price
              <input
                className="field mt-2"
                value={edit.price ?? ""}
                onChange={(e) => setEdit({ ...edit, price: e.target.value === "" ? null : Number(e.target.value) })}
              />
            </label>
            <label className="mt-4 block text-sm">
              Image URL
              <input className="field mt-2" value={image} onChange={(e) => setImage(e.target.value)} />
            </label>
            <label className="mt-4 block text-sm">
              Video URL
              <input
                className="field mt-2"
                value={edit.video || ""}
                onChange={(e) => setEdit({ ...edit, video: e.target.value })}
              />
            </label>
            <div className="mt-6 flex gap-3">
              <button className="btn btn-green">Save</button>
              <button type="button" className="btn btn-ghost" onClick={() => setEdit(null)}>
                Close
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </Shell>
  );
}
