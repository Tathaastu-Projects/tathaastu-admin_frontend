"use client";

import { useEffect, useState } from "react";
import { parseApiJson } from "@/lib/parseApiJson";
import { CATEGORY_TABS } from "@/components/homepage/CategoryBannersSection";
import {
  Film,
  Plus,
  Trash2,
  Upload,
  ArrowUp,
  ArrowDown,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";

type ReelItem = {
  id: string;
  overlayTag: string;
  videoUrl: string;
  imageUrl: string;
  categorySlug: string;
  categoryLabel: string;
  categoryHref: string;
  isActive: boolean;
};

const STORE_ORIGIN = "http://localhost:3025";

function resolveMediaUrl(url?: string) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) return url;
  if (url.startsWith("/uploads/")) return url;
  return `${STORE_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
}

function categoryHref(slug: string) {
  const clean = String(slug || "").trim().replace(/^\/+|\/+$/g, "").replace(/^shop\//, "");
  return clean ? `/shop/${clean}` : "/shop";
}

export function ScreenToSpaceSection() {
  const [title, setTitle] = useState("Unlock Your Destiny With Abhimantrit Products");
  const [subtitle, setSubtitle] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [items, setItems] = useState<ReelItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const resSection = await fetch("/api/store/admin/screen-to-space");
        const sectionData = await parseApiJson(resSection);
        if (resSection.ok && sectionData.success && sectionData.data) {
          if (!cancelled) {
            setTitle(sectionData.data.title || "Unlock Your Destiny With Abhimantrit Products");
            setSubtitle(sectionData.data.subtitle || "");
            setIsActive(sectionData.data.isActive !== false);
            setItems(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (sectionData.data.items || []).map((item: any, idx: number) => {
                const matched = CATEGORY_TABS.find((c) => c.id === item.categorySlug);
                const categorySlug = String(item.categorySlug || matched?.id || "");
                return {
                  id: String(item.id || `reel-${idx + 1}`),
                  overlayTag: String(item.overlayTag || ""),
                  videoUrl: String(item.videoUrl || ""),
                  imageUrl: String(item.imageUrl || ""),
                  categorySlug,
                  categoryLabel: String(item.categoryLabel || matched?.label || ""),
                  categoryHref: categorySlug ? `/shop/${categorySlug}` : "/shop",
                  isActive: item.isActive !== false,
                } satisfies ReelItem;
              })
            );
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load reels data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAddItem = () => {
    const first = CATEGORY_TABS[0];
    const newItem: ReelItem = {
      id: `reel-${Date.now()}`,
      overlayTag: "",
      videoUrl: "",
      imageUrl: "",
      categorySlug: first?.id || "crystal-bracelets",
      categoryLabel: first?.label || "Crystal Bracelets",
      categoryHref: first?.href || "/shop/crystal-bracelets",
      isActive: true,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    const item = items[index];
    const name = item?.categoryLabel || item?.overlayTag || `Reel Card #${index + 1}`;
    if (!window.confirm(`Delete reel card "${name}"?`)) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const next = [...items];
    const temp = next[index];
    next[index] = next[targetIndex];
    next[targetIndex] = temp;
    setItems(next);
  };

  const handleUpdateItem = (index: number, updates: Partial<ReelItem>) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updates };
      return next;
    });
  };

  const handleSelectCategory = (index: number, categoryId: string) => {
    const cat = CATEGORY_TABS.find((c) => c.id === categoryId);
    if (!cat) return;
    handleUpdateItem(index, {
      categorySlug: cat.id,
      categoryLabel: cat.label,
      categoryHref: cat.href,
    });
  };

  const handleUploadFile = async (index: number, file: File, type: "video" | "image") => {
    const itemId = items[index].id;
    setUploadingId(`${itemId}-${type}`);
    setError("");

    try {
      const formData = new FormData();
      formData.append(type, file);

      const res = await fetch("/api/store/admin/screen-to-space/upload", {
        method: "POST",
        body: formData,
      });

      const data = await parseApiJson<{
        success?: boolean;
        message?: string;
        data?: { videoUrl?: string; imageUrl?: string };
      }>(res);
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Upload failed");
      }

      if (type === "video" && data.data?.videoUrl) {
        handleUpdateItem(index, { videoUrl: data.data.videoUrl });
      } else if (type === "image" && data.data?.imageUrl) {
        handleUpdateItem(index, { imageUrl: data.data.imageUrl });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload error");
    } finally {
      setUploadingId(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSavedMessage("");

    try {
      const payload = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        isActive,
        items,
      };

      const res = await fetch("/api/store/admin/screen-to-space", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await parseApiJson(res);
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to save");
      }

      setSavedMessage("Successfully saved! Changes are now live on the storefront.");
      setTimeout(() => setSavedMessage(""), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-maroon border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-maroon/10 px-3 py-1 text-xs font-semibold text-brand-maroon">
              <Film className="h-3.5 w-3.5" />
              Category Video Reels
            </div>
            <h2 className="mt-2 font-serif text-2xl font-semibold text-stone-900">
              Unlock Your Destiny Videos
            </h2>
            <p className="text-xs text-stone-500 sm:text-sm">
              Upload videos, choose a category tab, and clicking a video on the storefront opens that shop category.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium border transition-colors ${
                isActive
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : "border-stone-300 bg-stone-50 text-stone-600"
              }`}
            >
              {isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              {isActive ? "Visible on Store" : "Hidden from Store"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-brand-maroon px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-deepMaroon disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {savedMessage ? (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 border border-emerald-200">
            <Check className="h-4 w-4 shrink-0 text-emerald-600" />
            {savedMessage}
          </div>
        ) : null}
        {error ? (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-sm text-rose-800 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-stone-700">Section Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Unlock Your Destiny With Abhimantrit Products"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-brand-maroon focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-stone-700">Optional Subtitle</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Optional secondary text"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-brand-maroon focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-stone-900 text-lg flex items-center gap-2">
            Reel Cards ({items.length})
            <span className="text-xs font-normal text-stone-500">
              Each video links to one category tab
            </span>
          </h3>
          <button
            type="button"
            onClick={handleAddItem}
            className="flex items-center gap-1.5 rounded-lg border border-brand-maroon/30 bg-white px-3 py-1.5 text-xs font-semibold text-brand-maroon hover:bg-brand-maroon/5 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Reel Card
          </button>
        </div>

        <div className="grid gap-6">
          {items.map((item, index) => {
            const videoPreview = resolveMediaUrl(item.videoUrl);
            const imagePreview = resolveMediaUrl(item.imageUrl);
            const href = categoryHref(item.categorySlug);

            return (
              <div
                key={item.id}
                className={`rounded-xl border bg-white p-5 shadow-sm transition-all ${
                  item.isActive ? "border-stone-200" : "border-stone-200 opacity-60 bg-stone-50"
                }`}
              >
                <div className="flex flex-col gap-6 lg:flex-row">
                  <div className="shrink-0 flex flex-col items-center">
                    <span className="mb-2 text-xs font-medium text-stone-400">Card #{index + 1} Preview</span>
                    <div className="relative w-[180px] sm:w-[210px] aspect-[9/16] rounded-xl overflow-hidden bg-stone-900 shadow-md border border-stone-300">
                      {videoPreview ? (
                        <video
                          src={videoPreview}
                          poster={imagePreview}
                          muted
                          loop
                          playsInline
                          autoPlay
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : imagePreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imagePreview}
                          alt={item.categoryLabel || "Reel"}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-stone-500">
                          No Media
                        </div>
                      )}

                      {item.overlayTag ? (
                        <div className="absolute top-2 left-2 z-10 max-w-[90%]">
                          <p className="font-serif text-[11px] text-white font-medium drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] leading-tight">
                            {item.overlayTag}
                          </p>
                        </div>
                      ) : null}

                      <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 to-transparent p-2.5 pt-8">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-white">
                          → {item.categoryLabel || "Select category"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-900 text-xs font-bold text-white">
                          {index + 1}
                        </span>
                        <h4 className="font-semibold text-stone-900 text-sm">
                          {item.categoryLabel || `Reel Card #${index + 1}`}
                        </h4>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMove(index, "up")}
                          disabled={index === 0}
                          aria-label="Move card up"
                          className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 disabled:opacity-30"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMove(index, "down")}
                          disabled={index === items.length - 1}
                          aria-label="Move card down"
                          className="rounded p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 disabled:opacity-30"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateItem(index, { isActive: !item.isActive })}
                          className={`rounded px-2 py-1 text-xs font-medium border ml-2 ${
                            item.isActive
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-stone-200 bg-stone-100 text-stone-500"
                          }`}
                        >
                          {item.isActive ? "Active" : "Disabled"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 ml-1 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="rounded-lg bg-stone-50 p-3 border border-stone-200">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <label className="text-xs font-semibold text-stone-700">
                          Navigate to category tab (required)
                        </label>
                        {item.categorySlug ? (
                          <a
                            href={`${STORE_ORIGIN}${href}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-maroon hover:underline"
                          >
                            Preview <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : null}
                      </div>
                      <select
                        value={item.categorySlug || ""}
                        onChange={(e) => handleSelectCategory(index, e.target.value)}
                        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-800 focus:border-brand-maroon focus:outline-none"
                      >
                        <option value="" disabled>
                          -- Choose category tab --
                        </option>
                        {CATEGORY_TABS.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.label} ({cat.href})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-semibold text-stone-700">
                            Video (MP4 or WebM)
                          </label>
                          {item.videoUrl ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm("Remove video from this reel card?")) {
                                  handleUpdateItem(index, { videoUrl: "" });
                                }
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 hover:text-rose-700"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete video
                            </button>
                          ) : null}
                        </div>
                        <div className="mt-1 flex gap-2">
                          <input
                            type="text"
                            value={item.videoUrl}
                            onChange={(e) => handleUpdateItem(index, { videoUrl: e.target.value })}
                            placeholder="/uploads/reels/... or https://..."
                            className="flex-1 rounded-lg border border-stone-300 px-3 py-1.5 text-xs text-stone-900 focus:border-brand-maroon focus:outline-none"
                          />
                          <label className="cursor-pointer flex items-center justify-center rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-200 transition-colors border border-stone-300">
                            <Upload className="h-3.5 w-3.5 mr-1" />
                            {uploadingId === `${item.id}-video` ? "..." : "Upload"}
                            <input
                              type="file"
                              accept="video/mp4,video/webm"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadFile(index, file, "video");
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-semibold text-stone-700">
                            Poster / Cover Image
                          </label>
                          {item.imageUrl ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm("Remove cover photo from this reel card?")) {
                                  handleUpdateItem(index, { imageUrl: "" });
                                }
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 hover:text-rose-700"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete photo
                            </button>
                          ) : null}
                        </div>
                        <div className="mt-1 flex gap-2">
                          <input
                            type="text"
                            value={item.imageUrl}
                            onChange={(e) => handleUpdateItem(index, { imageUrl: e.target.value })}
                            placeholder="/uploads/reels/... or https://..."
                            className="flex-1 rounded-lg border border-stone-300 px-3 py-1.5 text-xs text-stone-900 focus:border-brand-maroon focus:outline-none"
                          />
                          <label className="cursor-pointer flex items-center justify-center rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-200 transition-colors border border-stone-300">
                            <Upload className="h-3.5 w-3.5 mr-1" />
                            {uploadingId === `${item.id}-image` ? "..." : "Upload"}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadFile(index, file, "image");
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-stone-700">
                          Optional top overlay text
                        </label>
                        <input
                          type="text"
                          value={item.overlayTag}
                          onChange={(e) => handleUpdateItem(index, { overlayTag: e.target.value })}
                          placeholder="Optional text overlay at top of video"
                          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-1.5 text-xs text-stone-900 focus:border-brand-maroon focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <button
            type="button"
            onClick={handleAddItem}
            className="flex items-center gap-2 rounded-lg border border-brand-maroon bg-white px-4 py-2 text-sm font-semibold text-brand-maroon hover:bg-brand-maroon/5 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Reel Card
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-lg bg-brand-maroon px-6 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-deepMaroon disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save All Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
