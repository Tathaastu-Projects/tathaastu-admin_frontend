"use client";

import { useEffect, useState } from "react";
import { Flower2 } from "lucide-react";

type Feature = {
  id: string;
  title: string;
  description: string;
  image?: string;
  imageUrl?: string;
  videoUrl?: string;
  playbackUrl?: string;
};

type AboutData = {
  image: string;
  imageUrl?: string;
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
  imageUrl: string;
  videoUrl: string;
  playbackUrl: string;
};

const STORE_ORIGIN = "http://localhost:3025";

async function readPayload(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      text.startsWith("Internal")
        ? "The video is still being prepared. Wait a minute, refresh this page, then save again."
        : text.slice(0, 180) || "Save failed",
    );
  }
}

function driveFileId(url: string) {
  const file = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (file) return file[1];
  if (!/drive\.google\.com|googleusercontent\.com/.test(url)) return "";
  const id = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return id ? id[1] : "";
}

function MediaFrame({
  playback,
  image,
  aspect,
  empty,
}: {
  playback?: string;
  image?: string;
  aspect: string;
  empty?: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-[#f3efe8]" style={{ aspectRatio: aspect }}>
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
  );
}

function previewSrc(url?: string) {
  if (!url) return "";
  const id = driveFileId(url);
  if (id) return `https://lh3.googleusercontent.com/d/${id}`;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) return url;
  if (url.startsWith("/uploads/")) return url;
  return `${STORE_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
}

export function AboutSection() {
  const [about, setAbout] = useState<AboutData | null>(null);
  const [intro, setIntro] = useState("");
  const [baseFile, setBaseFile] = useState<File | null>(null);
  const [basePreview, setBasePreview] = useState("");
  const [baseImageUrl, setBaseImageUrl] = useState("");
  const [baseVideoUrl, setBaseVideoUrl] = useState("");
  const [basePlayback, setBasePlayback] = useState("");
  const [drafts, setDrafts] = useState<Record<string, PointDraft>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
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
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to load about section");
      }
      const data = payload.data as AboutData;
      setAbout(data);
      setIntro(data.intro || "");
      setBaseImageUrl(data.imageUrl || "");
      setBaseVideoUrl(data.videoUrl || "");
      setBasePlayback(data.playbackUrl || "");
      setBasePreview(previewSrc(data.image));
      setBaseFile(null);
      setDrafts(
        Object.fromEntries(
          (data.features || []).map((item) => [
            item.id,
            {
              title: item.title,
              description: item.description,
              imageUrl: item.imageUrl || "",
              videoUrl: item.videoUrl || "",
              playbackUrl: item.playbackUrl || "",
            },
          ])
        )
      );
      setPreviews(
        Object.fromEntries((data.features || []).map((item) => [item.id, previewSrc(item.image)]))
      );
      setFiles({});
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
      body.set("imageUrl", baseImageUrl.trim());
      body.set("videoUrl", baseVideoUrl.trim());
      if (baseFile) body.set("image", baseFile);
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
      body.set("imageUrl", draft.imageUrl.trim());
      body.set("videoUrl", draft.videoUrl.trim());
      const file = files[feature.id];
      if (file) body.set("image", file);
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

  return (
        <div className="space-y-6">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-maroon/20 bg-white/80 px-3 py-1 text-xs font-medium text-brand-maroon">
              <Flower2 className="h-3.5 w-3.5" />
              Homepage
            </div>
            <h2 className="font-serif text-3xl font-semibold text-brand-deepMaroon">About</h2>
            <p className="mt-2 max-w-2xl text-sm text-stone-600">
              Paste a public image or video link, including a Google Drive share link, or upload a photo. A video plays on a loop. The Drive file must be shared as “Anyone with the link”. Hovering a point on the store swaps the picture.
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
                      Photo link
                      <input
                        value={baseImageUrl}
                        placeholder="https://drive.google.com/file/d/… or a direct image URL"
                        onChange={(event) => {
                          setBaseImageUrl(event.target.value);
                          if (!baseFile) setBasePreview(previewSrc(event.target.value) || previewSrc(about.image));
                        }}
                        className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
                      />
                    </label>
                    <label className="block text-sm text-stone-700">
                      Or upload a photo
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
                      Video link
                      <input
                        value={baseVideoUrl}
                        placeholder="https://drive.google.com/file/d/… or a direct video URL"
                        onChange={(event) => {
                          setBaseVideoUrl(event.target.value);
                          setBasePlayback("");
                        }}
                        className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
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
                                  imageUrl: prev[feature.id]?.imageUrl || "",
                                  videoUrl: prev[feature.id]?.videoUrl || "",
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
                                  imageUrl: prev[feature.id]?.imageUrl || "",
                                  videoUrl: prev[feature.id]?.videoUrl || "",
                                  playbackUrl: prev[feature.id]?.playbackUrl || "",
                                },
                              }))
                            }
                            rows={3}
                            className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
                          />
                        </label>
                        <label className="block text-sm text-stone-700">
                          Photo link
                          <input
                            value={drafts[feature.id]?.imageUrl || ""}
                            placeholder="https://drive.google.com/file/d/… or a direct image URL"
                            onChange={(event) => {
                              const value = event.target.value;
                              setDrafts((prev) => ({
                                ...prev,
                                [feature.id]: {
                                  title: prev[feature.id]?.title || "",
                                  description: prev[feature.id]?.description || "",
                                  imageUrl: value,
                                  videoUrl: prev[feature.id]?.videoUrl || "",
                                  playbackUrl: prev[feature.id]?.playbackUrl || "",
                                },
                              }));
                              if (!files[feature.id]) {
                                setPreviews((prev) => ({ ...prev, [feature.id]: previewSrc(value) }));
                              }
                            }}
                            className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
                          />
                        </label>
                        <label className="block text-sm text-stone-700">
                          Or upload a photo
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
                          Video link
                          <input
                            value={drafts[feature.id]?.videoUrl || ""}
                            placeholder="https://drive.google.com/file/d/… or a direct video URL"
                            onChange={(event) =>
                              setDrafts((prev) => ({
                                ...prev,
                                [feature.id]: {
                                  title: prev[feature.id]?.title || "",
                                  description: prev[feature.id]?.description || "",
                                  imageUrl: prev[feature.id]?.imageUrl || "",
                                  videoUrl: event.target.value,
                                  playbackUrl: "",
                                },
                              }))
                            }
                            className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
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
