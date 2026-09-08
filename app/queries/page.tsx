"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Plus, Eye, Edit, Trash2, Search, FileText, History, X, Download } from "lucide-react";
import { motion } from "framer-motion";
import PPTBuilder from "@/components/PPTBuilder";
import { downloadSolutionPPT, type ExportPPTData } from "@/lib/pptExport";

interface Query {
  id: string;
  clientName: string;
  queryType: string;
  date: string;
  status: "pending" | "in-progress" | "completed";
  assignedTo: string;
  clientEmail?: string;
  solution?: {
    status: "draft" | "completed";
    createdAt: string;
    updatedAt: string;
  };
}


const mockQueries: Query[] = [
  { id: "Q001", clientName: "John Doe", queryType: "Astrology", date: "2025-01-15", status: "pending", assignedTo: "Astrologer A", clientEmail: "john@example.com" },
  { id: "Q002", clientName: "Jane Smith", queryType: "Numerology", date: "2025-01-15", status: "in-progress", assignedTo: "Numerologist B", clientEmail: "jane@example.com", solution: { status: "draft", createdAt: "2025-01-15", updatedAt: "2025-01-15" } },
  { id: "Q003", clientName: "Mike Johnson", queryType: "Tarot", date: "2025-01-14", status: "completed", assignedTo: "Tarot Reader C", clientEmail: "mike@example.com", solution: { status: "completed", createdAt: "2025-01-14", updatedAt: "2025-01-14" } },
  { id: "Q004", clientName: "Sarah Williams", queryType: "Palmistry", date: "2025-01-14", status: "pending", assignedTo: "Palmist D", clientEmail: "sarah@example.com" },
  { id: "Q005", clientName: "David Brown", queryType: "Astrology", date: "2025-01-13", status: "completed", assignedTo: "Astrologer A", clientEmail: "david@example.com", solution: { status: "completed", createdAt: "2025-01-13", updatedAt: "2025-01-13" } },
];

export default function QueryTrackerPage() {
  const [queries, setQueries] = useState<Query[]>(mockQueries);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState<Query | null>(null);
  const [showPPTBuilder, setShowPPTBuilder] = useState(false);
  const [pptQuery, setPPTQuery] = useState<Query | null>(null);
  const [showSolutionHistory, setShowSolutionHistory] = useState(false);
  const [historyQuery, setHistoryQuery] = useState<Query | null>(null);
  const [solutionData, setSolutionData] = useState<Record<string, ExportPPTData>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadQueries = async () => {
      try {
        const response = await fetch("/api/queries");
        if (!response.ok) return;
        const payload = await response.json();
        if (payload?.data) {
          setQueries(payload.data);
        }
      } catch (error) {
        console.error("Failed to load queries", error);
      }
    };

    loadQueries();
  }, []);

  const filteredQueries = queries.filter(
    (q) =>
      q.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.queryType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this query?")) {
      setQueries(queries.filter((q) => q.id !== id));
    }
  };

  const handleCreateSolution = (query: Query) => {
    setPPTQuery(query);
    setShowPPTBuilder(true);
  };

  const handleViewSolution = async (query: Query) => {
    try {
      const response = await fetch(`/api/queries/${query.id}/solution`);
      if (response.ok) {
        const payload = await response.json();
        if (payload?.data) {
          setSolutionData((prev) => ({ ...prev, [query.id]: payload.data }));
        }
      }
    } catch (error) {
      console.error("Failed to load solution", error);
    }
    setPPTQuery(query);
    setShowPPTBuilder(true);
  };

  const handleViewHistory = (query: Query) => {
    setHistoryQuery(query);
    setShowSolutionHistory(true);
  };

  const handlePPTSave = async (data: ExportPPTData, status: "draft" | "completed") => {
    if (pptQuery) {
      setLoading(true);
      try {
        await fetch(`/api/queries/${pptQuery.id}/solution`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pptData: data, status }),
        });
      } catch (error) {
        console.error("Failed to save solution", error);
      } finally {
        setLoading(false);
      }

      setSolutionData((prev) => ({ ...prev, [pptQuery.id]: data }));
      setQueries(
        queries.map((q) =>
          q.id === pptQuery.id
            ? {
                ...q,
                solution: {
                  status,
                  createdAt: q.solution?.createdAt || new Date().toISOString().split("T")[0],
                  updatedAt: new Date().toISOString().split("T")[0],
                },
                status: status === "completed" ? "completed" : q.status,
              }
            : q
        )
      );
      setShowPPTBuilder(false);
      setPPTQuery(null);
    }
  };

  const handleDownloadSolution = async (query: Query) => {
    try {
      let data = solutionData[query.id];
      if (!data) {
        const response = await fetch(`/api/queries/${query.id}/solution`);
        if (!response.ok) {
          alert("No solution found to download.");
          return;
        }
        const payload = await response.json();
        data = payload?.data;
      }
      if (!data) {
        alert("No solution found to download.");
        return;
      }
      await downloadSolutionPPT(query.id);
    } catch (error) {
      console.error("Failed to download PPT", error);
      alert("Unable to download PPT right now.");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Query Tracker</h1>
            <p className="text-gray-600">Manage all client queries and consultations</p>
            {loading && <p className="text-xs text-spiritual-purple mt-2">Saving solution...</p>}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSelectedQuery(null);
              setShowModal(true);
            }}
            className="bg-gradient-to-r from-spiritual-purple to-spiritual-darkPurple text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"
          >
            <Plus className="w-5 h-5" />
            Add New Query
          </motion.button>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl p-4 shadow-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by client name, query type, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-spiritual-purple focus:border-transparent outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-spiritual-purple to-spiritual-darkPurple text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Query ID</th>
                  <th className="px-6 py-4 text-left font-semibold">Client Name</th>
                  <th className="px-6 py-4 text-left font-semibold">Query Type</th>
                  <th className="px-6 py-4 text-left font-semibold">Date</th>
                  <th className="px-6 py-4 text-left font-semibold">Status</th>
                  <th className="px-6 py-4 text-left font-semibold">Assigned To</th>
                  <th className="px-6 py-4 text-left font-semibold">Solution</th>
                  <th className="px-6 py-4 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredQueries.map((query) => (
                  <tr key={query.id} className="hover:bg-spiritual-lightGold transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-800">{query.id}</td>
                    <td className="px-6 py-4 text-gray-700">{query.clientName}</td>
                    <td className="px-6 py-4 text-gray-700">{query.queryType}</td>
                    <td className="px-6 py-4 text-gray-700">{query.date}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(query.status)}`}>
                        {query.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{query.assignedTo}</td>
                    <td className="px-6 py-4">
                      {query.solution ? (
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              query.solution.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {query.solution.status === "completed" ? "Completed" : "Draft"}
                          </span>
                          <button
                            onClick={() => handleViewSolution(query)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="View/Edit Solution"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleViewHistory(query)}
                            className="p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                            title="View History"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDownloadSolution(query)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                            title="Download PPT"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleCreateSolution(query)}
                          className="px-3 py-1 bg-gradient-to-r from-spiritual-purple to-spiritual-darkPurple text-white text-xs rounded-lg font-medium hover:shadow-md transition-shadow flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" />
                          Create Solution
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedQuery(query);
                            setShowModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedQuery(query);
                            setShowModal(true);
                          }}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(query.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {selectedQuery ? "Edit Query" : "Add New Query"}
              </h2>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Client Name</label>
                  <input
                    type="text"
                    defaultValue={selectedQuery?.clientName || ""}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-spiritual-purple focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Query Type</label>
                  <select
                    defaultValue={selectedQuery?.queryType || ""}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-spiritual-purple focus:border-transparent outline-none"
                  >
                    <option value="">Select type</option>
                    <option value="Astrology">Astrology</option>
                    <option value="Numerology">Numerology</option>
                    <option value="Tarot">Tarot</option>
                    <option value="Palmistry">Palmistry</option>
                    <option value="Vastu">Vastu</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    defaultValue={selectedQuery?.date || ""}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-spiritual-purple focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    defaultValue={selectedQuery?.status || ""}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-spiritual-purple focus:border-transparent outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
                  <input
                    type="text"
                    defaultValue={selectedQuery?.assignedTo || ""}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-spiritual-purple focus:border-transparent outline-none"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-spiritual-purple to-spiritual-darkPurple text-white rounded-lg font-semibold hover:shadow-lg transition-shadow"
                  >
                    {selectedQuery ? "Update" : "Create"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* PPT Builder */}
        {showPPTBuilder && pptQuery && (
          <PPTBuilder
            query={pptQuery}
            initialData={solutionData[pptQuery.id] || null}
            onClose={() => {
              setShowPPTBuilder(false);
              setPPTQuery(null);
            }}
            onSave={handlePPTSave}
          />
        )}

        {/* Solution History Modal */}
        {showSolutionHistory && historyQuery && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Solution History</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Query: {historyQuery.id} - {historyQuery.clientName}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowSolutionHistory(false);
                    setHistoryQuery(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {historyQuery.solution && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-800">Solution Details</h3>
                        <p className="text-sm text-gray-600">
                          Status:{" "}
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              historyQuery.solution.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {historyQuery.solution.status}
                          </span>
                        </p>
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        <p>Created: {historyQuery.solution.createdAt}</p>
                        <p>Updated: {historyQuery.solution.updatedAt}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setShowSolutionHistory(false);
                          handleViewSolution(historyQuery);
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-spiritual-purple to-spiritual-darkPurple text-white rounded-lg font-medium hover:shadow-md transition-shadow"
                      >
                        View/Edit Solution
                      </button>
                      <button
                        onClick={() => handleDownloadSolution(historyQuery)}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg font-medium hover:shadow-md transition-shadow flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download PPT
                      </button>
                    </div>
                  </div>
                )}

                {/* Query Timeline */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-3">Query Timeline</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-spiritual-purple rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-gray-800">Query Created</p>
                        <p className="text-sm text-gray-600">{historyQuery.date}</p>
                      </div>
                    </div>
                    {historyQuery.solution && (
                      <>
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                          <div>
                            <p className="font-medium text-gray-800">
                              Solution {historyQuery.solution.status === "completed" ? "Completed" : "Drafted"}
                            </p>
                            <p className="text-sm text-gray-600">{historyQuery.solution.updatedAt}</p>
                          </div>
                        </div>
                        {historyQuery.solution.status === "completed" && (
                          <div className="flex items-start gap-3">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                            <div>
                              <p className="font-medium text-gray-800">Solution Sent to Client</p>
                              <p className="text-sm text-gray-600">
                                Email sent to {historyQuery.clientEmail || "client email"}
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

