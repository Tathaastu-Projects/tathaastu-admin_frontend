"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { User, Mail, Shield, Plus, Ban, CheckCircle, Trash2, RefreshCw } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { parseApiJson } from "@/lib/parseApiJson";

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

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
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
      const payload = await parseApiJson(response);
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
      const payload = await parseApiJson(response);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to create admin");
      }
      setName("");
      setEmail("");
      setPassword("");
      setSaved(`Admin “${payload.data?.name || email}” created — they can log in now`);
      await loadAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create admin");
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
      const payload = await parseApiJson(response);
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
      const payload = await parseApiJson(response);
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to delete admin");
      }
      setSaved("Admin user deleted");
      await loadAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete admin");
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Settings</h1>
          <p className="text-gray-600">
            Your profile and admin panel access. To add a new admin login, open{" "}
            <Link href="/admin-users" className="font-semibold text-spiritual-purple hover:underline">
              Create Admin Account
            </Link>
            .
          </p>
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

        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-spiritual-purple" />
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">Signed in as</h2>
              <p className="text-sm text-gray-500">Your current admin session</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs text-gray-500 inline-flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" /> Name
              </p>
              <p className="mt-1 font-semibold text-gray-800">{user?.name || "—"}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-xs text-gray-500 inline-flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> Email
              </p>
              <p className="mt-1 font-semibold text-gray-800">{user?.email || "—"}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-gray-800">Admin panel users</h2>
              <p className="text-sm text-gray-500">
                Create more logins for people who should manage the store admin.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadAdmins()}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          <form onSubmit={createAdmin} className="mb-6 grid gap-3 rounded-xl border border-dashed border-spiritual-purple/30 bg-spiritual-lightGold/20 p-4 md:grid-cols-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-spiritual-purple/30"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email for login"
              required
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-spiritual-purple/30"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6)"
              required
              minLength={6}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-spiritual-purple/30"
            />
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-spiritual-purple to-spiritual-darkPurple px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              <Plus className="w-4 h-4" />
              {saving ? "Creating…" : "Create admin"}
            </button>
          </form>

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
                      Loading admin users…
                    </td>
                  </tr>
                ) : admins.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500">
                      No admin users found.
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
                        <div className="flex flex-wrap gap-2">
                          {!admin.isDefault ? (
                            <>
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
                            </>
                          ) : (
                            <span className="text-xs text-gray-400">Protected default login</span>
                          )}
                        </div>
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
