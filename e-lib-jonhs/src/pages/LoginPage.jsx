import React, { useState, useContext } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { BookOpen, Lock, Mail } from "lucide-react";
import { AuthContext } from "../App";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Auto-clear error after 3 seconds
  React.useEffect(() => {
    if (!error) return undefined;
    const t = setTimeout(() => setError(""), 3000);
    return () => clearTimeout(t);
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userData = await login(email, password);
      if (userData.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/student");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8">
      <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900 md:grid-cols-2">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white md:p-12">
          <p className="inline-flex rounded-full bg-white/20 px-3 py-1 text-sm">
            Welcome back
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-tight">
            Discover your next favorite book
          </h1>
          <p className="mt-3 text-blue-100">
            Browse, borrow, and manage your learning journey in one place.
          </p>
          <div className="mt-8 flex items-center gap-2 text-sm text-blue-100">
            <BookOpen size={18} />
            Smart access for students and admins
          </div>
        </div>

        <div className="p-8 md:p-12">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Sign in to E-Library</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Continue where you left off.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg px-3 py-2 text-sm text-white bg-red-600 shadow-red-200/20">
              <div className="font-bold text-xs uppercase">Error</div>
              <div className="mt-1">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Email</span>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-3.5 text-slate-400"
                  size={18}
                />
                <input
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-800"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Password</span>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-3.5 text-slate-400"
                  size={18}
                />
                <input
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-800"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 py-3 font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-600 dark:text-slate-300">
            No account yet?{" "}
            <RouterLink
              to="/register"
              className="font-medium text-blue-600 hover:underline"
            >
              Create one
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
