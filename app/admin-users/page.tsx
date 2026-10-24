"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Shield, Plus, Ban, CheckCircle, Trash2, RefreshCw, UserPlus } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

type AdminRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  isDefault?: boolean;
  createdAt?: string;
};

function authHeaders(token: string | null) {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function AdminUsersPage() {
  const token = useAuthStore((state) => state.token);

  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loadAdmins = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/auth/admins", {
        headers: authHeaders(token),
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to load admin users");
      }
      setAdmins(payload.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load admin users");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadAdmins();
  }, [loadAdmins]);

  const createAdmin = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSaving(true);
    setError("");
    setSaved("");
    try {
      const response = await fetch("/api/auth/admins", {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ name, email, password, role: "admin" }),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to create admin account");
      }
      setName("");
      setEmail("");
      setPassword("");
      setSaved(
        `Admin account created for “${payload.data?.email || email}”. They can log in on the admin panel now.`,
      );
      await loadAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create admin account");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (id: string) => {
    if (!token) return;
    setError("");
    try {
      const response = await fetch(`/api/auth/admins/${id}/toggle-status`, {
        method: "PATCH",
        headers: authHeaders(token),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to update admin");
      }
      await loadAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update admin");
    }
  };

  const removeAdmin = async (id: string, label: string) => {
    if (!token) return;
    if (!window.confirm(`Delete admin “${label}”? They will no longer be able to log in.`)) return;
    setError("");
    try {
      const response = await fetch(`/api/auth/admins/${id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to delete admin");
      }
      setSaved("Admin account deleted");
      await loadAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete admin");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Admin Account</h1>
            <p className="text-gray-600 max-w-2xl">
              Add a new login for someone who should use this admin panel. After you create it, they
              sign in on the login page with that email and password.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadAdmins()}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {error}
          </p>
        ) : null}
        {saved ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {saved}
          </p>
        ) : null}

        <div className="bg-white rounded-xl p-6 shadow-md border border-spiritual-purple/10">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-full bg-spiritual-purple/10 p-3">
              <UserPlus className="h-6 w-6 text-spiritual-purple" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">New admin login</h2>
              <p className="text-sm text-gray-500">Name, email and password are required</p>
            </div>
          </div>

          <form onSubmit={createAdmin} className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm text-gray-700">
              Full name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Store Manager"
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-spiritual-purple/30"
              />
            </label>
            <label className="block text-sm text-gray-700">
              Login email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. manager@example.com"
                required
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-spiritual-purple/30"
              />
            </label>
            <label className="block text-sm text-gray-700 md:col-span-2">
              Password (min 6 characters)
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password"
                required
                minLength={6}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-spiritual-purple/30"
              />
            </label>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-spiritual-purple to-spiritual-darkPurple px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                <Plus className="w-4 h-4" />
                {saving ? "Creating account…" : "Create admin account"}
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="h-5 w-5 text-spiritual-purple" />
            <h2 className="text-xl font-semibold text-gray-800">Existing admin accounts</h2>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-spiritual-purple to-spiritual-darkPurple text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Role</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                      Loading…
                    </td>
                  </tr>
                ) : admins.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                      No admin accounts yet.
                    </td>
                  </tr>
                ) : (
                  admins.map((admin) => (
                    <tr key={admin.id} className="border-b border-gray-100">
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {admin.name}
                        {admin.isDefault ? (
                          <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-700">
                            Default
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{admin.email}</td>
                      <td className="px-4 py-3 text-sm capitalize text-gray-600">{admin.role}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            admin.isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {admin.isActive ? "active" : "suspended"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {!admin.isDefault ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => void toggleStatus(admin.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                            >
                              {admin.isActive ? (
                                <>
                                  <Ban className="w-3.5 h-3.5" /> Suspend
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="w-3.5 h-3.5" /> Activate
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => void removeAdmin(admin.id, admin.name)}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Protected default login</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
