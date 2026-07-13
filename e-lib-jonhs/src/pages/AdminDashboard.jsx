import React, { useState, useEffect, useContext, useMemo } from "react";
import {
  useNavigate,
  Routes,
  Route,
  useLocation,
  Link,
} from "react-router-dom";
import {
  LayoutDashboard,
  Library,
  Users,
  HandHelping,
  LogOut,
  Moon,
  Sun,
  Search,
  Upload,
  Trash2,
  Pencil,
  Menu,
  X,
  Ticket,
  ShieldAlert,
  CheckCircle,
  AlertTriangle,
  UserX,
  UserCheck,
  UserRoundCog,
} from "lucide-react";
import { io } from "socket.io-client";
import axios from "axios";
import { AuthContext } from "../App";
import { useDebounce } from "../utils/useDebounce";
import { SkeletonTableRow, SkeletonCard } from "../components/Skeleton";

function AdminDashboard() {
  const { user, logout, theme, toggleTheme } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [openNav, setOpenNav] = useState(false);

  const links = useMemo(
    () => [
      { to: "/admin", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
      { to: "/admin/books", label: "Books", icon: <Library size={18} /> },
      {
        to: "/admin/borrow-requests",
        label: "Borrow Requests",
        icon: <HandHelping size={18} />,
      },
      { to: "/admin/accounts", label: "Accounts", icon: <Users size={18} /> },
      {
        to: "/admin/settings",
        label: "Settings",
        icon: <UserRoundCog size={18} />,
      },
    ],
    [],
  );

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <aside
        className={`${openNav ? "translate-x-0" : "-translate-x-full"} fixed z-30 h-full w-64 border-r border-slate-200 bg-white p-4 transition-transform md:translate-x-0 dark:border-slate-800 dark:bg-slate-900`}
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              A
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Admin Panel
            </h1>
          </div>
          <button
            className="md:hidden text-slate-500 hover:text-slate-950 dark:hover:text-white"
            onClick={() => setOpenNav(false)}
          >
            <X size={18} />
          </button>
        </div>
        <nav className="space-y-1">
          {links.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${location.pathname === item.to ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" : "hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400"}`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex w-full flex-col md:ml-64">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <button
            className="md:hidden text-slate-600 dark:text-slate-400"
            onClick={() => setOpenNav(true)}
          >
            <Menu size={18} />
          </button>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Welcome back, {user?.name} (Admin)
          </p>
          <div className="flex items-center gap-2">
            <button
              className="rounded-xl border border-slate-300 p-2 text-slate-600 dark:border-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              onClick={toggleTheme}
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              className="rounded-xl bg-red-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-red-700 transition"
              onClick={handleLogout}
            >
              <LogOut size={16} className="inline mr-1" /> Logout
            </button>
          </div>
        </header>

        <main className="p-4 md:p-6 flex-1">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/books" element={<BookManagement />} />
            <Route path="/borrow-requests" element={<BorrowRequests />} />
            <Route path="/accounts" element={<AccountManagement />} />
            <Route path="/settings" element={<Settings user={user} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function DashboardHome() {
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalStudents: 0,
    totalBorrowed: 0,
    overdueBooks: 0,
    pendingRequests: 0,
  });

  const fetchStatsWithRetry = async (attempt = 1) => {
    const maxAttempts = 3;
    const backoffMs = 1000 * attempt;

    try {
      const response = await axios.get("/api/borrow/stats");
      setStats(response.data);
    } catch (error) {
      if (attempt < maxAttempts) {
        window.setTimeout(() => fetchStatsWithRetry(attempt + 1), backoffMs);
      } else {
        console.error("Failed to load dashboard stats after retries:", error);
      }
    }
  };

  useEffect(() => {
    fetchStatsWithRetry();
  }, []);

  const cards = [
    {
      label: "Total Books Catalog",
      value: stats.totalBooks,
      color: "border-blue-500 text-blue-600 bg-blue-50/50 dark:bg-blue-900/10",
    },
    {
      label: "Registered Students",
      value: stats.totalStudents,
      color:
        "border-indigo-500 text-indigo-650 bg-indigo-50/50 dark:bg-indigo-900/10",
    },
    {
      label: "Currently Borrowed",
      value: stats.totalBorrowed,
      color:
        "border-green-500 text-green-600 bg-green-50/50 dark:bg-green-900/10",
    },
    {
      label: "Overdue Return Dates",
      value: stats.overdueBooks,
      color: "border-red-500 text-red-600 bg-red-50/50 dark:bg-red-900/10 ",
    },
    {
      label: "Pending Requests",
      value: stats.pendingRequests,
      color:
        "border-amber-500 text-amber-600 bg-amber-50/50 dark:bg-amber-900/10",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className={`card border-l-4 ${c.color}`}>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {c.label}
            </p>
            <p className="mt-3 text-3xl font-extrabold">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card">
          <h3 className="text-sm font-bold uppercase text-slate-500 tracking-wider mb-3">
            Admin Actions Quicklinks
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <Link
              to="/admin/borrow-requests"
              className="p-4 rounded-xl bg-blue-550/10 hover:bg-blue-600/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold text-center transition text-xs"
            >
              Manage Borrow Requests
            </Link>
            <Link
              to="/admin/accounts"
              className="p-4 rounded-xl bg-green-550/10 hover:bg-green-600/10 border border-green-500/20 text-green-600 dark:text-green-400 font-semibold text-center transition text-xs"
            >
              Manage User Accounts
            </Link>
          </div>
        </div>
        <div className="card flex items-center justify-center p-6 text-center text-slate-550">
          <div>
            <Library size={32} className="mx-auto mb-2 text-blue-600" />
            <p className="font-semibold text-sm">System Operations Normal</p>
            <p className="text-[11px] text-slate-400 mt-1">
              E-Library system processes ticket entries automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BookManagement() {
  const [books, setBooks] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    accNo: "",
    publisher: "",
    year: new Date().getFullYear(),
    quantity: 1,
    description: "",
    coverImage: "",
  });
  const [editingBook, setEditingBook] = useState(null);
  const [search, setSearch] = useState("");
  const [booksLoading, setBooksLoading] = useState(false);
  const debouncedSearch = useDebounce(search, 300);
  const [currentBooksPage, setCurrentBooksPage] = useState(1);
  const itemsPerPage = 10;
  const [notification, setNotification] = useState(null);
  const [uploadSummary, setUploadSummary] = useState(null);
  const [savingBook, setSavingBook] = useState(false);

  useEffect(() => {
    if (!uploadSummary) return undefined;
    const t = window.setTimeout(() => setUploadSummary(null), 3000);
    return () => window.clearTimeout(t);
  }, [uploadSummary]);

  useEffect(() => {
    if (!notification) return undefined;
    const timer = window.setTimeout(() => setNotification(null), 3000);
    return () => window.clearTimeout(timer);
  }, [notification]);

  const fetchBooks = async () => {
    setBooksLoading(true);
    try {
      const { data } = await axios.get("/api/books");
      setBooks(data);
    } finally {
      setBooksLoading(false);
    }
  };
  useEffect(() => {
    fetchBooks();
  }, []);

  const saveBook = async (e) => {
    e.preventDefault();
    setSavingBook(true);
    try {
      if (editingBook) {
        await axios.put(`/api/books/${editingBook._id}`, formData);
        setNotification({
          text: `Book updated successfully: "${formData.title}"`,
          type: "success",
        });
      } else {
        const response = await axios.post("/api/books", formData);
        setNotification({
          text: `New book added successfully: "${response.data.title}"`,
          type: "success",
        });
      }
      setEditingBook(null);
      setFormData({
        title: "",
        author: "",
        accNo: "",
        publisher: "",
        year: new Date().getFullYear(),
        quantity: 1,
        description: "",
        coverImage: "",
      });
      fetchBooks();
    } catch (error) {
      console.error("Save book error:", error.response || error);
      setNotification({
        text:
          (error.response &&
            (error.response.data?.message ||
              JSON.stringify(error.response.data))) ||
          error.message ||
          "Unable to save book",
        type: "error",
      });
    } finally {
      setSavingBook(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const payload = new FormData();
    payload.append("file", file);
    const { data } = await axios.post("/api/books/import-excel", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    setUploadSummary(data);
    fetchBooks();
  };

  const filtered = books.filter((b) =>
    `${b.title} ${b.author} ${b.accNo} ${b.publisher}`
      .toLowerCase()
      .includes(debouncedSearch.toLowerCase()),
  );

  const totalBooksPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentBooksPage - 1) * itemsPerPage;
  const paginatedBooks = filtered.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentBooksPage(1);
  }, [debouncedSearch]);

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="mb-4 text-lg font-bold text-slate-800 dark:text-white">
          Add or Edit Catalog Book
        </h2>
        {notification && (
          <div
            className={`mb-4 rounded-xl px-4 py-3 text-sm flex items-center justify-between ${notification.type === "success" ? "bg-green-600 text-white shadow-green-200/20" : "bg-red-600 text-white shadow-red-200/20"}`}
          >
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-90">
                {notification.type === "success" ? "Success" : "Warning"}
              </p>
              <p className="mt-1 leading-snug">{notification.text}</p>
            </div>
            <button
              type="button"
              onClick={() => setNotification(null)}
              className="text-white hover:opacity-80"
            >
              <X size={14} />
            </button>
          </div>
        )}
        <form onSubmit={saveBook} className="grid gap-4 md:grid-cols-2">
          {["accNo", "title", "author", "publisher", "year"].map((key) => (
            <input
              key={key}
              type={key === "year" ? "text" : "text"}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-800 transition"
              placeholder={
                key === "accNo"
                  ? "Accession Number"
                  : key === "year"
                    ? "Year"
                    : key.charAt(0).toUpperCase() + key.slice(1)
              }
              value={formData[key]}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  [key]:
                    key === "year" ? Number(e.target.value) : e.target.value,
                })
              }
            />
          ))}
          <input
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-800 transition"
            type="text"
            placeholder="Quantity"
            value={formData.quantity}
            onChange={(e) =>
              setFormData({
                ...formData,
                quantity: Number(e.target.value),
              })
            }
          />
          <textarea
            className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-800 transition md:col-span-2"
            rows={3}
            placeholder="Book description details..."
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={savingBook}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold px-4 py-2.5 text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingBook
                ? editingBook
                  ? "Updating..."
                  : "Saving..."
                : editingBook
                  ? "Update Catalog Item"
                  : "Add Catalog Item"}
            </button>
          </div>
        </form>
      </div>

      {/* <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              Import Books from Excel
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Required columns: accNo, title, author, publisher, year
            </p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-indigo-650 hover:bg-indigo-700 px-4 py-2.5 text-xs font-semibold text-white transition">
            <Upload size={14} /> Upload XLSX
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleImport}
            />
          </label>
        </div>
        {uploadSummary && (
          <p className="mt-3 text-xs rounded-lg inline-block bg-green-600 text-white px-3 py-2">
            Imported: <strong>{uploadSummary.importedCount}</strong>, Updated:{" "}
            <strong>{uploadSummary.updatedCount}</strong>, Skipped:{" "}
            <strong>{uploadSummary.skippedCount}</strong>
          </p>
        )}
      </div> */}

      <div className="card">
        <div className="relative mb-4">
          <Search
            size={16}
            className="absolute left-3 top-3.5 text-slate-400"
          />
          <input
            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 text-xs outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-800 transition"
            placeholder="Search books in database..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="text-left text-slate-500 uppercase tracking-wider">
                <th className="pb-3 font-semibold">Acc No.</th>
                <th className="pb-3 font-semibold">Title</th>
                <th className="pb-3 font-semibold">Author</th>
                <th className="pb-3 font-semibold">Publisher</th>
                <th className="pb-3 font-semibold">Year</th>
                <th className="pb-3 font-semibold">Qty</th>
                <th className="pb-3 font-semibold">Available</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {booksLoading && (
                <>
                  <SkeletonTableRow columns={8} />
                  <SkeletonTableRow columns={8} />
                  <SkeletonTableRow columns={8} />
                </>
              )}
              {!booksLoading &&
                paginatedBooks.map((b) => (
                  <tr
                    key={b._id}
                    className="border-t border-slate-200 dark:border-slate-800 transition hover:bg-slate-100/40 dark:hover:bg-slate-900/30"
                  >
                    <td className="py-3 font-mono">{b.accNo}</td>
                    <td className="py-3 font-bold">{b.title}</td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">
                      {b.author}
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">
                      {b.publisher}
                    </td>
                    <td className="py-3">{b.year}</td>
                    <td className="py-3">{b.quantity}</td>
                    <td className="py-3 font-bold text-green-600 dark:text-green-450">
                      {b.available}
                    </td>
                    <td className="py-3 space-x-3 text-right">
                      <button
                        className="text-blue-600 hover:text-blue-800"
                        onClick={() => {
                          setEditingBook(b);
                          setFormData({
                            title: b.title,
                            author: b.author,
                            accNo: b.accNo,
                            publisher: b.publisher,
                            year: b.year,
                            quantity: b.quantity,
                            description: b.description || "",
                            coverImage: b.coverImage || "",
                          });
                        }}
                      >
                        <Pencil size={14} className="inline" /> Edit
                      </button>
                      <button
                        className="text-red-500 hover:text-red-700"
                        onClick={async () => {
                          await axios.delete(`/api/books/${b._id}`);
                          fetchBooks();
                        }}
                      >
                        <Trash2 size={14} className="inline" /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-450">
                    No matching books in catalog database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing {startIndex + 1} -{" "}
              {Math.min(startIndex + itemsPerPage, filtered.length)} of{" "}
              {filtered.length}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentBooksPage((p) => Math.max(1, p - 1))}
                disabled={currentBooksPage === 1}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalBooksPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentBooksPage(i + 1)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                      currentBooksPage === i + 1
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() =>
                  setCurrentBooksPage((p) => Math.min(totalBooksPages, p + 1))
                }
                disabled={currentBooksPage === totalBooksPages}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BorrowRequests() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);
  const [borrowsLoading, setBorrowsLoading] = useState(false);
  const [currentBorrowsPage, setCurrentBorrowsPage] = useState(1);
  const [notice, setNotice] = useState("");
  const itemsPerPage = 10;

  const fetchRequests = async () => {
    const url =
      filter === "all" ? "/api/borrow/all" : `/api/borrow/all?status=${filter}`;
    const { data } = await axios.get(url);
    setRequests(data);
  };

  useEffect(() => {
    fetchRequests();
  }, [filter]);

  useEffect(() => {
    const apiBaseUrl = import.meta.env.VITE_API_URL || "";
    const socketUrl = apiBaseUrl || undefined;
    const socket = io(socketUrl, {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      socket.emit("join", { role: "admin" });
    });

    socket.on("newBorrowRequest", (newRequest) => {
      setNotice(`New borrow request received for ${newRequest.book?.title}`);
      setRequests((prev) => [newRequest, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const updateStatus = async (id, status) => {
    try {
      const { data } = await axios.put(`/api/borrow/${id}/status`, { status });
      setNotice(data.message || `Request marked as ${status}`);
      fetchRequests();
    } catch (error) {
      setNotice(error.response?.data?.message || "Unable to update request");
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const query = debouncedQuery.toLowerCase();
      return (
        (r.ticketNumber && r.ticketNumber.toLowerCase().includes(query)) ||
        (r.user?.name && r.user.name.toLowerCase().includes(query)) ||
        (r.book?.title && r.book.title.toLowerCase().includes(query))
      );
    });
  }, [requests, debouncedQuery]);

  useEffect(() => {
    setCurrentBorrowsPage(1);
  }, [debouncedQuery]);

  const totalBorrowsPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const borrowsStartIndex = (currentBorrowsPage - 1) * itemsPerPage;
  const paginatedRequests = filteredRequests.slice(
    borrowsStartIndex,
    borrowsStartIndex + itemsPerPage,
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
      case "approved":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 font-extrabold animate-pulse";
      case "returned":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400";
    }
  };

  return (
    <div className="space-y-6">
      {notice && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-700 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-450 flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice("")} className="hover:text-blue-900">
            <X size={14} />
          </button>
        </div>
      )}

      <div className="card">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-4">
          <div className="flex flex-wrap gap-2">
            {[
              "all",
              "pending",
              "approved",
              "overdue",
              "returned",
              "cancelled",
            ].map((f) => (
              <button
                key={f}
                className={`rounded-xl px-3 py-1.5 text-xs font-semibold uppercase transition ${filter === f ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750"}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search
              size={14}
              className="absolute left-3 top-3 text-slate-400"
            />
            <input
              className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-800"
              placeholder="Search Ticket, Student, Book..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="text-left text-slate-500 uppercase tracking-wider">
                <th className="pb-3 font-semibold">Student</th>
                <th className="pb-3 font-semibold">Book Title</th>
                <th className="pb-3 font-semibold">Ticket</th>
                <th className="pb-3 font-semibold">Due Date</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {borrowsLoading && (
                <>
                  <SkeletonTableRow columns={6} />
                  <SkeletonTableRow columns={6} />
                  <SkeletonTableRow columns={6} />
                </>
              )}
              {!borrowsLoading &&
                paginatedRequests.map((r) => (
                  <tr
                    key={r._id}
                    className="border-t border-slate-200 dark:border-slate-800 transition hover:bg-slate-100/40 dark:hover:bg-slate-900/30"
                  >
                    <td className="py-3 font-semibold">
                      {r.user?.name}
                      <span className="block text-[10px] font-normal text-slate-400">
                        {r.user?.email}
                      </span>
                    </td>
                    <td className="py-3 font-semibold">{r.book?.title}</td>
                    <td className="py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {r.ticketNumber || "—"}
                    </td>
                    <td className="py-3 text-slate-500">
                      {new Date(r.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider ${getStatusBadge(r.status)}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 space-x-2 text-right">
                      {r.status === "pending" && (
                        <>
                          <button
                            className="rounded-lg bg-green-600 hover:bg-green-700 px-3 py-1 font-semibold text-white transition text-[10px]"
                            onClick={() => updateStatus(r._id, "approved")}
                          >
                            Approve
                          </button>
                          <button
                            className="rounded-lg bg-red-600 hover:bg-red-700 px-3 py-1 font-semibold text-white transition text-[10px]"
                            onClick={() => updateStatus(r._id, "rejected")}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {(r.status === "approved" || r.status === "overdue") && (
                        <button
                          className="rounded-lg bg-green-600 hover:bg-green-700 px-3 py-1 font-semibold text-white transition text-[10px]"
                          onClick={() => updateStatus(r._id, "returned")}
                        >
                          Mark Returned
                        </button>
                      )}
                      {r.status === "approved" && (
                        <button
                          className="rounded-lg bg-amber-600 hover:bg-amber-700 px-3 py-1 font-semibold text-white transition text-[10px]"
                          onClick={() => updateStatus(r._id, "overdue")}
                        >
                          Mark Overdue
                        </button>
                      )}
                      {["returned", "rejected", "cancelled"].includes(
                        r.status,
                      ) && (
                        <span className="text-slate-400 font-medium text-[11px]">
                          —
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-450">
                    No borrow requests match the filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredRequests.length > 0 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing {borrowsStartIndex + 1} -{" "}
              {Math.min(
                borrowsStartIndex + itemsPerPage,
                filteredRequests.length,
              )}{" "}
              of {filteredRequests.length}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentBorrowsPage((p) => Math.max(1, p - 1))}
                disabled={currentBorrowsPage === 1}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalBorrowsPages }, (_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentBorrowsPage(i + 1)}
                    className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                      currentBorrowsPage === i + 1
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750"
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() =>
                  setCurrentBorrowsPage((p) =>
                    Math.min(totalBorrowsPages, p + 1),
                  )
                }
                disabled={currentBorrowsPage === totalBorrowsPages}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AccountManagement() {
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [currentUsersPage, setCurrentUsersPage] = useState(1);
  const [usersSearch, setUsersSearch] = useState("");
  const debouncedUsersSearch = useDebounce(usersSearch, 300);
  const itemsPerPage = 10;

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const { data } = await axios.get("/api/auth/users");
      setUsers(data);
    } finally {
      setUsersLoading(false);
    }
  };
  useEffect(() => {
    fetchUsers();
  }, []);

  const totalUsersPages = Math.ceil(users.length / itemsPerPage);
  const usersStartIndex = (currentUsersPage - 1) * itemsPerPage;
  const paginatedUsers = users.slice(
    usersStartIndex,
    usersStartIndex + itemsPerPage,
  );

  const filteredUsers = users.filter((u) =>
    `${u.name} ${u.email} ${u.role}`
      .toLowerCase()
      .includes(debouncedUsersSearch.toLowerCase()),
  );

  const totalFilteredUsersPages = Math.ceil(
    filteredUsers.length / itemsPerPage,
  );
  const filteredUsersStartIndex = (currentUsersPage - 1) * itemsPerPage;
  const paginatedFilteredUsers = filteredUsers.slice(
    filteredUsersStartIndex,
    filteredUsersStartIndex + itemsPerPage,
  );

  useEffect(() => {
    setCurrentUsersPage(1);
  }, [debouncedUsersSearch]);

  const getBorrowBadge = (user) => {
    if (user.role === "admin") return <span className="text-slate-400">—</span>;

    if (user.status === "blocked") {
      const reason = user.blockReason || "Blocked";
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400">
          <UserX size={10} />{" "}
          {reason === "Overdue book return"
            ? "Blocked (Overdue)"
            : "Blocked (Manual)"}
        </span>
      );
    }

    if (user.overdueBorrowsCount > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
          <AlertTriangle size={10} /> Has Overdue Books
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400">
        <UserCheck size={10} /> Eligible to Borrow
      </span>
    );
  };

  return (
    <div className="card">
      <h2 className="mb-4 text-lg font-bold text-slate-800 dark:text-white">
        Registered Accounts & Eligibility Restrictions
      </h2>

      <div className="mb-4 relative w-full md:w-64">
        <Search size={14} className="absolute left-3 top-3 text-slate-400" />
        <input
          className="w-full rounded-xl border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-800"
          placeholder="Search name, email, role..."
          value={usersSearch}
          onChange={(e) => setUsersSearch(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="text-left text-slate-500 uppercase tracking-wider">
              <th className="pb-3 font-semibold">User details</th>
              <th className="pb-3 font-semibold">Role</th>
              <th className="pb-3 font-semibold">Active Borrows</th>
              <th className="pb-3 font-semibold">Overdue Books</th>
              <th className="pb-3 font-semibold">Eligibility Status</th>
              <th className="pb-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {usersLoading && (
              <>
                <SkeletonTableRow columns={6} />
                <SkeletonTableRow columns={6} />
                <SkeletonTableRow columns={6} />
              </>
            )}
            {!usersLoading &&
              paginatedFilteredUsers.map((u) => (
                <tr
                  key={u._id}
                  className="border-t border-slate-200 dark:border-slate-800 transition hover:bg-slate-100/40 dark:hover:bg-slate-900/30"
                >
                  <td className="py-3 font-semibold">
                    {u.name}
                    <span className="block text-[10px] font-normal text-slate-400">
                      {u.email}
                    </span>
                  </td>
                  <td className="py-3 capitalize text-slate-500">{u.role}</td>
                  <td className="py-3 font-bold text-slate-700 dark:text-slate-300">
                    {u.role === "student" ? u.activeBorrowsCount || 0 : "—"}
                  </td>
                  <td
                    className={`py-3 font-bold ${u.overdueBorrowsCount > 0 ? "text-red-500" : "text-slate-400"}`}
                  >
                    {u.role === "student" ? u.overdueBorrowsCount || 0 : "—"}
                  </td>
                  <td className="py-3">{getBorrowBadge(u)}</td>
                  <td className="py-3 text-right">
                    {u.role !== "admin" ? (
                      <button
                        className={`rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition text-white ${
                          u.status === "blocked"
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-amber-600 hover:bg-amber-700"
                        }`}
                        onClick={async () => {
                          const next =
                            u.status === "blocked" ? "active" : "blocked";
                          await axios.put(`/api/auth/users/${u._id}/status`, {
                            status: next,
                            blockReason:
                              next === "blocked" ? "Manual restriction" : null,
                          });
                          fetchUsers();
                        }}
                      >
                        {u.status === "blocked"
                          ? "Unblock Borrowing"
                          : "Block Borrowing"}
                      </button>
                    ) : (
                      <span className="text-slate-400 font-medium text-[11px]">
                        —
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            {filteredUsers.length === 0 && !usersLoading && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-450">
                  No accounts match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredUsers.length > 0 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Showing {filteredUsersStartIndex + 1} -{" "}
            {Math.min(
              filteredUsersStartIndex + itemsPerPage,
              filteredUsers.length,
            )}{" "}
            of {filteredUsers.length}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentUsersPage((p) => Math.max(1, p - 1))}
              disabled={currentUsersPage === 1}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalFilteredUsersPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentUsersPage(i + 1)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                    currentUsersPage === i + 1
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() =>
                setCurrentUsersPage((p) =>
                  Math.min(totalFilteredUsersPages, p + 1),
                )
              }
              disabled={currentUsersPage === totalFilteredUsersPages}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Settings({ user }) {
  const { updateUser } = useContext(AuthContext);
  const [emailForm, setEmailForm] = useState({
    email: user?.email || "",
    currentPassword: "",
  });
  const [nameForm, setNameForm] = useState({
    name: user?.name || "",
    currentPassword: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });
  const [emailFeedback, setEmailFeedback] = useState({ type: "", text: "" });
  const [nameFeedback, setNameFeedback] = useState({ type: "", text: "" });
  const [passwordFeedback, setPasswordFeedback] = useState({
    type: "",
    text: "",
  });

  useEffect(() => {
    if (emailFeedback.text) {
      const timer = setTimeout(
        () => setEmailFeedback({ type: "", text: "" }),
        3000,
      );
      return () => clearTimeout(timer);
    }
  }, [emailFeedback.text]);

  useEffect(() => {
    if (nameFeedback.text) {
      const timer = setTimeout(
        () => setNameFeedback({ type: "", text: "" }),
        3000,
      );
      return () => clearTimeout(timer);
    }
  }, [nameFeedback.text]);

  useEffect(() => {
    if (passwordFeedback.text) {
      const timer = setTimeout(
        () => setPasswordFeedback({ type: "", text: "" }),
        3000,
      );
      return () => clearTimeout(timer);
    }
  }, [passwordFeedback.text]);

  const handleEmailChange = async (e) => {
    e.preventDefault();
    setEmailFeedback({ type: "", text: "" });

    try {
      const { data } = await axios.put("/api/auth/me/email", {
        email: emailForm.email,
        currentPassword: emailForm.currentPassword,
      });

      updateUser({
        ...(user || {}),
        email: data.user?.email || emailForm.email,
      });
      setEmailForm({
        email: data.user?.email || emailForm.email,
        currentPassword: "",
      });
      setEmailFeedback({
        type: "success",
        text: data.message || "Email updated successfully.",
      });
    } catch (error) {
      setEmailFeedback({
        type: "error",
        text:
          error.response?.data?.message || "Unable to update email right now.",
      });
    }
  };

  const handleNameChange = async (e) => {
    e.preventDefault();
    setNameFeedback({ type: "", text: "" });

    try {
      const { data } = await axios.put("/api/auth/me/name", {
        name: nameForm.name,
        currentPassword: nameForm.currentPassword,
      });

      updateUser({ ...(user || {}), name: data.user?.name || nameForm.name });
      setNameForm({
        name: data.user?.name || nameForm.name,
        currentPassword: "",
      });
      setNameFeedback({
        type: "success",
        text: data.message || "Name updated successfully.",
      });
    } catch (error) {
      setNameFeedback({
        type: "error",
        text:
          error.response?.data?.message || "Unable to update name right now.",
      });
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordFeedback({ type: "", text: "" });

    try {
      const { data } = await axios.put("/api/auth/me/password", {
        currentPassword: passwordForm.currentPassword,
        password: passwordForm.password,
        confirmPassword: passwordForm.confirmPassword,
      });

      setPasswordForm({
        currentPassword: "",
        password: "",
        confirmPassword: "",
      });
      setPasswordFeedback({
        type: "success",
        text: data.message || "Password updated successfully.",
      });
    } catch (error) {
      setPasswordFeedback({
        type: "error",
        text:
          error.response?.data?.message ||
          "Unable to update password right now.",
      });
    }
  };

  return (
    <div className="card space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-800 dark:text-white">
          Admin Settings
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Manage your account details securely from here.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-white">
            Change Email
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Enter the new email address and confirm it with your password.
          </p>
        </div>

        {emailFeedback.text && (
          <div
            className={`rounded-xl px-4 py-3 text-sm ${emailFeedback.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}
          >
            {emailFeedback.text}
          </div>
        )}

        <form onSubmit={handleEmailChange} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              New Email
            </label>
            <input
              type="email"
              value={emailForm.email}
              onChange={(e) =>
                setEmailForm({ ...emailForm, email: e.target.value })
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-800"
              placeholder="Enter new email"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Confirm Password
            </label>
            <input
              type="password"
              value={emailForm.currentPassword}
              onChange={(e) =>
                setEmailForm({ ...emailForm, currentPassword: e.target.value })
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-800"
              placeholder="Enter current password"
              required
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Update Email
          </button>
        </form>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-white">
            Change Name
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Update your display name and confirm with your password.
          </p>
        </div>

        {nameFeedback.text && (
          <div
            className={`rounded-xl px-4 py-3 text-sm ${nameFeedback.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}
          >
            {nameFeedback.text}
          </div>
        )}

        <form onSubmit={handleNameChange} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              New Name
            </label>
            <input
              type="text"
              value={nameForm.name}
              onChange={(e) =>
                setNameForm({ ...nameForm, name: e.target.value })
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-800"
              placeholder="Enter new name"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Confirm Password
            </label>
            <input
              type="password"
              value={nameForm.currentPassword}
              onChange={(e) =>
                setNameForm({ ...nameForm, currentPassword: e.target.value })
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-800"
              placeholder="Enter current password"
              required
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Update Name
          </button>
        </form>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
        <div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-white">
            Change Password
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Confirm your new password before submitting.
          </p>
        </div>

        {passwordFeedback.text && (
          <div
            className={`rounded-xl px-4 py-3 text-sm ${passwordFeedback.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}
          >
            {passwordFeedback.text}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              Current Password
            </label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  currentPassword: e.target.value,
                })
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-800"
              placeholder="Enter current password"
              required
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                New Password
              </label>
              <input
                type="password"
                value={passwordForm.password}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, password: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-800"
                placeholder="Enter new password"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Confirm Password
              </label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-800"
                placeholder="Re-enter new password"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}
export default AdminDashboard;
