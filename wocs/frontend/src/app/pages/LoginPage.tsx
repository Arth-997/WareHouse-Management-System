import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router";
import { Chrome, Shield } from "lucide-react";
import { api } from "../../lib/api";
import { useAuth } from "../components/AuthContext";

type Role =
  | "IT_ADMINISTRATOR"
  | "WAREHOUSE_OPERATOR"
  | "WAREHOUSE_MANAGER"
  | "REGIONAL_OPS_HEAD"
  | "FINANCE"
  | "SALES"
  | "CLIENT_USER";

const ROLE_OPTIONS: Array<{ value: Role; label: string }> = [
  { value: "IT_ADMINISTRATOR", label: "IT Administrator" },
  { value: "WAREHOUSE_MANAGER", label: "Warehouse Manager" },
  { value: "WAREHOUSE_OPERATOR", label: "Warehouse Operator" },
  { value: "FINANCE", label: "Finance" },
  { value: "CLIENT_USER", label: "Client User" },
];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  // Register fields
  const [name, setName] = useState<string>("");
  const [role, setRole] = useState<Role>("CLIENT_USER");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e?: FormEvent) => {
    e?.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      login(res.data.user, res.data.token);
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e?: FormEvent) => {
    e?.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.post("/auth/register", { name, email, password, role });
      // Immediately log the user in after registration.
      const res = await api.post("/auth/login", { email, password });
      login(res.data.user, res.data.token);
      navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    // Google auth will be implemented in a later phase.
    window.location.href = `${api.defaults.baseURL}/auth/google`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-600 via-purple-700 to-purple-900 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-300 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-white text-2xl">WOCS</h1>
              <div className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded text-xs text-white/90 inline-block mt-1">
                Phase 1 Core
              </div>
            </div>
          </div>

          <div className="mt-16">
            <h2 className="text-4xl text-white mb-4">
              Warehouse Operations &<br />Coordination System
            </h2>
            <p className="text-purple-100 text-lg">
              Streamline your warehouse operations with real-time monitoring,
              inventory management, and SLA tracking.
            </p>
          </div>
        </div>

        <div className="relative z-10 text-purple-100 text-sm">
          © 2026 WOCS. All rights reserved.
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl text-white mb-2">
              {mode === "login" ? "Sign in" : "Create account"}
            </h2>
            <p className="text-slate-400">
              {mode === "login" ? "Welcome back to WOCS" : "Start using WOCS"}
            </p>
          </div>

          <div className="space-y-4">
            <form onSubmit={mode === "login" ? handleLogin : handleRegister} className="space-y-4">
              {mode === "register" && (
                <div className="space-y-2">
                  <label className="block text-sm text-slate-300">Name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#111118] border border-[#1e1e2e] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#7c3aed]/50"
                    placeholder="Your name"
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm text-slate-300">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-[#111118] border border-[#1e1e2e] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#7c3aed]/50"
                  placeholder="you@company.com"
                  autoComplete="email"
                  type="email"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-slate-300">Password</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#111118] border border-[#1e1e2e] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#7c3aed]/50"
                  placeholder="••••••••"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  type="password"
                />
              </div>

              {mode === "register" && (
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
              )}

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#7c3aed] hover:bg-[#6d2fd4] text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              >
                <Shield className="w-4 h-4" />
                {submitting ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
              </button>
            </form>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode("login");
                }}
                className={`flex-1 py-2 rounded-lg border transition-all ${
                  mode === "login"
                    ? "bg-[#7c3aed]/15 border-[#7c3aed]/40 text-[#7c3aed]"
                    : "bg-[#111118] border-[#1e1e2e] text-slate-400 hover:text-white"
                }`}
              >
                Sign in
              </button>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setMode("register");
                }}
                className={`flex-1 py-2 rounded-lg border transition-all ${
                  mode === "register"
                    ? "bg-[#7c3aed]/15 border-[#7c3aed]/40 text-[#7c3aed]"
                    : "bg-[#111118] border-[#1e1e2e] text-slate-400 hover:text-white"
                }`}
              >
                Register
              </button>
            </div>

            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full bg-white hover:bg-gray-100 text-gray-900 py-3 px-4 rounded-lg flex items-center justify-center gap-3 transition-all"
            >
              <Chrome className="w-5 h-5" />
              Continue with Google
            </button>

            <p className="text-slate-500 text-xs text-center mt-2">
              Google sign-in will be connected in a later phase.
            </p>
          </div>

          <p className="text-slate-500 text-xs text-center mt-8">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
