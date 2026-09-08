"use client";

import { useState } from "react";
import { X, Save, FileText, XCircle, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { downloadSolutionPPT, type ExportPPTData } from "@/lib/pptExport";

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

export default function PPTBuilder({ query, initialData, onClose, onSave }: PPTBuilderProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [newProblem, setNewProblem] = useState("");
  const [newPrediction, setNewPrediction] = useState("");
  const [pptData, setPPTData] = useState<ExportPPTData>(createDefaultData(query, initialData));
  const totalPages = PAGE_LABELS.length;

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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="bg-gradient-to-r from-spiritual-purple to-spiritual-darkPurple text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Tathasstu Solution PPT</h2>
            <p className="text-sm text-white/80">Query: {query.id} - {query.clientName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-gray-100 px-6 py-4 flex items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            {PAGE_LABELS.map((label, index) => (
              <button
                key={label}
                onClick={() => setCurrentPage(index + 1)}
                className={`px-3 h-8 rounded-full text-xs font-semibold ${
                  currentPage === index + 1
                    ? "bg-spiritual-purple text-white"
                    : currentPage > index + 1
                    ? "bg-green-500 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                {index + 1}. {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {currentPage === 1 && (
              <FormPage title="Profile" key="p1">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Name" value={pptData.clientInfo.name} onChange={(value) => setPPTData({ ...pptData, clientInfo: { ...pptData.clientInfo, name: value } })} />
                  <Field label="Email" value={pptData.clientInfo.email} onChange={(value) => setPPTData({ ...pptData, clientInfo: { ...pptData.clientInfo, email: value } })} />
                  <Field label="Phone" value={pptData.clientInfo.phone} onChange={(value) => setPPTData({ ...pptData, clientInfo: { ...pptData.clientInfo, phone: value } })} />
                  <Field label="Date of Birth" type="date" value={pptData.clientInfo.dateOfBirth} onChange={(value) => setPPTData({ ...pptData, clientInfo: { ...pptData.clientInfo, dateOfBirth: value } })} />
                  <Field label="Place of Birth" value={pptData.clientInfo.placeOfBirth} onChange={(value) => setPPTData({ ...pptData, clientInfo: { ...pptData.clientInfo, placeOfBirth: value } })} />
                  <Field label="Time of Birth" type="time" value={pptData.clientInfo.timeOfBirth} onChange={(value) => setPPTData({ ...pptData, clientInfo: { ...pptData.clientInfo, timeOfBirth: value } })} />
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
                />
              </FormPage>
            )}

            {currentPage === 2 && (
              <FormPage title="Scanner Reading" key="p2">
                <Field
                  label="Reading Date"
                  type="date"
                  value={pptData.scannerReading.readingDate}
                  onChange={(value) => setPPTData({ ...pptData, scannerReading: { ...pptData.scannerReading, readingDate: value } })}
                />
                <h4 className="font-semibold text-gray-800">Doshas / Yog</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {pptData.scannerReading.doshas.map((dosha, index) => (
                    <div key={dosha.label} className="border rounded-lg p-3 space-y-2">
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
                    <div key={planet.name} className="grid grid-cols-3 gap-2">
                      <div className="px-3 py-2 bg-gray-50 border rounded-lg text-sm font-medium">{planet.name}</div>
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
              <FormPage title="Upay as per scanner" key="p3">
                <textarea
                  value={pptData.scannerUpay}
                  onChange={(e) => setPPTData({ ...pptData, scannerUpay: e.target.value })}
                  rows={14}
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder={"Write each upay on a new line, e.g.\n3 Male clothes – Brahmin\nSalt bathing – 7 days\nCourt Cases - Maa Bagla Mukhi hawan"}
                />
              </FormPage>
            )}

            {currentPage === 4 && (
              <FormPage title="Kundli Details" key="p4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Lagan" value={pptData.kundli.lagan} onChange={(value) => setPPTData({ ...pptData, kundli: { ...pptData.kundli, lagan: value } })} placeholder="Mithun" />
                  <Field label="Rashi" value={pptData.kundli.rashi} onChange={(value) => setPPTData({ ...pptData, kundli: { ...pptData.kundli, rashi: value } })} placeholder="Meen" />
                  <Field label="Dasha" value={pptData.kundli.dasha} onChange={(value) => setPPTData({ ...pptData, kundli: { ...pptData.kundli, dasha: value } })} placeholder="Venus" />
                  <Field label="Shani ki sade Satti" value={pptData.kundli.shaniSadeSatti} onChange={(value) => setPPTData({ ...pptData, kundli: { ...pptData.kundli, shaniSadeSatti: value } })} placeholder="till Feb 2028" />
                </div>
                <label className="block text-sm font-medium text-gray-700">Personality / Kundli notes</label>
                <textarea value={pptData.kundli.personalityNotes} onChange={(e) => setPPTData({ ...pptData, kundli: { ...pptData.kundli, personalityNotes: e.target.value } })} rows={5} className="w-full px-4 py-2 border rounded-lg" />
                <label className="block text-sm font-medium text-gray-700">Rin details</label>
                <textarea value={pptData.kundli.rinNotes} onChange={(e) => setPPTData({ ...pptData, kundli: { ...pptData.kundli, rinNotes: e.target.value } })} rows={4} className="w-full px-4 py-2 border rounded-lg" />
              </FormPage>
            )}

            {currentPage === 5 && (
              <FormPage title="Predictions" key="p5">
                <ListEditor
                  label="Add prediction points"
                  placeholder="Will have lot of secrets within his heart."
                  value={newPrediction}
                  items={pptData.predictions}
                  onChangeValue={setNewPrediction}
                  onAdd={() => addListItem("predictions", newPrediction)}
                  onRemove={(index) => setPPTData({ ...pptData, predictions: pptData.predictions.filter((_, i) => i !== index) })}
                />
              </FormPage>
            )}

            {currentPage === 6 && (
              <FormPage title="Upay as per Kundli" key="p6">
                <textarea
                  value={pptData.kundliUpay}
                  onChange={(e) => setPPTData({ ...pptData, kundliUpay: e.target.value })}
                  rows={14}
                  className="w-full px-4 py-3 border rounded-lg"
                  placeholder={"Write each kundli upay on a new line, e.g.\nUjjain Mangal Nath mandir mein mangal shanti pooja karein.\nHanuman ji ki pooja karein."}
                />
              </FormPage>
            )}

            {currentPage === 7 && (
              <FormPage title="PPT Preview" key="p7">
                <p className="text-sm text-gray-600">Generated PPT will follow the Tathasstu 11-slide template: cover, about, profile, scanner reading, scanner upay, lagan kundli, kundli prediction, predictions, kundli upay, and thanks.</p>
                <PreviewBlock title="Profile" lines={[pptData.clientInfo.name, pptData.clientInfo.dateOfBirth, pptData.clientInfo.placeOfBirth, pptData.clientInfo.timeOfBirth, pptData.queryInfo.problems.join(", ")]} />
                <PreviewBlock title="Predictions" lines={pptData.predictions} />
                <PreviewBlock title="Scanner Upay" lines={pptData.scannerUpay.split("\n")} />
                <PreviewBlock title="Kundli Upay" lines={pptData.kundliUpay.split("\n")} />
              </FormPage>
            )}
          </AnimatePresence>
        </div>

        <div className="bg-gray-100 px-6 py-4 flex justify-between items-center border-t">
          <div className="flex gap-2">
            <button onClick={() => handleSave("draft")} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Save Draft
            </button>
            <button onClick={() => handleSave("completed")} className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-semibold flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save & Send
            </button>
            <button onClick={handleDownload} className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold flex items-center gap-2">
              <Download className="w-4 h-4" />
              Download PPT
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="px-4 py-2 border rounded-lg disabled:opacity-50 flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="px-4 py-2 bg-gradient-to-r from-spiritual-purple to-spiritual-darkPurple text-white rounded-lg disabled:opacity-50 flex items-center gap-2">
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="px-4 py-2 border border-red-300 text-red-600 rounded-lg flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function FormPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
      <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="w-full px-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-spiritual-purple" />
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
}: {
  label: string;
  placeholder: string;
  value: string;
  items: string[];
  onChangeValue: (value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex gap-2">
        <input
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChangeValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
          className="w-full px-4 py-2 border rounded-lg"
        />
        <button type="button" onClick={onAdd} className="px-4 py-2 bg-gradient-to-r from-spiritual-purple to-spiritual-darkPurple text-white rounded-lg">
          Add
        </button>
      </div>
      <div className="mt-3 space-y-2">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500">Nothing added yet.</p>
        ) : (
          items.map((item, index) => (
            <div key={`${item}-${index}`} className="flex items-center justify-between border rounded-lg px-3 py-2">
              <p className="text-sm text-gray-700">{index + 1}. {item}</p>
              <button type="button" onClick={() => onRemove(index)} className="text-red-600 text-sm font-medium">
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function PreviewBlock({ title, lines }: { title: string; lines: string[] }) {
  const cleaned = lines.filter((line) => line && line.trim());
  return (
    <div className="border rounded-lg p-4">
      <h4 className="font-semibold text-gray-800 mb-2">{title}</h4>
      {cleaned.length ? (
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          {cleaned.map((line, index) => (
            <li key={`${line}-${index}`}>{line}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">No content yet.</p>
      )}
    </div>
  );
}
