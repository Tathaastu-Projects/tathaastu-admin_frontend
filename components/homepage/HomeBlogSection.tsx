"use client";

import { useEffect, useState } from "react";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import { parseApiJson } from "@/lib/parseApiJson";

type Item = {
  _id: string;
  title: string;
  coverImage: string;
  videoUrl: string;
  playbackUrl: string;
  file: File | null;
  videoFile: File | null;
  preview: string;
  videoPreview: string;
};

type SavedItem = {
  _id?: string;
  title?: string;
  coverImage?: string;
  videoUrl?: string;
  playbackUrl?: string;
};

function mediaSrc(url?: string) {
  if (!url) return "";
  if (url.startsWith("blob:") || url.startsWith("/uploads/")) return url;
  if (url.startsWith("http://") || url.startsWith("https://")) return "";
  return url.startsWith("/") ? url : `/${url}`;
}

function toItem(item: SavedItem): Item {
  const cover = mediaSrc(item.coverImage);
  const playback = mediaSrc(item.playbackUrl) || mediaSrc(item.videoUrl);
  return {
    _id: item._id || "",
    title: item.title || "",
    coverImage: cover,
    videoUrl: mediaSrc(item.videoUrl),
    playbackUrl: playback,
    file: null,
    videoFile: null,
    preview: cover,
    videoPreview: playback,
  };
}

export function HomeBlogSection() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const load = async () => {
    const response = await fetch("/api/store/admin/home-blogs");
    const payload = await parseApiJson(response);
    if (!response.ok || !payload?.success) {
      throw new Error(payload?.message || "Failed to load blog cards");
    }
    setItems((payload.data || []).map((item: SavedItem) => toItem(item)));
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
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
          })),
        ),
      );
      items.forEach((item, index) => {
        if (item.file) body.set(`image_${index}`, item.file);
        if (item.videoFile) body.set(`video_${index}`, item.videoFile);
      });
      const response = await fetch("/api/store/admin/home-blogs", { method: "PUT", body });
      const payload = await parseApiJson(response);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to save blog cards");
      }
      setItems((payload.data || []).map((item: SavedItem) => toItem(item)));
      setSaved("Blog cards updated — videos compressed on the server when uploaded");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save blog cards");
    } finally {
      setSaving(false);
    }
  };

  const createBlog = async () => {
    const title = newTitle.trim();
    if (!title) {
      setError("Enter a title for the new journal post");
      return;
    }
    setCreating(true);
    setError("");
    setSaved("");
    try {
      const response = await fetch("/api/store/admin/blogs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          status: "published",
          publishedAt: new Date().toISOString(),
          tags: ["Journal"],
          coverImage: "",
          videoUrl: "",
          playbackUrl: "",
        }),
      });
      const payload = await parseApiJson(response);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to create blog post");
      }
      setNewTitle("");
      await load();
      setSaved(`“${title}” added — upload a photo or video, then save`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create blog post");
    } finally {
      setCreating(false);
    }
  };

  const deletePhoto = async (index: number, id: string) => {
    if (!window.confirm("Delete photo from this blog card?")) return;
    setItems((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, coverImage: "", file: null, preview: "" } : row,
      ),
    );
    try {
      const res = await fetch(`/api/store/admin/home-blogs/${id}/image`, { method: "DELETE" });
      const payload = await parseApiJson(res);
      if (res.ok && payload.success) setSaved("Blog photo deleted");
    } catch (_err) {
      // Local state already updated
    }
  };

  const deleteVideo = async (index: number, id: string) => {
    if (!window.confirm("Delete video from this blog card?")) return;
    setItems((prev) =>
      prev.map((row, i) =>
        i === index
          ? { ...row, videoUrl: "", playbackUrl: "", videoFile: null, videoPreview: "" }
          : row,
      ),
    );
    try {
      const res = await fetch(`/api/store/admin/home-blogs/${id}/video`, { method: "DELETE" });
      const payload = await parseApiJson(res);
      if (res.ok && payload.success) setSaved("Blog video deleted");
    } catch (_err) {
      // Local state already updated
    }
  };

  const deleteBlog = async (index: number, id: string) => {
    const item = items[index];
    const name = item?.title || `Blog #${index + 1}`;
    if (!window.confirm(`Delete blog post "${name}" from the store?`)) return;
    setItems((prev) => prev.filter((b) => b._id !== id));
    try {
      const res = await fetch(`/api/store/admin/home-blogs/${id}`, { method: "DELETE" });
      const payload = await parseApiJson(res);
      if (res.ok && payload.success) setSaved(`Blog "${name}" deleted`);
    } catch (_err) {
      // Local state already updated
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
          Upload photos and videos from your computer (max ~120&nbsp;MB). Videos are compressed on
          the server to reduce size while keeping quality — same as About / Karungali. Files save
          under <code className="rounded bg-stone-100 px-1">/uploads/blogs/</code>. Live or Drive
          URLs are not used. A video plays on a loop on the storefront Journal section.
        </p>
      </div>

      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {saved}
        </p>
      ) : null}
      {loading ? <p className="text-sm text-stone-500">Loading blog cards…</p> : null}

      <div className="flex flex-wrap items-end gap-2 rounded-[24px] border border-dashed border-brand-maroon/25 bg-white/70 p-4">
        <label className="min-w-[200px] flex-1 text-sm text-stone-700">
          New journal post title
          <input
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            placeholder="e.g. How to wear Rudraksha"
            className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
          />
        </label>
        <button
          type="button"
          onClick={createBlog}
          disabled={creating || loading}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-maroon px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          {creating ? "Adding…" : "Add post"}
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <article
            key={item._id}
            className="rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-sm"
          >
            <div className="grid gap-4 md:grid-cols-[180px_1fr]">
              <div className="flex flex-col gap-2">
                <div className="h-28 overflow-hidden rounded-xl bg-[#ececec]">
                  {item.videoPreview ? (
                    <video
                      key={item.videoPreview}
                      src={item.videoPreview}
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
                  {item.coverImage || item.preview || item.file ? (
                    <button
                      type="button"
                      onClick={() => deletePhoto(index, item._id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete photo
                    </button>
                  ) : null}
                  {item.playbackUrl || item.videoUrl || item.videoFile ? (
                    <button
                      type="button"
                      onClick={() => deleteVideo(index, item._id)}
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
                  <p className="font-medium text-stone-800">{item.title}</p>
                  <button
                    type="button"
                    onClick={() => deleteBlog(index, item._id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete blog
                  </button>
                </div>
                <label className="block text-sm text-stone-700">
                  Upload photo
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="mt-1 block w-full text-sm"
                    onChange={(event) => {
                      const file = event.target.files?.[0] || null;
                      setItems((prev) =>
                        prev.map((row, i) =>
                          i === index
                            ? {
                                ...row,
                                file,
                                preview: file ? URL.createObjectURL(file) : row.coverImage,
                              }
                            : row,
                        ),
                      );
                    }}
                  />
                </label>
                <label className="block text-sm text-stone-700">
                  Upload video
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
                    className="mt-1 block w-full text-sm"
                    onChange={(event) => {
                      const videoFile = event.target.files?.[0] || null;
                      setItems((prev) =>
                        prev.map((row, i) =>
                          i === index
                            ? {
                                ...row,
                                videoFile,
                                videoPreview: videoFile
                                  ? URL.createObjectURL(videoFile)
                                  : row.playbackUrl || row.videoUrl,
                              }
                            : row,
                        ),
                      );
                    }}
                  />
                </label>
              </div>
            </div>
          </article>
        ))}
      </div>

      {!loading && !items.length ? (
        <p className="text-sm text-stone-500">
          No published journal posts yet. Add a title above, then upload media.
        </p>
      ) : null}

      <button
        type="button"
        onClick={save}
        disabled={saving || loading || !items.length}
        className="rounded-xl bg-brand-maroon px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? "Saving… (compressing videos if needed)" : "Save blog cards"}
      </button>
    </div>
  );
}
