"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import PPTBuilder from "@/components/PPTBuilder";
import { downloadSolutionPPT, type ExportPPTData } from "@/lib/pptExport";
import { motion } from "framer-motion";
import {
  Presentation,
  Search,
  Plus,
  FileText,
  Download,
  Sparkles,
  UserRound,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QueryItem {
  id: string;
  clientName: string;
  queryType: string;
  date: string;
  status: string;
  clientEmail?: string;
  solution?: {
    status: "draft" | "completed";
    createdAt: string;
    updatedAt: string;
  };
}

export default function PPTBuilderPage() {
  const [queries, setQueries] = useState<QueryItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedQuery, setSelectedQuery] = useState<QueryItem | null>(null);
  const [initialData, setInitialData] = useState<ExportPPTData | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [message, setMessage] = useState("");
  const [newClient, setNewClient] = useState({
    clientName: "",
    clientEmail: "",
    queryType: "Astrology",
    date: new Date().toISOString().split("T")[0],
  });

  const loadQueries = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/queries");
      const payload = await response.json();
      if (payload?.data) setQueries(payload.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueries();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return queries;
    return queries.filter(
      (item) =>
        item.id.toLowerCase().includes(q) ||
        item.clientName.toLowerCase().includes(q) ||
        item.queryType.toLowerCase().includes(q) ||
        (item.clientEmail || "").toLowerCase().includes(q)
    );
  }, [queries, search]);

  const openBuilder = async (query: QueryItem) => {
    setMessage("");
    setSelectedQuery(query);
    setInitialData(null);
    try {
      const response = await fetch(`/api/queries/${query.id}/solution`);
      if (response.ok) {
        const payload = await response.json();
        if (payload?.data) setInitialData(payload.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const createAndOpen = async () => {
    if (!newClient.clientName.trim()) {
      setMessage("Client name is required to start a PPT.");
      return;
    }
    setCreating(true);
    setMessage("");
    try {
      const response = await fetch("/api/queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: newClient.clientName.trim(),
          clientEmail: newClient.clientEmail.trim(),
          queryType: newClient.queryType,
          date: newClient.date,
          status: "pending",
          assignedTo: "Admin",
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.data) {
        throw new Error(payload?.message || "Failed to create query");
      }
      await loadQueries();
      setShowNewForm(false);
      setNewClient({
        clientName: "",
        clientEmail: "",
        queryType: "Astrology",
        date: new Date().toISOString().split("T")[0],
      });
      await openBuilder(payload.data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create PPT session");
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async (data: ExportPPTData, status: "draft" | "completed") => {
    if (!selectedQuery) return;
    try {
      const response = await fetch(`/api/queries/${selectedQuery.id}/solution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pptData: data, status }),
      });
      if (!response.ok) throw new Error("Save failed");
      setMessage(status === "completed" ? "PPT saved and marked completed." : "Draft saved successfully.");
      await loadQueries();
      if (status === "completed") {
        setSelectedQuery(null);
        setInitialData(null);
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to save PPT right now.");
    }
  };

  const quickDownload = async (query: QueryItem) => {
    try {
      await downloadSolutionPPT(query.id);
    } catch {
      setMessage("No saved solution found for download. Open the builder and save first.");
    }
  };

  return (
    <DashboardLayout>
      <div className="relative min-h-[calc(100vh-8rem)] overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,#0B513C18,transparent_34%),radial-gradient(circle_at_top_right,#9370DB22,transparent_28%),linear-gradient(180deg,#FFF8EE_0%,#F7F3EC_50%,#F4EEE6_100%)]" />

        <div className="relative space-y-6 p-6 md:p-8">
          {!selectedQuery ? (
            <>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#0B513C]/15 bg-white/80 px-3 py-1 text-xs font-medium text-[#0B513C]">
                    <Presentation className="h-3.5 w-3.5" />
                    PPT Solution Studio
                  </div>
                  <h1 className="font-serif text-4xl font-semibold tracking-tight text-[#1F2A24] md:text-5xl">
                    Create Tathasstu Solution PPT
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#4A554E] md:text-base">
                    Pick an existing client query or start a new session. Fill Profile → Scanner → Kundli →
                    Predictions, then download the branded 11-slide PPT.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewForm((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#0B513C] to-[#147A5A] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#0B513C]/25"
                >
                  <Plus className="h-4 w-4" />
                  New PPT Session
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {[
                  ["1", "Choose client", "Select a query or create a new one"],
                  ["2", "Fill 7 steps", "Profile, scanner, kundli, predictions, upay"],
                  ["3", "Download PPT", "Same branded template as original solutions"],
                ].map(([step, title, desc]) => (
                  <div key={step} className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur">
                    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#0B513C] text-sm font-semibold text-white">
                      {step}
                    </div>
                    <p className="font-semibold text-[#1F2A24]">{title}</p>
                    <p className="mt-1 text-sm text-stone-600">{desc}</p>
                  </div>
                ))}
              </div>

              {showNewForm && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-[24px] border border-[#0B513C]/10 bg-white/90 p-5 shadow-sm"
                >
                  <div className="mb-4 flex items-center gap-2 text-[#0B513C]">
                    <UserRound className="h-5 w-5" />
                    <h2 className="font-serif text-xl font-semibold">Start with a new client</h2>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <input
                      value={newClient.clientName}
                      onChange={(e) => setNewClient((prev) => ({ ...prev, clientName: e.target.value }))}
                      placeholder="Client name *"
                      className="rounded-xl border border-[#0B513C]/15 bg-[#FFFCF8] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0B513C]/20"
                    />
                    <input
                      value={newClient.clientEmail}
                      onChange={(e) => setNewClient((prev) => ({ ...prev, clientEmail: e.target.value }))}
                      placeholder="Email"
                      className="rounded-xl border border-[#0B513C]/15 bg-[#FFFCF8] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0B513C]/20"
                    />
                    <select
                      value={newClient.queryType}
                      onChange={(e) => setNewClient((prev) => ({ ...prev, queryType: e.target.value }))}
                      className="rounded-xl border border-[#0B513C]/15 bg-[#FFFCF8] px-3 py-2.5 text-sm"
                    >
                      <option>Astrology</option>
                      <option>Numerology</option>
                      <option>Tarot</option>
                      <option>Vastu</option>
                      <option>Palmistry</option>
                    </select>
                    <input
                      type="date"
                      value={newClient.date}
                      onChange={(e) => setNewClient((prev) => ({ ...prev, date: e.target.value }))}
                      className="rounded-xl border border-[#0B513C]/15 bg-[#FFFCF8] px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      disabled={creating}
                      onClick={createAndOpen}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0B513C] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {creating ? "Creating..." : "Create & Open Builder"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              )}

              <div className="rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-sm backdrop-blur">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by query ID, client name, email..."
                    className="w-full rounded-xl border border-[#0B513C]/15 bg-[#FFFCF8] py-2.5 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-[#0B513C]/20"
                  />
                </div>

                {message && (
                  <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    {message}
                  </div>
                )}

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {loading ? (
                    <p className="col-span-full py-10 text-center text-sm text-stone-500">Loading queries...</p>
                  ) : filtered.length === 0 ? (
                    <p className="col-span-full py-10 text-center text-sm text-stone-500">
                      No queries found. Start a new PPT session above.
                    </p>
                  ) : (
                    filtered.map((query) => (
                      <motion.article
                        key={query.id}
                        whileHover={{ y: -2 }}
                        className="rounded-2xl border border-[#0B513C]/10 bg-gradient-to-br from-white to-[#FFF8F0] p-4 shadow-sm"
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-[#0B513C]/70">
                              {query.id}
                            </p>
                            <h3 className="mt-1 text-lg font-semibold text-[#1F2A24]">{query.clientName}</h3>
                            <p className="text-sm text-stone-500">
                              {query.queryType} · {query.date}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "rounded-full px-2.5 py-1 text-[11px] font-medium capitalize",
                              query.solution?.status === "completed"
                                ? "bg-emerald-100 text-emerald-800"
                                : query.solution?.status === "draft"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-stone-100 text-stone-600"
                            )}
                          >
                            {query.solution?.status || "no ppt"}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => openBuilder(query)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0B513C] px-3 py-2 text-xs font-semibold text-white"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            {query.solution ? "Continue PPT" : "Create PPT"}
                          </button>
                          {query.solution && (
                            <button
                              type="button"
                              onClick={() => quickDownload(query)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-[#0B513C]/20 bg-white px-3 py-2 text-xs font-medium text-[#0B513C]"
                            >
                              <Download className="h-3.5 w-3.5" />
                              Download
                            </button>
                          )}
                        </div>
                      </motion.article>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {message && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {message}
                </div>
              )}
              <PPTBuilder
                variant="page"
                query={{
                  id: selectedQuery.id,
                  clientName: selectedQuery.clientName,
                  queryType: selectedQuery.queryType,
                  date: selectedQuery.date,
                  clientEmail: selectedQuery.clientEmail,
                }}
                initialData={initialData}
                onClose={() => {
                  setSelectedQuery(null);
                  setInitialData(null);
                  setMessage("");
                }}
                onSave={handleSave}
              />
              <div className="rounded-2xl border border-[#0B513C]/10 bg-white/80 px-4 py-3 text-sm text-stone-600">
                <FileText className="mr-2 inline h-4 w-4 text-[#0B513C]" />
                Tip: complete all 7 steps, then use <strong>Download PPT</strong> to get the final branded file.
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
