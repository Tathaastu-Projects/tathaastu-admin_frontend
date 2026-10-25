"use client";

import { useEffect, useState } from "react";
import { parseApiJson } from "@/lib/parseApiJson";
import {
  Film,
  Plus,
  Trash2,
  Upload,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";

type ReelItem = {
  id: string;
  overlayTag: string;
  videoUrl: string;
  imageUrl: string;
  productTitle: string;
  productPrice: number;
  productImage: string;
  productSlug: string;
  buttonText: string;
  dotsCount: number;
  isActive: boolean;
};

type ProductOption = {
  _id: string;
  title: string;
  slug: string;
  salePrice: number;
  image?: string;
};

const STORE_ORIGIN = "http://localhost:3025";

function resolveMediaUrl(url?: string) {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")) return url;
  if (url.startsWith("/uploads/")) return url;
  return `${STORE_ORIGIN}${url.startsWith("/") ? url : `/${url}`}`;
}

export function ScreenToSpaceSection() {
  const [title, setTitle] = useState("from screen to space, seamlessly");
  const [subtitle, setSubtitle] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [items, setItems] = useState<ReelItem[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const [resSection, resProducts] = await Promise.all([
          fetch("/api/store/admin/screen-to-space"),
          fetch("/api/products?limit=100"),
        ]);

        const sectionData = await parseApiJson(resSection);
        if (resSection.ok && sectionData.success && sectionData.data) {
          if (!cancelled) {
            setTitle(sectionData.data.title || "from screen to space, seamlessly");
            setSubtitle(sectionData.data.subtitle || "");
            setIsActive(sectionData.data.isActive !== false);
            setItems(sectionData.data.items || []);
          }
        }

        const productsData = await parseApiJson(resProducts);
        if (resProducts.ok && productsData.products) {
          if (!cancelled) {
            setProducts(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              productsData.products.map((p: any) => ({
                _id: p._id,
                title: p.title,
                slug: p.slug,
                salePrice: p.salePrice || 0,
                image: p.images?.find((img: { isPrimary: boolean }) => img.isPrimary)?.url || p.images?.[0]?.url || "",
              }))
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
    const newItem: ReelItem = {
      id: `reel-${Date.now()}`,
      overlayTag: "",
      videoUrl: "",
      imageUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=800&q=80",
      productTitle: "New Product",
      productPrice: 1999,
      productImage: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=300&q=80",
      productSlug: "new-product",
      buttonText: "SHOP NOW",
      dotsCount: 4,
      isActive: true,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    const item = items[index];
    const name = item?.productTitle || `Reel Card #${index + 1}`;
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

  const handleSelectProduct = (index: number, productId: string) => {
    const prod = products.find((p) => p._id === productId);
    if (!prod) return;
    handleUpdateItem(index, {
      productTitle: prod.title,
      productPrice: prod.salePrice,
      productSlug: prod.slug,
      productImage: prod.image || items[index].productImage,
    });
  };

  const handleUploadFile = async (
    index: number,
    file: File,
    type: "video" | "image" | "productImage"
  ) => {
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
        data?: { videoUrl?: string; imageUrl?: string; productImage?: string };
      }>(res);
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Upload failed");
      }

      if (type === "video" && data.data?.videoUrl) {
        handleUpdateItem(index, { videoUrl: data.data.videoUrl });
      } else if (type === "image" && data.data?.imageUrl) {
        handleUpdateItem(index, { imageUrl: data.data.imageUrl });
      } else if (type === "productImage" && data.data?.productImage) {
        handleUpdateItem(index, { productImage: data.data.productImage });
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
      {/* Header Info Banner */}
      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-maroon/10 px-3 py-1 text-xs font-semibold text-brand-maroon">
              <Film className="h-3.5 w-3.5" />
              Shoppable Video Reels
            </div>
            <h2 className="mt-2 font-serif text-2xl font-semibold text-stone-900">
              Screen to Space Section
            </h2>
            <p className="text-xs text-stone-500 sm:text-sm">
              Manage the portrait video &amp; product carousel shown right before Testimonials on the storefront.
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

        {/* Global Feedback */}
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

        {/* Section Heading Inputs */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-stone-700">Section Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="from screen to space, seamlessly"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-brand-maroon focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-stone-400">Title shown centered above the reels</p>
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
            <p className="mt-1 text-[11px] text-stone-400">Leave blank if no subtitle is needed</p>
          </div>
        </div>
      </div>

      {/* Reel Cards List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-stone-900 text-lg flex items-center gap-2">
            Reel Cards ({items.length})
            <span className="text-xs font-normal text-stone-500">
              Arrange in the exact order you want them to scroll
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
            const prodImgPreview = resolveMediaUrl(item.productImage || item.imageUrl);

            return (
              <div
                key={item.id}
                className={`rounded-xl border bg-white p-5 shadow-sm transition-all ${
                  item.isActive ? "border-stone-200" : "border-stone-200 opacity-60 bg-stone-50"
                }`}
              >
                <div className="flex flex-col gap-6 lg:flex-row">
                  {/* Left: Card Visual Preview (approx 9:16) */}
                  <div className="shrink-0 flex flex-col items-center">
                    <span className="mb-2 text-xs font-medium text-stone-400">
                      Card #{index + 1} Preview
                    </span>
                    <div className="relative w-[180px] sm:w-[210px] aspect-[9/16] rounded-xl overflow-hidden bg-stone-900 shadow-md border border-stone-300 flex flex-col justify-between">
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
                          alt={item.productTitle}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs text-stone-500">
                          No Media
                        </div>
                      )}

                      {/* Overlay Tag Preview */}
                      {item.overlayTag ? (
                        <div className="relative z-10 p-2.5">
                          <p className="font-serif text-[11px] text-white font-medium drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)] leading-tight">
                            {item.overlayTag}
                          </p>
                        </div>
                      ) : (
                        <div />
                      )}

                      {/* Bottom White Box Preview */}
                      <div className="relative z-10 m-2 rounded-lg bg-white p-2 shadow-lg flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={prodImgPreview || "/placeholder-product.svg"}
                            alt={item.productTitle}
                            className="h-8 w-8 rounded object-cover bg-stone-100 border border-stone-200 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-medium text-stone-900 truncate">
                              {item.productTitle || "Product Title"}
                            </p>
                            <p className="text-[10px] font-bold text-stone-950">
                              Rs. {Number(item.productPrice || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                        <div
                          className="rounded py-1 text-center text-[9px] font-bold uppercase tracking-wider shadow-sm"
                          style={{ backgroundColor: "#123f33", color: "#ffffff" }}
                        >
                          {item.buttonText || "SHOP NOW"}
                        </div>
                        <div className="flex items-center justify-center gap-1">
                          {Array.from({ length: item.dotsCount || 4 }).map((_, dIdx) => (
                            <span
                              key={dIdx}
                              className={`h-1 rounded-full ${dIdx === 0 ? "w-2 bg-stone-900" : "w-1 bg-stone-300"}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Controls & Form Fields */}
                  <div className="flex-1 space-y-4">
                    {/* Top Row: Card Title & Order Controls */}
                    <div className="flex items-center justify-between border-b pb-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-stone-900 text-xs font-bold text-white">
                          {index + 1}
                        </span>
                        <h4 className="font-semibold text-stone-900 text-sm">
                          {item.productTitle || `Reel Card #${index + 1}`}
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
                          aria-label={item.isActive ? "Hide card" : "Show card"}
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
                          aria-label="Delete card"
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 ml-1 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete card
                        </button>
                      </div>
                    </div>

                    {/* Auto-fill from Product Catalog */}
                    <div className="rounded-lg bg-stone-50 p-3 border border-stone-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-brand-maroon" />
                        <label className="text-xs font-semibold text-stone-700">
                          Auto-populate from Listed Product
                        </label>
                      </div>
                      <select
                        onChange={(e) => handleSelectProduct(index, e.target.value)}
                        defaultValue=""
                        className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-xs text-stone-800 focus:border-brand-maroon focus:outline-none"
                      >
                        <option value="" disabled>
                          -- Choose a product to auto-fill title, price &amp; thumbnail --
                        </option>
                        {products.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.title} (₹{p.salePrice})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Form Grid */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {/* Video Media */}
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

                      {/* Poster / Fallback Image */}
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

                      {/* Overlay Tag */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-stone-700">
                          Top Overlay Text (e.g. &quot;1. Beal Gond Katira cooler&quot;)
                        </label>
                        <input
                          type="text"
                          value={item.overlayTag}
                          onChange={(e) => handleUpdateItem(index, { overlayTag: e.target.value })}
                          placeholder="Optional text overlay at top of video"
                          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-1.5 text-xs text-stone-900 focus:border-brand-maroon focus:outline-none"
                        />
                      </div>

                      {/* Product Title */}
                      <div>
                        <label className="block text-xs font-semibold text-stone-700">
                          Product Display Title
                        </label>
                        <input
                          type="text"
                          value={item.productTitle}
                          onChange={(e) => handleUpdateItem(index, { productTitle: e.target.value })}
                          placeholder="Arra Brass Tea Pan With Wooden..."
                          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-1.5 text-xs text-stone-900 focus:border-brand-maroon focus:outline-none"
                        />
                      </div>

                      {/* Product Price */}
                      <div>
                        <label className="block text-xs font-semibold text-stone-700">
                          Price (₹)
                        </label>
                        <input
                          type="number"
                          value={item.productPrice || ""}
                          onChange={(e) => handleUpdateItem(index, { productPrice: Number(e.target.value) || 0 })}
                          placeholder="4581"
                          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-1.5 text-xs text-stone-900 focus:border-brand-maroon focus:outline-none"
                        />
                      </div>

                      {/* Product Thumbnail URL / Upload */}
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-semibold text-stone-700">
                            Product Thumbnail Image
                          </label>
                          {item.productImage ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm("Remove thumbnail from this product?")) {
                                  handleUpdateItem(index, { productImage: "" });
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
                            value={item.productImage}
                            onChange={(e) => handleUpdateItem(index, { productImage: e.target.value })}
                            placeholder="/uploads/... or https://..."
                            className="flex-1 rounded-lg border border-stone-300 px-3 py-1.5 text-xs text-stone-900 focus:border-brand-maroon focus:outline-none"
                          />
                          <label className="cursor-pointer flex items-center justify-center rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-200 transition-colors border border-stone-300">
                            <Upload className="h-3.5 w-3.5 mr-1" />
                            {uploadingId === `${item.id}-productImage` ? "..." : "Upload"}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadFile(index, file, "productImage");
                              }}
                            />
                          </label>
                        </div>
                      </div>

                      {/* Product Link / Slug */}
                      <div>
                        <label className="block text-xs font-semibold text-stone-700">
                          Product Slug or Link
                        </label>
                        <div className="mt-1 flex items-center gap-1">
                          <input
                            type="text"
                            value={item.productSlug}
                            onChange={(e) => handleUpdateItem(index, { productSlug: e.target.value })}
                            placeholder="product-slug or /shop"
                            className="flex-1 rounded-lg border border-stone-300 px-3 py-1.5 text-xs text-stone-900 focus:border-brand-maroon focus:outline-none"
                          />
                          {item.productSlug ? (
                            <a
                              href={`${STORE_ORIGIN}${item.productSlug.startsWith("/") ? item.productSlug : `/product/${item.productSlug}`}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-stone-400 hover:text-stone-700"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          ) : null}
                        </div>
                      </div>

                      {/* Button Text */}
                      <div>
                        <label className="block text-xs font-semibold text-stone-700">
                          Button Text
                        </label>
                        <input
                          type="text"
                          value={item.buttonText}
                          onChange={(e) => handleUpdateItem(index, { buttonText: e.target.value })}
                          placeholder="SHOP NOW"
                          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-1.5 text-xs text-stone-900 focus:border-brand-maroon focus:outline-none"
                        />
                      </div>

                      {/* Dots Count */}
                      <div>
                        <label className="block text-xs font-semibold text-stone-700">
                          Pagination Dots Count
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={8}
                          value={item.dotsCount || 4}
                          onChange={(e) => handleUpdateItem(index, { dotsCount: Number(e.target.value) || 4 })}
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

        {/* Bottom Save Action */}
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
