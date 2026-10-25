"use client";

import { useEffect, useState } from "react";
import { Plus, Quote, Trash2 } from "lucide-react";
import { parseApiJson } from "@/lib/parseApiJson";

type Item = {
  quote: string;
  name: string;
  imageUrl: string;
  videoUrl: string;
  playbackUrl: string;
  file: File | null;
  preview: string;
};

type SavedItem = { quote?: string; name?: string; imageUrl?: string; videoUrl?: string; playbackUrl?: string };

function driveFileId(url: string) {
  const file = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (file) return file[1];
  if (!/drive\.google\.com|googleusercontent\.com/.test(url)) return "";
  const id = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return id ? id[1] : "";
}

const STORE_ORIGIN = "http://localhost:3025";

function previewSrc(url?: string) {
  if (!url) return "";
  const id = driveFileId(url);
  if (id) return `https://lh3.googleusercontent.com/d/${id}`;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) return url;
  if (url.startsWith("/uploads/")) return url;
  return `${STORE_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
}

function toItem(item: SavedItem): Item {
  return {
    quote: item.quote || "",
    name: item.name || "",
    imageUrl: item.imageUrl || "",
    videoUrl: item.videoUrl || "",
    playbackUrl: item.playbackUrl || "",
    file: null,
    preview: previewSrc(item.imageUrl),
  };
}

export function TestimonialsSection() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/store/admin/testimonials");
        const payload = await parseApiJson(response);
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.message || "Failed to load testimonials");
        }
        if (!cancelled) {
          setItems((payload.data || []).map((item: SavedItem) => toItem(item)));
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load testimonials");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async () => {
    const clean = items
      .map((item) => ({
        quote: item.quote.trim(),
        name: item.name.trim(),
        imageUrl: item.imageUrl.trim(),
        videoUrl: item.videoUrl.trim(),
        playbackUrl: item.playbackUrl,
        file: item.file,
      }))
      .filter((item) => item.quote && item.name);
    if (!clean.length) {
      setError("Each testimonial needs a quote and a name");
      return;
    }
    setSaving(true);
    setError("");
    setSaved("");
    try {
      const body = new FormData();
      body.set(
        "items",
        JSON.stringify(
          clean.map((item) => ({
            quote: item.quote,
            name: item.name,
            imageUrl: item.imageUrl,
            videoUrl: item.videoUrl,
            playbackUrl: item.playbackUrl,
          })),
        ),
      );
      clean.forEach((item, index) => {
        if (item.file) body.set(`image_${index}`, item.file);
      });
      const response = await fetch("/api/store/admin/testimonials", { method: "PUT", body });
      const payload = await parseApiJson(response);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to save testimonials");
      }
      setItems((payload.data || []).map((item: SavedItem) => toItem(item)));
      setSaved("Testimonials updated on the homepage");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save testimonials");
    } finally {
      setSaving(false);
    }
  };

  const deletePhoto = (index: number) => {
    if (!window.confirm("Remove photo from this testimonial?")) return;
    setItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, imageUrl: "", file: null, preview: "" } : row))
    );
  };

  const deleteVideo = (index: number) => {
    if (!window.confirm("Remove video from this testimonial?")) return;
    setItems((prev) =>
      prev.map((row, i) => (i === index ? { ...row, videoUrl: "", playbackUrl: "" } : row))
    );
  };

  const deleteTestimonial = async (index: number) => {
    const item = items[index];
    const name = item?.name?.trim() || `Testimonial #${index + 1}`;
    if (!window.confirm(`Delete testimonial from "${name}"?`)) return;
    const next = items.filter((_, i) => i !== index);
    setItems(next);
    try {
      const res = await fetch(`/api/store/admin/testimonials/${index}`, { method: "DELETE" });
      const payload = await parseApiJson(res);
      if (res.ok && payload.success && Array.isArray(payload.data)) {
        setItems(payload.data.map((row: SavedItem) => toItem(row)));
        setSaved("Testimonial deleted");
      }
    } catch (_e) {
      // Local state already updated
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-maroon/20 bg-white/80 px-3 py-1 text-xs font-medium text-brand-maroon">
            <Quote className="h-3.5 w-3.5" />
            Homepage
          </div>
          <h2 className="font-serif text-3xl font-semibold text-brand-deepMaroon">Testimonials</h2>
          <p className="mt-2 max-w-2xl text-sm text-stone-600">
            These cards slide from right to left. Paste a public image or video link, including a Google Drive share link. A video plays on a loop. The Drive file must be shared as “Anyone with the link”.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            setItems((prev) => [
              ...prev,
              { quote: "", name: "", imageUrl: "", videoUrl: "", playbackUrl: "", file: null, preview: "" },
            ])
          }
          className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700"
        >
          <Plus className="h-4 w-4" />
          Add testimonial
        </button>
      </div>

      {error ? <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p> : null}
      {saved ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{saved}</p> : null}
      {loading ? <p className="text-sm text-stone-500">Loading testimonials…</p> : null}

      <div className="space-y-4">
        {items.map((item, index) => (
          <article key={index} className="rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-sm">
            <div className="grid gap-4 md:grid-cols-[180px_1fr]">
              <div className="flex flex-col gap-2">
                <div className="h-36 overflow-hidden rounded-xl bg-[#ececec]">
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
                  ) : (
                    <div className="flex h-full items-center justify-center p-2 text-center text-xs text-stone-400">
                      No photo or video
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  {item.preview || item.imageUrl || item.file ? (
                    <button
                      type="button"
                      onClick={() => deletePhoto(index)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete photo
                    </button>
                  ) : null}
                  {item.playbackUrl || item.videoUrl ? (
                    <button
                      type="button"
                      onClick={() => deleteVideo(index)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete video
                    </button>
                  ) : null}
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-brand-maroon">Testimonial #{index + 1}</p>
                  <button
                    type="button"
                    onClick={() => deleteTestimonial(index)}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete testimonial
                  </button>
                </div>
                <label className="block text-sm text-stone-700">
                  Quote
                  <textarea
                    rows={3}
                    value={item.quote}
                    onChange={(event) =>
                      setItems((prev) =>
                        prev.map((row, i) => (i === index ? { ...row, quote: event.target.value } : row)),
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
                  />
                </label>
                <label className="block text-sm text-stone-700">
                  Name
                  <input
                    value={item.name}
                    onChange={(event) =>
                      setItems((prev) =>
                        prev.map((row, i) => (i === index ? { ...row, name: event.target.value } : row)),
                      )
                    }
                    className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
                  />
                </label>
                <label className="block text-sm text-stone-700">
                  Photo link
                  <input
                    value={item.imageUrl}
                    placeholder="https://drive.google.com/file/d/… or a direct image URL"
                    onChange={(event) =>
                      setItems((prev) =>
                        prev.map((row, i) =>
                          i === index
                            ? {
                                ...row,
                                imageUrl: event.target.value,
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
                            ? { ...row, file, preview: file ? URL.createObjectURL(file) : previewSrc(row.imageUrl) }
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
        disabled={saving || loading}
        className="rounded-xl bg-brand-maroon px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save testimonials"}
      </button>
    </div>
  );
}
