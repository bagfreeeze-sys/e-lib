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
} from "lucide-react";
import { io } from "socket.io-client";
import axios from "axios";
import { AuthContext } from "../App";

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

  useEffect(() => {
    axios
      .get("/api/borrow/stats")
      .then((res) => setStats(res.data))
      .catch(() => null);
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
      color:
        "border-red-500 text-red-600 bg-red-50/50 dark:bg-red-900/10 animate-pulse",
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
    const { data } = await axios.get("/api/books");
    setBooks(data);
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
      .includes(search.toLowerCase()),
  );

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
              type={key === "year" ? "number" : "text"}
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
            type="number"
            min={1}
            placeholder="Quantity"
            value={formData.quantity}
            onChange={(e) =>
              setFormData({ ...formData, quantity: Number(e.target.value) })
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
              {filtered.map((b) => (
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
      </div>
    </div>
  );
}

function BorrowRequests() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [notice, setNotice] = useState("");

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
    const socket = io("http://localhost:5000", {
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
      const query = searchQuery.toLowerCase();
      return (
        (r.ticketNumber && r.ticketNumber.toLowerCase().includes(query)) ||
        (r.user?.name && r.user.name.toLowerCase().includes(query)) ||
        (r.book?.title && r.book.title.toLowerCase().includes(query))
      );
    });
  }, [requests, searchQuery]);

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
              {filteredRequests.map((r) => (
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
      </div>
    </div>
  );
}

function AccountManagement() {
  const [users, setUsers] = useState([]);
  const fetchUsers = async () => {
    const { data } = await axios.get("/api/auth/users");
    setUsers(data);
  };
  useEffect(() => {
    fetchUsers();
  }, []);

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
            {users.map((u) => (
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
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminDashboard;
