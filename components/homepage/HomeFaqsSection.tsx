"use client";

import { useEffect, useState } from "react";
import { HelpCircle, Plus, Trash2 } from "lucide-react";
import { parseApiJson } from "@/lib/parseApiJson";

type Faq = { question: string; answer: string };

export function HomeFaqsSection() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch("/api/store/admin/faqs");
        const payload = await parseApiJson(response);
        if (!response.ok || !payload?.success) {
          throw new Error(payload?.message || "Failed to load FAQs");
        }
        if (!cancelled) setFaqs(payload.data || []);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load FAQs");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const update = (index: number, field: keyof Faq, value: string) => {
    setFaqs((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
    setSaved("");
  };

  const save = async (next = faqs) => {
    const clean = next
      .map((item) => ({ question: item.question.trim(), answer: item.answer.trim() }))
      .filter((item) => item.question && item.answer);
    if (!clean.length) {
      setError("Each FAQ needs a question and an answer");
      return;
    }
    setSaving(true);
    setError("");
    setSaved("");
    try {
      const response = await fetch("/api/store/admin/faqs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faqs: clean }),
      });
      const payload = await parseApiJson(response);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to save FAQs");
      }
      setFaqs(payload.data || clean);
      setSaved("FAQs updated on the homepage");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save FAQs");
    } finally {
      setSaving(false);
    }
  };

  const deleteFaq = async (index: number) => {
    const qTitle = faqs[index]?.question?.trim() || `Q${index + 1}`;
    const ok = window.confirm(`Delete question "${qTitle}"?`);
    if (!ok) return;
    const next = faqs.filter((_, i) => i !== index);
    setFaqs(next);
    setSaving(true);
    setError("");
    setSaved("");
    try {
      const response = await fetch(`/api/store/admin/faqs/${index}`, {
        method: "DELETE",
      });
      const payload = await parseApiJson(response);
      if (!response.ok || !payload?.success) {
        await save(next);
        return;
      }
      setFaqs(payload.data || next);
      setSaved(`Question deleted successfully`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete FAQ");
    } finally {
      setSaving(false);
    }
  };

  const clearAllFaqs = async () => {
    if (!faqs.length) return;
    const ok = window.confirm("Are you sure you want to delete ALL FAQs from the homepage?");
    if (!ok) return;
    setSaving(true);
    setError("");
    setSaved("");
    try {
      const response = await fetch("/api/store/admin/faqs", { method: "DELETE" });
      const payload = await parseApiJson(response);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to clear FAQs");
      }
      setFaqs([]);
      setSaved("All FAQs removed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear FAQs");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand-maroon/20 bg-white/80 px-3 py-1 text-xs font-medium text-brand-maroon">
            <HelpCircle className="h-3.5 w-3.5" />
            Homepage
          </div>
          <h2 className="font-serif text-3xl font-semibold text-brand-deepMaroon">FAQs</h2>
          <p className="mt-2 max-w-2xl text-sm text-stone-600">
            These questions appear at the bottom of the store homepage, in this order. Q1 is the first row.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {faqs.length > 0 ? (
            <button
              type="button"
              onClick={clearAllFaqs}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Delete all FAQs
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setFaqs((prev) => [...prev, { question: "", answer: "" }])}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-maroon to-brand-deepMaroon px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-maroon/20"
          >
            <Plus className="h-4 w-4" />
            Add question
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>
      ) : null}
      {saved ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{saved}</p>
      ) : null}

      {loading ? (
        <p className="text-sm text-stone-500">Loading FAQs…</p>
      ) : (
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <article key={index} className="rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-brand-maroon">Q{index + 1}</p>
                <button
                  type="button"
                  onClick={() => deleteFaq(index)}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-700 transition hover:border-rose-400 hover:bg-rose-100 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete FAQ
                </button>
              </div>
              <label className="block text-sm text-stone-700">
                Question
                <input
                  value={faq.question}
                  onChange={(event) => update(index, "question", event.target.value)}
                  className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
                />
              </label>
              <label className="mt-3 block text-sm text-stone-700">
                Answer
                <textarea
                  value={faq.answer}
                  onChange={(event) => update(index, "answer", event.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-stone-200 px-3 py-2"
                />
              </label>
            </article>
          ))}
          {!faqs.length ? (
            <p className="rounded-[24px] border border-dashed border-stone-300 bg-white/70 px-4 py-8 text-center text-sm text-stone-500">
              No FAQs yet. Click &ldquo;Add question&rdquo; above to create one.
            </p>
          ) : null}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => save()}
              disabled={saving}
              className="rounded-xl bg-brand-maroon px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save FAQs"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
