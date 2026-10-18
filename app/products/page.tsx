"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuthStore } from "@/store/authStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Sparkles,
  AlertTriangle,
  CheckSquare,
  Square,
  X,
  Upload,
  Package,
  History,
  Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ProductStatus = "draft" | "listed" | "unlisted";

interface Variant {
  sku?: string;
  label: string;
  mukhi?: string;
  size?: string;
  weight?: string;
  material?: string;
  color?: string;
  mrp?: number;
  salePrice?: number;
  quantity?: number;
  isActive?: boolean;
}

interface ProductImage {
  url: string;
  alt?: string;
  isPrimary?: boolean;
}

interface Product {
  _id: string;
  title: string;
  slug: string;
  sku?: string;
  shortDescription?: string;
  description?: string;
  category: string;
  images: ProductImage[];
  mrp: number;
  salePrice: number;
  quantity: number;
  lowStockThreshold?: number;
  variants: Variant[];
  status: ProductStatus;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  intentions: string[];
  hoverDetails?: { label: string }[];
  attributes?: Record<string, string>;
  seo?: { metaTitle?: string; metaDescription?: string };
  linkedRemedyId?: string | null;
  linkedRemedyName?: string;
  discountPercent?: number;
  totalStock?: number;
  isLowStock?: boolean;
  updatedAt?: string;
}

interface RemedyOption {
  _id: string;
  name: string;
  category: string;
  slug: string;
}

interface AuditItem {
  _id: string;
  productTitle: string;
  action: string;
  actor: string;
  createdAt: string;
  note?: string;
}

const emptyForm = {
  title: "",
  sku: "",
  slug: "",
  shortDescription: "",
  description: "",
  category: "rudraksha",
  mrp: 0,
  salePrice: 0,
  discountPercent: 0,
  quantity: 0,
  lowStockThreshold: 5,
  status: "draft" as ProductStatus,
  isFeatured: false,
  isBestSeller: false,
  isNewArrival: true,
  intentions: [] as string[],
  hoverDetails: [] as { label: string }[],
  attributes: {
    face: "",
    stone: "",
    shape: "",
    weight: "",
    gender: "",
    color: "",
    occasion: "",
    zodiac: "",
    material: "",
    mukhi: "",
    jewelryType: "",
    planet: "",
    origin: "",
  },
  seo: { metaTitle: "", metaDescription: "" },
  linkedRemedyId: "",
  linkedRemedyName: "",
  variants: [] as Variant[],
  images: [] as ProductImage[],
  imageUrlInput: "",
};

function money(value?: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function calcDiscountPercent(mrp: number, salePrice: number) {
  const m = Number(mrp) || 0;
  const s = Number(salePrice) || 0;
  if (m <= 0 || s < 0 || s >= m) return 0;
  return Math.round(((m - s) / m) * 100);
}

function calcSaleFromDiscount(mrp: number, discountPercent: number) {
  const m = Number(mrp) || 0;
  const d = Math.min(Math.max(Number(discountPercent) || 0, 0), 100);
  if (m <= 0) return 0;
  return Math.round(m * (1 - d / 100));
}

function statusTone(status: ProductStatus) {
  if (status === "listed") return "bg-emerald-100 text-emerald-800";
  if (status === "draft") return "bg-amber-100 text-amber-800";
  return "bg-slate-200 text-slate-700";
}

export default function ProductsPage() {
  const user = useAuthStore((state) => state.user);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [meta, setMeta] = useState<{
    categories: string[];
    intentions: string[];
    remedies: RemedyOption[];
  }>({ categories: [], intentions: [], remedies: [] });
  const [audits, setAudits] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, pages: 1 });
  const [selected, setSelected] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showAudits, setShowAudits] = useState(false);

  const actorHeaders = useMemo(
    () => ({
      "Content-Type": "application/json",
      "x-actor-name": user?.name || "Admin",
      "x-actor-email": user?.email || "",
    }),
    [user]
  );

  const loadAll = async (pageOverride?: number) => {
    setLoading(true);
    setError("");
    try {
      const pageNum = pageOverride ?? page;
      const query = new URLSearchParams();
      query.set("page", String(pageNum));
      query.set("limit", "50");
      if (statusFilter !== "all") query.set("status", statusFilter);
      if (categoryFilter !== "all") query.set("category", categoryFilter);
      if (search.trim()) query.set("q", search.trim());
      if (lowStockOnly) query.set("lowStock", "true");

      const [productsRes, statsRes, metaRes, auditRes] = await Promise.all([
        fetch(`/api/products?${query.toString()}`),
        fetch("/api/products/stats"),
        fetch("/api/products/meta"),
        fetch("/api/products/audits?limit=25"),
      ]);

      const productsPayload = await productsRes.json();
      const statsPayload = await statsRes.json();
      const metaPayload = await metaRes.json();
      const auditPayload = await auditRes.json();

      if (!productsRes.ok || !productsPayload?.success) {
        throw new Error(productsPayload?.message || "Failed to load products from API");
      }

      setProducts(productsPayload.data || []);
      setPagination(
        productsPayload.pagination || {
          total: (productsPayload.data || []).length,
          page: pageNum,
          limit: 50,
          pages: 1,
        }
      );
      if (statsPayload?.success) setStats(statsPayload.data || {});
      if (metaPayload?.success) {
        setMeta({
          categories: metaPayload.data.categories || [],
          intentions: metaPayload.data.intentions || [],
          remedies: metaPayload.data.remedies || [],
        });
      }
      if (auditPayload?.success) setAudits(auditPayload.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, categoryFilter, lowStockOnly, page]);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...emptyForm, discountPercent: 0 });
    setShowForm(true);
  };

  const openEdit = (product: Product) => {
    setEditingId(product._id);
    setForm({
      title: product.title || "",
      sku: product.sku || "",
      slug: product.slug || "",
      shortDescription: product.shortDescription || "",
      description: product.description || "",
      category: product.category || "other",
      mrp: product.mrp || 0,
      salePrice: product.salePrice || 0,
      discountPercent: calcDiscountPercent(product.mrp || 0, product.salePrice || 0),
      quantity: product.quantity || 0,
      lowStockThreshold: product.lowStockThreshold ?? 5,
      status: product.status || "draft",
      isFeatured: Boolean(product.isFeatured),
      isBestSeller: Boolean(product.isBestSeller),
      isNewArrival: product.isNewArrival !== false,
      intentions: product.intentions || [],
      hoverDetails: (product.hoverDetails || []).map((item) => ({ label: item.label || "" })),
      attributes: {
        face: product.attributes?.face || "",
        stone: product.attributes?.stone || "",
        shape: product.attributes?.shape || "",
        weight: product.attributes?.weight || "",
        gender: product.attributes?.gender || "",
        color: product.attributes?.color || "",
        occasion: product.attributes?.occasion || "",
        zodiac: product.attributes?.zodiac || "",
        material: product.attributes?.material || "",
        mukhi: product.attributes?.mukhi || "",
        jewelryType: product.attributes?.jewelryType || "",
        planet: product.attributes?.planet || "",
        origin: product.attributes?.origin || "",
      },
      seo: {
        metaTitle: product.seo?.metaTitle || "",
        metaDescription: product.seo?.metaDescription || "",
      },
      linkedRemedyId: product.linkedRemedyId || "",
      linkedRemedyName: product.linkedRemedyName || "",
      variants: product.variants || [],
      images: product.images || [],
      imageUrlInput: "",
    });
    setShowForm(true);
  };

  const toggleIntention = (value: string) => {
    setForm((prev) => ({
      ...prev,
      intentions: prev.intentions.includes(value)
        ? prev.intentions.filter((item) => item !== value)
        : [...prev.intentions, value],
    }));
  };

  const addVariant = () => {
    setForm((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          label: "",
          sku: "",
          mukhi: "",
          size: "",
          material: "",
          mrp: prev.mrp,
          salePrice: prev.salePrice,
          quantity: 0,
          isActive: true,
        },
      ],
    }));
  };

  const updateVariant = (index: number, key: keyof Variant, value: string | number | boolean) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((item, i) => (i === index ? { ...item, [key]: value } : item)),
    }));
  };

  const removeVariant = (index: number) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const addImageUrl = () => {
    const url = form.imageUrlInput.trim();
    if (!url) return;
    setForm((prev) => ({
      ...prev,
      images: [
        ...prev.images,
        { url, alt: prev.title || "Product image", isPrimary: prev.images.length === 0 },
      ],
      imageUrlInput: "",
    }));
  };

  const saveProduct = async () => {
    if (!form.title.trim()) {
      setError("Product title is required");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        linkedRemedyId: form.linkedRemedyId || null,
        actor: user?.name || "Admin",
        actorEmail: user?.email || "",
      };
      const response = await fetch(editingId ? `/api/products/${editingId}` : "/api/products", {
        method: editingId ? "PUT" : "POST",
        headers: actorHeaders,
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || "Save failed");
      setShowForm(false);
      setSelected([]);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const setStatus = async (id: string, status: ProductStatus) => {
    const response = await fetch(`/api/products/${id}/status`, {
      method: "PATCH",
      headers: actorHeaders,
      body: JSON.stringify({ status, actor: user?.name || "Admin" }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      setError(data.message || "Status update failed");
      return;
    }
    await loadAll();
  };

  const bulkStatus = async (status: ProductStatus) => {
    if (!selected.length) return;
    const response = await fetch("/api/products/bulk-status", {
      method: "POST",
      headers: actorHeaders,
      body: JSON.stringify({ ids: selected, status, actor: user?.name || "Admin" }),
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      setError(data.message || "Bulk update failed");
      return;
    }
    setSelected([]);
    await loadAll();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product permanently?")) return;
    const response = await fetch(`/api/products/${id}`, {
      method: "DELETE",
      headers: actorHeaders,
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      setError(data.message || "Delete failed");
      return;
    }
    await loadAll();
  };

  const uploadImages = async (id: string, files: FileList | null) => {
    if (!files?.length) return;
    const body = new FormData();
    Array.from(files).forEach((file) => body.append("images", file));
    const response = await fetch(`/api/products/${id}/images`, {
      method: "POST",
      headers: {
        "x-actor-name": user?.name || "Admin",
        "x-actor-email": user?.email || "",
      },
      body,
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      setError(data.message || "Image upload failed");
      return;
    }
    await loadAll();
    if (editingId === id) openEdit(data.data);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selected.length === products.length) setSelected([]);
    else setSelected(products.map((item) => item._id));
  };

  const primaryImage = (product: Product) =>
    product.images?.find((img) => img.isPrimary)?.url || product.images?.[0]?.url || "";

  return (
    <DashboardLayout>
      <div className="relative min-h-[calc(100vh-8rem)] overflow-hidden bg-brand-softCream">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,#7A1F2B18,transparent_28%),radial-gradient(circle_at_bottom_left,#C9A24A22,transparent_30%)]" />

        <div className="relative space-y-6 p-6 md:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-maroon/20 bg-white/80 px-3 py-1 text-xs font-medium text-brand-maroon">
                <Package className="h-3.5 w-3.5" />
                Catalog Control
              </div>
              <h1 className="font-serif text-4xl font-semibold text-brand-deepMaroon">Products</h1>
              <p className="mt-2 max-w-2xl text-sm text-stone-600">
                Same catalog the public store uses via API. Manage price, stock, variants, images,
                list/unlist — listed products appear on the storefront automatically.
                {stats.total ? (
                  <span className="ml-1 font-medium text-brand-deepMaroon">
                    ({stats.total} in database · {stats.listed || 0} listed on store)
                  </span>
                ) : null}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setShowAudits(true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-brand-maroon/20 bg-white px-4 py-2.5 text-sm font-medium text-brand-maroon"
              >
                <History className="h-4 w-4" />
                Audit Log
              </button>
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-maroon to-brand-deepMaroon px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-maroon/20"
              >
                <Plus className="h-4 w-4" />
                Add Product
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {[
              ["Total", stats.total || 0, "bg-white"],
              ["Listed", stats.listed || 0, "bg-emerald-50"],
              ["Draft", stats.draft || 0, "bg-amber-50"],
              ["Unlisted", stats.unlisted || 0, "bg-slate-100"],
              ["Low Stock", stats.lowStock || 0, "bg-rose-50"],
            ].map(([label, value, tone]) => (
              <div key={label as string} className={cn("rounded-2xl border border-white/80 p-4 shadow-sm", tone as string)}>
                <p className="text-xs uppercase tracking-wide text-stone-500">{label as string}</p>
                <p className="mt-1 text-2xl font-semibold text-brand-deepMaroon">{value as number}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadAll()}
                  placeholder="Search title or SKU..."
                  className="w-full rounded-xl border border-stone-200 bg-brand-softCream py-2.5 pl-10 pr-3 text-sm outline-none ring-brand-maroon/20 focus:ring-2"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setPage(1);
                  setStatusFilter(e.target.value);
                }}
                className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm"
              >
                <option value="all">All status</option>
                <option value="draft">Draft</option>
                <option value="listed">Listed</option>
                <option value="unlisted">Unlisted</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setPage(1);
                  setCategoryFilter(e.target.value);
                }}
                className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm"
              >
                <option value="all">All categories</option>
                {meta.categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  setPage(1);
                  setLowStockOnly((prev) => !prev);
                }}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm",
                  lowStockOnly
                    ? "border-rose-300 bg-rose-50 text-rose-700"
                    : "border-stone-200 bg-white text-stone-600"
                )}
              >
                <AlertTriangle className="h-4 w-4" />
                Low stock
              </button>
              <button
                type="button"
                onClick={() => {
                  setPage(1);
                  loadAll(1);
                }}
                className="rounded-xl bg-brand-maroon px-4 py-2.5 text-sm font-medium text-white"
              >
                Search
              </button>
            </div>

            {selected.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-brand-blush px-3 py-2 text-sm">
                <span className="font-medium text-brand-deepMaroon">{selected.length} selected</span>
                <button type="button" onClick={() => bulkStatus("listed")} className="rounded-lg bg-emerald-700 px-3 py-1 text-white">
                  Bulk List
                </button>
                <button type="button" onClick={() => bulkStatus("unlisted")} className="rounded-lg bg-slate-700 px-3 py-1 text-white">
                  Bulk Unlist
                </button>
                <button type="button" onClick={() => bulkStatus("draft")} className="rounded-lg bg-amber-700 px-3 py-1 text-white">
                  Move to Draft
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="overflow-hidden rounded-[24px] border border-white/80 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead className="bg-gradient-to-r from-brand-maroon to-brand-deepMaroon text-left text-white">
                  <tr>
                    <th className="px-4 py-4">
                      <button type="button" onClick={toggleSelectAll}>
                        {selected.length && selected.length === products.length ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-4 text-sm font-medium">Product</th>
                    <th className="px-4 py-4 text-sm font-medium">SKU</th>
                    <th className="px-4 py-4 text-sm font-medium">Pricing</th>
                    <th className="px-4 py-4 text-sm font-medium">Stock</th>
                    <th className="px-4 py-4 text-sm font-medium">Flags</th>
                    <th className="px-4 py-4 text-sm font-medium">Status</th>
                    <th className="px-4 py-4 text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-sm text-stone-500">
                        Loading products...
                      </td>
                    </tr>
                  ) : products.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-sm text-stone-500">
                        No products found for this filter. Clear filters or click{" "}
                        <strong>Add Product</strong> to create one. Store catalog lives in this same
                        Products list (not under Store Orders).
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product._id} className="hover:bg-brand-softCream/70">
                        <td className="px-4 py-4">
                          <button type="button" onClick={() => toggleSelect(product._id)}>
                            {selected.includes(product._id) ? (
                              <CheckSquare className="h-4 w-4 text-brand-maroon" />
                            ) : (
                              <Square className="h-4 w-4 text-stone-400" />
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-14 w-14 overflow-hidden rounded-xl bg-stone-100">
                              {primaryImage(product) ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={primaryImage(product)}
                                  alt={product.title}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-[10px] text-stone-400">
                                  No image
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-stone-900">{product.title}</p>
                              <p className="text-xs capitalize text-stone-500">
                                {product.category}
                                {product.intentions?.length ? ` · ${product.intentions.join(", ")}` : ""}
                              </p>
                              {product.linkedRemedyName && (
                                <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-brand-maroon">
                                  <Link2 className="h-3 w-3" />
                                  {product.linkedRemedyName}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-stone-700">{product.sku || "—"}</td>
                        <td className="px-4 py-4">
                          <div className="text-sm">
                            <span className="font-semibold text-brand-maroon">{money(product.salePrice)}</span>
                            {product.mrp > product.salePrice && (
                              <span className="ml-2 text-xs text-stone-400 line-through">{money(product.mrp)}</span>
                            )}
                          </div>
                          {!!product.discountPercent && (
                            <span className="mt-1 inline-flex rounded-full bg-brand-gold/20 px-2 py-0.5 text-[11px] font-medium text-brand-deepMaroon">
                              -{product.discountPercent}%
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-medium text-stone-800">{product.totalStock ?? product.quantity}</p>
                          {product.isLowStock && (
                            <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-rose-600">
                              <AlertTriangle className="h-3 w-3" />
                              Low stock
                            </span>
                          )}
                          {product.variants?.length > 0 && (
                            <p className="text-[11px] text-stone-500">{product.variants.length} variants</p>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1">
                            {product.isNewArrival && <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-800">NEW</span>}
                            {product.isFeatured && <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-800">Featured</span>}
                            {product.isBestSeller && <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-800">Best Seller</span>}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium capitalize", statusTone(product.status))}>
                            {product.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button type="button" onClick={() => openEdit(product)} className="rounded-lg border border-stone-200 p-2 text-stone-600 hover:bg-stone-50">
                              <Pencil className="h-4 w-4" />
                            </button>
                            {product.status !== "listed" ? (
                              <button type="button" onClick={() => setStatus(product._id, "listed")} className="rounded-lg border border-emerald-200 p-2 text-emerald-700 hover:bg-emerald-50" title="List">
                                <Eye className="h-4 w-4" />
                              </button>
                            ) : (
                              <button type="button" onClick={() => setStatus(product._id, "unlisted")} className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-slate-50" title="Unlist">
                                <EyeOff className="h-4 w-4" />
                              </button>
                            )}
                            <label className="rounded-lg border border-brand-maroon/20 p-2 text-brand-maroon hover:bg-brand-blush cursor-pointer" title="Upload images">
                              <Upload className="h-4 w-4" />
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={(e) => uploadImages(product._id, e.target.files)}
                              />
                            </label>
                            <button type="button" onClick={() => deleteProduct(product._id)} className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 bg-stone-50 px-4 py-3">
              <p className="text-sm text-stone-600">
                Showing {products.length} of {pagination.total} products
                {pagination.pages > 1 ? ` · Page ${pagination.page} / ${pagination.pages}` : ""}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={page >= pagination.pages || loading}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm"
            >
              <motion.div
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 24, opacity: 0 }}
                className="my-6 w-full max-w-5xl rounded-[28px] bg-white shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-stone-100 px-6 py-4">
                  <div>
                    <h2 className="font-serif text-2xl text-brand-deepMaroon">
                      {editingId ? "Edit Product" : "Add Product"}
                    </h2>
                    <p className="text-sm text-stone-500">Draft first, then publish/list for the website.</p>
                  </div>
                  <button type="button" onClick={() => setShowForm(false)} className="rounded-full p-2 hover:bg-stone-100">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="max-h-[75vh] space-y-6 overflow-y-auto px-6 py-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="text-sm">
                      <span className="mb-1 block font-medium text-stone-700">Title *</span>
                      <input
                        value={form.title}
                        onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                        className="w-full rounded-xl border border-stone-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-maroon/30"
                      />
                    </label>
                    <label className="text-sm">
                      <span className="mb-1 block font-medium text-stone-700">SKU / Product Code</span>
                      <input
                        value={form.sku}
                        onChange={(e) => setForm((prev) => ({ ...prev, sku: e.target.value }))}
                        className="w-full rounded-xl border border-stone-200 px-3 py-2.5 outline-none focus:ring-2 focus:ring-brand-maroon/30"
                      />
                    </label>
                    <label className="text-sm">
                      <span className="mb-1 block font-medium text-stone-700">Category</span>
                      <select
                        value={form.category}
                        onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                        className="w-full rounded-xl border border-stone-200 px-3 py-2.5"
                      >
                        {meta.categories.map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-sm">
                      <span className="mb-1 block font-medium text-stone-700">Status</span>
                      <select
                        value={form.status}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, status: e.target.value as ProductStatus }))
                        }
                        className="w-full rounded-xl border border-stone-200 px-3 py-2.5"
                      >
                        <option value="draft">Draft</option>
                        <option value="listed">Listed (visible on website)</option>
                        <option value="unlisted">Unlisted (hidden)</option>
                      </select>
                    </label>
                  </div>

                  <div className="rounded-2xl border border-stone-200 bg-stone-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-stone-800">Hover details</p>
                        <p className="mt-1 text-xs text-stone-500">
                          These lines appear on the right of the picture when a shopper hovers the product card.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            hoverDetails: [...prev.hoverDetails, { label: "" }],
                          }))
                        }
                        className="rounded-xl border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700"
                      >
                        Add line
                      </button>
                    </div>
                    <div className="mt-3 space-y-2">
                      {form.hoverDetails.map((item, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            value={item.label}
                            placeholder="Handcrafted by artisans"
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                hoverDetails: prev.hoverDetails.map((row, i) =>
                                  i === index ? { label: e.target.value } : row
                                ),
                              }))
                            }
                            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({
                                ...prev,
                                hoverDetails: prev.hoverDetails.filter((_, i) => i !== index),
                              }))
                            }
                            className="rounded-xl border border-rose-200 px-3 text-xs text-rose-700"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      {!form.hoverDetails.length ? (
                        <p className="text-xs text-stone-500">No hover lines yet. Add one to show details on the card.</p>
                      ) : null}
                    </div>
                  </div>

                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-stone-700">Short description</span>
                    <input
                      value={form.shortDescription}
                      onChange={(e) => setForm((prev) => ({ ...prev, shortDescription: e.target.value }))}
                      className="w-full rounded-xl border border-stone-200 px-3 py-2.5"
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="mb-1 block font-medium text-stone-700">Full description</span>
                    <textarea
                      rows={4}
                      value={form.description}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                      className="w-full rounded-xl border border-stone-200 px-3 py-2.5"
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-5">
                    <label className="text-sm">
                      <span className="mb-1 block font-medium text-stone-700">MRP</span>
                      <input
                        type="number"
                        min={0}
                        value={form.mrp}
                        onChange={(e) => {
                          const mrp = Number(e.target.value) || 0;
                          setForm((prev) => {
                            if (prev.discountPercent > 0) {
                              return {
                                ...prev,
                                mrp,
                                salePrice: calcSaleFromDiscount(mrp, prev.discountPercent),
                              };
                            }
                            return {
                              ...prev,
                              mrp,
                              discountPercent: calcDiscountPercent(mrp, prev.salePrice),
                            };
                          });
                        }}
                        className="w-full rounded-xl border border-stone-200 px-3 py-2.5"
                      />
                    </label>
                    <label className="text-sm">
                      <span className="mb-1 block font-medium text-stone-700">Sale Price</span>
                      <input
                        type="number"
                        min={0}
                        value={form.salePrice}
                        onChange={(e) => {
                          const salePrice = Number(e.target.value) || 0;
                          setForm((prev) => ({
                            ...prev,
                            salePrice,
                            discountPercent: calcDiscountPercent(prev.mrp, salePrice),
                          }));
                        }}
                        className="w-full rounded-xl border border-stone-200 px-3 py-2.5"
                      />
                    </label>
                    <label className="text-sm">
                      <span className="mb-1 block font-medium text-stone-700">Discount %</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={form.discountPercent}
                        onChange={(e) => {
                          const discountPercent = Math.min(
                            Math.max(Number(e.target.value) || 0, 0),
                            100
                          );
                          setForm((prev) => ({
                            ...prev,
                            discountPercent,
                            salePrice: calcSaleFromDiscount(prev.mrp, discountPercent),
                          }));
                        }}
                        className="w-full rounded-xl border border-stone-200 px-3 py-2.5"
                      />
                      <span className="mt-1 block text-[11px] text-stone-500">
                        Auto-fills from MRP + sale, or updates sale from MRP + %
                      </span>
                    </label>
                    <label className="text-sm">
                      <span className="mb-1 block font-medium text-stone-700">Quantity</span>
                      <input
                        type="number"
                        value={form.quantity}
                        onChange={(e) => setForm((prev) => ({ ...prev, quantity: Number(e.target.value) }))}
                        className="w-full rounded-xl border border-stone-200 px-3 py-2.5"
                      />
                    </label>
                    <label className="text-sm">
                      <span className="mb-1 block font-medium text-stone-700">Low stock alert at</span>
                      <input
                        type="number"
                        value={form.lowStockThreshold}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, lowStockThreshold: Number(e.target.value) }))
                        }
                        className="w-full rounded-xl border border-stone-200 px-3 py-2.5"
                      />
                    </label>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-medium text-stone-700">Intention tags</p>
                    <div className="flex flex-wrap gap-2">
                      {meta.intentions.map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleIntention(item)}
                          className={cn(
                            "rounded-full border px-3 py-1.5 text-xs",
                            form.intentions.includes(item)
                              ? "border-brand-maroon bg-brand-maroon text-white"
                              : "border-stone-200 bg-white text-stone-600"
                          )}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.isNewArrival}
                        onChange={(e) => setForm((prev) => ({ ...prev, isNewArrival: e.target.checked }))}
                      />
                      New badge
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.isFeatured}
                        onChange={(e) => setForm((prev) => ({ ...prev, isFeatured: e.target.checked }))}
                      />
                      Featured
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={form.isBestSeller}
                        onChange={(e) => setForm((prev) => ({ ...prev, isBestSeller: e.target.checked }))}
                      />
                      Best Seller
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-4">
                    {Object.keys(form.attributes).map((key) => (
                      <label key={key} className="text-sm capitalize">
                        <span className="mb-1 block font-medium text-stone-700">{key}</span>
                        <input
                          value={(form.attributes as Record<string, string>)[key]}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              attributes: { ...prev.attributes, [key]: e.target.value },
                            }))
                          }
                          className="w-full rounded-xl border border-stone-200 px-3 py-2.5"
                        />
                      </label>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-stone-200 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="font-medium text-stone-800">Variants (mukhi / size / material)</p>
                      <button type="button" onClick={addVariant} className="text-sm font-medium text-brand-maroon">
                        + Add variant
                      </button>
                    </div>
                    <div className="space-y-3">
                      {form.variants.map((variant, index) => (
                        <div key={index} className="grid gap-2 rounded-xl bg-brand-softCream p-3 md:grid-cols-6">
                          <input placeholder="Label" value={variant.label} onChange={(e) => updateVariant(index, "label", e.target.value)} className="rounded-lg border border-stone-200 px-2 py-2 text-sm" />
                          <input placeholder="SKU" value={variant.sku || ""} onChange={(e) => updateVariant(index, "sku", e.target.value)} className="rounded-lg border border-stone-200 px-2 py-2 text-sm" />
                          <input placeholder="Mukhi/Size" value={variant.mukhi || variant.size || ""} onChange={(e) => updateVariant(index, "mukhi", e.target.value)} className="rounded-lg border border-stone-200 px-2 py-2 text-sm" />
                          <input placeholder="Material" value={variant.material || ""} onChange={(e) => updateVariant(index, "material", e.target.value)} className="rounded-lg border border-stone-200 px-2 py-2 text-sm" />
                          <input type="number" placeholder="Sale" value={variant.salePrice || 0} onChange={(e) => updateVariant(index, "salePrice", Number(e.target.value))} className="rounded-lg border border-stone-200 px-2 py-2 text-sm" />
                          <div className="flex gap-2">
                            <input type="number" placeholder="Qty" value={variant.quantity || 0} onChange={(e) => updateVariant(index, "quantity", Number(e.target.value))} className="w-full rounded-lg border border-stone-200 px-2 py-2 text-sm" />
                            <button type="button" onClick={() => removeVariant(index)} className="rounded-lg px-2 text-rose-600">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      {!form.variants.length && (
                        <p className="text-sm text-stone-500">No variants yet. Optional for simple products.</p>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-stone-200 p-4">
                      <p className="mb-2 font-medium text-stone-800">Images</p>
                      <div className="mb-3 flex gap-2">
                        <input
                          value={form.imageUrlInput}
                          onChange={(e) => setForm((prev) => ({ ...prev, imageUrlInput: e.target.value }))}
                          placeholder="Paste image URL"
                          className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                        />
                        <button type="button" onClick={addImageUrl} className="rounded-xl bg-brand-maroon px-3 text-sm text-white">
                          Add
                        </button>
                      </div>
                      {editingId && (
                        <label className="mb-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-brand-maroon/40 px-3 py-2 text-sm text-brand-maroon">
                          <Upload className="h-4 w-4" />
                          Upload files
                          <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => uploadImages(editingId, e.target.files)} />
                        </label>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {form.images.map((img, index) => (
                          <div key={`${img.url}-${index}`} className="relative h-20 w-20 overflow-hidden rounded-xl bg-stone-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.url} alt={img.alt || ""} className="h-full w-full object-cover" />
                            <button
                              type="button"
                              onClick={() =>
                                setForm((prev) => ({
                                  ...prev,
                                  images: prev.images.filter((_, i) => i !== index),
                                }))
                              }
                              className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 rounded-2xl border border-stone-200 p-4">
                      <p className="font-medium text-stone-800">SEO + Remedy link</p>
                      <input
                        value={form.seo.metaTitle}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, seo: { ...prev.seo, metaTitle: e.target.value } }))
                        }
                        placeholder="Meta title"
                        className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                      />
                      <textarea
                        value={form.seo.metaDescription}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            seo: { ...prev.seo, metaDescription: e.target.value },
                          }))
                        }
                        placeholder="Meta description"
                        rows={3}
                        className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                      />
                      <select
                        value={form.linkedRemedyId}
                        onChange={(e) => {
                          const remedy = meta.remedies.find((item) => item._id === e.target.value);
                          setForm((prev) => ({
                            ...prev,
                            linkedRemedyId: e.target.value,
                            linkedRemedyName: remedy?.name || "",
                          }));
                        }}
                        className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm"
                      >
                        <option value="">Link recommendation remedy (optional)</option>
                        {meta.remedies.map((item) => (
                          <option key={item._id} value={item._id}>
                            [{item.category}] {item.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-stone-100 px-6 py-4">
                  <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm">
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={saveProduct}
                    className="rounded-xl bg-gradient-to-r from-brand-maroon to-brand-deepMaroon px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    {saving ? "Saving..." : editingId ? "Update Product" : "Save Product"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAudits && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            >
              <motion.div
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
              >
                <div className="flex items-center justify-between border-b px-5 py-4">
                  <h3 className="font-serif text-xl text-brand-deepMaroon">Audit Log</h3>
                  <button type="button" onClick={() => setShowAudits(false)}>
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="max-h-[65vh] space-y-3 overflow-y-auto p-5">
                  {audits.length === 0 ? (
                    <p className="text-sm text-stone-500">No audit entries yet.</p>
                  ) : (
                    audits.map((item) => (
                      <div key={item._id} className="rounded-2xl border border-stone-100 bg-brand-softCream px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-medium text-stone-800">{item.productTitle}</p>
                          <span className="rounded-full bg-white px-2 py-0.5 text-[11px] uppercase text-brand-maroon">
                            {item.action}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-stone-500">
                          {item.actor} · {new Date(item.createdAt).toLocaleString()}
                        </p>
                        {item.note && <p className="mt-1 text-xs text-stone-600">{item.note}</p>}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
