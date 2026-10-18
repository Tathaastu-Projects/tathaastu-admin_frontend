"use client";

import { useEffect, useState } from "react";
import { LayoutGrid } from "lucide-react";

type Tile = {
  id: string;
  label: string;
  href: string;
  image: string;
  width: number;
  height: number;
};

const STORE_ORIGIN = "http://localhost:3025";

function previewSrc(url?: string) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/uploads/")) return url;
  return `${STORE_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
}

export function ShopCategoriesSection() {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/store/admin/category-tiles");
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to load categories");
      }
      const data = (payload.data || []) as Tile[];
      setTiles(data);
      setNames(Object.fromEntries(data.map((tile) => [tile.id, tile.label])));
      setPreviews(Object.fromEntries(data.map((tile) => [tile.id, previewSrc(tile.image)])));
      setFiles({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async (tile: Tile) => {
    const label = (names[tile.id] || "").trim();
    if (!label) {
      setError("Name is required");
      return;
    }
    setSavingId(tile.id);
    setError("");
    setSaved("");
    try {
      const body = new FormData();
      body.set("label", label);
      const file = files[tile.id];
      if (file) body.set("image", file);
      const response = await fetch(`/api/store/admin/category-tiles/${tile.id}`, {
        method: "PUT",
        body,
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to update category");
      }
      setSaved(`${label} updated`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update category");
    } finally {
      setSavingId("");
    }
  };

  return (
        <div className="space-y-6">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-maroon/20 bg-white/80 px-3 py-1 text-xs font-medium text-brand-maroon">
              <LayoutGrid className="h-3.5 w-3.5" />
              Homepage
            </div>
            <h2 className="font-serif text-3xl font-semibold text-brand-deepMaroon">Shop by Category</h2>
            <p className="mt-2 max-w-2xl text-sm text-stone-600">
              Each card is a fixed frame on the homepage. Upload an image at the size shown so it fills that frame, and change the name under the picture.
            </p>
          </div>

          {error ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>
          ) : null}
          {saved ? (
            <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{saved}</p>
          ) : null}

          {loading ? (
            <p className="text-sm text-stone-500">Loading frames…</p>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {tiles.map((tile) => (
                <article key={tile.id} className="rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-sm">
                  <div className="flex gap-4">
                    <div
                      className="w-40 shrink-0 overflow-hidden rounded-2xl bg-[#f3f0ea]"
                      style={{ aspectRatio: `${tile.width} / ${tile.height}` }}
                    >
                      {previews[tile.id] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={previews[tile.id]} alt="" className="h-full w-full object-fill" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1 space-y-3">
                      <p className="text-sm font-medium text-brand-deepMaroon">
                        Frame size: {tile.width} × {tile.height} px
                      </p>
                      <label className="block text-sm text-stone-700">
                        Name
                        <input
                          value={names[tile.id] || ""}
                          onChange={(event) =>
                            setNames((prev) => ({ ...prev, [tile.id]: event.target.value }))
                          }
                          className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
                        />
                      </label>
                      <label className="block text-sm text-stone-700">
                        Image ({tile.width} × {tile.height})
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          className="mt-1 block w-full text-sm"
                          onChange={(event) => {
                            const next = event.target.files?.[0] || null;
                            setFiles((prev) => ({ ...prev, [tile.id]: next }));
                            if (next) {
                              setPreviews((prev) => ({ ...prev, [tile.id]: URL.createObjectURL(next) }));
                            }
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => save(tile)}
                        disabled={savingId === tile.id}
                        className="rounded-xl bg-brand-maroon px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {savingId === tile.id ? "Saving…" : "Save frame"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
    </div>
  );
}
