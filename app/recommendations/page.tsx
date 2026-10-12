"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Search,
  Gem,
  CircleDot,
  Flower2,
  BookOpenText,
  Loader2,
  RefreshCw,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";

type RemedyCategory = "rudraksha" | "stone" | "crystal" | "switchword";

interface RemedyItem {
  _id: string;
  category: RemedyCategory;
  name: string;
  problems?: string[];
  benefits?: string[];
  description?: string;
  howToUse?: string;
  meta?: Record<string, unknown>;
  score?: number;
  matchedTerms?: string[];
  source?: string;
}

interface RecommendationPayload {
  problem: string;
  tokens: string[];
  totalMatches: number;
  message?: string;
  recommendations: {
    rudraksha: RemedyItem[];
    stones: RemedyItem[];
    crystals: RemedyItem[];
    switchwords: RemedyItem[];
  };
}

const SUGGESTIONS = [
  "Money flow and wealth blockages",
  "Anxiety, stress and poor sleep",
  "Marriage delay and relationship issues",
  "Court case and legal obstacles",
  "Thyroid and respiratory problems",
  "Lack of focus in studies and exams",
];

const CATEGORY_META = {
  rudraksha: {
    label: "Rudraksha",
    icon: Flower2,
    accent: "from-amber-700 to-yellow-600",
    chip: "bg-amber-50 text-amber-900 border-amber-200",
    empty: "No rudraksha matched this concern yet.",
  },
  stones: {
    label: "Stones",
    icon: CircleDot,
    accent: "from-stone-700 to-stone-500",
    chip: "bg-stone-50 text-stone-800 border-stone-200",
    empty: "No stones matched this concern yet.",
  },
  crystals: {
    label: "Crystals",
    icon: Gem,
    accent: "from-violet-600 to-fuchsia-500",
    chip: "bg-violet-50 text-violet-900 border-violet-200",
    empty: "No crystals matched this concern yet.",
  },
  switchwords: {
    label: "Vedic Switch Words",
    icon: BookOpenText,
    accent: "from-emerald-700 to-teal-500",
    chip: "bg-emerald-50 text-emerald-900 border-emerald-200",
    empty: "No switch words matched this concern yet.",
  },
} as const;

function cleanDisplay(value: unknown) {
  return String(value || "")
    .replace(/^[\s➢❖•:\-–—]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function looksLikeProblemTitle(value: string) {
  return /^(for|to|while|reduce|protect|looking|positive|make|name|heal|recover|remove|sell|normal)\b/i.test(
    value.trim()
  );
}

function getWriteText(item: RemedyItem) {
  const meta = item.meta || {};
  const candidates = [
    cleanDisplay(meta.writeText),
    cleanDisplay(meta.mantraOrScript),
    cleanDisplay(String(item.howToUse || "").match(/Write\s*\/\s*chant this Vedic switch word:\s*"([^"]+)"/i)?.[1]),
    cleanDisplay(String(item.description || "").match(/Write\/chant:\s*([^.\n]+)/i)?.[1]),
    cleanDisplay(String(item.description || "").match(/^([अ-हA-Za-z][अ-हA-Za-z0-9\s''-]{0,60}?)\s*➢\s*LORD/i)?.[1]),
    cleanDisplay(String(item.description || "").match(/\b([अ-ह]{1,30}|[A-Z]{2,30})\b/)?.[1]),
    cleanDisplay(item.name),
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (!looksLikeProblemTitle(candidate) && !/LORD|ISSUES|COLOUR|PEN/i.test(candidate)) {
      return candidate;
    }
  }
  return candidates[0] || "";
}

function metaLine(item: RemedyItem) {
  const meta = item.meta || {};
  if (item.category === "switchword") {
    const parts = [
      cleanDisplay(meta.lord) ? `Lord: ${cleanDisplay(meta.lord)}` : null,
      cleanDisplay(meta.penColor) ? `Pen: ${cleanDisplay(meta.penColor)}` : null,
    ].filter(Boolean);
    return parts.join(" · ");
  }

  const parts = [
    meta.rulingGod,
    meta.chakra,
    meta.rulingPlanet,
    meta.beejaMantra,
    meta.lord,
    meta.penColor ? `Pen: ${cleanDisplay(meta.penColor)}` : null,
  ]
    .filter(Boolean)
    .map(String);
  return parts.slice(0, 3).join(" · ");
}

function RemedyCard({ item, tone }: { item: RemedyItem; tone: string }) {
  const isSwitch = item.category === "switchword";
  const writeText = getWriteText(item);
  const purpose =
    cleanDisplay(item.meta?.purpose) ||
    (isSwitch ? "" : "") ||
    (item.problems || []).find((p) => p && !/^etc$/i.test(p)) ||
    "";
  const penColor = cleanDisplay(item.meta?.penColor);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/60 bg-white/80 p-4 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-gray-900 break-words">
            {isSwitch ? writeText || item.name : item.name}
          </h3>
          <p className="mt-1 text-xs text-gray-500">{metaLine(item)}</p>
        </div>
        {typeof item.score === "number" && (
          <span className={cn("shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium", tone)}>
            Match {item.score}
          </span>
        )}
      </div>

      {isSwitch ? (
        <div className="mb-3 rounded-xl border-2 border-[#0B513C]/25 bg-gradient-to-br from-emerald-50 to-[#FFF8EE] px-4 py-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#0B513C]">
            What to write / read / chant
          </p>
          <p className="mt-2 break-words font-serif text-2xl font-semibold leading-snug text-[#0B513C]">
            {writeText || "Switch word missing — re-sync PDF data"}
          </p>
          {penColor && (
            <p className="mt-2 text-sm text-[#1F2A24]">
              Pen colour: <span className="font-semibold">{penColor}</span>
            </p>
          )}
          <p className="mt-2 text-xs leading-relaxed text-[#3C3250]">
            Write this on paper / body / wall, or chant it, or use water therapy.
          </p>
        </div>
      ) : (
        item.description && (
          <p className="mb-3 line-clamp-3 text-sm leading-relaxed text-gray-600">{item.description}</p>
        )
      )}

      {isSwitch && purpose && (
        <p className="mb-3 text-sm text-gray-600">
          <span className="font-medium text-gray-800">Helps with: </span>
          {purpose}
        </p>
      )}

      {(item.matchedTerms?.length || item.problems?.length) && (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {(item.matchedTerms?.length ? item.matchedTerms : item.problems?.slice(0, 5) || []).map(
            (tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#0B513C]/10 px-2 py-0.5 text-[11px] font-medium text-[#0B513C]"
              >
                {tag}
              </span>
            )
          )}
        </div>
      )}

      {item.howToUse && (
        <p className="rounded-xl bg-[#FFF4E0]/70 px-3 py-2 text-xs leading-relaxed text-[#3C3250]">
          <span className="font-semibold">How to use: </span>
          {item.howToUse}
        </p>
      )}
    </motion.article>
  );
}

export default function RecommendationsPage() {
  const [problem, setProblem] = useState("");
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<{ total: number; byCategory: Record<string, number> } | null>(
    null
  );
  const [result, setResult] = useState<RecommendationPayload | null>(null);
  const [activeTab, setActiveTab] = useState<keyof typeof CATEGORY_META>("rudraksha");

  const loadStats = async () => {
    try {
      const response = await fetch("/api/remedies/stats");
      const payload = await response.json();
      if (payload?.success) setStats(payload.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const sections = useMemo(() => {
    if (!result) return [];
    return [
      { key: "rudraksha" as const, items: result.recommendations.rudraksha },
      { key: "stones" as const, items: result.recommendations.stones },
      { key: "crystals" as const, items: result.recommendations.crystals },
      { key: "switchwords" as const, items: result.recommendations.switchwords },
    ];
  }, [result]);

  const handleRecommend = async (value?: string) => {
    const query = (value ?? problem).trim();
    if (!query) {
      setError("Please write the problem first.");
      return;
    }
    setProblem(query);
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/remedies/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem: query }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Recommendation failed");
      }
      setResult(payload.data);
      const firstWithItems = (
        [
          ["rudraksha", payload.data.recommendations.rudraksha],
          ["stones", payload.data.recommendations.stones],
          ["crystals", payload.data.recommendations.crystals],
          ["switchwords", payload.data.recommendations.switchwords],
        ] as const
      ).find(([, items]) => items.length > 0);
      if (firstWithItems) setActiveTab(firstWithItems[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    setError("");
    try {
      const response = await fetch("/api/remedies/seed", { method: "POST" });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Seed failed");
      }
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Seed failed");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="relative min-h-[calc(100vh-8rem)] overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,#0B513C22,transparent_35%),radial-gradient(circle_at_top_right,#D25E6833,transparent_30%),linear-gradient(180deg,#FFF8EE_0%,#F7F1E6_45%,#F3EEE4_100%)]" />
        <div className="pointer-events-none absolute -right-16 top-24 h-64 w-64 rounded-full bg-[#0B513C]/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-10 h-56 w-56 rounded-full bg-[#D4AF37]/20 blur-3xl" />

        <div className="relative space-y-8 p-6 md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#0B513C]/15 bg-white/70 px-3 py-1 text-xs font-medium text-[#0B513C] backdrop-blur">
                <Sparkles className="h-3.5 w-3.5" />
                Remedy Intelligence
              </div>
              <h1 className="font-serif text-4xl font-semibold tracking-tight text-[#1F2A24] md:text-5xl">
                Problem → Sacred Recommendations
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#4A554E]">
                Write the client&apos;s concern once. Instantly get matching Rudraksha, stones,
                crystals, and Vedic switch words from your imported knowledge base.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {[
                ["Rudraksha", stats?.byCategory?.rudraksha || 0],
                ["Stones", stats?.byCategory?.stone || 0],
                ["Crystals", stats?.byCategory?.crystal || 0],
                ["Switch Words", stats?.byCategory?.switchword || 0],
              ].map(([label, count]) => (
                <div
                  key={label as string}
                  className="min-w-[120px] rounded-2xl border border-white/70 bg-white/75 px-4 py-3 shadow-sm backdrop-blur"
                >
                  <p className="text-xs uppercase tracking-wide text-gray-500">{label as string}</p>
                  <p className="mt-1 text-2xl font-semibold text-[#0B513C]">{count as number}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-[28px] border border-white/80 bg-white/75 p-5 shadow-[0_20px_60px_rgba(11,81,60,0.08)] backdrop-blur md:p-7">
              <label className="mb-3 block text-sm font-medium text-[#1F2A24]">
                Describe the problem
              </label>
              <textarea
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                rows={6}
                placeholder="Example: Client has money blockage, anxiety, and delayed marriage..."
                className="w-full resize-none rounded-2xl border border-[#0B513C]/15 bg-[#FFFCF7] px-4 py-3 text-base text-gray-800 outline-none ring-[#0B513C]/20 transition focus:ring-2"
              />

              <div className="mt-4 flex flex-wrap gap-2">
                {SUGGESTIONS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleRecommend(item)}
                    className="rounded-full border border-[#0B513C]/15 bg-white px-3 py-1.5 text-xs text-[#0B513C] transition hover:bg-[#0B513C] hover:text-white"
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleRecommend()}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#0B513C] to-[#147A5A] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0B513C]/25 transition hover:brightness-110 disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                  Get Recommendations
                </button>
                <button
                  type="button"
                  onClick={handleSeed}
                  disabled={seeding}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[#0B513C]/20 bg-white px-5 py-3 text-sm font-medium text-[#0B513C] transition hover:bg-[#FFF4E0] disabled:opacity-60"
                >
                  {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Sync PDF Data to MongoDB
                </button>
              </div>

              {error && (
                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}
            </section>

            <section className="rounded-[28px] border border-white/80 bg-gradient-to-br from-[#0B513C] to-[#16382C] p-6 text-white shadow-[0_20px_60px_rgba(11,81,60,0.18)]">
              <div className="mb-4 flex items-center gap-2 text-sm text-white/70">
                <Search className="h-4 w-4" />
                How it works
              </div>
              <ol className="space-y-4 text-sm leading-relaxed text-white/90">
                <li>
                  <span className="font-semibold text-[#F4E4BC]">1.</span> Knowledge from your
                  `alldata` PDFs is stored in MongoDB (Rudraksha, crystals/stones, switch words).
                </li>
                <li>
                  <span className="font-semibold text-[#F4E4BC]">2.</span> The problem text is matched
                  against symptoms, benefits, mantras, and keywords.
                </li>
                <li>
                  <span className="font-semibold text-[#F4E4BC]">3.</span> Results appear in four
                  clear groups so consultants can guide clients quickly.
                </li>
              </ol>
              <div className="mt-6 rounded-2xl bg-white/10 p-4 text-sm text-white/85">
                Database total:{" "}
                <span className="text-lg font-semibold text-[#F4E4BC]">{stats?.total ?? 0}</span>{" "}
                remedies
              </div>
            </section>
          </div>

          <AnimatePresence mode="wait">
            {result && (
              <motion.section
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-[#1F2A24]">Suggested remedies</h2>
                    <p className="text-sm text-gray-600">
                      {result.totalMatches} matches for “{result.problem}”
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sections.map(({ key, items }) => {
                      const meta = CATEGORY_META[key];
                      const Icon = meta.icon;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setActiveTab(key)}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition",
                            activeTab === key
                              ? "border-transparent bg-[#0B513C] text-white"
                              : "border-[#0B513C]/15 bg-white/80 text-[#0B513C] hover:bg-white"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {meta.label}
                          <span className="rounded-full bg-black/10 px-2 py-0.5 text-xs">
                            {items.length}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {result.message && (
                  <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    {result.message}
                  </p>
                )}

                {sections.map(({ key, items }) => {
                  if (key !== activeTab) return null;
                  const meta = CATEGORY_META[key];
                  return (
                    <div key={key} className="space-y-4">
                      <div
                        className={cn(
                          "inline-flex items-center gap-2 rounded-full bg-gradient-to-r px-4 py-1.5 text-sm font-medium text-white",
                          meta.accent
                        )}
                      >
                        {meta.label}
                      </div>
                      {items.length ? (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                          {items.map((item) => (
                            <RemedyCard key={item._id} item={item} tone={meta.chip} />
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-gray-300 bg-white/60 px-6 py-10 text-center text-sm text-gray-500">
                          {meta.empty}
                        </div>
                      )}
                    </div>
                  );
                })}
              </motion.section>
            )}
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
}
