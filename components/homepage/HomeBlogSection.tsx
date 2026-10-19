"use client";

import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";

type Item = {
  _id: string;
  title: string;
  coverImage: string;
  videoUrl: string;
  playbackUrl: string;
  file: File | null;
  preview: string;
};

type SavedItem = {
  _id?: string;
  title?: string;
  coverImage?: string;
  videoUrl?: string;
  playbackUrl?: string;
};

function driveFileId(url: string) {
  const file = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (file) return file[1];
  if (!/drive\.google\.com|googleusercontent\.com/.test(url)) return "";
  const id = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return id ? id[1] : "";
}

function previewSrc(url?: string) {
  if (!url) return "";
  const id = driveFileId(url);
  if (id) return `https://lh3.googleusercontent.com/d/${id}`;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:") || url.startsWith("/uploads/")) {
    return url;
  }
  return url.startsWith("/") ? url : `/${url}`;
}

function toItem(item: SavedItem): Item {
  return {
    _id: item._id || "",
    title: item.title || "",
    coverImage: item.coverImage || "",
    videoUrl: item.videoUrl || "",
    playbackUrl: item.playbackUrl || "",
    file: null,
    preview: previewSrc(item.coverImage),
  };
}

export function HomeBlogSection() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/store/admin/home-blogs");
        const payload = await response.json();
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.message || "Failed to load blog cards");
        }
        if (!cancelled) setItems((payload.data || []).map((item: SavedItem) => toItem(item)));
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load blog cards");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async () => {
    setSaving(true);
    setError("");
    setSaved("");
    try {
      const body = new FormData();
      body.set(
        "items",
        JSON.stringify(
          items.map((item) => ({
            _id: item._id,
            coverImage: item.coverImage.trim(),
            videoUrl: item.videoUrl.trim(),
          })),
        ),
      );
      items.forEach((item, index) => {
        if (item.file) body.set(`image_${index}`, item.file);
      });
      const response = await fetch("/api/store/admin/home-blogs", { method: "PUT", body });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to save blog cards");
      }
      setItems((payload.data || []).map((item: SavedItem) => toItem(item)));
      setSaved("Blog cards updated on the homepage");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save blog cards");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-maroon/20 bg-white/80 px-3 py-1 text-xs font-medium text-brand-maroon">
          <BookOpen className="h-3.5 w-3.5" />
          Homepage
        </div>
        <h2 className="font-serif text-3xl font-semibold text-brand-deepMaroon">Read From Our Blog</h2>
        <p className="mt-2 max-w-2xl text-sm text-stone-600">
          Each card can use a photo or a video. Paste a public link, including a Google Drive share link, or upload a photo. A video plays on a loop. The Drive file must be shared as “Anyone with the link”.
        </p>
      </div>

      {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p> : null}
      {saved ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{saved}</p> : null}
      {loading ? <p className="text-sm text-stone-500">Loading blog cards…</p> : null}

      <div className="space-y-4">
        {items.map((item, index) => (
          <article key={item._id} className="rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-sm">
            <div className="grid gap-4 md:grid-cols-[180px_1fr]">
              <div className="h-28 overflow-hidden rounded-xl bg-[#ececec]">
                {item.playbackUrl ? (
                  <video
                    key={item.playbackUrl}
                    src={previewSrc(item.playbackUrl)}
                    poster={item.preview || undefined}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  />
                ) : item.preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.preview} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="space-y-3">
                <p className="font-medium text-stone-800">{item.title}</p>
                <label className="block text-sm text-stone-700">
                  Photo link
                  <input
                    value={item.coverImage}
                    placeholder="https://drive.google.com/file/d/… or a direct image URL"
                    onChange={(event) =>
                      setItems((prev) =>
                        prev.map((row, i) =>
                          i === index
                            ? {
                                ...row,
                                coverImage: event.target.value,
                                preview: row.file ? row.preview : previewSrc(event.target.value),
                              }
                            : row,
                        ),
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
                  />
                </label>
                <label className="block text-sm text-stone-700">
                  Or upload a photo
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="mt-1 block w-full text-sm"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      setItems((prev) =>
                        prev.map((row, i) =>
                          i === index
                            ? { ...row, file, preview: file ? URL.createObjectURL(file) : previewSrc(row.coverImage) }
                            : row,
                        ),
                      );
                    }}
                  />
                </label>
                <label className="block text-sm text-stone-700">
                  Video link
                  <input
                    value={item.videoUrl}
                    placeholder="https://drive.google.com/file/d/… or a direct video URL"
                    onChange={(event) =>
                      setItems((prev) =>
                        prev.map((row, i) =>
                          i === index ? { ...row, videoUrl: event.target.value, playbackUrl: "" } : row,
                        ),
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
                  />
                </label>
              </div>
            </div>
          </article>
        ))}
      </div>

      <button
        type="button"
        onClick={save}
        disabled={saving || loading || !items.length}
        className="rounded-xl bg-brand-maroon px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save blog cards"}
      </button>
    </div>
  );
}
