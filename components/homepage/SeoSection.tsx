"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { parseApiJson } from "@/lib/parseApiJson";

type SeoFields = {
  metaTitle: string;
  metaDescription: string;
};

type PageDef = {
  key: string;
  label: string;
  path: string;
  group?: string;
};

const empty: SeoFields = { metaTitle: "", metaDescription: "" };

export function SeoSection() {
  const [pageList, setPageList] = useState<PageDef[]>([]);
  const [pages, setPages] = useState<Record<string, SeoFields>>({});
  const [activeKey, setActiveKey] = useState("home");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/store/admin/seo");
      const payload = await parseApiJson<{
        success?: boolean;
        message?: string;
        data?: { pages?: Record<string, SeoFields>; pageList?: PageDef[] };
      }>(response);
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to load SEO settings");
      }
      const list = payload.data?.pageList || [];
      setPageList(list);
      setPages(payload.data?.pages || {});
      if (list.length && !list.some((p) => p.key === activeKey)) {
        setActiveKey(list[0].key);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load SEO");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const current = pages[activeKey] || empty;
  const activeDef = pageList.find((p) => p.key === activeKey);

  const updateField = (field: keyof SeoFields, value: string) => {
    setPages((prev) => ({
      ...prev,
      [activeKey]: {
        ...(prev[activeKey] || empty),
        [field]: value,
      },
    }));
    setSavedMsg("");
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setSavedMsg("");
    try {
      const response = await fetch("/api/store/admin/seo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pages }),
      });
      const payload = await parseApiJson<{
        success?: boolean;
        message?: string;
        data?: { pages?: Record<string, SeoFields> };
      }>(response);
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to save SEO");
      }
      if (payload.data?.pages) setPages(payload.data.pages);
      setSavedMsg("SEO saved. Homepage / pages will use the new title & description.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save SEO");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="p-6 text-sm text-stone-500">Loading SEO settings…</p>;
  }

  return (
    <div className="space-y-5 p-5 md:p-6">
      <div>
        <h3 className="text-base font-semibold text-brand-deepMaroon">SEO — Meta title & description</h3>
        <p className="mt-1 text-sm text-stone-600">
          Controls what Google and WhatsApp show when someone opens or shares a page. Start with{" "}
          <strong>Home</strong>, then edit any other page.
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

      {(["Main pages", "Category pages", "Policies"] as const).map((group) => {
        const items = pageList.filter((p) => (p.group || "Main pages") === group);
        if (!items.length) return null;
        return (
          <div key={group} className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              {group}
            </p>
            <div className="flex flex-wrap gap-2" role="tablist">
              {items.map((page) => {
                const selected = page.key === activeKey;
                return (
                  <button
                    key={page.key}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveKey(page.key)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                      selected
                        ? "bg-brand-maroon text-white"
                        : "border border-brand-maroon/20 bg-[#fbf7f2] text-brand-deepMaroon"
                    }`}
                  >
                    {page.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      <div className="rounded-2xl border border-brand-maroon/15 bg-[#fbf7f2]/70 p-4 md:p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-maroon">
          Editing: {activeDef?.label || activeKey}
          {activeDef?.path ? (
            <span className="ml-2 font-normal normal-case tracking-normal text-stone-500">
              ({activeDef.path})
            </span>
          ) : null}
        </p>

        <label className="mt-4 block text-sm font-medium text-stone-700">
          Meta title
          <input
            type="text"
            value={current.metaTitle}
            onChange={(e) => updateField("metaTitle", e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-brand-maroon/40"
            placeholder="Abhimantrit by Tathasstu | Energised Rudraksha & Gemstones."
          />
          <span className="mt-1 block text-[11px] text-stone-500">
            {current.metaTitle.length} characters · ideal ~50–60
          </span>
        </label>

        <label className="mt-4 block text-sm font-medium text-stone-700">
          Meta description
          <textarea
            value={current.metaDescription}
            onChange={(e) => updateField("metaDescription", e.target.value)}
            rows={4}
            className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-brand-maroon/40"
            placeholder="Shop Energised Gemstones & Rudraksha…"
          />
          <span className="mt-1 block text-[11px] text-stone-500">
            {current.metaDescription.length} characters · ideal ~140–160
          </span>
        </label>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-maroon px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-deepMaroon disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? "Saving…" : "Save SEO settings"}
        </button>
      </div>
    </div>
  );
}
