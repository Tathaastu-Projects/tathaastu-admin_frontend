"use client";

import { useEffect, useState } from "react";
import { Flower2, Trash2 } from "lucide-react";
import { parseApiJson } from "@/lib/parseApiJson";

type Feature = {
  id: string;
  title: string;
  description: string;
  image?: string;
  videoUrl?: string;
  playbackUrl?: string;
};

type AboutData = {
  image: string;
  videoUrl?: string;
  playbackUrl?: string;
  intro: string;
  width: number;
  height: number;
  features: Feature[];
};

type PointDraft = {
  title: string;
  description: string;
  playbackUrl: string;
};

async function readPayload(response: Response) {
  return parseApiJson(response);
}

function previewSrc(url?: string) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) return url;
  if (url.startsWith("/uploads/")) return url;
  return url.startsWith("/") ? url : `/${url}`;
}

function MediaFrame({
  playback,
  image,
  aspect,
  empty,
  onDeleteImage,
  onDeleteVideo,
}: {
  playback?: string;
  image?: string;
  aspect: string;
  empty?: string;
  onDeleteImage?: () => void;
  onDeleteVideo?: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="relative overflow-hidden rounded-2xl bg-[#f3efe8]" style={{ aspectRatio: aspect }}>
        {playback ? (
          <video
            key={playback}
            src={previewSrc(playback)}
            poster={image || undefined}
            autoPlay
            loop
            muted
            playsInline
            className="h-full w-full object-cover object-right"
          />
        ) : image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-full w-full object-cover object-right" />
        ) : (
          <div className="flex h-full items-center justify-center px-3 text-center text-xs text-stone-500">
            {empty || "No picture yet"}
          </div>
        )}
      </div>
      {(image && onDeleteImage) || (playback && onDeleteVideo) ? (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {image && onDeleteImage ? (
            <button
              type="button"
              onClick={onDeleteImage}
              title="Delete photo"
              className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:border-rose-400 hover:bg-rose-100"
            >
              <Trash2 className="h-3 w-3" />
              Delete photo
            </button>
          ) : null}
          {playback && onDeleteVideo ? (
            <button
              type="button"
              onClick={onDeleteVideo}
              title="Delete video"
              className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:border-rose-400 hover:bg-rose-100"
            >
              <Trash2 className="h-3 w-3" />
              Delete video
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function AboutSection() {
  const [about, setAbout] = useState<AboutData | null>(null);
  const [intro, setIntro] = useState("");
  const [baseFile, setBaseFile] = useState<File | null>(null);
  const [baseVideoFile, setBaseVideoFile] = useState<File | null>(null);
  const [basePreview, setBasePreview] = useState("");
  const [basePlayback, setBasePlayback] = useState("");
  const [drafts, setDrafts] = useState<Record<string, PointDraft>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [videoFiles, setVideoFiles] = useState<Record<string, File | null>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/store/admin/about");
      const payload = await parseApiJson(response);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to load about section");
      }
      const data = payload.data as AboutData;
      setAbout(data);
      setIntro(data.intro || "");
      setBasePlayback(data.playbackUrl || data.videoUrl || "");
      setBasePreview(previewSrc(data.image));
      setBaseFile(null);
      setBaseVideoFile(null);
      setDrafts(
        Object.fromEntries(
          (data.features || []).map((item) => [
            item.id,
            {
              title: item.title,
              description: item.description,
              playbackUrl: item.playbackUrl || item.videoUrl || "",
            },
          ])
        )
      );
      setPreviews(
        Object.fromEntries((data.features || []).map((item) => [item.id, previewSrc(item.image)]))
      );
      setFiles({});
      setVideoFiles({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load about section");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveBase = async () => {
    if (!intro.trim()) {
      setError("Intro text is required");
      return;
    }
    setSaving("base");
    setError("");
    setSaved("");
    try {
      const body = new FormData();
      body.set("intro", intro.trim());
      if (baseFile) body.set("image", baseFile);
      if (baseVideoFile) body.set("video", baseVideoFile);
      const response = await fetch("/api/store/admin/about", { method: "PUT", body });
      const payload = await readPayload(response);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to update the section");
      }
      setSaved("About section updated");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update the section");
    } finally {
      setSaving("");
    }
  };

  const saveFeature = async (feature: Feature) => {
    const draft = drafts[feature.id];
    if (!draft?.title.trim() || !draft.description.trim()) {
      setError("Title and description are required");
      return;
    }
    setSaving(feature.id);
    setError("");
    setSaved("");
    try {
      const body = new FormData();
      body.set("title", draft.title.trim());
      body.set("description", draft.description.trim());
      const file = files[feature.id];
      const video = videoFiles[feature.id];
      if (file) body.set("image", file);
      if (video) body.set("video", video);
      const response = await fetch(`/api/store/admin/about/features/${feature.id}`, {
        method: "PUT",
        body,
      });
      const payload = await readPayload(response);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to update this point");
      }
      setSaved(`${draft.title.trim()} updated`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update this point");
    } finally {
      setSaving("");
    }
  };

  const removeBasePhoto = async () => {
    if (!window.confirm("Delete default photo?")) return;
    setSaving("base-img");
    setError("");
    setSaved("");
    try {
      const response = await fetch("/api/store/admin/about/image", { method: "DELETE" });
      const payload = await readPayload(response);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to remove photo");
      }
      setBaseFile(null);
      setBasePreview("");
      setSaved("Default photo removed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove photo");
    } finally {
      setSaving("");
    }
  };

  const removeBaseVideo = async () => {
    if (!window.confirm("Delete default video?")) return;
    setSaving("base-vid");
    setError("");
    setSaved("");
    try {
      const response = await fetch("/api/store/admin/about/video", { method: "DELETE" });
      const payload = await readPayload(response);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to remove video");
      }
      setBaseVideoFile(null);
      setBasePlayback("");
      setSaved("Default video removed");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove video");
    } finally {
      setSaving("");
    }
  };

  const removeFeaturePhoto = async (feature: Feature) => {
    if (!window.confirm(`Delete photo for “${feature.title}”?`)) return;
    setSaving(`${feature.id}-img`);
    setError("");
    setSaved("");
    try {
      const response = await fetch(`/api/store/admin/about/features/${feature.id}/image`, {
        method: "DELETE",
      });
      const payload = await readPayload(response);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to remove photo");
      }
      setFiles((prev) => ({ ...prev, [feature.id]: null }));
      setPreviews((prev) => ({ ...prev, [feature.id]: "" }));
      setSaved(`Photo for “${feature.title}” removed`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove photo");
    } finally {
      setSaving("");
    }
  };

  const removeFeatureVideo = async (feature: Feature) => {
    if (!window.confirm(`Delete video for “${feature.title}”?`)) return;
    setSaving(`${feature.id}-vid`);
    setError("");
    setSaved("");
    try {
      const response = await fetch(`/api/store/admin/about/features/${feature.id}/video`, {
        method: "DELETE",
      });
      const payload = await readPayload(response);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to remove video");
      }
      setVideoFiles((prev) => ({ ...prev, [feature.id]: null }));
      setDrafts((prev) => ({
        ...prev,
        [feature.id]: {
          ...prev[feature.id],
          playbackUrl: "",
        },
      }));
      setSaved(`Video for “${feature.title}” removed`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove video");
    } finally {
      setSaving("");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-maroon/20 bg-white/80 px-3 py-1 text-xs font-medium text-brand-maroon">
          <Flower2 className="h-3.5 w-3.5" />
          Homepage
        </div>
        <h2 className="font-serif text-3xl font-semibold text-brand-deepMaroon">About</h2>
        <p className="mt-2 max-w-2xl text-sm text-stone-600">
          Upload photos and videos from your computer (max ~120&nbsp;MB). Videos are compressed on
          the server to reduce size while keeping quality. Files save under{" "}
          <code className="rounded bg-stone-100 px-1">/uploads/about/</code>. Live or Drive URLs are
          not used. Hovering a point on the store swaps the picture.
        </p>
      </div>

      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>
      ) : null}
      {saved ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{saved}</p>
      ) : null}

      {loading || !about ? (
        <p className="text-sm text-stone-500">Loading…</p>
      ) : (
        <>
          <section className="rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-sm">
            <h2 className="font-serif text-2xl text-brand-deepMaroon">Default picture and intro</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
              <MediaFrame
                playback={basePlayback}
                image={basePreview}
                aspect={`${about.width} / ${about.height}`}
                onDeleteImage={basePreview || about.image ? removeBasePhoto : undefined}
                onDeleteVideo={basePlayback || about.videoUrl ? removeBaseVideo : undefined}
              />
              <div className="space-y-3">
                <p className="text-sm font-medium text-brand-deepMaroon">
                  Image size: {about.width} × {about.height} px
                </p>
                <label className="block text-sm text-stone-700">
                  Intro
                  <textarea
                    value={intro}
                    onChange={(event) => setIntro(event.target.value)}
                    rows={5}
                    className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
                  />
                </label>
                <label className="block text-sm text-stone-700">
                  <div className="flex items-center justify-between">
                    <span>Upload photo</span>
                    {basePreview || about.image ? (
                      <button
                        type="button"
                        onClick={removeBasePhoto}
                        disabled={saving === "base-img"}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 transition hover:text-rose-700 disabled:opacity-50"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete photo
                      </button>
                    ) : null}
                  </div>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="mt-1 block w-full text-sm"
                    onChange={(event) => {
                      const next = event.target.files?.[0] || null;
                      setBaseFile(next);
                      if (next) setBasePreview(URL.createObjectURL(next));
                    }}
                  />
                </label>
                <label className="block text-sm text-stone-700">
                  <div className="flex items-center justify-between">
                    <span>Upload video</span>
                    {basePlayback || about.videoUrl ? (
                      <button
                        type="button"
                        onClick={removeBaseVideo}
                        disabled={saving === "base-vid"}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 transition hover:text-rose-700 disabled:opacity-50"
                      >
                        <Trash2 className="h-3 w-3" />
                        Delete video
                      </button>
                    ) : null}
                  </div>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    className="mt-1 block w-full text-sm"
                    onChange={(event) => {
                      const next = event.target.files?.[0] || null;
                      setBaseVideoFile(next);
                      if (next) setBasePlayback(URL.createObjectURL(next));
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={saveBase}
                  disabled={saving === "base"}
                  className="rounded-xl bg-brand-maroon px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving === "base" ? "Saving…" : "Save section"}
                </button>
              </div>
            </div>
          </section>

          <div className="grid gap-4">
            {about.features.map((feature) => (
              <article key={feature.id} className="rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-sm">
                <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
                  <MediaFrame
                    playback={drafts[feature.id]?.playbackUrl}
                    image={previews[feature.id]}
                    aspect={`${about.width} / ${about.height}`}
                    empty="Uses the default picture until you add one"
                    onDeleteImage={
                      previews[feature.id] || feature.image
                        ? () => removeFeaturePhoto(feature)
                        : undefined
                    }
                    onDeleteVideo={
                      drafts[feature.id]?.playbackUrl || feature.videoUrl
                        ? () => removeFeatureVideo(feature)
                        : undefined
                    }
                  />
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-brand-deepMaroon">
                      Hover image: {about.width} × {about.height} px
                    </p>
                    <label className="block text-sm text-stone-700">
                      Title
                      <input
                        value={drafts[feature.id]?.title || ""}
                        onChange={(event) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [feature.id]: {
                              title: event.target.value,
                              description: prev[feature.id]?.description || "",
                              playbackUrl: prev[feature.id]?.playbackUrl || "",
                            },
                          }))
                        }
                        className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
                      />
                    </label>
                    <label className="block text-sm text-stone-700">
                      Description
                      <textarea
                        value={drafts[feature.id]?.description || ""}
                        onChange={(event) =>
                          setDrafts((prev) => ({
                            ...prev,
                            [feature.id]: {
                              title: prev[feature.id]?.title || "",
                              description: event.target.value,
                              playbackUrl: prev[feature.id]?.playbackUrl || "",
                            },
                          }))
                        }
                        rows={3}
                        className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
                      />
                    </label>
                    <label className="block text-sm text-stone-700">
                      <div className="flex items-center justify-between">
                        <span>Upload photo</span>
                        {previews[feature.id] || feature.image ? (
                          <button
                            type="button"
                            onClick={() => removeFeaturePhoto(feature)}
                            disabled={saving === `${feature.id}-img`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 transition hover:text-rose-700 disabled:opacity-50"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete photo
                          </button>
                        ) : null}
                      </div>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="mt-1 block w-full text-sm"
                        onChange={(event) => {
                          const next = event.target.files?.[0] || null;
                          setFiles((prev) => ({ ...prev, [feature.id]: next }));
                          if (next) {
                            setPreviews((prev) => ({
                              ...prev,
                              [feature.id]: URL.createObjectURL(next),
                            }));
                          }
                        }}
                      />
                    </label>
                    <label className="block text-sm text-stone-700">
                      <div className="flex items-center justify-between">
                        <span>Upload video</span>
                        {drafts[feature.id]?.playbackUrl || feature.videoUrl ? (
                          <button
                            type="button"
                            onClick={() => removeFeatureVideo(feature)}
                            disabled={saving === `${feature.id}-vid`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 transition hover:text-rose-700 disabled:opacity-50"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete video
                          </button>
                        ) : null}
                      </div>
                      <input
                        type="file"
                        accept="video/mp4,video/webm,video/quicktime"
                        className="mt-1 block w-full text-sm"
                        onChange={(event) => {
                          const next = event.target.files?.[0] || null;
                          setVideoFiles((prev) => ({ ...prev, [feature.id]: next }));
                          if (next) {
                            const url = URL.createObjectURL(next);
                            setDrafts((prev) => ({
                              ...prev,
                              [feature.id]: {
                                title: prev[feature.id]?.title || "",
                                description: prev[feature.id]?.description || "",
                                playbackUrl: url,
                              },
                            }));
                          }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => saveFeature(feature)}
                      disabled={saving === feature.id}
                      className="rounded-xl bg-brand-maroon px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {saving === feature.id ? "Saving…" : "Save point"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
