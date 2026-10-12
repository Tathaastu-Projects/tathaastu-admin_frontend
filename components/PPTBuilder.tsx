"use client";

import { useEffect, useState } from "react";
import { X, Save, FileText, XCircle, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { downloadSolutionPPT, type ExportPPTData } from "@/lib/pptExport";
import { cn } from "@/lib/utils";

const DEFAULT_DOSHAS = [
  { label: "Kaal sarp dosh", value: "", note: "" },
  { label: "Mangal Dosh", value: "", note: "" },
  { label: "Pitra Dosh", value: "", note: "" },
  { label: "Bandhan yog", value: "", note: "" },
  { label: "Pishach yog", value: "", note: "" },
  { label: "Tona totka", value: "", note: "" },
  { label: "Nazar dosh", value: "", note: "" },
  { label: "Positivity", value: "", note: "" },
];

const DEFAULT_PLANETS = [
  { name: "Sun", strength: "", remedy: "" },
  { name: "Moon", strength: "", remedy: "" },
  { name: "Mercury", strength: "", remedy: "" },
  { name: "Venus", strength: "", remedy: "" },
  { name: "Jupiter", strength: "", remedy: "" },
  { name: "Saturn", strength: "", remedy: "" },
  { name: "Rahu", strength: "", remedy: "" },
  { name: "Ketu", strength: "", remedy: "" },
  { name: "Mangal", strength: "", remedy: "" },
];

interface PPTBuilderProps {
  query: {
    id: string;
    clientName: string;
    queryType: string;
    date: string;
    clientEmail?: string;
  };
  initialData?: ExportPPTData | null;
  onClose: () => void;
  onSave: (data: ExportPPTData, status: "draft" | "completed") => void;
  variant?: "modal" | "page";
}

const PAGE_LABELS = [
  "Profile",
  "Scanner Reading",
  "Scanner Upay",
  "Kundli Details",
  "Predictions",
  "Kundli Upay",
  "Preview",
];

function createDefaultData(query: PPTBuilderProps["query"], initialData?: ExportPPTData | null): ExportPPTData {
  return {
    clientInfo: initialData?.clientInfo || {
      name: query.clientName,
      email: query.clientEmail || "",
      phone: "",
      dateOfBirth: "",
      placeOfBirth: "",
      timeOfBirth: "",
    },
    queryInfo: initialData?.queryInfo || {
      queryType: query.queryType,
      problems: [],
      date: query.date,
    },
    scannerReading: initialData?.scannerReading || {
      readingDate: query.date,
      doshas: DEFAULT_DOSHAS,
      planets: DEFAULT_PLANETS,
    },
    scannerUpay: initialData?.scannerUpay || "",
    kundli: initialData?.kundli || {
      lagan: "",
      rashi: "",
      dasha: "",
      shaniSadeSatti: "",
      personalityNotes: "",
      rinNotes: "",
    },
    predictions: initialData?.predictions || [],
    kundliUpay: initialData?.kundliUpay || "",
  };
}

export default function PPTBuilder({
  query,
  initialData,
  onClose,
  onSave,
  variant = "modal",
}: PPTBuilderProps) {
  const isPage = variant === "page";
  const [currentPage, setCurrentPage] = useState(1);
  const [newProblem, setNewProblem] = useState("");
  const [newPrediction, setNewPrediction] = useState("");
  const [pptData, setPPTData] = useState<ExportPPTData>(createDefaultData(query, initialData));
  const totalPages = PAGE_LABELS.length;

  useEffect(() => {
    setPPTData(createDefaultData(query, initialData));
    setCurrentPage(1);
    setNewProblem("");
    setNewPrediction("");
  }, [query.id, initialData]);

  const addListItem = (field: "problems" | "predictions", value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (field === "problems") {
      setPPTData({
        ...pptData,
        queryInfo: { ...pptData.queryInfo, problems: [...pptData.queryInfo.problems, trimmed] },
      });
      setNewProblem("");
    } else {
      setPPTData({ ...pptData, predictions: [...pptData.predictions, trimmed] });
      setNewPrediction("");
    }
  };

  const handleSave = async (status: "draft" | "completed") => {
    if (status === "completed" && pptData.queryInfo.problems.length === 0) {
      alert("Please add at least one client problem/issue before marking as completed.");
      return;
    }
    onSave(pptData, status);
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(`/api/queries/${query.id}/solution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pptData, status: "draft" }),
      });
      if (!response.ok) {
        throw new Error("Save failed");
      }
      await downloadSolutionPPT(query.id);
    } catch (error) {
      console.error(error);
      alert("Unable to download PPT right now. Please save first, then try again.");
    }
  };

  const shell = (
    <motion.div
      initial={{ opacity: 0, y: isPage ? 12 : 0, scale: isPage ? 1 : 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={cn(
        "bg-white overflow-hidden flex flex-col",
        isPage
          ? "w-full rounded-[28px] border border-[#0B513C]/10 shadow-[0_24px_80px_rgba(11,81,60,0.12)] min-h-[78vh]"
          : "rounded-xl w-full max-w-5xl max-h-[90vh]"
      )}
    >
      <div
        className={cn(
          "text-white flex justify-between items-center",
          isPage
            ? "bg-gradient-to-r from-[#0B513C] via-[#147A5A] to-[#663399] px-7 py-6"
            : "bg-gradient-to-r from-spiritual-purple to-spiritual-darkPurple p-6"
        )}
      >
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/70 mb-1">Solution Studio</p>
          <h2 className={cn("font-bold", isPage ? "font-serif text-3xl" : "text-2xl")}>
            Tathasstu Solution PPT
          </h2>
          <p className="text-sm text-white/80 mt-1">
            Query: {query.id} — {query.clientName}
          </p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className={cn("px-6 py-4", isPage ? "bg-[#FFF8F0]" : "bg-gray-100")}>
        <div className="flex gap-2 flex-wrap">
          {PAGE_LABELS.map((label, index) => {
            const active = currentPage === index + 1;
            const done = currentPage > index + 1;
            return (
              <button
                key={label}
                onClick={() => setCurrentPage(index + 1)}
                className={cn(
                  "px-3 h-9 rounded-full text-xs font-semibold transition",
                  active && (isPage ? "bg-[#0B513C] text-white shadow-md" : "bg-spiritual-purple text-white"),
                  done && !active && "bg-emerald-500 text-white",
                  !active && !done && (isPage ? "bg-white text-[#0B513C] border border-[#0B513C]/15" : "bg-gray-300 text-gray-600")
                )}
              >
                {index + 1}. {label}
              </button>
            );
          })}
        </div>
        {isPage && (
          <div className="mt-4 h-2 rounded-full bg-white overflow-hidden border border-[#0B513C]/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0B513C] to-[#9370DB] transition-all"
              style={{ width: `${(currentPage / totalPages) * 100}%` }}
            />
          </div>
        )}
      </div>

      <div className={cn("flex-1 overflow-y-auto", isPage ? "p-7 bg-gradient-to-b from-white to-[#FFFCF8]" : "p-6")}>
        <AnimatePresence mode="wait">
          {currentPage === 1 && (
            <FormPage title="Profile" key="p1" isPage={isPage}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Name" value={pptData.clientInfo.name} onChange={(value) => setPPTData({ ...pptData, clientInfo: { ...pptData.clientInfo, name: value } })} isPage={isPage} />
                <Field label="Email" value={pptData.clientInfo.email} onChange={(value) => setPPTData({ ...pptData, clientInfo: { ...pptData.clientInfo, email: value } })} isPage={isPage} />
                <Field label="Phone" value={pptData.clientInfo.phone} onChange={(value) => setPPTData({ ...pptData, clientInfo: { ...pptData.clientInfo, phone: value } })} isPage={isPage} />
                <Field label="Date of Birth" type="date" value={pptData.clientInfo.dateOfBirth} onChange={(value) => setPPTData({ ...pptData, clientInfo: { ...pptData.clientInfo, dateOfBirth: value } })} isPage={isPage} />
                <Field label="Place of Birth" value={pptData.clientInfo.placeOfBirth} onChange={(value) => setPPTData({ ...pptData, clientInfo: { ...pptData.clientInfo, placeOfBirth: value } })} isPage={isPage} />
                <Field label="Time of Birth" type="time" value={pptData.clientInfo.timeOfBirth} onChange={(value) => setPPTData({ ...pptData, clientInfo: { ...pptData.clientInfo, timeOfBirth: value } })} isPage={isPage} />
              </div>
              <ListEditor
                label="Issue / Problems"
                placeholder="Money flow, court cases, blockages..."
                value={newProblem}
                items={pptData.queryInfo.problems}
                onChangeValue={setNewProblem}
                onAdd={() => addListItem("problems", newProblem)}
                onRemove={(index) =>
                  setPPTData({
                    ...pptData,
                    queryInfo: { ...pptData.queryInfo, problems: pptData.queryInfo.problems.filter((_, i) => i !== index) },
                  })
                }
                isPage={isPage}
              />
            </FormPage>
          )}

          {currentPage === 2 && (
            <FormPage title="Scanner Reading" key="p2" isPage={isPage}>
              <Field
                label="Reading Date"
                type="date"
                value={pptData.scannerReading.readingDate}
                onChange={(value) => setPPTData({ ...pptData, scannerReading: { ...pptData.scannerReading, readingDate: value } })}
                isPage={isPage}
              />
              <h4 className="font-semibold text-gray-800">Doshas / Yog</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pptData.scannerReading.doshas.map((dosha, index) => (
                  <div key={dosha.label} className={cn("border rounded-xl p-3 space-y-2", isPage && "bg-[#FFF8F0] border-[#0B513C]/10")}>
                    <p className="text-sm font-medium text-gray-700">{dosha.label}</p>
                    <select
                      value={dosha.value}
                      onChange={(e) => {
                        const doshas = [...pptData.scannerReading.doshas];
                        doshas[index] = { ...dosha, value: e.target.value };
                        setPPTData({ ...pptData, scannerReading: { ...pptData.scannerReading, doshas } });
                      }}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                    <input
                      value={dosha.note || ""}
                      onChange={(e) => {
                        const doshas = [...pptData.scannerReading.doshas];
                        doshas[index] = { ...dosha, note: e.target.value };
                        setPPTData({ ...pptData, scannerReading: { ...pptData.scannerReading, doshas } });
                      }}
                      placeholder="Note, e.g. but no upay needed"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                ))}
              </div>
              <h4 className="font-semibold text-gray-800 pt-2">Planet Strength & Remedy</h4>
              <div className="space-y-2">
                {pptData.scannerReading.planets.map((planet, index) => (
                  <div key={planet.name} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div className={cn("px-3 py-2 border rounded-lg text-sm font-medium", isPage ? "bg-[#0B513C]/5 border-[#0B513C]/10" : "bg-gray-50")}>
                      {planet.name}
                    </div>
                    <input
                      value={planet.strength}
                      onChange={(e) => {
                        const planets = [...pptData.scannerReading.planets];
                        planets[index] = { ...planet, strength: e.target.value };
                        setPPTData({ ...pptData, scannerReading: { ...pptData.scannerReading, planets } });
                      }}
                      placeholder="100%"
                      className="px-3 py-2 border rounded-lg text-sm"
                    />
                    <input
                      value={planet.remedy}
                      onChange={(e) => {
                        const planets = [...pptData.scannerReading.planets];
                        planets[index] = { ...planet, remedy: e.target.value };
                        setPPTData({ ...pptData, scannerReading: { ...pptData.scannerReading, planets } });
                      }}
                      placeholder="Remedy / upay"
                      className="px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                ))}
              </div>
            </FormPage>
          )}

          {currentPage === 3 && (
            <FormPage title="Upay as per scanner" key="p3" isPage={isPage}>
              <textarea
                value={pptData.scannerUpay}
                onChange={(e) => setPPTData({ ...pptData, scannerUpay: e.target.value })}
                rows={14}
                className={cn("w-full px-4 py-3 border rounded-xl outline-none", isPage && "bg-[#FFFCF8] border-[#0B513C]/15 focus:ring-2 focus:ring-[#0B513C]/20")}
                placeholder={"Write each upay on a new line, e.g.\n3 Male clothes – Brahmin\nSalt bathing – 7 days\nCourt Cases - Maa Bagla Mukhi hawan"}
              />
            </FormPage>
          )}

          {currentPage === 4 && (
            <FormPage title="Kundli Details" key="p4" isPage={isPage}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Lagan" value={pptData.kundli.lagan} onChange={(value) => setPPTData({ ...pptData, kundli: { ...pptData.kundli, lagan: value } })} placeholder="Mithun" isPage={isPage} />
                <Field label="Rashi" value={pptData.kundli.rashi} onChange={(value) => setPPTData({ ...pptData, kundli: { ...pptData.kundli, rashi: value } })} placeholder="Meen" isPage={isPage} />
                <Field label="Dasha" value={pptData.kundli.dasha} onChange={(value) => setPPTData({ ...pptData, kundli: { ...pptData.kundli, dasha: value } })} placeholder="Venus" isPage={isPage} />
                <Field label="Shani ki sade Satti" value={pptData.kundli.shaniSadeSatti} onChange={(value) => setPPTData({ ...pptData, kundli: { ...pptData.kundli, shaniSadeSatti: value } })} placeholder="till Feb 2028" isPage={isPage} />
              </div>
              <label className="block text-sm font-medium text-gray-700">Personality / Kundli notes</label>
              <textarea value={pptData.kundli.personalityNotes} onChange={(e) => setPPTData({ ...pptData, kundli: { ...pptData.kundli, personalityNotes: e.target.value } })} rows={5} className="w-full px-4 py-2 border rounded-xl" />
              <label className="block text-sm font-medium text-gray-700">Rin details</label>
              <textarea value={pptData.kundli.rinNotes} onChange={(e) => setPPTData({ ...pptData, kundli: { ...pptData.kundli, rinNotes: e.target.value } })} rows={4} className="w-full px-4 py-2 border rounded-xl" />
            </FormPage>
          )}

          {currentPage === 5 && (
            <FormPage title="Predictions" key="p5" isPage={isPage}>
              <ListEditor
                label="Add prediction points"
                placeholder="Will have lot of secrets within his heart."
                value={newPrediction}
                items={pptData.predictions}
                onChangeValue={setNewPrediction}
                onAdd={() => addListItem("predictions", newPrediction)}
                onRemove={(index) => setPPTData({ ...pptData, predictions: pptData.predictions.filter((_, i) => i !== index) })}
                isPage={isPage}
              />
            </FormPage>
          )}

          {currentPage === 6 && (
            <FormPage title="Upay as per Kundli" key="p6" isPage={isPage}>
              <textarea
                value={pptData.kundliUpay}
                onChange={(e) => setPPTData({ ...pptData, kundliUpay: e.target.value })}
                rows={14}
                className={cn("w-full px-4 py-3 border rounded-xl outline-none", isPage && "bg-[#FFFCF8] border-[#0B513C]/15 focus:ring-2 focus:ring-[#0B513C]/20")}
                placeholder={"Write each kundli upay on a new line, e.g.\nUjjain Mangal Nath mandir mein mangal shanti pooja karein.\nHanuman ji ki pooja karein."}
              />
            </FormPage>
          )}

          {currentPage === 7 && (
            <FormPage title="PPT Preview" key="p7" isPage={isPage}>
              <p className="text-sm text-gray-600">
                Generated PPT will follow the Tathasstu 11-slide template: cover, about, profile, scanner reading, scanner upay, lagan kundli, kundli prediction, predictions, kundli upay, and thanks.
              </p>
              <PreviewBlock title="Profile" lines={[pptData.clientInfo.name, pptData.clientInfo.dateOfBirth, pptData.clientInfo.placeOfBirth, pptData.clientInfo.timeOfBirth, pptData.queryInfo.problems.join(", ")]} />
              <PreviewBlock title="Predictions" lines={pptData.predictions} />
              <PreviewBlock title="Scanner Upay" lines={pptData.scannerUpay.split("\n")} />
              <PreviewBlock title="Kundli Upay" lines={pptData.kundliUpay.split("\n")} />
            </FormPage>
          )}
        </AnimatePresence>
      </div>

      <div className={cn("px-6 py-4 flex flex-col gap-3 md:flex-row md:justify-between md:items-center border-t", isPage ? "bg-[#FFF8F0]" : "bg-gray-100")}>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => handleSave("draft")} className="px-4 py-2.5 bg-white border border-stone-200 text-gray-700 rounded-xl font-medium hover:bg-stone-50 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Save Draft
          </button>
          <button onClick={() => handleSave("completed")} className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-semibold flex items-center gap-2 shadow-md shadow-emerald-500/20">
            <Save className="w-4 h-4" />
            Save & Send
          </button>
          <button onClick={handleDownload} className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-semibold flex items-center gap-2">
            <Download className="w-4 h-4" />
            Download PPT
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="px-4 py-2.5 border rounded-xl disabled:opacity-50 flex items-center gap-2 bg-white">
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <button
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
            className={cn(
              "px-4 py-2.5 text-white rounded-xl disabled:opacity-50 flex items-center gap-2",
              isPage ? "bg-gradient-to-r from-[#0B513C] to-[#147A5A]" : "bg-gradient-to-r from-spiritual-purple to-spiritual-darkPurple"
            )}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="px-4 py-2.5 border border-red-300 text-red-600 rounded-xl flex items-center gap-2 bg-white">
            <XCircle className="w-4 h-4" />
            {isPage ? "Back" : "Close"}
          </button>
        </div>
      </div>
    </motion.div>
  );

  if (isPage) return shell;
  return <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">{shell}</div>;
}

function FormPage({ title, children, isPage }: { title: string; children: React.ReactNode; isPage?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
      <h3 className={cn("font-semibold text-gray-800", isPage ? "font-serif text-2xl text-[#0B513C]" : "text-xl")}>{title}</h3>
      {children}
    </motion.div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  isPage,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  isPage?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full px-4 py-2.5 border rounded-xl outline-none",
          isPage ? "bg-[#FFFCF8] border-[#0B513C]/15 focus:ring-2 focus:ring-[#0B513C]/25" : "focus:ring-2 focus:ring-spiritual-purple"
        )}
      />
    </div>
  );
}

function ListEditor({
  label,
  placeholder,
  value,
  items,
  onChangeValue,
  onAdd,
  onRemove,
  isPage,
}: {
  label: string;
  placeholder: string;
  value: string;
  items: string[];
  onChangeValue: (value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  isPage?: boolean;
}) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={(e) => onChangeValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onAdd()}
          placeholder={placeholder}
          className={cn(
            "flex-1 px-4 py-2.5 border rounded-xl outline-none",
            isPage ? "bg-[#FFFCF8] border-[#0B513C]/15 focus:ring-2 focus:ring-[#0B513C]/25" : "focus:ring-2 focus:ring-spiritual-purple"
          )}
        />
        <button
          type="button"
          onClick={onAdd}
          className={cn("px-4 py-2.5 rounded-xl text-white font-medium", isPage ? "bg-[#0B513C]" : "bg-spiritual-purple")}
        >
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.length === 0 ? (
          <p className="text-sm text-gray-400">Nothing added yet.</p>
        ) : (
          items.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm",
                isPage ? "bg-[#0B513C]/10 text-[#0B513C]" : "bg-purple-100 text-purple-800"
              )}
            >
              {item}
              <button type="button" onClick={() => onRemove(index)} className="text-xs opacity-70 hover:opacity-100">
                ×
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  );
}

function PreviewBlock({ title, lines }: { title: string; lines: string[] }) {
  const cleaned = lines.map((line) => String(line || "").trim()).filter(Boolean);
  return (
    <div className="rounded-2xl border border-[#0B513C]/10 bg-[#FFF8F0] p-4">
      <h4 className="mb-2 font-semibold text-[#0B513C]">{title}</h4>
      {cleaned.length ? (
        <ul className="space-y-1 text-sm text-gray-700">
          {cleaned.map((line) => (
            <li key={line}>• {line}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-400">No content yet</p>
      )}
    </div>
  );
}
