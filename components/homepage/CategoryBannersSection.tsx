"use client";

import { useEffect, useState } from "react";
import { FolderKanban, ImageIcon, Pencil, Plus, Trash2, X, ExternalLink } from "lucide-react";
import { parseApiJson } from "@/lib/parseApiJson";

type CategoryOption = {
  id: string;
  label: string;
  href: string;
};

export const CATEGORY_TABS: CategoryOption[] = [
  { id: "crystal-bracelets", label: "Crystal Bracelets", href: "/shop/crystal-bracelets" },
  { id: "rudraksha", label: "Rudraksha", href: "/shop/rudraksha" },
  { id: "crystal-anklets", label: "Crystal Anklets", href: "/shop/crystal-anklets" },
  { id: "tumbles", label: "Tumbles", href: "/shop/tumbles" },
  { id: "crystal-trees", label: "Crystal Trees", href: "/shop/crystal-trees" },
  { id: "pyramids", label: "Pyramids", href: "/shop/pyramids" },
  { id: "loose-stones", label: "Loose Stones", href: "/shop/loose-stones" },
  { id: "mala", label: "Mala", href: "/shop/mala" },
  { id: "photo-frames", label: "Photo Frames", href: "/shop/photo-frames" },
  { id: "other", label: "Other", href: "/shop/other" },
];

type CategoryBannerItem = {
  _id: string;
  key?: string;
  category: string;
  title?: string;
  titleLine2?: string;
  subtitle?: string;
  imageUrl?: string;
  ctaLabel?: string;
  ctaHref?: string;
  sortOrder?: number;
  isActive?: boolean;
};

const STORE_ORIGIN = "http://localhost:3025";

function previewSrc(url?: string) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  if (url.startsWith("/uploads/")) return url;
  return `${STORE_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
}

const emptyForm = {
  category: "crystal-bracelets",
  title: "",
  titleLine2: "",
  subtitle: "",
  ctaLabel: "",
  ctaHref: "",
  imageUrl: "",
  sortOrder: "",
  isActive: true,
};

export function CategoryBannersSection() {
  const [activeCategory, setActiveCategory] = useState("crystal-bracelets");
  const [banners, setBanners] = useState<CategoryBannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/store/admin/category-banners");
      const payload = await parseApiJson(response);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to load category banners");
      }
      setBanners(payload.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load category banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const currentTab = CATEGORY_TABS.find((t) => t.id === activeCategory) || CATEGORY_TABS[0];
  const categoryBanners = banners.filter((b) => b.category === activeCategory);

  const openCreate = (category = activeCategory) => {
    setEditingId(null);
    const existingForCat = banners.filter((b) => b.category === category);
    setForm({
      ...emptyForm,
      category,
      ctaHref: `/shop/${category}`,
      sortOrder: String(existingForCat.length + 1),
    });
    setFile(null);
    setPreview("");
    setShowForm(true);
    setError("");
  };

  const openEdit = (banner: CategoryBannerItem) => {
    setEditingId(banner._id);
    setForm({
      category: banner.category || activeCategory,
      title: banner.title || "",
      titleLine2: banner.titleLine2 || "",
      subtitle: banner.subtitle || "",
      ctaLabel: banner.ctaLabel || "",
      ctaHref: banner.ctaHref || `/shop/${banner.category || activeCategory}`,
      imageUrl: banner.imageUrl || "",
      sortOrder: String(banner.sortOrder ?? ""),
      isActive: banner.isActive !== false,
    });
    setFile(null);
    setPreview(previewSrc(banner.imageUrl));
    setShowForm(true);
    setError("");
  };

  const onFile = (next: File | null) => {
    setFile(next);
    if (!next) return;
    setForm((prev) => ({ ...prev, imageUrl: "" }));
    const url = URL.createObjectURL(next);
    setPreview(url);
  };

  const save = async () => {
    if (!editingId && !file && !form.imageUrl.trim()) {
      setError("Please choose a banner image file OR paste a live image URL");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const body = new FormData();
      body.set("category", form.category);
      body.set("title", form.title.trim());
      body.set("titleLine2", form.titleLine2.trim());
      body.set("subtitle", form.subtitle.trim());
      body.set("ctaLabel", form.ctaLabel.trim());
      body.set("ctaHref", form.ctaHref.trim() || `/shop/${form.category}`);
      body.set("sortOrder", form.sortOrder || "0");
      body.set("isActive", form.isActive ? "true" : "false");
      if (file) {
        body.set("image", file);
      } else if (form.imageUrl.trim()) {
        body.set("imageUrl", form.imageUrl.trim());
      }

      const response = await fetch(
        editingId ? `/api/store/admin/category-banners/${editingId}` : "/api/store/admin/category-banners",
        { method: editingId ? "PUT" : "POST", body }
      );
      const payload = await parseApiJson(response);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to save category banner");
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category banner");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (banner: CategoryBannerItem) => {
    const title = banner.title || banner.titleLine2 || "this banner";
    const ok = window.confirm(`Delete “${title}” from ${banner.category}?`);
    if (!ok) return;
    setError("");
    try {
      const response = await fetch(`/api/store/admin/category-banners/${banner._id}`, { method: "DELETE" });
      const payload = await parseApiJson(response);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to delete category banner");
      }
      if (editingId === banner._id) setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete category banner");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-maroon/20 bg-white/80 px-3 py-1 text-xs font-medium text-brand-maroon">
            <FolderKanban className="h-3.5 w-3.5" />
            Category Pages
          </div>
          <h2 className="font-serif text-3xl font-semibold text-brand-deepMaroon">Category-wise Banners</h2>
          <p className="mt-2 max-w-2xl text-sm text-stone-600">
            Set custom banners for each product category page. Upload an image or paste a live URL. All text fields are optional; leave button text blank to hide the button.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openCreate(activeCategory)}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-maroon to-brand-deepMaroon px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-maroon/20 hover:opacity-95"
        >
          <Plus className="h-4 w-4" />
          Add banner for {currentTab.label}
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 rounded-2xl border border-stone-200/80 bg-white/90 p-2 shadow-sm">
        {CATEGORY_TABS.map((tab) => {
          const isSelected = tab.id === activeCategory;
          const count = banners.filter((b) => b.category === tab.id).length;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                isSelected
                  ? "bg-brand-maroon text-white shadow-sm"
                  : "bg-stone-50 text-stone-700 hover:bg-stone-100"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  isSelected ? "bg-white/20 text-white" : "bg-stone-200 text-stone-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>
      ) : null}

      {/* Banner list for active category */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-xl font-semibold text-brand-deepMaroon">
              {currentTab.label} Banners
            </h3>
            <span className="text-xs text-stone-500">
              ({categoryBanners.length} {categoryBanners.length === 1 ? "banner" : "banners"})
            </span>
          </div>
          <a
            href={`${STORE_ORIGIN}/shop/${currentTab.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-brand-maroon hover:underline"
          >
            Preview {currentTab.label} page <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {loading ? (
          <p className="text-sm text-stone-500">Loading banners…</p>
        ) : categoryBanners.length ? (
          <div className="grid gap-4">
            {categoryBanners.map((banner) => {
              const titleDisplay = [banner.title, banner.titleLine2].filter(Boolean).join(" ");
              return (
                <article
                  key={banner._id}
                  className="grid gap-4 rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-sm md:grid-cols-[220px_minmax(0,1fr)_auto] md:items-center"
                >
                  <div className="h-28 overflow-hidden rounded-2xl bg-[#f3efe8]">
                    {banner.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previewSrc(banner.imageUrl)} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <p className="font-serif text-lg text-brand-deepMaroon">
                      {titleDisplay || "Full-width Banner (no headline)"}
                    </p>
                    {banner.subtitle ? <p className="mt-1 text-sm text-stone-600">{banner.subtitle}</p> : null}
                    <p className="mt-2 text-xs text-stone-500">
                      {banner.ctaLabel ? `Button: "${banner.ctaLabel}"` : "No button (full banner click)"} · Link: {banner.ctaHref || `/shop/${banner.category}`}
                      {banner.isActive === false ? " · Hidden" : " · Visible"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(banner)}
                      className="inline-flex items-center gap-1 rounded-xl border border-brand-maroon/20 px-3 py-2 text-sm text-brand-maroon hover:bg-brand-maroon/5"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(banner)}
                      className="inline-flex items-center gap-1 rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded-[24px] border border-dashed border-stone-300 bg-white/70 p-8 text-center">
            <ImageIcon className="mx-auto h-8 w-8 text-stone-400" />
            <p className="mt-2 text-sm font-medium text-stone-700">No custom banners set for {currentTab.label}</p>
            <p className="mt-1 text-xs text-stone-500">
              The store currently displays the default collection banner on this category page.
            </p>
            <button
              type="button"
              onClick={() => openCreate(activeCategory)}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-maroon px-4 py-2 text-xs font-semibold text-white shadow hover:opacity-95"
            >
              <Plus className="h-3.5 w-3.5" />
              Add custom banner for {currentTab.label}
            </button>
          </div>
        )}
      </div>

      {/* Modal Form */}
      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[24px] bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-2xl text-brand-deepMaroon">
                {editingId ? `Edit ${currentTab.label} banner` : `Add banner for ${currentTab.label}`}
              </h2>
              <button type="button" onClick={() => setShowForm(false)} aria-label="Close">
                <X className="h-5 w-5 text-stone-500" />
              </button>
            </div>

            <div className="space-y-4">
              <label className="block text-sm text-stone-700">
                Target category
                <select
                  value={form.category}
                  onChange={(event) => {
                    const nextCat = event.target.value;
                    setForm((prev) => ({
                      ...prev,
                      category: nextCat,
                      ctaHref: prev.ctaHref && prev.ctaHref !== `/shop/${prev.category}` ? prev.ctaHref : `/shop/${nextCat}`,
                    }));
                  }}
                  className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                >
                  {CATEGORY_TABS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              {/* Image upload OR paste live URL */}
              <div className="rounded-2xl border border-stone-200 bg-stone-50/70 p-3.5 space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-stone-800">Banner image</label>
                  <p className="text-xs text-stone-500">Upload a picture from your device OR paste a live image URL.</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <span className="block text-xs font-semibold text-stone-600">Option 1: Upload image file</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="mt-1 block w-full text-xs text-stone-600 file:mr-2 file:rounded-lg file:border-0 file:bg-brand-maroon/10 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-brand-maroon hover:file:bg-brand-maroon/20"
                      onChange={(event) => onFile(event.target.files?.[0] || null)}
                    />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-stone-600">Option 2: Paste live image URL</span>
                    <input
                      type="url"
                      placeholder="https://example.com/banner.jpg"
                      value={form.imageUrl}
                      onChange={(event) => {
                        const val = event.target.value;
                        setForm((prev) => ({ ...prev, imageUrl: val }));
                        if (val.trim()) {
                          setFile(null);
                          setPreview(val.trim());
                        }
                      }}
                      className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-800 focus:border-brand-maroon focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {preview ? (
                <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-[#f3efe8]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="Banner preview" className="h-40 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setPreview("");
                      setForm((prev) => ({ ...prev, imageUrl: "" }));
                    }}
                    className="absolute right-2 top-2 rounded-lg bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80"
                  >
                    Clear image
                  </button>
                </div>
              ) : null}

              <label className="block text-sm text-stone-700">
                Headline <span className="font-normal text-stone-400">(optional)</span>
                <input
                  value={form.title}
                  placeholder="Leave blank for clean image-only banner"
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                />
              </label>

              <label className="block text-sm text-stone-700">
                Second line <span className="font-normal text-stone-400">(optional)</span>
                <input
                  value={form.titleLine2}
                  placeholder="Leave blank if not needed"
                  onChange={(event) => setForm((prev) => ({ ...prev, titleLine2: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                />
              </label>

              <label className="block text-sm text-stone-700">
                Small line under the headline <span className="font-normal text-stone-400">(optional)</span>
                <input
                  value={form.subtitle}
                  placeholder="Leave blank if not needed"
                  onChange={(event) => setForm((prev) => ({ ...prev, subtitle: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                />
              </label>

              <label className="block text-sm text-stone-700">
                Button text <span className="font-normal text-stone-400">(optional - leave blank to hide button)</span>
                <input
                  value={form.ctaLabel}
                  placeholder="Leave blank for no button (full banner is clickable)"
                  onChange={(event) => setForm((prev) => ({ ...prev, ctaLabel: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                />
              </label>

              <label className="block text-sm text-stone-700">
                Banner click destination link <span className="font-normal text-stone-400">(optional)</span>
                <input
                  value={form.ctaHref}
                  placeholder={`/shop/${form.category}`}
                  onChange={(event) => setForm((prev) => ({ ...prev, ctaHref: event.target.value }))}
                  className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                />
              </label>

              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                />
                Show on category page
              </label>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              {editingId ? (
                <button
                  type="button"
                  onClick={() => {
                    const cur = banners.find((b) => b._id === editingId);
                    if (cur) remove(cur);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete banner
                </button>
              ) : (
                <div />
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-stone-200 px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="rounded-xl bg-brand-maroon px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save banner"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
