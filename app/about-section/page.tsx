"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Flower2 } from "lucide-react";

type Feature = {
  id: string;
  title: string;
  description: string;
  image?: string;
};

type AboutData = {
  image: string;
  intro: string;
  width: number;
  height: number;
  features: Feature[];
};

const STORE_ORIGIN = "http://localhost:3025";

function previewSrc(url?: string) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/uploads/")) return url;
  return `${STORE_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
}

export function AboutSection() {
  const [about, setAbout] = useState<AboutData | null>(null);
  const [intro, setIntro] = useState("");
  const [baseFile, setBaseFile] = useState<File | null>(null);
  const [basePreview, setBasePreview] = useState("");
  const [drafts, setDrafts] = useState<Record<string, { title: string; description: string }>>({});
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
      setBasePreview(previewSrc(data.image));
      setBaseFile(null);
      setDrafts(
        Object.fromEntries(
          (data.features || []).map((item) => [
            item.id,
            { title: item.title, description: item.description },
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
      if (baseFile) body.set("image", baseFile);
      const response = await fetch("/api/store/admin/about", { method: "PUT", body });
      const payload = await response.json();
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
      if (file) body.set("image", file);
      const response = await fetch(`/api/store/admin/about/features/${feature.id}`, {
        method: "PUT",
        body,
      });
      const payload = await response.json();
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
              The right-hand picture is {about?.width || 900} × {about?.height || 720} px. Hovering a point on the store swaps that picture for the image you set on that point.
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
                  <div className="overflow-hidden rounded-2xl bg-[#f3efe8]" style={{ aspectRatio: `${about.width} / ${about.height}` }}>
                    {basePreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={basePreview} alt="" className="h-full w-full object-cover object-right" />
                    ) : null}
                  </div>
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
                      Default image
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
                      <div className="overflow-hidden rounded-2xl bg-[#f3efe8]" style={{ aspectRatio: `${about.width} / ${about.height}` }}>
                        {previews[feature.id] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={previews[feature.id]} alt="" className="h-full w-full object-cover object-right" />
                        ) : (
                          <div className="flex h-full items-center justify-center px-3 text-center text-xs text-stone-500">
                            Uses the default picture until you upload one
                          </div>
                        )}
                      </div>
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
                                },
                              }))
                            }
                            rows={3}
                            className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
                          />
                        </label>
                        <label className="block text-sm text-stone-700">
                          Image shown on hover
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

export default function AboutSectionRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/home-page");
  }, [router]);
  return null;
}
