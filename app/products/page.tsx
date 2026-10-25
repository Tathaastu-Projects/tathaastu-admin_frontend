"use client";

import { asErrorMessage, parseApiJson } from "@/lib/parseApiJson";

type ImportResult = {
  success: boolean;
  message: string;
  totalParsed?: number;
  importedCount?: number;
  failedCount?: number;
  importedProducts?: Array<{
    _id: string;
    title: string;
    sku?: string;
    category: string;
    salePrice: number;
    status: string;
  }>;
  errors?: Array<{ row: number; title: string; error: string }>;
};

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
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
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
};

function money(value?: number) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

const ALLOWED_CATEGORIES = [
  "crystal-bracelets",
  "rudraksha",
  "crystal-anklets",
  "tumbles",
  "crystal-trees",
  "pyramids",
  "loose-stones",
  "mala",
  "photo-frames",
  "other",
];

const CATEGORY_LABELS: Record<string, string> = {
  "crystal-bracelets": "Crystal Bracelets",
  "rudraksha": "Rudraksha",
  "crystal-anklets": "Crystal Anklets",
  "tumbles": "Tumbles",
  "crystal-trees": "Crystal Trees",
  "pyramids": "Pyramids",
  "loose-stones": "Loose Stones",
  "mala": "Mala",
  "photo-frames": "Photo Frames",
  "other": "Other",
};

function formatCategoryLabel(cat?: string): string {
  if (!cat) return "";
  if (CATEGORY_LABELS[cat]) return CATEGORY_LABELS[cat];
  return cat
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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
  const [uploadingImages, setUploadingImages] = useState(false);
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
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState("");

  const handleDownloadTemplate = () => {
    window.location.href = "/api/products/excel-template";
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) {
      setImportError("Please choose an Excel (.xlsx, .xls) or CSV file to import.");
      return;
    }
    setImporting(true);
    setImportError("");
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append("file", importFile);

      const res = await fetch("/api/products/excel-import", {
        method: "POST",
        body: formData,
        headers: {
          "x-actor-name": user?.name || "Admin",
          "x-actor-email": user?.email || "",
        },
      });

      const data = await parseApiJson<ImportResult>(res);
      if (!res.ok || !data.success) {
        throw new Error(asErrorMessage(data.message, "Failed to import products from file."));
      }

      setImportResult(data);
      setImportFile(null);
      loadAll(1);
    } catch (err: any) {
      setImportError(err.message || "Failed to process import file.");
    } finally {
      setImporting(false);
    }
  };

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

      const productsPayload = await parseApiJson<{
        success?: boolean;
        message?: string;
        data?: Product[];
        pagination?: { total: number; page: number; limit: number; pages: number };
      }>(productsRes);
      const statsPayload = await parseApiJson<{ success?: boolean; data?: Record<string, unknown> }>(statsRes);
      const metaPayload = await parseApiJson<{
        success?: boolean;
        data?: { categories?: string[]; intentions?: string[]; remedies?: RemedyOption[] };
      }>(metaRes);
      const auditPayload = await parseApiJson<{ success?: boolean; data?: AuditItem[] }>(auditRes);

      if (!productsRes.ok || !productsPayload?.success) {
        throw new Error(asErrorMessage(productsPayload?.message, "Failed to load products from API"));
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
      if (statsPayload?.success) setStats((statsPayload.data || {}) as Record<string, number>);
      if (metaPayload?.success) {
        const raw = metaPayload.data?.categories || [];
        const filtered = raw.filter((c: string) => ALLOWED_CATEGORIES.includes(c));
        setMeta({
          categories: filtered.length ? filtered : ALLOWED_CATEGORIES,
          intentions: metaPayload.data?.intentions || [],
          remedies: metaPayload.data?.remedies || [],
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

  const uploadFormImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploadingImages(true);
    setError("");
    try {
      const body = new FormData();
      Array.from(files).forEach((file) => body.append("images", file));
      if (form.title.trim()) body.set("alt", form.title.trim());

      const endpoint = editingId
        ? `/api/products/${editingId}/images`
        : "/api/products/upload-images";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "x-actor-name": user?.name || "Admin",
          "x-actor-email": user?.email || "",
        },
        body,
      });
      const data = await parseApiJson<{
        success?: boolean;
        message?: string;
        data?: Product | ProductImage[];
      }>(response);
      if (!response.ok || !data.success) {
        throw new Error(asErrorMessage(data.message, "Image upload failed"));
      }

      if (editingId && data.data && !Array.isArray(data.data)) {
        // Product document returned from /:id/images
        const productDoc = data.data;
        setForm((prev) => ({ ...prev, images: productDoc.images || [] }));
        await loadAll();
        return;
      }

      const uploaded: ProductImage[] = Array.isArray(data.data) ? data.data : [];
      setForm((prev) => {
        const hadImages = prev.images.length > 0;
        const next = [
          ...prev.images,
          ...uploaded.map((img, index) => ({
            url: img.url,
            alt: img.alt || prev.title || "Product image",
            isPrimary: !hadImages && index === 0,
          })),
        ];
        if (next.length && !next.some((img) => img.isPrimary)) next[0].isPrimary = true;
        return { ...prev, images: next };
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setUploadingImages(false);
    }
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
      const data = await parseApiJson<{ success?: boolean; message?: string }>(response);
      if (!response.ok || !data.success) throw new Error(asErrorMessage(data.message, "Save failed"));
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
    const data = await parseApiJson<{ success?: boolean; message?: string }>(response);
    if (!response.ok || !data.success) {
      setError(asErrorMessage(data.message, "Status update failed"));
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
    const data = await parseApiJson<{ success?: boolean; message?: string }>(response);
    if (!response.ok || !data.success) {
      setError(asErrorMessage(data.message, "Bulk update failed"));
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
    const data = await parseApiJson<{ success?: boolean; message?: string }>(response);
    if (!response.ok || !data.success) {
      setError(asErrorMessage(data.message, "Delete failed"));
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
    const data = await parseApiJson<{ success?: boolean; message?: string; data?: Product }>(response);
    if (!response.ok || !data.success) {
      setError(asErrorMessage(data.message, "Image upload failed"));
      return;
    }
    await loadAll();
    if (editingId === id && data.data) openEdit(data.data);
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
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadTemplate}
                title="Download ready-to-use Excel template with sample dummy data and instructions"
                className="inline-flex items-center gap-2 rounded-2xl border border-emerald-600/30 bg-emerald-50/90 px-4 py-2.5 text-sm font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-100 hover:shadow"
              >
                <Download className="h-4 w-4 text-emerald-700" />
                Download Format
              </button>
              <button
                type="button"
                onClick={() => {
                  setImportFile(null);
                  setImportError("");
                  setImportResult(null);
                  setShowImportModal(true);
                }}
                className="inline-flex items-center gap-2 rounded-2xl border border-brand-maroon/30 bg-white px-4 py-2.5 text-sm font-semibold text-brand-maroon shadow-sm transition hover:bg-brand-maroon/5 hover:shadow"
              >
                <FileSpreadsheet className="h-4 w-4 text-brand-maroon" />
                Upload Excel
              </button>
              <button
                type="button"
                onClick={() => setShowAudits(true)}
                className="inline-flex items-center gap-2 rounded-2xl border border-brand-maroon/20 bg-white px-4 py-2.5 text-sm font-medium text-brand-maroon shadow-sm transition hover:bg-stone-50"
              >
                <History className="h-4 w-4" />
                Audit Log
              </button>
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-maroon to-brand-deepMaroon px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-maroon/20 transition hover:opacity-95"
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
                    {formatCategoryLabel(item)}
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
                              <p className="text-xs text-stone-500">
                                <span className="font-medium text-stone-700">{formatCategoryLabel(product.category)}</span>
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
                            {formatCategoryLabel(item)}
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
                        <p className="text-sm font-medium text-stone-800">Mouse hover details</p>
                        <p className="mt-1 text-xs text-stone-500">
                          These lines show on the right of the photo when the mouse is over the product card. Add one line at a time, then save the product.
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
                      <p className="mb-1 font-medium text-stone-800">Product images</p>
                      <p className="mb-3 text-xs text-stone-500">
                        Select multiple photos from your computer (max 12, ~8&nbsp;MB each). No URL paste.
                      </p>
                      <label
                        className={cn(
                          "mb-3 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-brand-maroon/40 bg-brand-softCream/60 px-4 py-6 text-sm text-brand-maroon transition hover:bg-brand-blush/40",
                          uploadingImages && "pointer-events-none opacity-60",
                        )}
                      >
                        <Upload className="h-5 w-5" />
                        <span className="font-semibold">
                          {uploadingImages ? "Uploading…" : "Select & upload images"}
                        </span>
                        <span className="text-xs text-stone-500">PNG, JPG, WEBP — multi-select</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          multiple
                          className="hidden"
                          disabled={uploadingImages}
                          onChange={(e) => {
                            void uploadFormImages(e.target.files);
                            e.target.value = "";
                          }}
                        />
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {form.images.map((img, index) => (
                          <div
                            key={`${img.url}-${index}`}
                            className="relative h-20 w-20 overflow-hidden rounded-xl bg-stone-100 ring-1 ring-stone-200"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.url} alt={img.alt || ""} className="h-full w-full object-cover" />
                            {img.isPrimary ? (
                              <span className="absolute left-1 bottom-1 rounded bg-brand-maroon px-1 text-[9px] font-semibold uppercase text-white">
                                Main
                              </span>
                            ) : (
                              <button
                                type="button"
                                title="Set as main image"
                                onClick={() =>
                                  setForm((prev) => ({
                                    ...prev,
                                    images: prev.images.map((item, i) => ({
                                      ...item,
                                      isPrimary: i === index,
                                    })),
                                  }))
                                }
                                className="absolute left-1 bottom-1 rounded bg-black/55 px-1 text-[9px] font-semibold uppercase text-white"
                              >
                                Set main
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                setForm((prev) => {
                                  const next = prev.images.filter((_, i) => i !== index);
                                  if (next.length && !next.some((item) => item.isPrimary)) {
                                    next[0].isPrimary = true;
                                  }
                                  return { ...prev, images: next };
                                })
                              }
                              className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                      {!form.images.length ? (
                        <p className="mt-2 text-xs text-stone-400">No images yet — upload at least one for the store.</p>
                      ) : null}
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

        <AnimatePresence>
          {showImportModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 15 }}
                className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-stone-200/80 bg-gradient-to-r from-brand-softCream to-white px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-100 p-2 text-emerald-800">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-serif text-xl font-semibold text-brand-deepMaroon">
                        Bulk Import Products from Excel / CSV
                      </h3>
                      <p className="text-xs text-stone-500">
                        Upload an Excel file (.xlsx, .xls) or CSV to add multiple products at once.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!importing) {
                        setShowImportModal(false);
                        setImportFile(null);
                        setImportResult(null);
                        setImportError("");
                      }
                    }}
                    className="rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 space-y-5 overflow-y-auto p-6">
                  {/* Download format prompt card */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl border border-emerald-200/70 bg-emerald-50/70 p-4">
                    <div className="flex items-start gap-3">
                      <FileText className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                      <div>
                        <p className="text-sm font-semibold text-emerald-900">
                          Need the standard Excel format?
                        </p>
                        <p className="text-xs text-emerald-700">
                          Download the pre-filled template with sample dummy data and column guides.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-800"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download Template
                    </button>
                  </div>

                  {/* Error banner if any */}
                  {importError && (
                    <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                      <div>
                        <p className="font-semibold">Import Failed</p>
                        <p className="mt-0.5 text-xs text-rose-700">{importError}</p>
                      </div>
                    </div>
                  )}

                  {/* Result view if import has finished */}
                  {importResult && (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4">
                        <div className="flex items-center gap-3">
                          <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
                          <div>
                            <h4 className="text-base font-semibold text-emerald-900">
                              Import Process Completed
                            </h4>
                            <p className="text-xs text-emerald-700">{importResult.message}</p>
                          </div>
                        </div>

                        {/* Mini stats */}
                        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-xl border border-emerald-100 bg-white p-2.5 shadow-sm">
                            <p className="text-[11px] font-medium uppercase text-stone-500">Total in File</p>
                            <p className="text-lg font-bold text-stone-800">{importResult.totalParsed || 0}</p>
                          </div>
                          <div className="rounded-xl border border-emerald-100 bg-white p-2.5 shadow-sm">
                            <p className="text-[11px] font-medium uppercase text-emerald-600">Imported</p>
                            <p className="text-lg font-bold text-emerald-700">{importResult.importedCount || 0}</p>
                          </div>
                          <div className="rounded-xl border border-emerald-100 bg-white p-2.5 shadow-sm">
                            <p className="text-[11px] font-medium uppercase text-rose-500">Failed / Skipped</p>
                            <p className="text-lg font-bold text-rose-600">{importResult.failedCount || 0}</p>
                          </div>
                        </div>
                      </div>

                      {/* Created products preview */}
                      {importResult.importedProducts && importResult.importedProducts.length > 0 && (
                        <div>
                          <p className="mb-2 text-xs font-semibold text-stone-700">
                            Successfully Added Products ({importResult.importedProducts.length}):
                          </p>
                          <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-2xl border border-stone-200 bg-stone-50/50 p-3">
                            {importResult.importedProducts.map((p, idx) => (
                              <div key={p._id || idx} className="flex items-center justify-between border-b border-stone-100 py-1 text-xs last:border-none">
                                <span className="max-w-[280px] truncate font-medium text-stone-800">
                                  {p.title}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-stone-500">{p.sku || ""}</span>
                                  <span className="font-semibold text-brand-maroon">{money(p.salePrice)}</span>
                                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", statusTone(p.status as ProductStatus))}>
                                    {p.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Error rows preview */}
                      {importResult.errors && importResult.errors.length > 0 && (
                        <div>
                          <p className="mb-2 text-xs font-semibold text-rose-700">
                            Skipped / Error Rows ({importResult.errors.length}):
                          </p>
                          <div className="max-h-36 space-y-1.5 overflow-y-auto rounded-2xl border border-rose-200 bg-rose-50/40 p-3 text-xs">
                            {importResult.errors.map((err, idx) => (
                              <div key={idx} className="flex items-start gap-2 py-0.5 text-rose-800">
                                <span className="shrink-0 font-bold">Row {err.row}:</span>
                                <span>{err.title} — {err.error}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Upload Form */}
                  {!importResult && (
                    <form onSubmit={handleImportSubmit} className="space-y-4">
                      {/* Drag & Drop Zone */}
                      <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const f = e.dataTransfer.files?.[0];
                          if (f) setImportFile(f);
                        }}
                        className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50/80 p-8 text-center transition hover:border-brand-maroon/50 hover:bg-stone-50"
                      >
                        <input
                          id="excelFileInput"
                          type="file"
                          accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                          onChange={(e) => {
                            const f = e.target.files?.[0] || null;
                            setImportFile(f);
                          }}
                          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                        />
                        <div className="rounded-2xl border border-stone-200/80 bg-white p-3 text-brand-maroon shadow-sm">
                          <Upload className="h-7 w-7" />
                        </div>
                        <p className="mt-3 text-sm font-semibold text-stone-800">
                          {importFile ? importFile.name : "Click to browse or drag and drop your file here"}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          {importFile
                            ? `${(importFile.size / 1024).toFixed(1)} KB · Ready to import`
                            : "Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv)"}
                        </p>
                        {importFile && (
                          <div className="mt-3 flex items-center gap-2">
                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                              Selected: {importFile.name}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setImportFile(null);
                              }}
                              className="text-xs text-rose-600 hover:underline"
                            >
                              Change file
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Multiple Images Highlight Box */}
                      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 text-xs text-amber-900 space-y-1.5">
                        <p className="font-semibold text-amber-950 flex items-center gap-1.5 text-[12px]">
                          <span>📸</span> How to Add Multiple Images for Every Product:
                        </p>
                        <p className="text-amber-900 leading-relaxed">
                          In the Excel template, you can add multiple photos in two easy ways:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-amber-800 ml-1">
                          <li>
                            <strong className="text-amber-950">Option A (Separate Columns):</strong> Use <code>Primary Image URL</code> for the cover photo, and <code>Image 2 URL</code>, <code>Image 3 URL</code>, <code>Image 4 URL</code>, <code>Image 5 URL</code> for gallery photos.
                          </li>
                          <li>
                            <strong className="text-amber-950">Option B (All in one column):</strong> In <code>All Images (Comma Separated)</code>, paste all your links separated by comma: <code>url1, url2, url3</code>
                          </li>
                          <li>
                            Both direct URLs (https://...) and <strong>Google Drive share links</strong> (drive.google.com/file/d/...) are automatically recognized!
                          </li>
                        </ul>
                      </div>

                      {/* Complete Field Checklist */}
                      <div className="space-y-2 rounded-2xl border border-stone-200/80 bg-stone-50/60 p-4 text-xs text-stone-600">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-800">
                          All Manual Product Fields Included in Excel Format:
                        </p>
                        <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
                          <div><strong className="text-stone-800">Basic:</strong> Title *, SKU, Category, Status</div>
                          <div><strong className="text-stone-800">Pricing & Stock:</strong> MRP, Sale Price, Discount %, Quantity, Low Stock Alert</div>
                          <div><strong className="text-stone-800">Descriptions:</strong> Short & Full Description, Mouse Hover Details (| separated)</div>
                          <div><strong className="text-stone-800">Badges & Intentions:</strong> New Badge, Featured, Best Seller, Intention Tags</div>
                          <div><strong className="text-stone-800">All Attributes:</strong> Face, Stone, Shape, Weight, Gender, Color, Occasion, Zodiac, Material, Mukhi, Jewelry Type, Planet, Origin</div>
                          <div><strong className="text-stone-800">Variants & SEO:</strong> Variants (mukhi/size/price/stock), Meta Title, Meta Description, Link Remedy</div>
                        </div>
                      </div>
                    </form>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between border-t border-stone-200 bg-stone-50/50 px-6 py-4">
                  <button
                    type="button"
                    onClick={() => {
                      if (!importing) {
                        setShowImportModal(false);
                        setImportFile(null);
                        setImportResult(null);
                        setImportError("");
                      }
                    }}
                    className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                  >
                    {importResult ? "Close" : "Cancel"}
                  </button>

                  {!importResult ? (
                    <button
                      type="button"
                      disabled={!importFile || importing}
                      onClick={handleImportSubmit}
                      className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-maroon to-brand-deepMaroon px-5 py-2 text-sm font-semibold text-white shadow-md shadow-brand-maroon/20 hover:opacity-95 disabled:opacity-50"
                    >
                      {importing ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Importing Products...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Import Products
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setImportResult(null);
                        setImportFile(null);
                        setImportError("");
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-brand-maroon/30 bg-white px-4 py-2 text-sm font-semibold text-brand-maroon hover:bg-brand-softCream"
                    >
                      <Plus className="h-4 w-4" />
                      Import Another File
                    </button>
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
