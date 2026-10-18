"use client";

import { useEffect, useState } from "react";
import { Clapperboard } from "lucide-react";

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
        const payload = await response.json();
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
      if (videoFile) body.set("video", videoFile);
      if (imageFile) body.set("image", imageFile);
      const response = await fetch("/api/store/admin/featured-finds", { method: "PUT", body });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to save");
      }
      const next = { ...EMPTY, ...payload.data, points: payload.data.points || EMPTY.points };
      setForm(next);
      setPointsText(next.points.join(" | "));
      setVideoPreview(payload.data.videoUrl || "");
      setImagePreview(payload.data.imageUrl || "");
      setVideoFile(null);
      setImageFile(null);
      setSaved("Karungali section updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

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
          This block sits just above Loved by Our Customers. The first frame is a video. The second frame is a photo.
        </p>
      </div>

      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>
      ) : null}
      {saved ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{saved}</p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-sm">
          <p className="text-sm font-semibold text-brand-maroon">1. Video</p>
          <p className="mt-1 text-xs text-stone-500">MP4, WebM, or MOV. Up to 40 MB.</p>
          <div className="mt-3 aspect-video overflow-hidden rounded-2xl bg-[#f3efe8]">
            {videoPreview ? (
              <video src={videoPreview} className="h-full w-full object-cover" muted controls />
            ) : null}
          </div>
          <input
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="mt-3 block w-full text-sm"
            onChange={(event) => {
              const next = event.target.files?.[0] || null;
              setVideoFile(next);
              if (next) setVideoPreview(URL.createObjectURL(next));
            }}
          />
        </article>

        <article className="rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-sm">
          <p className="text-sm font-semibold text-brand-maroon">2. Image</p>
          <p className="mt-1 text-xs text-stone-500">The still photo beside the video.</p>
          <div className="mt-3 aspect-video overflow-hidden rounded-2xl bg-[#f3efe8]">
            {imagePreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imagePreview} alt="" className="h-full w-full object-cover" />
            ) : null}
          </div>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="mt-3 block w-full text-sm"
            onChange={(event) => {
              const next = event.target.files?.[0] || null;
              setImageFile(next);
              if (next) setImagePreview(URL.createObjectURL(next));
            }}
          />
          <label className="mt-3 block text-sm text-stone-700">
            Label on the photo
            <input
              value={form.imageLabel}
              onChange={(event) => setForm((prev) => ({ ...prev, imageLabel: event.target.value }))}
              className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
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
