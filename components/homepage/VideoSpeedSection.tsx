"use client";

import { useEffect, useState } from "react";
import { Gauge, Save } from "lucide-react";
import { parseApiJson } from "@/lib/parseApiJson";

type Preset = {
  id: string;
  label: string;
  rate: number;
};

const FALLBACK_PRESETS: Preset[] = [
  { id: "slow", label: "Slow", rate: 0.75 },
  { id: "normal", label: "Normal", rate: 1 },
  { id: "fast", label: "Fast", rate: 1.5 },
  { id: "very-fast", label: "Very fast", rate: 2 },
];

const MIN_RATE = 0.25;
const MAX_RATE = 2.5;
const RATE_STEP = 0.05;

function clampCustomRate(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(MAX_RATE, Math.max(MIN_RATE, Math.round(value * 100) / 100));
}

export function VideoSpeedSection() {
  const [presets, setPresets] = useState<Preset[]>(FALLBACK_PRESETS);
  const [preset, setPreset] = useState("normal");
  const [rate, setRate] = useState(1);
  const [customRate, setCustomRate] = useState("1");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  const isCustom = preset === "custom";

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/store/admin/video-speed");
      const payload = await parseApiJson<{
        success?: boolean;
        message?: string;
        data?: { preset?: string; rate?: number; presets?: Preset[] };
      }>(response);
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to load video speed");
      }
      if (payload.data?.presets?.length) setPresets(payload.data.presets);
      const nextPreset = payload.data?.preset || "normal";
      const nextRate = clampCustomRate(Number(payload.data?.rate) || 1);
      setPreset(nextPreset);
      setRate(nextRate);
      setCustomRate(String(nextRate));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load video speed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const selectPreset = (next: Preset) => {
    setPreset(next.id);
    setRate(next.rate);
    setCustomRate(String(next.rate));
  };

  const selectCustom = () => {
    setPreset("custom");
    const next = clampCustomRate(rate);
    setRate(next);
    setCustomRate(String(next));
  };

  const applyCustomRate = (raw: string) => {
    setCustomRate(raw);
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return;
    setRate(clampCustomRate(parsed));
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setSavedMsg("");
    try {
      const payloadBody =
        preset === "custom"
          ? { preset: "custom", rate: clampCustomRate(Number(customRate) || rate) }
          : { preset, rate };

      const response = await fetch("/api/store/admin/video-speed", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadBody),
      });
      const payload = await parseApiJson<{
        success?: boolean;
        message?: string;
        data?: { preset?: string; rate?: number };
      }>(response);
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to save video speed");
      }
      const savedPreset = payload.data?.preset || preset;
      const savedRate = clampCustomRate(Number(payload.data?.rate) || rate);
      setPreset(savedPreset);
      setRate(savedRate);
      setCustomRate(String(savedRate));
      setSavedMsg("Video speed saved. Refresh the Abhimantrit website to apply.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="p-6 text-sm text-stone-500">Loading video speed…</p>;
  }

  return (
    <div className="space-y-5 p-5 md:p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-maroon/10 text-brand-maroon">
          <Gauge className="h-4 w-4" />
        </span>
        <div>
          <h3 className="font-serif text-xl font-semibold text-stone-900">Storefront video speed</h3>
          <p className="mt-1 text-sm text-stone-500">
            Control how fast homepage videos play on Abhimantrit (hero, reels, about, testimonials, blog).
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</div>
      ) : null}
      {savedMsg ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {savedMsg}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {presets.map((item) => {
          const active = preset === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => selectPreset(item)}
              className={`rounded-xl border px-4 py-4 text-left transition ${
                active
                  ? "border-brand-maroon bg-brand-maroon/5 shadow-sm"
                  : "border-stone-200 bg-white hover:border-stone-300"
              }`}
            >
              <p className={`text-sm font-semibold ${active ? "text-brand-maroon" : "text-stone-900"}`}>
                {item.label}
              </p>
              <p className="mt-1 text-xs text-stone-500">{item.rate}× playback</p>
            </button>
          );
        })}

        <button
          type="button"
          onClick={selectCustom}
          className={`rounded-xl border px-4 py-4 text-left transition ${
            isCustom
              ? "border-brand-maroon bg-brand-maroon/5 shadow-sm"
              : "border-stone-200 bg-white hover:border-stone-300"
          }`}
        >
          <p className={`text-sm font-semibold ${isCustom ? "text-brand-maroon" : "text-stone-900"}`}>
            Custom
          </p>
          <p className="mt-1 text-xs text-stone-500">
            {isCustom ? `${rate}× playback` : "Set your own speed"}
          </p>
        </button>
      </div>

      {isCustom ? (
        <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-4 space-y-3">
          <label className="block text-sm font-medium text-stone-800" htmlFor="video-speed-custom">
            Custom playback rate ({MIN_RATE}× – {MAX_RATE}×)
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <input
              id="video-speed-custom"
              type="number"
              min={MIN_RATE}
              max={MAX_RATE}
              step={RATE_STEP}
              value={customRate}
              onChange={(e) => applyCustomRate(e.target.value)}
              onBlur={() => {
                const next = clampCustomRate(Number(customRate) || rate);
                setRate(next);
                setCustomRate(String(next));
              }}
              className="w-28 rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 shadow-sm focus:border-brand-maroon focus:outline-none focus:ring-1 focus:ring-brand-maroon"
            />
            <input
              type="range"
              min={MIN_RATE}
              max={MAX_RATE}
              step={RATE_STEP}
              value={rate}
              onChange={(e) => {
                const next = clampCustomRate(Number(e.target.value));
                setRate(next);
                setCustomRate(String(next));
              }}
              className="min-w-[180px] flex-1 accent-[var(--brand-maroon,#7a1f2b)]"
              aria-label="Custom video speed slider"
            />
            <span className="text-sm font-semibold text-stone-800 tabular-nums">{rate}×</span>
          </div>
          <p className="text-xs text-stone-500">Examples: 0.5 = half speed, 1 = normal, 1.25 = slightly fast.</p>
        </div>
      ) : null}

      <p className="text-xs text-stone-500">
        Selected: <span className="font-semibold text-stone-800">{preset}</span> · {rate}×
      </p>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-maroon px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-deepMaroon disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save video speed"}
        </button>
      </div>
    </div>
  );
}
