"use client";

import { useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { parseApiJson } from "@/lib/parseApiJson";

type ProductPrice = {
  id: string;
  name: string;
  title: string;
  category: string;
  sku: string;
  price: string;
  originalPrice: string;
  offer: string;
  buyLabel: string;
};

export function Remedies3dPricesSection() {
  const [products, setProducts] = useState<ProductPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");
  const [filter, setFilter] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/store/admin/3d-prices");
      const payload = await parseApiJson<{
        success?: boolean;
        message?: string;
        data?: { products?: ProductPrice[] };
      }>(response);
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to load 3D prices");
      }
      setProducts(
        (Array.isArray(payload.data?.products) ? payload.data.products : []).map((p) => ({
          ...p,
          sku: p.sku || "",
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load 3D prices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.sku || "").toLowerCase().includes(q)
    );
  }, [products, filter]);

  const updateField = (id: string, key: keyof ProductPrice, value: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [key]: value } : p))
    );
    setSavedMsg("");
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setSavedMsg("");
    try {
      const response = await fetch("/api/store/admin/3d-prices", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products }),
      });
      const payload = await parseApiJson<{
        success?: boolean;
        message?: string;
        data?: { products?: ProductPrice[] };
      }>(response);
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to save 3D prices");
      }
      setProducts(
        (Array.isArray(payload.data?.products) ? payload.data.products : products).map((p) => ({
          ...p,
          sku: p.sku || "",
        }))
      );
      setSavedMsg(
        "Saved. Buy button on the homepage 3D explorer will open /product/… for the linked SKU."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="p-6 text-sm text-stone-500">Loading 3D prices…</p>;
  }

  return (
    <div className="space-y-5 p-5 md:p-6">
      <div>
        <h3 className="text-base font-semibold text-brand-deepMaroon">
          3D remedies — prices, SKU &amp; buy labels
        </h3>
        <p className="mt-1 text-sm text-stone-600">
          Set the catalog <strong>SKU</strong> (or full product slug) for each 3D model. The Order
          button then opens that product detail page, e.g.{" "}
          <code className="rounded bg-stone-100 px-1 text-[11px]">
            /product/dhan-yog-necklace-attracts-wealth-prosperity-3135-712
          </code>
          .
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

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search by name, SKU, or category…"
          className="w-full max-w-sm rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-maroon/40"
        />
        <p className="text-xs text-stone-500">
          {filtered.length} of {products.length} products
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-stone-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-3 py-2.5 font-semibold">3D model</th>
              <th className="px-3 py-2.5 font-semibold">SKU / product slug</th>
              <th className="px-3 py-2.5 font-semibold">Price</th>
              <th className="px-3 py-2.5 font-semibold">MRP</th>
              <th className="px-3 py-2.5 font-semibold">Offer</th>
              <th className="px-3 py-2.5 font-semibold">Buy button</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-stone-100 align-top">
                <td className="px-3 py-2.5">
                  <p className="font-medium text-stone-800">{p.title || p.name}</p>
                  <p className="mt-0.5 text-[11px] text-stone-500">
                    {p.category || "—"} · {p.id}
                  </p>
                </td>
                <td className="px-3 py-2.5">
                  <input
                    type="text"
                    value={p.sku || ""}
                    onChange={(e) => updateField(p.id, "sku", e.target.value)}
                    className="min-w-[11rem] w-full rounded-lg border border-stone-200 px-2 py-1.5 font-mono text-sm outline-none focus:border-brand-maroon/40"
                    placeholder="GM_DYN_770"
                  />
                </td>
                <td className="px-3 py-2.5">
                  <input
                    type="text"
                    value={p.price}
                    onChange={(e) => updateField(p.id, "price", e.target.value)}
                    className="w-[7.5rem] rounded-lg border border-stone-200 px-2 py-1.5 text-sm outline-none focus:border-brand-maroon/40"
                    placeholder="₹2,499"
                  />
                </td>
                <td className="px-3 py-2.5">
                  <input
                    type="text"
                    value={p.originalPrice}
                    onChange={(e) => updateField(p.id, "originalPrice", e.target.value)}
                    className="w-[7.5rem] rounded-lg border border-stone-200 px-2 py-1.5 text-sm outline-none focus:border-brand-maroon/40"
                    placeholder="₹4,999"
                  />
                </td>
                <td className="px-3 py-2.5">
                  <input
                    type="text"
                    value={p.offer}
                    onChange={(e) => updateField(p.id, "offer", e.target.value)}
                    className="w-[6.5rem] rounded-lg border border-stone-200 px-2 py-1.5 text-sm outline-none focus:border-brand-maroon/40"
                    placeholder="50% off"
                  />
                </td>
                <td className="px-3 py-2.5">
                  <input
                    type="text"
                    value={p.buyLabel}
                    onChange={(e) => updateField(p.id, "buyLabel", e.target.value)}
                    className="min-w-[12rem] w-full rounded-lg border border-stone-200 px-2 py-1.5 text-sm outline-none focus:border-brand-maroon/40"
                    placeholder="Order Energized Bracelet"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={() => void save()}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-xl bg-brand-maroon px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-deepMaroon disabled:opacity-60"
      >
        <Save className="h-4 w-4" />
        {saving ? "Saving…" : "Save 3D prices"}
      </button>
    </div>
  );
}
