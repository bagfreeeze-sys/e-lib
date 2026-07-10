import React, { useState, useContext } from "react";
import { useNavigate, Link as RouterLink } from "react-router-dom";
import { UserPlus, Mail, Lock, User } from "lucide-react";
import { AuthContext } from "../App";

function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!error) return undefined;
    const t = setTimeout(() => setError(""), 3000);
    return () => clearTimeout(t);
  }, [error]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const userData = await register(
        formData.name,
        formData.email,
        formData.password,
        formData.role,
      );
      if (userData.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/student");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8">
      <div className="grid w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900 md:grid-cols-2">
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-white md:p-12">
          <p className="inline-flex rounded-full bg-white/20 px-3 py-1 text-sm">
            Join the community
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-tight">
            Start your library experience today
          </h1>
          <p className="mt-3 text-indigo-100">
            Create an account to borrow books and manage your learning.
          </p>
        </div>

        <div className="p-8 md:p-12">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold">Create your account</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              It takes less than a minute.
            </p>
          </div>
          {error && (
            <div className="mb-4 rounded-lg px-3 py-2 text-sm text-white bg-red-600 shadow-red-200/20">
              <div className="font-bold text-xs uppercase">Error</div>
              <div className="mt-1">{error}</div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User
                className="absolute left-3 top-3.5 text-slate-400"
                size={18}
              />
              <input
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-800"
                name="name"
                type="text"
                placeholder="Full name"
                required
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div className="relative">
              <Mail
                className="absolute left-3 top-3.5 text-slate-400"
                size={18}
              />
              <input
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-800"
                name="email"
                type="email"
                placeholder="Email address"
                required
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div className="relative">
              <Lock
                className="absolute left-3 top-3.5 text-slate-400"
                size={18}
              />
              <input
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-800"
                name="password"
                type="password"
                placeholder="Password"
                required
                value={formData.password}
                onChange={handleChange}
              />
            </div>
            <div className="relative">
              <Lock
                className="absolute left-3 top-3.5 text-slate-400"
                size={18}
              />
              <input
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-800"
                name="confirmPassword"
                type="password"
                placeholder="Confirm password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
            <select
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-800"
              name="role"
              value={formData.role}
              onChange={handleChange}
            >
              <option value="student">Student</option>
              {/* <option value="admin">Admin</option> */}
            </select>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
            >
              <UserPlus size={18} />{" "}
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-slate-600 dark:text-slate-300">
            Already have an account?{" "}
            <RouterLink
              to="/login"
              className="font-medium text-blue-600 hover:underline"
            >
              Sign in
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
