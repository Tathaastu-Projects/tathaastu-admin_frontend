"use client";

import { useEffect, useState } from "react";
import { ImageIcon, Pencil, Plus, Trash2, X } from "lucide-react";

type CategoryOption = {
  id: string;
  label: string;
  href: string;
};

type HomeBanner = {
  _id: string;
  title: string;
  titleLine2?: string;
  subtitle?: string;
  imageUrl?: string;
  category?: string;
  ctaLabel?: string;
  ctaHref?: string;
  sortOrder?: number;
  isActive?: boolean;
};

const STORE_ORIGIN = "http://localhost:3025";

const emptyForm = {
  title: "",
  titleLine2: "",
  subtitle: "",
  category: "",
  ctaLabel: "",
  imageUrl: "",
  sortOrder: "",
  isActive: true,
};

function previewSrc(url?: string) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  if (url.startsWith("/uploads/")) return url;
  return `${STORE_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
}

export function HomeBannersSection() {
  const [banners, setBanners] = useState<HomeBanner[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [savingLogo, setSavingLogo] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/store/admin/home-banners");
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to load banners");
      }
      setBanners(payload.data || []);
      setCategories(payload.categories || []);
      const nextLogo = payload.logoUrl || "";
      setLogoPreview(nextLogo ? previewSrc(nextLogo) : "");
      setLogoFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load banners");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...emptyForm,
      sortOrder: String((banners[banners.length - 1]?.sortOrder || banners.length) + 1),
    });
    setFile(null);
    setPreview("");
    setShowForm(true);
    setError("");
  };

  const openEdit = (banner: HomeBanner) => {
    setEditingId(banner._id);
    setForm({
      title: banner.title || "",
      titleLine2: banner.titleLine2 || "",
      subtitle: banner.subtitle || "",
      category: banner.category || "",
      ctaLabel: banner.ctaLabel || "",
      imageUrl: banner.imageUrl || "",
      sortOrder: String(banner.sortOrder ?? ""),
      isActive: banner.isActive !== false,
    });
    setFile(null);
    setPreview(previewSrc(banner.imageUrl));
    setShowForm(true);
    setError("");
  };

  const onCategory = (id: string) => {
    setForm((prev) => ({
      ...prev,
      category: id,
    }));
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
      body.set("title", form.title.trim());
      body.set("titleLine2", form.titleLine2.trim());
      body.set("subtitle", form.subtitle.trim());
      body.set("category", form.category);
      body.set("ctaLabel", form.ctaLabel.trim());
      body.set("sortOrder", form.sortOrder || "0");
      body.set("isActive", form.isActive ? "true" : "false");
      if (file) {
        body.set("image", file);
      } else if (form.imageUrl.trim()) {
        body.set("imageUrl", form.imageUrl.trim());
      }

      const response = await fetch(
        editingId ? `/api/store/admin/home-banners/${editingId}` : "/api/store/admin/home-banners",
        { method: editingId ? "PUT" : "POST", body }
      );
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to save banner");
      }
      setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save banner");
    } finally {
      setSaving(false);
    }
  };

  const saveLogo = async () => {
    if (!logoFile) {
      setError("Choose a logo image first");
      return;
    }
    setSavingLogo(true);
    setError("");
    try {
      const body = new FormData();
      body.set("image", logoFile);
      const response = await fetch("/api/store/admin/logo", { method: "PUT", body });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to update logo");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update logo");
    } finally {
      setSavingLogo(false);
    }
  };

  const deleteLogo = async () => {
    const ok = window.confirm("Remove the store logo? Upload a new one from admin to show it again.");
    if (!ok) return;
    setSavingLogo(true);
    setError("");
    try {
      const response = await fetch("/api/store/admin/logo", { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to remove logo");
      }
      setLogoFile(null);
      setLogoPreview("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove logo");
    } finally {
      setSavingLogo(false);
    }
  };

  const remove = async (banner: HomeBanner) => {
    const ok = window.confirm(`Delete “${banner.title}”? It will leave the homepage loop.`);
    if (!ok) return;
    setError("");
    try {
      const response = await fetch(`/api/store/admin/home-banners/${banner._id}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to delete banner");
      }
      if (editingId === banner._id) setShowForm(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete banner");
    }
  };

  return (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-maroon/20 bg-white/80 px-3 py-1 text-xs font-medium text-brand-maroon">
                <ImageIcon className="h-3.5 w-3.5" />
                Homepage
              </div>
              <h2 className="font-serif text-3xl font-semibold text-brand-deepMaroon">Banners</h2>
              <p className="mt-2 max-w-2xl text-sm text-stone-600">
                These slides run in a loop on the store homepage. Upload an image, write the text, and choose which category the button opens.
              </p>
            </div>
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-maroon to-brand-deepMaroon px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-maroon/20"
            >
              <Plus className="h-4 w-4" />
              Add banner
            </button>
          </div>

          <section className="rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-sm">
            <h2 className="font-serif text-2xl text-brand-deepMaroon">Store logo</h2>
            <p className="mt-1 text-sm text-stone-600">
              This is the logo in the website header. Upload a new image to replace it.
            </p>
            <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-20 min-w-[180px] items-center rounded-2xl bg-[#f7f7f5] px-3">
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoPreview} alt="Current logo" className="h-12 w-auto object-contain" />
                ) : null}
              </div>
              <label className="text-sm text-stone-700">
                New logo
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  className="mt-1 block w-full text-sm"
                  onChange={(event) => {
                    const next = event.target.files?.[0] || null;
                    setLogoFile(next);
                    if (next) setLogoPreview(URL.createObjectURL(next));
                  }}
                />
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={saveLogo}
                  disabled={savingLogo || !logoFile}
                  className="rounded-xl bg-brand-maroon px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {savingLogo ? "Updating…" : "Update logo"}
                </button>
                <button
                  type="button"
                  onClick={deleteLogo}
                  disabled={savingLogo}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-400 hover:bg-rose-100 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove logo
                </button>
              </div>
            </div>
          </section>

          {error ? (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>
          ) : null}

          {loading ? (
            <p className="text-sm text-stone-500">Loading banners…</p>
          ) : (
            <div className="grid gap-4">
              {banners.map((banner) => {
                const cat = categories.find((item) => item.id === banner.category);
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
                        {[banner.title, banner.titleLine2].filter(Boolean).join(" ") || "Full-width Banner (no headline)"}
                      </p>
                      {banner.subtitle ? <p className="mt-1 text-sm text-stone-600">{banner.subtitle}</p> : null}
                      <p className="mt-2 text-xs text-stone-500">
                        {banner.ctaLabel ? `Button: "${banner.ctaLabel}"` : "No button (full banner click)"} · Destination: {cat?.label || (banner.category ? banner.category : "Shop (/shop)")}
                        {banner.isActive === false ? " · Hidden" : " · Visible"}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(banner)}
                        className="inline-flex items-center gap-1 rounded-xl border border-brand-maroon/20 px-3 py-2 text-sm text-brand-maroon"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(banner)}
                        className="inline-flex items-center gap-1 rounded-xl border border-rose-200 px-3 py-2 text-sm text-rose-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
              {!banners.length ? (
                <p className="rounded-[24px] border border-dashed border-stone-300 bg-white/70 px-4 py-8 text-center text-sm text-stone-500">
                  No banners yet. Add one to show it on the homepage.
                </p>
              ) : null}
            </div>
          )}

        {showForm ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[24px] bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-serif text-2xl text-brand-deepMaroon">
                  {editingId ? "Edit banner" : "Add banner"}
                </h2>
                <button type="button" onClick={() => setShowForm(false)} aria-label="Close">
                  <X className="h-5 w-5 text-stone-500" />
                </button>
              </div>

              <div className="space-y-4">
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
                    className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
                  />
                </label>
                <label className="block text-sm text-stone-700">
                  Second line <span className="font-normal text-stone-400">(optional)</span>
                  <input
                    value={form.titleLine2}
                    placeholder="Leave blank if not needed"
                    onChange={(event) => setForm((prev) => ({ ...prev, titleLine2: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
                  />
                </label>
                <label className="block text-sm text-stone-700">
                  Small line under the headline <span className="font-normal text-stone-400">(optional)</span>
                  <input
                    value={form.subtitle}
                    placeholder="Leave blank if not needed"
                    onChange={(event) => setForm((prev) => ({ ...prev, subtitle: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
                  />
                </label>
                <label className="block text-sm text-stone-700">
                  Button category <span className="font-normal text-stone-400">(optional - click destination)</span>
                  <select
                    value={form.category}
                    onChange={(event) => onCategory(event.target.value)}
                    className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
                  >
                    <option value="">Select category (optional / defaults to Shop)</option>
                    {categories.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm text-stone-700">
                  Button text <span className="font-normal text-stone-400">(optional - leave blank to hide button)</span>
                  <input
                    value={form.ctaLabel}
                    placeholder="Leave blank for no button (full banner stays clickable)"
                    onChange={(event) => setForm((prev) => ({ ...prev, ctaLabel: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
                  />
                </label>
                <label className="flex items-center gap-2 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                  />
                  Show on the homepage
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
                    Delete this banner
                  </button>
                ) : <div />}
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
