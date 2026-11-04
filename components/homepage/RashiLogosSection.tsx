"use client";

import { useEffect, useState } from "react";
import { Sparkles, Trash2 } from "lucide-react";
import { parseApiJson } from "@/lib/parseApiJson";

type RashiLogo = {
  id: string;
  name: string;
  english: string;
  hindi?: string;
  logo?: string;
  effectiveLogo?: string;
};

const STORE_ORIGIN = "http://localhost:3025";

function previewSrc(url?: string) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) return url;
  if (url.startsWith("/uploads/")) return url;
  return `${STORE_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
}

export function RashiLogosSection() {
  const [items, setItems] = useState<RashiLogo[]>([]);
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
      const response = await fetch("/api/store/admin/rashi-logos");
      const payload = await parseApiJson<{
        success?: boolean;
        message?: string;
        data?: RashiLogo[];
      }>(response);
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to load rashi logos");
      }
      const data = payload.data || [];
      setItems(data);
      setPreviews(
        Object.fromEntries(
          data.map((item) => [item.id, previewSrc(item.logo || item.effectiveLogo || "")]),
        ),
      );
      setFiles({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rashi logos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async (item: RashiLogo) => {
    const file = files[item.id];
    if (!file) {
      setError(`Choose a logo image for ${item.name} first`);
      return;
    }
    setSavingId(item.id);
    setError("");
    setSaved("");
    try {
      const body = new FormData();
      body.set("logo", file);
      const response = await fetch(`/api/store/admin/rashi-logos/${item.id}`, {
        method: "PUT",
        body,
      });
      const payload = await parseApiJson<{
        success?: boolean;
        message?: string;
      }>(response);
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to update logo");
      }
      setSaved(`${item.name} (${item.english}) logo updated`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update logo");
    } finally {
      setSavingId("");
    }
  };

  const clearLogo = async (item: RashiLogo) => {
    const ok = window.confirm(`Clear custom logo for ${item.name} (${item.english})?`);
    if (!ok) return;
    setSavingId(item.id);
    setError("");
    setSaved("");
    try {
      const response = await fetch(`/api/store/admin/rashi-logos/${item.id}/logo`, {
        method: "DELETE",
      });
      const payload = await parseApiJson<{
        success?: boolean;
        message?: string;
      }>(response);
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to clear logo");
      }
      setFiles((prev) => ({ ...prev, [item.id]: null }));
      setSaved(`${item.name} logo cleared`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear logo");
    } finally {
      setSavingId("");
    }
  };

  if (loading) {
    return <p className="p-6 text-sm text-stone-500">Loading rashi logos…</p>;
  }

  return (
    <div className="space-y-5 p-5 md:p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-maroon/10 text-brand-maroon">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <h3 className="font-serif text-xl font-semibold text-stone-900">Rashi bracelet logos</h3>
          <p className="mt-1 text-sm text-stone-500">
            Upload the small zodiac logo shown next to each sign on the Abhimantrit Rashi Bracelets
            Collection strip (Mesh, Vrishabha, Mithun, …).
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</div>
      ) : null}
      {saved ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {saved}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#f6f3ee]">
                {previews[item.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previews[item.id]}
                    alt=""
                    className="h-full w-full object-contain p-1.5"
                    onError={(event) => {
                      (event.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <span className="text-[10px] text-stone-400">No logo</span>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-semibold text-stone-900">
                  {item.name} ({item.english})
                </p>
                <p className="text-xs text-stone-500">{item.hindi || item.id}</p>
              </div>
            </div>

            <label className="mt-3 block text-sm text-stone-700">
              Logo image
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="mt-1 block w-full text-sm"
                onChange={(event) => {
                  const next = event.target.files?.[0] || null;
                  setFiles((prev) => ({ ...prev, [item.id]: next }));
                  if (next) {
                    setPreviews((prev) => ({ ...prev, [item.id]: URL.createObjectURL(next) }));
                  }
                }}
              />
            </label>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => save(item)}
                disabled={savingId === item.id || !files[item.id]}
                className="rounded-xl bg-brand-maroon px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {savingId === item.id ? "Saving…" : "Save logo"}
              </button>
              <button
                type="button"
                onClick={() => clearLogo(item)}
                disabled={savingId === item.id || !item.logo}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
