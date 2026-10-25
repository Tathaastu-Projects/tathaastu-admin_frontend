"use client";

import { useEffect, useState } from "react";
import { Clapperboard, Trash2 } from "lucide-react";
import { parseApiJson } from "@/lib/parseApiJson";

type Featured = {
  eyebrow: string;
  title: string;
  videoUrl: string;
  imageUrl: string;
  imageLabel: string;
  points: string[];
  ctaLabel: string;
  ctaHref: string;
};

const EMPTY: Featured = {
  eyebrow: "Featured finds",
  title: "Everyday Vibe, Purposeful Intention",
  videoUrl: "",
  imageUrl: "",
  imageLabel: "Mind Peace",
  points: ["Authentically Sourced", "Mindful Rituals", "Positive Energy", "Traditional Craftsmanship"],
  ctaLabel: "Shop now",
  ctaHref: "/product/gm-karungali-mala",
};

const STORE_ORIGIN = "http://localhost:3025";

function previewMediaSrc(url?: string) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  if (url.startsWith("/uploads/")) return url;
  return `${STORE_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
}

function getEmbedUrl(url?: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }
  const vimeoMatch = trimmed.match(/vimeo\.com\/(?:video\/)?([0-9]+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  const driveMatch = trimmed.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveMatch) {
    return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
  }
  return null;
}

export function FeaturedFindsSection() {
  const [form, setForm] = useState<Featured>(EMPTY);
  const [pointsText, setPointsText] = useState(EMPTY.points.join(" | "));
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/store/admin/featured-finds");
        const payload = await parseApiJson<{ success?: boolean; message?: string; data?: Featured }>(response);
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.message || "Failed to load this section");
        }
        if (!cancelled && payload.data) {
          const next = { ...EMPTY, ...payload.data, points: payload.data.points || EMPTY.points };
          setForm(next);
          setPointsText(next.points.join(" | "));
          setVideoPreview(payload.data.videoUrl || "");
          setImagePreview(payload.data.imageUrl || "");
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load this section");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async () => {
    if (!form.title.trim()) {
      setError("Heading is required");
      return;
    }
    setSaving(true);
    setError("");
    setSaved("");
    try {
      const body = new FormData();
      body.set("eyebrow", form.eyebrow.trim());
      body.set("title", form.title.trim());
      body.set("imageLabel", form.imageLabel.trim());
      body.set("points", pointsText);
      body.set("ctaLabel", form.ctaLabel.trim());
      body.set("ctaHref", form.ctaHref.trim());
      if (videoFile) {
        body.set("video", videoFile);
      } else if (form.videoUrl !== undefined) {
        body.set("videoUrl", form.videoUrl.trim());
      }
      if (imageFile) {
        body.set("image", imageFile);
      } else if (form.imageUrl !== undefined) {
        body.set("imageUrl", form.imageUrl.trim());
      }
      const response = await fetch("/api/store/admin/featured-finds", { method: "PUT", body });
      const payload = await parseApiJson<{ success?: boolean; message?: string; data?: Featured }>(response);
      if (!response.ok || !payload?.success || !payload.data) {
        throw new Error(payload?.message || "Failed to save");
      }
      const savedData = payload.data;
      const next = { ...EMPTY, ...savedData, points: savedData.points || EMPTY.points };
      setForm(next);
      setPointsText(next.points.join(" | "));
      setVideoPreview(savedData.videoUrl || "");
      setImagePreview(savedData.imageUrl || "");
      setVideoFile(null);
      setImageFile(null);
      setSaved("Karungali section updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const deleteVideo = async () => {
    const ok = window.confirm("Delete / Clear the Karungali featured video?");
    if (!ok) return;
    setSaving(true);
    setError("");
    setSaved("");
    try {
      const response = await fetch("/api/store/admin/featured-finds/video", { method: "DELETE" });
      const payload = await parseApiJson<{ success?: boolean; message?: string }>(response);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to delete video");
      }
      setVideoFile(null);
      setVideoPreview("");
      setForm((prev) => ({ ...prev, videoUrl: "" }));
      setSaved("Featured video removed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete video");
    } finally {
      setSaving(false);
    }
  };

  const deleteImage = async () => {
    const ok = window.confirm("Delete / Clear the Karungali featured photo?");
    if (!ok) return;
    setSaving(true);
    setError("");
    setSaved("");
    try {
      const response = await fetch("/api/store/admin/featured-finds/image", { method: "DELETE" });
      const payload = await parseApiJson<{ success?: boolean; message?: string }>(response);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to delete photo");
      }
      setImageFile(null);
      setImagePreview("");
      setForm((prev) => ({ ...prev, imageUrl: "" }));
      setSaved("Featured photo removed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete photo");
    } finally {
      setSaving(false);
    }
  };

  const rawVideo = videoPreview || form.videoUrl || "";
  const videoDisplay = previewMediaSrc(rawVideo);
  const videoEmbed = getEmbedUrl(rawVideo);

  const rawImage = imagePreview || form.imageUrl || "";
  const imageDisplay = previewMediaSrc(rawImage);

  if (loading) return <p className="text-sm text-stone-500">Loading Karungali section…</p>;

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-maroon/20 bg-white/80 px-3 py-1 text-xs font-medium text-brand-maroon">
          <Clapperboard className="h-3.5 w-3.5" />
          Karungali mala
        </div>
        <h2 className="font-serif text-3xl font-semibold text-brand-deepMaroon">Featured finds</h2>
        <p className="mt-2 max-w-2xl text-sm text-stone-600">
          This block sits just above Testimonials. Upload a video (MP4/WebM, max ~120&nbsp;MB — compressed on the server) or paste a live URL, plus a photo for the second frame.
        </p>
      </div>

      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>
      ) : null}
      {saved ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{saved}</p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Frame 1: Video */}
        <article className="rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-brand-maroon">1. Video</p>
            {videoDisplay ? (
              <button
                type="button"
                onClick={deleteVideo}
                disabled={saving}
                className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 transition hover:border-rose-400 hover:bg-rose-100 disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3" />
                Delete video
              </button>
            ) : null}
          </div>
          <p className="text-xs text-stone-500">Upload video file (MP4, WebM) OR paste a live video / YouTube / Drive URL.</p>

          <div className="aspect-video overflow-hidden rounded-2xl bg-[#f3efe8]">
            {videoEmbed ? (
              <iframe src={videoEmbed} className="h-full w-full object-cover" allow="autoplay; muted" />
            ) : videoDisplay ? (
              <video src={videoDisplay} className="h-full w-full object-cover" muted controls />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-stone-400">
                No video set
              </div>
            )}
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3 space-y-2.5">
            <div>
              <span className="block text-xs font-semibold text-stone-600">Option 1: Upload video file</span>
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                className="mt-1 block w-full text-xs text-stone-600 file:mr-2 file:rounded-lg file:border-0 file:bg-brand-maroon/10 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-brand-maroon hover:file:bg-brand-maroon/20"
                onChange={(event) => {
                  const next = event.target.files?.[0] || null;
                  setVideoFile(next);
                  if (next) {
                    setVideoPreview(URL.createObjectURL(next));
                    setForm((prev) => ({ ...prev, videoUrl: "" }));
                  }
                }}
              />
            </div>
            <div>
              <span className="block text-xs font-semibold text-stone-600">Option 2: Paste live video URL</span>
              <input
                type="url"
                placeholder="https://example.com/video.mp4 or YouTube / Drive link"
                value={form.videoUrl}
                onChange={(event) => {
                  const val = event.target.value;
                  setForm((prev) => ({ ...prev, videoUrl: val }));
                  setVideoFile(null);
                  setVideoPreview(val.trim());
                }}
                className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-800 focus:border-brand-maroon focus:outline-none"
              />
            </div>
          </div>
        </article>

        {/* Frame 2: Image */}
        <article className="rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-brand-maroon">2. Image</p>
            {imageDisplay ? (
              <button
                type="button"
                onClick={deleteImage}
                disabled={saving}
                className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 transition hover:border-rose-400 hover:bg-rose-100 disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3" />
                Delete photo
              </button>
            ) : null}
          </div>
          <p className="text-xs text-stone-500">The still photo beside the video. Upload file OR paste live image URL.</p>

          <div className="aspect-video overflow-hidden rounded-2xl bg-[#f3efe8]">
            {imageDisplay ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageDisplay} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-stone-400">
                No photo set
              </div>
            )}
          </div>

          <div className="rounded-xl border border-stone-200 bg-stone-50/70 p-3 space-y-2.5">
            <div>
              <span className="block text-xs font-semibold text-stone-600">Option 1: Upload image file</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="mt-1 block w-full text-xs text-stone-600 file:mr-2 file:rounded-lg file:border-0 file:bg-brand-maroon/10 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-brand-maroon hover:file:bg-brand-maroon/20"
                onChange={(event) => {
                  const next = event.target.files?.[0] || null;
                  setImageFile(next);
                  if (next) {
                    setImagePreview(URL.createObjectURL(next));
                    setForm((prev) => ({ ...prev, imageUrl: "" }));
                  }
                }}
              />
            </div>
            <div>
              <span className="block text-xs font-semibold text-stone-600">Option 2: Paste live image URL</span>
              <input
                type="url"
                placeholder="https://example.com/photo.jpg"
                value={form.imageUrl}
                onChange={(event) => {
                  const val = event.target.value;
                  setForm((prev) => ({ ...prev, imageUrl: val }));
                  setImageFile(null);
                  setImagePreview(val.trim());
                }}
                className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-800 focus:border-brand-maroon focus:outline-none"
              />
            </div>
          </div>

          <label className="block text-sm text-stone-700">
            Label on the photo
            <input
              value={form.imageLabel}
              onChange={(event) => setForm((prev) => ({ ...prev, imageLabel: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
            />
          </label>
        </article>
      </div>

      <div className="grid gap-3 rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-sm md:grid-cols-2">
        <label className="block text-sm text-stone-700">
          Small label
          <input
            value={form.eyebrow}
            onChange={(event) => setForm((prev) => ({ ...prev, eyebrow: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm text-stone-700">
          Heading
          <input
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm text-stone-700 md:col-span-2">
          Line under the pictures, separated by |
          <input
            value={pointsText}
            onChange={(event) => setPointsText(event.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm text-stone-700">
          Button text
          <input
            value={form.ctaLabel}
            onChange={(event) => setForm((prev) => ({ ...prev, ctaLabel: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm text-stone-700">
          Button link
          <input
            value={form.ctaHref}
            onChange={(event) => setForm((prev) => ({ ...prev, ctaHref: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
          />
        </label>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-xl bg-brand-maroon px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save Karungali section"}
        </button>
      </div>
    </div>
  );
}
