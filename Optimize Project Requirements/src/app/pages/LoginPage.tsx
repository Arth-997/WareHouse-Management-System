import { useNavigate } from "react-router";
import { Shield, Chrome } from "lucide-react";

export function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = (role?: string) => {
    // Store role in localStorage for demo purposes
    if (role) {
      localStorage.setItem('userRole', role);
      localStorage.setItem('userName', getRoleDisplayName(role));
    }
    navigate('/');
  };

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      'it-admin': 'IT Admin',
      'warehouse-manager': 'Warehouse Manager',
      'operator': 'Warehouse Operator',
      'billing': 'Billing Manager',
    };
    return roleMap[role] || 'User';
  };

  const roles = [
    { id: 'it-admin', label: 'IT Admin', color: 'from-purple-600 to-purple-800' },
    { id: 'warehouse-manager', label: 'Warehouse Manager', color: 'from-blue-600 to-blue-800' },
    { id: 'operator', label: 'Warehouse Operator', color: 'from-emerald-600 to-emerald-800' },
    { id: 'billing', label: 'Billing Manager', color: 'from-amber-600 to-amber-800' },
  ];

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
            <h2 className="text-3xl text-white mb-2">Sign in</h2>
            <p className="text-slate-400">Welcome back to WOCS</p>
          </div>

          <button
            onClick={() => handleLogin()}
            className="w-full bg-white hover:bg-gray-100 text-gray-900 py-3 px-4 rounded-lg flex items-center justify-center gap-3 transition-all mb-6"
          >
            <Chrome className="w-5 h-5" />
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#1e1e2e]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#0a0a0f] text-slate-500">Or demo as role</span>
            </div>
          </div>

          <div className="space-y-3">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => handleLogin(role.id)}
                className={`w-full bg-gradient-to-r ${role.color} hover:opacity-90 text-white py-3 px-4 rounded-lg flex items-center gap-3 transition-all group`}
              >
                <Shield className="w-5 h-5 opacity-80 group-hover:opacity-100" />
                <span className="flex-1 text-left">{role.label}</span>
              </button>
            ))}
          </div>

          <p className="text-slate-500 text-xs text-center mt-8">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
