"use client";

import { useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { parseApiJson } from "@/lib/parseApiJson";

const MAX_ITEMS = 16;

export function HeroTickerSection() {
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/store/admin/hero-ticker");
      const payload = await parseApiJson<{
        success?: boolean;
        message?: string;
        data?: { items?: string[] };
      }>(response);
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to load hero ticker");
      }
      setItems(payload.data?.items?.length ? payload.data.items : [""]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load hero ticker");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    setSaving(true);
    setError("");
    setSavedMsg("");
    try {
      const cleaned = items.map((s) => s.trim()).filter(Boolean);
      if (!cleaned.length) {
        throw new Error("Add at least one phrase for the hero ticker");
      }
      const response = await fetch("/api/store/admin/hero-ticker", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: cleaned }),
      });
      const payload = await parseApiJson<{
        success?: boolean;
        message?: string;
        data?: { items?: string[] };
      }>(response);
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to save hero ticker");
      }
      setItems(payload.data?.items?.length ? payload.data.items : cleaned);
      setSavedMsg("Hero ticker saved. Refresh the homepage to see the scrolling strip update.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="p-6 text-sm text-stone-500">Loading hero ticker…</p>;
  }

  return (
    <div className="space-y-5 p-5 md:p-6">
      <div>
        <h3 className="text-base font-semibold text-brand-deepMaroon">
          Hero ticker (auto-scroll strip)
        </h3>
        <p className="mt-1 text-sm text-stone-600">
          Dark green band under the homepage hero that scrolls phrases in a loop (marquee). Edit
          lines below — order here = scroll order.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}
      {savedMsg ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {savedMsg}
        </div>
      ) : null}

      <div className="space-y-3">
        {items.map((value, index) => (
          <div key={index} className="flex items-start gap-2">
            <label className="flex-1 text-sm font-medium text-stone-700">
              Phrase {index + 1}
              <input
                type="text"
                value={value}
                onChange={(e) => {
                  const next = [...items];
                  next[index] = e.target.value;
                  setItems(next);
                  setSavedMsg("");
                }}
                className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-maroon/40"
                placeholder="Astrology-Guided"
              />
            </label>
            <button
              type="button"
              title="Remove"
              disabled={items.length <= 1}
              onClick={() => {
                setItems((prev) => prev.filter((_, i) => i !== index));
                setSavedMsg("");
              }}
              className="mt-7 rounded-lg border border-stone-200 p-2 text-stone-500 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-40"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      {items.length < MAX_ITEMS ? (
        <button
          type="button"
          onClick={() => {
            setItems((prev) => [...prev, ""]);
            setSavedMsg("");
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-brand-maroon/25 bg-white px-3 py-2 text-xs font-semibold text-brand-maroon hover:bg-brand-maroon/5"
        >
          <Plus className="h-3.5 w-3.5" />
          Add phrase
        </button>
      ) : null}

      <div className="overflow-hidden rounded-2xl bg-[#0b2b1d] px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/50">Preview</p>
        <p className="mt-2 truncate text-sm text-white">
          {items.map((s) => s.trim()).filter(Boolean).join("   ·   ") || "—"}
        </p>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-maroon px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-deepMaroon disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save hero ticker"}
        </button>
      </div>
    </div>
  );
}
