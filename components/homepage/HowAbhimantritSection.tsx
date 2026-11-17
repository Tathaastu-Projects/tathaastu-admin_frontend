"use client";

import { useEffect, useState } from "react";
import { Sparkles, Trash2 } from "lucide-react";
import { parseApiJson } from "@/lib/parseApiJson";

type HowStep = {
  id: string;
  title: string;
  image?: string;
};

type HowSection = {
  enabled: boolean;
  title: string;
  steps: HowStep[];
};

const EMPTY: HowSection = {
  enabled: true,
  title: "How Abhimantrit",
  steps: [
    { id: "thoughtfully-sourced", title: "Thoughtfully Sourced", image: "" },
    { id: "cleansed-carefully", title: "Cleansed Carefully", image: "" },
    { id: "energised-intentionally", title: "Energised Intentionally", image: "" },
    { id: "delivered", title: "Delivered to Unlock Your Destiny", image: "" },
  ],
};

function previewSrc(url?: string) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) return url;
  if (url.startsWith("/uploads/")) return url;
  return url.startsWith("/") ? url : `/${url}`;
}

export function HowAbhimantritSection() {
  const [form, setForm] = useState<HowSection>(EMPTY);
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingMeta, setSavingMeta] = useState(false);
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/store/admin/how-abhimantrit");
      const payload = await parseApiJson<{
        success?: boolean;
        message?: string;
        data?: HowSection;
      }>(response);
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.message || "Failed to load How Abhimantrit");
      }
      const data = {
        ...EMPTY,
        ...payload.data,
        steps: payload.data.steps?.length ? payload.data.steps : EMPTY.steps,
      };
      setForm(data);
      setPreviews(
        Object.fromEntries(data.steps.map((step) => [step.id, previewSrc(step.image || "")])),
      );
      setFiles({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load How Abhimantrit");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const saveMeta = async () => {
    if (!form.title.trim()) {
      setError("Heading is required");
      return;
    }
    setSavingMeta(true);
    setError("");
    setSaved("");
    try {
      const response = await fetch("/api/store/admin/how-abhimantrit", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: form.enabled,
          title: form.title.trim(),
          steps: form.steps.map((step) => ({ id: step.id, title: step.title })),
        }),
      });
      const payload = await parseApiJson<{ success?: boolean; message?: string }>(response);
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to save");
      }
      setSaved("Heading and labels saved");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSavingMeta(false);
    }
  };

  const saveStepImage = async (step: HowStep) => {
    const file = files[step.id];
    if (!file) {
      setError(`Choose an image for “${step.title}” first`);
      return;
    }
    setSavingId(step.id);
    setError("");
    setSaved("");
    try {
      const body = new FormData();
      body.set("image", file);
      body.set("title", step.title);
      const response = await fetch(`/api/store/admin/how-abhimantrit/steps/${step.id}`, {
        method: "PUT",
        body,
      });
      const payload = await parseApiJson<{ success?: boolean; message?: string }>(response);
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to upload image");
      }
      setSaved(`Image updated for “${step.title}”`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setSavingId("");
    }
  };

  const resetStepImage = async (step: HowStep) => {
    const ok = window.confirm(`Reset image for “${step.title}” to the default?`);
    if (!ok) return;
    setSavingId(step.id);
    setError("");
    setSaved("");
    try {
      const response = await fetch(`/api/store/admin/how-abhimantrit/steps/${step.id}/image`, {
        method: "DELETE",
      });
      const payload = await parseApiJson<{ success?: boolean; message?: string }>(response);
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to reset image");
      }
      setFiles((prev) => ({ ...prev, [step.id]: null }));
      setSaved(`Image reset for “${step.title}”`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset image");
    } finally {
      setSavingId("");
    }
  };

  if (loading) {
    return <p className="p-6 text-sm text-stone-500">Loading How Abhimantrit…</p>;
  }

  return (
    <div className="space-y-5 p-5 md:p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-maroon/10 text-brand-maroon">
          <Sparkles className="h-4 w-4" />
        </span>
        <div>
          <h3 className="font-serif text-xl font-semibold text-stone-900">How Abhimantrit</h3>
          <p className="mt-1 text-sm text-stone-500">
            Four circular images shown on the website after Explore Remedies in 3D. Upload a square
            circular graphic for each step.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </div>
      ) : null}
      {saved ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {saved}
        </div>
      ) : null}

      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm space-y-3">
        <label className="block text-sm font-medium text-stone-700">
          Section heading
          <input
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
            placeholder="How Abhimantrit"
          />
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-stone-700">
          <input
            type="checkbox"
            checked={form.enabled}
            onChange={(e) => setForm((prev) => ({ ...prev, enabled: e.target.checked }))}
          />
          Show this section on the website
        </label>
        <button
          type="button"
          onClick={() => void saveMeta()}
          disabled={savingMeta}
          className="rounded-full bg-brand-maroon px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {savingMeta ? "Saving…" : "Save heading"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {form.steps.map((step, index) => (
          <article
            key={step.id}
            className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm space-y-3"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
              Step {index + 1}
            </p>
            <label className="block text-sm font-medium text-stone-700">
              Label
              <input
                value={step.title}
                onChange={(e) => {
                  const title = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    steps: prev.steps.map((item) =>
                      item.id === step.id ? { ...item, title } : item,
                    ),
                  }));
                }}
                className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
              />
            </label>

            <div className="mx-auto flex h-36 w-36 items-center justify-center bg-transparent">
              {previews[step.id] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previews[step.id]}
                  alt={step.title}
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="text-xs text-stone-400">No image</span>
              )}
            </div>

            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setFiles((prev) => ({ ...prev, [step.id]: file }));
                if (file) {
                  const url = URL.createObjectURL(file);
                  setPreviews((prev) => ({ ...prev, [step.id]: url }));
                }
              }}
              className="block w-full text-xs text-stone-600"
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void saveStepImage(step)}
                disabled={savingId === step.id || !files[step.id]}
                className="rounded-full bg-brand-maroon px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                {savingId === step.id ? "Uploading…" : "Upload image"}
              </button>
              <button
                type="button"
                onClick={() => void resetStepImage(step)}
                disabled={savingId === step.id}
                className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700"
              >
                <Trash2 className="h-3 w-3" />
                Reset default
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
