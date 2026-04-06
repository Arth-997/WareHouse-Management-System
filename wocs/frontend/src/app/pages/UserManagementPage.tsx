import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { api } from "../../lib/api";

type Role =
  | "IT_ADMINISTRATOR"
  | "WAREHOUSE_OPERATOR"
  | "WAREHOUSE_MANAGER"
  | "REGIONAL_OPS_HEAD"
  | "FINANCE"
  | "SALES"
  | "CLIENT_USER";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
};

const ROLE_OPTIONS: Array<{ value: Role; label: string }> = [
  { value: "IT_ADMINISTRATOR", label: "IT Administrator" },
  { value: "WAREHOUSE_MANAGER", label: "Warehouse Manager" },
  { value: "WAREHOUSE_OPERATOR", label: "Warehouse Operator" },
  { value: "FINANCE", label: "Finance" },
  { value: "CLIENT_USER", label: "Client User" },
];

export function UserManagementPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("CLIENT_USER");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchUsers = async (q?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/auth/users", { params: { q } });
      setUsers(res.data ?? []);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = window.setTimeout(() => fetchUsers(query), 300);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const queryPlaceholder = useMemo(() => {
    if (!query) return "Search by name or email...";
    return "Searching...";
  }, [query]);

  const onCreateUser = async (e?: FormEvent) => {
    e?.preventDefault();
    setCreateError(null);
    setCreating(true);
    try {
      await api.post("/auth/users", { name, email, password, role });
      setName("");
      setEmail("");
      setPassword("");
      setRole("CLIENT_USER");
      await fetchUsers(query);
    } catch (err: any) {
      setCreateError(err?.response?.data?.message ?? "Failed to create user");
    } finally {
      setCreating(false);
    }
  };

  const onDeleteUser = async (id: string) => {
    if (!window.confirm("Delete this user?")) return;
    setCreateError(null);
    setCreating(true);
    try {
      await api.delete(`/auth/users/${id}`);
      await fetchUsers(query);
    } catch (err: any) {
      setCreateError(err?.response?.data?.message ?? "Failed to delete user");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-white text-2xl">User Management</h1>

      {/* Search */}
      <div className="flex gap-4 items-center">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="text"
            placeholder={queryPlaceholder}
            className="w-full pl-10 pr-4 py-2.5 bg-[#111118] border border-[#1e1e2e] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#7c3aed]/50"
          />
        </div>
      </div>

      {/* Users table */}
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 text-slate-400">Loading...</div>
        ) : error ? (
          <div className="p-6 text-red-400">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#1e1e2e] bg-[#0a0a0f]">
                  <th className="px-6 py-4 text-left text-slate-400 text-sm font-normal">Name</th>
                  <th className="px-6 py-4 text-left text-slate-400 text-sm font-normal">Email</th>
                  <th className="px-6 py-4 text-left text-slate-400 text-sm font-normal">Role</th>
                  <th className="px-6 py-4 text-left text-slate-400 text-sm font-normal">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, idx) => (
                  <tr
                    key={u.id}
                    className={`border-b border-[#1e1e2e] hover:bg-[#0a0a0f] transition-colors ${
                      idx % 2 === 0 ? "bg-[#111118]" : "bg-[#0f0f16]"
                    }`}
                  >
                    <td className="px-6 py-4 text-slate-300">{u.name}</td>
                    <td className="px-6 py-4 text-slate-400 text-sm">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-[#7c3aed]/10 border border-[#7c3aed]/30 rounded-full text-xs text-[#7c3aed]">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => onDeleteUser(u.id)}
                        disabled={creating}
                        className="px-3 py-2 bg-red-500/10 border border-red-500/20 hover:border-red-500/30 text-red-300 rounded-lg transition-all disabled:opacity-60"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-slate-500">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create user */}
      <div className="bg-[#111118] border border-[#1e1e2e] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-white text-lg font-semibold">Add User</div>
          <div className="text-slate-400 text-sm">Create a local account (email/password)</div>
        </div>

        <form onSubmit={onCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm text-slate-300">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-[#111118] border border-[#1e1e2e] rounded-lg text-white focus:outline-none focus:border-[#7c3aed]/50"
              placeholder="User name"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-slate-300">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-[#111118] border border-[#1e1e2e] rounded-lg text-white focus:outline-none focus:border-[#7c3aed]/50"
              placeholder="user@company.com"
              type="email"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-slate-300">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-[#111118] border border-[#1e1e2e] rounded-lg text-white focus:outline-none focus:border-[#7c3aed]/50"
              placeholder="Set password"
              type="password"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-slate-300">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full px-4 py-3 bg-[#111118] border border-[#1e1e2e] rounded-lg text-white focus:outline-none focus:border-[#7c3aed]/50"
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {createError && (
            <div className="md:col-span-2 text-red-400 text-sm">{createError}</div>
          )}

          <div className="md:col-span-2 flex gap-3 items-center">
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-3 bg-[#7c3aed] hover:bg-[#6d2fd4] text-white rounded-lg flex items-center gap-2 transition-all disabled:opacity-60"
            >
              <Plus className="w-4 h-4" />
              {creating ? "Creating..." : "Create user"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
