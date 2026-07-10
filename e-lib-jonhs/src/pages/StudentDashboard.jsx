import React, {
  useState,
  useEffect,
  useContext,
  useTransition,
  useMemo,
  Suspense,
} from "react";
import {
  useNavigate,
  Routes,
  Route,
  useLocation,
  Link,
} from "react-router-dom";
import {
  Library,
  HandHelping,
  LogOut,
  Moon,
  Sun,
  Search,
  Menu,
  X,
  Bell,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Ticket,
  ShieldAlert,
} from "lucide-react";
import { io } from "socket.io-client";
import axios from "axios";
import { AuthContext } from "../App";
import { createResource } from "../utils/fetchResource";

function StudentDashboard() {
  const { user, logout, theme, toggleTheme } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [openNav, setOpenNav] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [openNotifDropdown, setOpenNotifDropdown] = useState(false);

  // Local state for requests to compute notifications dynamically without suspending the header
  const [requestsList, setRequestsList] = useState([]);

  const [booksResource, setBooksResource] = useState(() =>
    createResource(axios.get("/api/books").then((res) => res.data)),
  );

  const [requestsResource, setRequestsResource] = useState(() =>
    createResource(
      axios.get("/api/borrow/my-requests").then((res) => res.data),
    ),
  );

  const [search, setSearch] = useState("");

  const fetchRequestsData = async () => {
    try {
      const { data } = await axios.get("/api/borrow/my-requests");
      setRequestsList(data);
    } catch (error) {
      console.error("Failed to fetch requests", error);
    }
  };

  useEffect(() => {
    fetchRequestsData();
  }, []);

  useEffect(() => {
    if (!user?._id) return undefined;

    const socket = io("http://localhost:5000", {
      transports: ["websocket"],
    });

    socket.on("connect", () => {
      socket.emit("join", { userId: user._id, role: user.role });
    });

    socket.on("borrowRequestUpdated", (updatedRequest) => {
      setRequestsList((prev) => {
        const exists = prev.find((r) => r._id === updatedRequest._id);
        if (exists) {
          return prev.map((r) =>
            r._id === updatedRequest._id ? updatedRequest : r,
          );
        }
        return [updatedRequest, ...prev];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const refreshBooks = () => {
    startTransition(() => {
      setBooksResource(
        createResource(axios.get("/api/books").then((res) => res.data)),
      );
    });
  };

  const refreshRequests = () => {
    fetchRequestsData();
    startTransition(() => {
      setRequestsResource(
        createResource(
          axios.get("/api/borrow/my-requests").then((res) => res.data),
        ),
      );
    });
  };

  const handleSearchChange = (value) => {
    startTransition(() => {
      setSearch(value);
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // Dynamic Notification Engine
  const notificationsList = useMemo(() => {
    const list = [];
    const dismissed = JSON.parse(
      localStorage.getItem("dismissedNotifications") || "[]",
    );

    requestsList.forEach((r) => {
      if (!r.book) return;

      const now = new Date();
      const due = new Date(r.dueDate);
      const diffTime = due - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (
        r.status === "overdue" ||
        (r.status === "approved" && diffDays < 0 && r.returnDate === null)
      ) {
        list.push({
          id: `overdue-${r._id}`,
          title: "Overdue Book Return",
          message: `Your borrowed book "${r.book.title}" was due on ${due.toLocaleDateString()}. Please return it to the library immediately.`,
          severity: "critical",
          dismissible: false,
        });
      } else if (r.status === "approved" && r.returnDate === null) {
        if (diffDays >= 0 && diffDays <= 3) {
          list.push({
            id: `near-${r._id}`,
            title: "Return Date Approaching",
            message: `"${r.book.title}" return is near! Due in ${diffDays} day${diffDays === 1 ? "" : "s"} (${due.toLocaleDateString()}).`,
            severity: "warning",
            dismissible: false,
          });
        } else {
          // Standard approved request (dismissible)
          if (!dismissed.includes(`approved-${r._id}`)) {
            list.push({
              id: `approved-${r._id}`,
              title: "Request Approved",
              message: `Your request for "${r.book.title}" is approved. Show this ticket code at the library desk.`,
              ticketNumber: r.ticketNumber,
              severity: "success",
              dismissible: true,
            });
          }
        }
      } else if (r.status === "rejected") {
        if (!dismissed.includes(`rejected-${r._id}`)) {
          list.push({
            id: `rejected-${r._id}`,
            title: "Request Declined",
            message: `Your request for "${r.book.title}" was rejected by admin.`,
            severity: "critical",
            dismissible: true,
          });
        }
      }
    });

    return list;
  }, [requestsList]);

  // Auto-dismiss dismissible header notifications after 3 seconds
  useEffect(() => {
    if (!notificationsList || notificationsList.length === 0) return undefined;
    const timers = notificationsList
      .filter((n) => n.dismissible)
      .map((n) =>
        window.setTimeout(() => {
          dismissNotification(n.id);
        }, 3000),
      );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [notificationsList]);

  const unreadCount = notificationsList.length;

  const dismissNotification = (id) => {
    const dismissed = JSON.parse(
      localStorage.getItem("dismissedNotifications") || "[]",
    );
    dismissed.push(id);
    localStorage.setItem("dismissedNotifications", JSON.stringify(dismissed));
    fetchRequestsData(); // Trigger list re-calculation
  };

  const dismissAllNotifications = () => {
    const dismissed = JSON.parse(
      localStorage.getItem("dismissedNotifications") || "[]",
    );
    notificationsList.forEach((n) => {
      if (n.dismissible) dismissed.push(n.id);
    });
    localStorage.setItem("dismissedNotifications", JSON.stringify(dismissed));
    fetchRequestsData();
  };

  // State to hold a selected ticket for the boarding pass modal
  const [selectedTicket, setSelectedTicket] = useState(null);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <aside
        className={`${openNav ? "translate-x-0" : "-translate-x-full"} fixed z-30 h-full w-64 border-r border-slate-200 bg-white p-4 transition-transform md:translate-x-0 dark:border-slate-800 dark:bg-slate-900`}
      >
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
              L
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              E-Library
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
          <Link
            to="/student"
            className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${location.pathname === "/student" ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" : "hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400"}`}
          >
            <Library size={18} /> Available Books
          </Link>
          <Link
            to="/student/my-requests"
            className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition ${location.pathname === "/student/my-requests" ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400" : "hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400"}`}
          >
            <HandHelping size={18} /> My Requests
          </Link>
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
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-ping"></span>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Welcome, {user?.name}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification Dropdown Bell */}
            <div className="relative">
              <button
                className={`rounded-xl border border-slate-300 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition ${unreadCount > 0 ? "bell-ring" : ""}`}
                onClick={() => setOpenNotifDropdown(!openNotifDropdown)}
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {openNotifDropdown && (
                <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in-50 slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-2">
                    <span className="font-bold text-xs uppercase tracking-wider text-slate-500">
                      Notifications
                    </span>
                    {unreadCount > 0 && (
                      <button
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                        onClick={dismissAllNotifications}
                      >
                        Dismiss All
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto custom-scrollbar space-y-2">
                    {notificationsList.length === 0 ? (
                      <p className="text-center text-xs text-slate-400 py-6">
                        No notifications
                      </p>
                    ) : (
                      notificationsList.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3 rounded-xl flex gap-2 text-xs relative transition ${
                            n.severity === "critical"
                              ? "bg-red-600 text-white shadow-red-200/20"
                              : n.severity === "warning"
                                ? "bg-amber-500 text-slate-950 shadow-amber-200/30"
                                : "bg-green-600 text-white shadow-green-200/20"
                          }`}
                        >
                          <div className="mt-0.5">
                            {n.severity === "critical" ? (
                              <ShieldAlert size={14} className="text-white" />
                            ) : n.severity === "warning" ? (
                              <AlertTriangle
                                size={14}
                                className="text-slate-950"
                              />
                            ) : (
                              <CheckCircle2 size={14} className="text-white" />
                            )}
                          </div>
                          <div className="flex-1 pr-4">
                            <p className="font-bold text-sm leading-tight">
                              {n.title}
                            </p>
                            <p className="text-[11px] opacity-90 mt-0.5">
                              {n.message}
                            </p>
                            {n.ticketNumber && (
                              <div className="mt-2 flex items-center gap-1 text-[10px] font-mono bg-blue-100/50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded w-max">
                                <span>{n.ticketNumber}</span>
                                <button
                                  className="p-0.5 hover:bg-blue-100 rounded transition dark:hover:bg-blue-800"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(
                                      n.ticketNumber,
                                    );
                                  }}
                                >
                                  <Copy size={10} />
                                </button>
                              </div>
                            )}
                          </div>
                          {n.dismissible && (
                            <button
                              className="absolute top-2 right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              onClick={() => dismissNotification(n.id)}
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

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
          <Suspense
            fallback={
              <div className="flex items-center justify-center py-20 text-slate-500">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mr-2" />
                Loading e-library content...
              </div>
            }
          >
            <Routes>
              <Route
                path="/"
                element={
                  <AvailableBooks
                    user={user}
                    booksResource={booksResource}
                    search={search}
                    onSearchChange={handleSearchChange}
                    refreshBooks={refreshBooks}
                    refreshNotifications={fetchRequestsData}
                  />
                }
              />
              <Route
                path="/my-requests"
                element={
                  <MyRequests
                    requestsResource={requestsResource}
                    refreshRequests={refreshRequests}
                    pending={isPending}
                    setSelectedTicket={setSelectedTicket}
                  />
                }
              />
            </Routes>
          </Suspense>
        </main>
      </div>

      {/* Boarding Pass Ticket View Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-blue-600 px-6 py-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Ticket size={16} />
                <h3 className="font-bold tracking-widest text-xs uppercase">
                  E-Library Ticket
                </h3>
              </div>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                READY
              </span>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Book Title
                </span>
                <span className="text-base font-bold text-slate-800 dark:text-white leading-tight block">
                  {selectedTicket.bookTitle}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Author
                </span>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {selectedTicket.bookAuthor}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Borrow Date
                  </span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {new Date(
                      selectedTicket.createdAt || Date.now(),
                    ).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Due Date
                  </span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {new Date(selectedTicket.dueDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="relative my-4 border-t border-dashed border-slate-300 dark:border-slate-700">
                <div className="absolute -left-7 -top-2.5 h-5 w-5 rounded-full bg-black/50" />
                <div className="absolute -right-7 -top-2.5 h-5 w-5 rounded-full bg-black/50" />
              </div>

              <div className="text-center space-y-3">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Ticket Number
                </span>
                <div className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-1.5 text-white">
                  <span className="font-mono text-sm font-bold tracking-wider">
                    {selectedTicket.ticketNumber}
                  </span>
                  <button
                    className="p-1 hover:bg-blue-100 rounded transition dark:hover:bg-blue-800"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        selectedTicket.ticketNumber,
                      );
                    }}
                  >
                    <Copy size={13} />
                  </button>
                </div>

                {/* Barcode Mock */}
                <div className="flex items-center justify-center gap-[3px] py-1 opacity-70">
                  {[1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 4, 1, 3, 2, 1, 4, 1, 2].map(
                    (w, i) => (
                      <div
                        key={i}
                        className="h-8 bg-slate-955 dark:bg-slate-100"
                        style={{ width: `${w}px` }}
                      />
                    ),
                  )}
                </div>

                <p className="text-[11px] text-slate-500 leading-tight">
                  Present this ticket code to the library administrator in
                  person to process and pick up your book.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 px-5 py-3.5 flex justify-end border-t border-slate-100 dark:border-slate-800/50">
              <button
                className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition"
                onClick={() => setSelectedTicket(null)}
              >
                Close Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AvailableBooks({
  user,
  booksResource,
  search,
  onSearchChange,
  refreshBooks,
  refreshNotifications,
}) {
  const [toast, setToast] = useState({
    open: false,
    title: "",
    message: "",
    type: "success",
  });

  useEffect(() => {
    if (!toast.open) return undefined;
    const timer = window.setTimeout(() => {
      setToast((prev) => ({ ...prev, open: false }));
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [toast.open]);

  // State for request confirmation popover/modal
  const [confirmingBook, setConfirmingBook] = useState(null);
  const [dueDate, setDueDate] = useState("");
  const [ticketData, setTicketData] = useState(null);
  const [requestingBorrow, setRequestingBorrow] = useState(false);

  // Set default due date to 14 days from now
  useEffect(() => {
    const defaultDue = new Date();
    defaultDue.setDate(defaultDue.getDate() + 14);
    setDueDate(defaultDue.toISOString().split("T")[0]);
  }, [confirmingBook]);

  const books = booksResource.read();
  const filtered = useMemo(
    () =>
      books.filter((b) =>
        `${b.title} ${b.author} ${b.publisher} ${b.accNo}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [books, search],
  );

  const requestBorrow = async (bookId, targetDueDate) => {
    setRequestingBorrow(true);
    try {
      const { data } = await axios.post("/api/borrow", {
        bookId,
        dueDate: targetDueDate,
      });

      // Hide request modal
      setConfirmingBook(null);

      // Open ticket popup
      setTicketData({
        bookTitle: data.book?.title || confirmingBook?.title || "Book",
        bookAuthor: data.book?.author || confirmingBook?.author || "Author",
        dueDate: targetDueDate,
        ticketNumber: data.ticketNumber,
      });

      refreshBooks();
      refreshNotifications();
    } catch (error) {
      setConfirmingBook(null);
      setToast({
        open: true,
        title: "Warning",
        message: error.response?.data?.message || "Unable to request this book",
        type: "error",
      });
    } finally {
      setRequestingBorrow(false);
    }
  };

  // Auto-dismiss ticket popup after 3 seconds
  useEffect(() => {
    if (!ticketData) return undefined;
    const t = window.setTimeout(() => setTicketData(null), 3000);
    return () => window.clearTimeout(t);
  }, [ticketData]);

  return (
    <div className="space-y-4">
      {/* Toast Alert */}
      {toast.open && (
        <div
          className={`rounded-2xl px-4 py-3 text-sm flex items-center justify-between ${
            toast.type === "success"
              ? "bg-green-600 text-white shadow-green-200/20"
              : "bg-red-600 text-white shadow-red-200/20"
          }`}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wide">
              {toast.title ||
                (toast.type === "success" ? "Success" : "Warning")}
            </p>
            <p className="mt-1 text-sm leading-snug">{toast.message}</p>
          </div>
          <button onClick={() => setToast({ ...toast, open: false })}>
            <X size={16} className="text-white" />
          </button>
        </div>
      )}

      {user?.status === "blocked" && (
        <div className="rounded-2xl px-4 py-3.5 text-sm text-white bg-red-600 flex items-center gap-2">
          <ShieldAlert size={18} className="text-white" />
          <span>
            <strong>Account Blocked:</strong> Borrowing is restricted. Overdue
            return dates or manually blocked status. Please contact the
            administrator.
          </span>
        </div>
      )}

      <div className="card">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-3.5 text-slate-400"
          />
          <input
            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-3 outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-800 transition"
            placeholder="Search books by title, author, publisher, or accession number..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((b) => (
          <div
            key={b._id}
            className="card flex flex-col justify-between hover:scale-[1.01] transition-transform"
          >
            <div>
              <div className="flex justify-between items-start gap-2">
                <h3 className="text-base font-bold leading-tight text-slate-900 dark:text-white">
                  {b.title}
                </h3>
                <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  {b.publisher} ({b.year})
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{b.author}</p>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
                {b.description || "No description provided."}
              </p>
            </div>

            <div className="mt-4 border-t border-slate-100 dark:border-slate-850 pt-3">
              <div className="flex items-center justify-between text-xs mb-3">
                <span className="text-slate-450">Stock Available:</span>
                <span
                  className={`font-bold ${b.available > 0 ? "text-green-600 dark:text-green-400" : "text-red-500"}`}
                >
                  {b.available} copies
                </span>
              </div>

              <button
                disabled={b.available <= 0 || user?.status === "blocked"}
                className="w-full rounded-xl bg-blue-600 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
                onClick={() => setConfirmingBook(b)}
              >
                Request Book
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400">
            No books found matching your search.
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Request Borrow Book
              </h3>
              <p className="text-xs text-slate-505 mb-4">
                Please verify the details and select your return date:
              </p>

              <div className="rounded-xl bg-blue-600 text-white p-3.5 mb-4">
                <h4 className="font-bold text-sm leading-tight">
                  {confirmingBook.title}
                </h4>
                <p className="text-xs mt-1 opacity-90">
                  {confirmingBook.author}
                </p>
                <div className="mt-2 flex gap-3 text-[10px] opacity-90">
                  <span>Acc No: {confirmingBook.accNo}</span>
                  <span>
                    Publisher: {confirmingBook.publisher} ({confirmingBook.year}
                    )
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block">
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-350 mb-1">
                    Return Due Date
                  </span>
                  <input
                    type="date"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none ring-blue-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-800"
                    value={dueDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </label>

                <div className="flex gap-1.5">
                  {[7, 14, 30].map((days) => (
                    <button
                      key={days}
                      type="button"
                      className="flex-1 text-[10px] font-semibold py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 text-slate-500 dark:text-slate-400 transition"
                      onClick={() => {
                        const d = new Date();
                        d.setDate(d.getDate() + days);
                        setDueDate(d.toISOString().split("T")[0]);
                      }}
                    >
                      +{days} Days
                    </button>
                  ))}
                </div>

                <div className="text-[10px] bg-amber-500 text-slate-950 p-2.5 rounded-xl flex gap-1.5 items-start mt-2">
                  <AlertTriangle
                    size={14}
                    className="shrink-0 mt-0.5 text-slate-950"
                  />
                  <span>
                    Present the issued Ticket code to the librarian in-person.
                    Overdue returns automatically block your account.
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 px-5 py-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:text-slate-355 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                onClick={() => setConfirmingBook(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={requestingBorrow}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => requestBorrow(confirmingBook._id, dueDate)}
              >
                {requestingBorrow ? "Requesting..." : "Confirm Borrow"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Output Popover */}
      {ticketData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-green-600 px-6 py-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Ticket size={16} />
                <h3 className="font-bold tracking-widest text-xs uppercase">
                  Request Submitted
                </h3>
              </div>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                SUCCESS
              </span>
            </div>

            <div className="p-5 space-y-4">
              <div className="text-center">
                <div className="h-10 w-10 bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 size={24} />
                </div>
                <p className="text-xs font-semibold text-slate-505">
                  Your borrow request was created!
                </p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Book Title
                </span>
                <span className="text-base font-bold text-slate-800 dark:text-white leading-tight block">
                  {ticketData.bookTitle}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Requested On
                  </span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Due Date
                  </span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {new Date(ticketData.dueDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="relative my-4 border-t border-dashed border-slate-300 dark:border-slate-700">
                <div className="absolute -left-7 -top-2.5 h-5 w-5 rounded-full bg-black/50" />
                <div className="absolute -right-7 -top-2.5 h-5 w-5 rounded-full bg-black/50" />
              </div>

              <div className="text-center space-y-3">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  Your Ticket Number
                </span>
                <div className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3.5 py-1.5 text-white">
                  <span className="font-mono text-sm font-bold tracking-wider">
                    {ticketData.ticketNumber}
                  </span>
                  <button
                    className="p-1 hover:bg-blue-100 rounded transition dark:hover:bg-blue-800"
                    onClick={() => {
                      navigator.clipboard.writeText(ticketData.ticketNumber);
                    }}
                  >
                    <Copy size={13} />
                  </button>
                </div>

                <p className="text-[11px] text-slate-500 leading-snug">
                  Please show this ticket code to the library administrator to
                  process and pick up your book.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/40 px-5 py-3.5 flex justify-end border-t border-slate-100 dark:border-slate-800/50">
              <button
                className="rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-xs font-bold text-white transition"
                onClick={() => setTicketData(null)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MyRequests({
  requestsResource,
  refreshRequests,
  pending,
  setSelectedTicket,
}) {
  const [toast, setToast] = useState({
    open: false,
    message: "",
    type: "success",
  });
  const [cancellingRequestId, setCancellingRequestId] = useState(null);

  useEffect(() => {
    if (!toast.open) return undefined;
    const t = window.setTimeout(
      () => setToast((p) => ({ ...p, open: false })),
      3000,
    );
    return () => window.clearTimeout(t);
  }, [toast.open]);

  const requestList = requestsResource.read();

  const cancelRequest = async (id) => {
    setCancellingRequestId(id);
    try {
      const { data } = await axios.put(`/api/borrow/${id}/cancel`);
      setToast({
        open: true,
        message: data.message || "Request cancelled successfully.",
        type: "success",
      });
      refreshRequests();
    } catch (error) {
      setToast({
        open: true,
        message: error.response?.data?.message || "Unable to cancel request.",
        type: "error",
      });
    } finally {
      setCancellingRequestId(null);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
      case "overdue":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 font-bold animate-pulse";
      case "cancelled":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-450";
      case "rejected":
        return "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    }
  };

  return (
    <div className="space-y-4">
      {pending && (
        <div className="rounded-xl px-4 py-3 text-xs text-white bg-blue-600">
          Syncing request lists…
        </div>
      )}
      {toast.open && (
        <div
          className={`rounded-xl px-4 py-3 text-sm flex items-center justify-between ${
            toast.type === "success"
              ? "bg-green-600 text-white shadow-green-200/20"
              : "bg-red-600 text-white shadow-red-200/20"
          }`}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wide">
              {toast.type === "success" ? "Success" : "Warning"}
            </p>
            <p className="mt-1 text-sm leading-snug">{toast.message}</p>
          </div>
          <button onClick={() => setToast({ ...toast, open: false })}>
            <X size={16} className="text-white" />
          </button>
        </div>
      )}
      <div className="card overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="text-left text-slate-500 uppercase tracking-wider">
              <th className="pb-3 font-semibold">Book Details</th>
              <th className="pb-3 font-semibold">Ticket</th>
              <th className="pb-3 font-semibold">Due Date</th>
              <th className="pb-3 font-semibold">Status</th>
              <th className="pb-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {requestList.map((r) => (
              <tr
                key={r._id}
                className="border-t border-slate-200 dark:border-slate-800 transition hover:bg-slate-100/40 dark:hover:bg-slate-900/30"
              >
                <td className="py-3 font-semibold text-slate-800 dark:text-slate-200">
                  {r.book?.title}
                  <span className="block text-[10px] font-normal text-slate-500">
                    {r.book?.author}
                  </span>
                </td>
                <td className="py-3 font-mono">
                  {r.ticketNumber ? (
                    <button
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-bold inline-flex items-center gap-1 hover:underline"
                      onClick={() =>
                        setSelectedTicket({
                          bookTitle: r.book?.title,
                          bookAuthor: r.book?.author,
                          dueDate: r.dueDate,
                          ticketNumber: r.ticketNumber,
                          createdAt: r.createdAt,
                        })
                      }
                    >
                      <Ticket size={12} />
                      {r.ticketNumber}
                    </button>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-3 text-slate-600 dark:text-slate-400">
                  {new Date(r.dueDate).toLocaleDateString()}
                </td>
                <td className="py-3">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${getStatusBadgeClass(r.status)}`}
                  >
                    {r.status}
                  </span>
                </td>
                <td className="py-3">
                  {r.status === "pending" ? (
                    <button
                      type="button"
                      disabled={cancellingRequestId === r._id}
                      className="rounded-lg bg-amber-600 hover:bg-amber-700 px-3 py-1 font-semibold text-white transition text-[10px] disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => cancelRequest(r._id)}
                    >
                      {cancellingRequestId === r._id
                        ? "Cancelling..."
                        : "Cancel Request"}
                    </button>
                  ) : (
                    <span className="text-slate-400 font-medium text-[11px]">
                      —
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {requestList.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-450">
                  You have not submitted any borrow requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default StudentDashboard;
