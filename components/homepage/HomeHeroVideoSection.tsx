"use client";

import { useEffect, useState } from "react";
import { Clapperboard, Save, Trash2 } from "lucide-react";
import { parseApiJson } from "@/lib/parseApiJson";

type HeroVideo = {
  enabled: boolean;
  videoUrl: string;
  posterUrl: string;
  headline: string;
  subheadline: string;
  ctaLabel: string;
  ctaHref: string;
};

const EMPTY: HeroVideo = {
  enabled: true,
  videoUrl: "",
  posterUrl: "",
  headline: "Blessed crystals & sacred essentials",
  subheadline:
    "Authentic rudraksha, gemstones, and ritual pieces — energised with care for your intention.",
  ctaLabel: "Shop now",
  ctaHref: "/shop",
};

const STORE_ORIGIN = "http://localhost:3025";

function previewMediaSrc(url?: string) {
  if (!url) return "";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url;
  }
  if (url.startsWith("/uploads/")) return url;
  return `${STORE_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
}

export function HomeHeroVideoSection() {
  const [form, setForm] = useState<HeroVideo>(EMPTY);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState("");
  const [posterPreview, setPosterPreview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/store/admin/home-hero-video");
        const payload = await parseApiJson<{
          success?: boolean;
          message?: string;
          data?: HeroVideo;
        }>(response);
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.message || "Failed to load hero video");
        }
        if (!cancelled && payload.data) {
          const next = { ...EMPTY, ...payload.data };
          setForm(next);
          setVideoPreview(payload.data.videoUrl || "");
          setPosterPreview(payload.data.posterUrl || "");
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load hero video");
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
      body.set("enabled", form.enabled ? "true" : "false");
      body.set("headline", form.headline.trim());
      body.set("subheadline", form.subheadline.trim());
      body.set("ctaLabel", form.ctaLabel.trim());
      body.set("ctaHref", form.ctaHref.trim() || "/shop");
      if (videoFile) {
        body.set("video", videoFile);
      } else {
        body.set("videoUrl", form.videoUrl.trim());
      }
      if (posterFile) {
        body.set("poster", posterFile);
      } else {
        body.set("posterUrl", form.posterUrl.trim());
      }

      const response = await fetch("/api/store/admin/home-hero-video", { method: "PUT", body });
      const payload = await parseApiJson<{
        success?: boolean;
        message?: string;
        data?: HeroVideo;
      }>(response);
      if (!response.ok || !payload?.success || !payload.data) {
        throw new Error(payload?.message || "Failed to save");
      }
      const next = { ...EMPTY, ...payload.data };
      setForm(next);
      setVideoPreview(payload.data.videoUrl || "");
      setPosterPreview(payload.data.posterUrl || "");
      setVideoFile(null);
      setPosterFile(null);
      setSaved("Homepage hero video saved. Refresh the storefront to see it full-screen.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const deleteVideo = async () => {
    const ok = window.confirm("Remove the homepage background video?");
    if (!ok) return;
    setSaving(true);
    setError("");
    setSaved("");
    try {
      const response = await fetch("/api/store/admin/home-hero-video/video", { method: "DELETE" });
      const payload = await parseApiJson<{ success?: boolean; message?: string; data?: HeroVideo }>(
        response,
      );
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to delete video");
      }
      setVideoFile(null);
      setVideoPreview("");
      setForm((prev) => ({ ...prev, videoUrl: "", ...(payload.data || {}) }));
      setSaved("Hero video removed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete video");
    } finally {
      setSaving(false);
    }
  };

  const deletePoster = async () => {
    const ok = window.confirm("Remove the poster image?");
    if (!ok) return;
    setSaving(true);
    setError("");
    setSaved("");
    try {
      const response = await fetch("/api/store/admin/home-hero-video/poster", { method: "DELETE" });
      const payload = await parseApiJson<{ success?: boolean; message?: string; data?: HeroVideo }>(
        response,
      );
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to delete poster");
      }
      setPosterFile(null);
      setPosterPreview("");
      setForm((prev) => ({ ...prev, posterUrl: "", ...(payload.data || {}) }));
      setSaved("Poster removed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete poster");
    } finally {
      setSaving(false);
    }
  };

  const videoDisplay = previewMediaSrc(videoPreview || form.videoUrl);
  const posterDisplay = previewMediaSrc(posterPreview || form.posterUrl);

  if (loading) return <p className="text-sm text-stone-500">Loading hero video…</p>;

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-maroon/20 bg-white/80 px-3 py-1 text-xs font-medium text-brand-maroon">
          <Clapperboard className="h-3.5 w-3.5" />
          Full-screen hero
        </div>
        <h2 className="font-serif text-3xl font-semibold text-brand-deepMaroon">Hero video</h2>
        <p className="mt-2 max-w-2xl text-sm text-stone-600">
          Zomato-style looping background on the homepage. Upload an MP4/WebM (max ~120&nbsp;MB —
          compressed on the server). Logo and brand name come from the site logo + copy below.
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

      <label className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/90 px-4 py-3 text-sm text-stone-700 shadow-sm">
        <input
          type="checkbox"
          checked={form.enabled}
          onChange={(event) => setForm((prev) => ({ ...prev, enabled: event.target.checked }))}
          className="h-4 w-4 rounded border-stone-300 text-brand-maroon focus:ring-brand-maroon"
        />
        Show full-screen hero video on the homepage
      </label>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="space-y-3 rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-brand-maroon">Background video</p>
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

          <div className="aspect-video overflow-hidden rounded-2xl bg-[#f3efe8]">
            {videoDisplay ? (
              <video
                src={videoDisplay}
                className="h-full w-full object-cover"
                muted
                controls
                preload="none"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-stone-400">
                No video set
              </div>
            )}
          </div>

          <div className="space-y-2.5 rounded-xl border border-stone-200 bg-stone-50/70 p-3">
            <div>
              <span className="block text-xs font-semibold text-stone-600">Upload video file</span>
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
              <span className="block text-xs font-semibold text-stone-600">Or paste MP4 URL</span>
              <input
                type="url"
                placeholder="https://example.com/hero.mp4"
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

        <article className="space-y-3 rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-brand-maroon">Poster (optional)</p>
            {posterDisplay ? (
              <button
                type="button"
                onClick={deletePoster}
                disabled={saving}
                className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 transition hover:border-rose-400 hover:bg-rose-100 disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3" />
                Delete poster
              </button>
            ) : null}
          </div>
          <p className="text-xs text-stone-500">Still image shown before the video loads.</p>

          <div className="aspect-video overflow-hidden rounded-2xl bg-[#f3efe8]">
            {posterDisplay ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={posterDisplay} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-stone-400">
                No poster set
              </div>
            )}
          </div>

          <div className="space-y-2.5 rounded-xl border border-stone-200 bg-stone-50/70 p-3">
            <div>
              <span className="block text-xs font-semibold text-stone-600">Upload poster image</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="mt-1 block w-full text-xs text-stone-600 file:mr-2 file:rounded-lg file:border-0 file:bg-brand-maroon/10 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-brand-maroon hover:file:bg-brand-maroon/20"
                onChange={(event) => {
                  const next = event.target.files?.[0] || null;
                  setPosterFile(next);
                  if (next) {
                    setPosterPreview(URL.createObjectURL(next));
                    setForm((prev) => ({ ...prev, posterUrl: "" }));
                  }
                }}
              />
            </div>
            <div>
              <span className="block text-xs font-semibold text-stone-600">Or paste image URL</span>
              <input
                type="url"
                placeholder="https://example.com/poster.jpg"
                value={form.posterUrl}
                onChange={(event) => {
                  const val = event.target.value;
                  setForm((prev) => ({ ...prev, posterUrl: val }));
                  setPosterFile(null);
                  setPosterPreview(val.trim());
                }}
                className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-800 focus:border-brand-maroon focus:outline-none"
              />
            </div>
          </div>
        </article>
      </div>

      <div className="grid gap-3 rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-sm md:grid-cols-2">
        <label className="block text-sm text-stone-700 md:col-span-2">
          Headline
          <input
            value={form.headline}
            onChange={(event) => setForm((prev) => ({ ...prev, headline: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
          />
        </label>
        <label className="block text-sm text-stone-700 md:col-span-2">
          Short explanation
          <textarea
            value={form.subheadline}
            onChange={(event) => setForm((prev) => ({ ...prev, subheadline: event.target.value }))}
            rows={3}
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
          className="inline-flex items-center gap-2 rounded-xl bg-brand-maroon px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save hero video"}
        </button>
      </div>
    </div>
  );
}
