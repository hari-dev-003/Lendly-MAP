import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  ChartNoAxesColumn,
  ClipboardList,
  Package,
  RefreshCw,
  Search,
  Shield,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import axios from "axios";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AdminUser {
  _id: string;
  username: string;
  email: string;
  kycStatus?: "none" | "pending" | "approved" | "rejected";
}

interface AdminProduct {
  _id: string;
  title: string;
  price: number;
  period: string;
  owner: string;
  category?: string;
  location?: string;
}

interface AdminBooking {
  _id: string;
  itemTitle?: string;
  renter: string;
  owner: string;
  status: "pending" | "confirmed" | "active" | "completed" | "cancelled" | "disputed";
  totalPrice?: number;
  totalDays?: number;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
}

interface AdminReview {
  _id: string;
  reviewer?: string;
  reviewee: string;
  rating: number;
  comment?: string;
  type?: string;
  createdAt?: string;
}

interface PendingKycUser {
  _id: string;
  username: string;
  email: string;
  kycDocFront?: string;
  kycDocBack?: string;
  kycSelfie?: string;
  kycStatus?: "pending";
}

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  confirmed: "#3b82f6",
  active: "#14b8a6",
  completed: "#22c55e",
  cancelled: "#ef4444",
  disputed: "#a855f7",
};

const formatCurrency = (value: number) => {
  if (Number.isNaN(value)) return "INR 0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (value?: string) => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "2-digit" });
};

const Admin = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [kycQueue, setKycQueue] = useState<PendingKycUser[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [bookingQuery, setBookingQuery] = useState("");
  const [reviewQuery, setReviewQuery] = useState("");

  const fetchDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const [usersRes, productsRes, bookingsRes, reviewsRes, kycRes] = await Promise.all([
        axios.get<{ users: AdminUser[] }>("http://localhost:3000/api/users"),
        axios.get<{ products: AdminProduct[] }>("http://localhost:3000/api/products"),
        axios.get<{ bookings: AdminBooking[] }>("http://localhost:3000/api/bookings"),
        axios.get<{ reviews: AdminReview[] }>("http://localhost:3000/api/reviews"),
        axios.get<{ users: PendingKycUser[] }>("http://localhost:3000/api/kyc/pending"),
      ]);

      setUsers(usersRes.data?.users || []);
      setProducts(productsRes.data?.products || []);
      setBookings(bookingsRes.data?.bookings || []);
      setReviews(reviewsRes.data?.reviews || []);
      setKycQueue(kycRes.data?.users || []);
    } catch (err: any) {
      setError(err?.message || "Unable to fetch admin data");
    } finally {
      setLoading(false);
    }
  };

  const handleKycAction = async (username: string, action: "approve" | "reject") => {
    try {
      await axios.post("http://localhost:3000/api/kyc/review", { username, action });
      setKycQueue((prev) => prev.filter((u) => u.username !== username));
      setUsers((prev) =>
        prev.map((u) => (u.username === username ? { ...u, kycStatus: action === "approve" ? "approved" : "rejected" } : u)),
      );
    } catch (err: any) {
      setError(err?.message || "Unable to update KYC status");
    }
  };

  useEffect(() => {
    if (isLoggedIn) fetchDashboard();
  }, [isLoggedIn]);

  const filteredUsers = useMemo(() => {
    if (!userQuery.trim()) return users;
    const q = userQuery.toLowerCase();
    return users.filter((u) => [u.username, u.email, u._id, u.kycStatus || ""].some((value) => value.toLowerCase().includes(q)));
  }, [users, userQuery]);

  const filteredProducts = useMemo(() => {
    if (!productQuery.trim()) return products;
    const q = productQuery.toLowerCase();
    return products.filter((p) =>
      [p.title, p.owner, p.category || "", p.location || "", p._id].some((value) => String(value).toLowerCase().includes(q)),
    );
  }, [products, productQuery]);

  const filteredBookings = useMemo(() => {
    if (!bookingQuery.trim()) return bookings;
    const q = bookingQuery.toLowerCase();
    return bookings.filter((b) =>
      [b._id, b.itemTitle || "", b.renter || "", b.owner || "", b.status || ""].some((value) =>
        String(value).toLowerCase().includes(q),
      ),
    );
  }, [bookings, bookingQuery]);

  const filteredReviews = useMemo(() => {
    if (!reviewQuery.trim()) return reviews;
    const q = reviewQuery.toLowerCase();
    return reviews.filter((r) =>
      [r._id, r.reviewer || "", r.reviewee || "", r.comment || "", r.type || ""].some((value) =>
        String(value).toLowerCase().includes(q),
      ),
    );
  }, [reviews, reviewQuery]);

  const validBookings = useMemo(() => bookings.filter((b) => b.status !== "cancelled"), [bookings]);

  const totalRentValue = useMemo(
    () => validBookings.reduce((sum, booking) => sum + (Number(booking.totalPrice) || 0), 0),
    [validBookings],
  );
  const companyProfit = totalRentValue * 0.1;
  const ownerPayout = totalRentValue - companyProfit;
  const completedBookings = useMemo(() => bookings.filter((b) => b.status === "completed").length, [bookings]);
  const activeBookings = useMemo(() => bookings.filter((b) => b.status === "active").length, [bookings]);
  const pendingBookings = useMemo(
    () => bookings.filter((b) => b.status === "pending" || b.status === "confirmed").length,
    [bookings],
  );
  const cancelledBookings = useMemo(() => bookings.filter((b) => b.status === "cancelled").length, [bookings]);
  const avgRating = useMemo(() => {
    if (!reviews.length) return 0;
    return reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / reviews.length;
  }, [reviews]);

  const bookingStatusData = useMemo(() => {
    const counts = bookings.reduce<Record<string, number>>((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(counts)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);
  }, [bookings]);

  const monthlyRevenueData = useMemo(() => {
    const map = new Map<string, { month: string; revenue: number; bookings: number }>();

    validBookings.forEach((b) => {
      const d = new Date(b.createdAt || b.startDate || "");
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      if (!map.has(key)) map.set(key, { month: label, revenue: 0, bookings: 0 });
      const row = map.get(key)!;
      row.revenue += Number(b.totalPrice) || 0;
      row.bookings += 1;
    });

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([, v]) => v);
  }, [validBookings]);

  const trustChartData = useMemo(() => {
    const usernames = new Set<string>();
    users.forEach((u) => usernames.add(u.username));
    bookings.forEach((b) => {
      if (b.renter) usernames.add(b.renter);
      if (b.owner) usernames.add(b.owner);
    });

    const rankings = Array.from(usernames).map((username) => {
      const completedRentals = bookings.filter(
        (b) => b.status === "completed" && (b.renter === username || b.owner === username),
      ).length;
      const receivedReviews = reviews.filter((r) => r.reviewee === username);
      const avg = receivedReviews.length
        ? receivedReviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / receivedReviews.length
        : 0;
      const trustScore = Math.min(100, completedRentals * 10 + Math.round(avg * 10) + (receivedReviews.length > 0 ? 20 : 0));
      return { username, trustScore };
    });

    return rankings.sort((a, b) => b.trustScore - a.trustScore).slice(0, 6);
  }, [users, bookings, reviews]);

  const kycBreakdown = useMemo(() => {
    const counts = users.reduce<Record<string, number>>((acc, u) => {
      const status = u.kycStatus || "none";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    return [
      { status: "approved", count: counts.approved || 0, color: "#22c55e" },
      { status: "pending", count: counts.pending || 0, color: "#f59e0b" },
      { status: "rejected", count: counts.rejected || 0, color: "#ef4444" },
      { status: "none", count: counts.none || 0, color: "#94a3b8" },
    ];
  }, [users]);

  const handleLogin = () => {
    if (password === "admin123") {
      setIsLoggedIn(true);
      return;
    }
    setError("Invalid admin password");
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setPassword("");
    setError("");
    setUserQuery("");
    setProductQuery("");
    setBookingQuery("");
    setReviewQuery("");
  };

  if (!isLoggedIn) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-slate-100 via-blue-50 to-teal-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-8 shadow-xl backdrop-blur">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Shield className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Admin Access</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Enter your credentials to manage platform operations.</p>
          </div>

          <input
            type="password"
            placeholder="Enter admin password"
            className="w-full rounded-lg border border-slate-300 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          />

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button
            onClick={handleLogin}
            className="mt-4 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Login to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="mb-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">Admin Analytics Dashboard</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Complete platform details with live KPIs and charts.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchDashboard}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-slate-800/60 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <button
                onClick={handleLogout}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Logout
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div>
          )}
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Users</p>
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{users.length}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">Listings</p>
              <Package className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{products.length}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">Total Bookings</p>
              <ClipboardList className="h-4 w-4 text-cyan-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{bookings.length}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">Completed</p>
              <BadgeCheck className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{completedBookings}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">Pending / Confirmed</p>
              <ChartNoAxesColumn className="h-4 w-4 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{pendingBookings}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">Active Bookings</p>
              <TrendingUp className="h-4 w-4 text-teal-600" />
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{activeBookings}</p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">GMV / Company Profit</p>
              <TrendingUp className="h-4 w-4 text-rose-600" />
            </div>
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(totalRentValue)}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{formatCurrency(companyProfit)} (10%)</p>
          </div>

          {/* <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm text-slate-500 dark:text-slate-400">Avg Rating / KYC Pending</p>
              <Star className="h-4 w-4 text-yellow-500" />
            </div>
            <p className="text-base font-semibold text-slate-900 dark:text-slate-100">{avgRating.toFixed(1)} / 5</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{kycQueue.length} users</p>
          </div> */}
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Booking Status Split</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={bookingStatusData} dataKey="count" nameKey="status" innerRadius={60} outerRadius={95} label>
                    {bookingStatusData.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Last 6 Months Revenue</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                  <Bar dataKey="revenue" fill="#2563eb" name="Revenue" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="bookings" fill="#14b8a6" name="Bookings" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">Top Trust Score Users</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trustChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="username" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="trustScore" fill="#16a34a" name="Trust Score" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100">KYC Status Breakdown</h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={kycBreakdown} dataKey="count" nameKey="status" innerRadius={60} outerRadius={95} label>
                    {kycBreakdown.map((entry) => (
                      <Cell key={entry.status} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <section className="mb-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Users</h2>
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder="Search users"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            <div className="max-h-96 overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  <tr>
                    <th className="px-3 py-3">User</th>
                    <th className="px-3 py-3">Email</th>
                    <th className="px-3 py-3">KYC</th>
                    <th className="px-3 py-3">ID</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-8 text-center text-slate-500 dark:text-slate-400">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr
                        key={user._id}
                        className="border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800/60"
                      >
                        <td className="px-3 py-3 font-medium text-slate-900 dark:text-slate-100">{user.username}</td>
                        <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{user.email}</td>
                        <td className="px-3 py-3">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {user.kycStatus || "none"}
                          </span>
                        </td>
                        <td className="px-3 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{user._id.slice(-8)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Products</h2>
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  placeholder="Search products"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            <div className="max-h-96 overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  <tr>
                    <th className="px-3 py-3">Title</th>
                    <th className="px-3 py-3">Owner</th>
                    <th className="px-3 py-3">Price</th>
                    <th className="px-3 py-3">Category</th>
                    <th className="px-3 py-3">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-slate-500 dark:text-slate-400">
                        No products found
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr
                        key={product._id}
                        className="border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800/60"
                      >
                        <td className="px-3 py-3 font-medium text-slate-900 dark:text-slate-100">{product.title}</td>
                        <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{product.owner}</td>
                        <td className="px-3 py-3 text-slate-900 dark:text-slate-100">{formatCurrency(Number(product.price || 0))}</td>
                        <td className="px-3 py-3 capitalize text-slate-700 dark:text-slate-300">{product.category || "-"}</td>
                        <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{product.location || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="mb-6 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Bookings</h2>
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={bookingQuery}
                  onChange={(e) => setBookingQuery(e.target.value)}
                  placeholder="Search bookings"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            <div className="max-h-96 overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  <tr>
                    <th className="px-3 py-3">Item</th>
                    <th className="px-3 py-3">Renter</th>
                    <th className="px-3 py-3">Owner</th>
                    <th className="px-3 py-3">Dates</th>
                    <th className="px-3 py-3">Amount</th>
                    <th className="px-3 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-slate-500 dark:text-slate-400">
                        No bookings found
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((b) => (
                      <tr
                        key={b._id}
                        className="border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800/60"
                      >
                        <td className="px-3 py-3 font-medium text-slate-900 dark:text-slate-100">{b.itemTitle || "-"}</td>
                        <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{b.renter}</td>
                        <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{b.owner}</td>
                        <td className="px-3 py-3 text-xs text-slate-600 dark:text-slate-400">
                          {formatDate(b.startDate)} to {formatDate(b.endDate)}
                        </td>
                        <td className="px-3 py-3 text-slate-900 dark:text-slate-100">{formatCurrency(Number(b.totalPrice || 0))}</td>
                        <td className="px-3 py-3">
                          <span
                            className="rounded-full px-2.5 py-1 text-xs font-medium capitalize text-white"
                            style={{ backgroundColor: STATUS_COLORS[b.status] || "#64748b" }}
                          >
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Reviews</h2>
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={reviewQuery}
                  onChange={(e) => setReviewQuery(e.target.value)}
                  placeholder="Search reviews"
                  className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            <div className="max-h-96 overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  <tr>
                    <th className="px-3 py-3">Reviewer</th>
                    <th className="px-3 py-3">Reviewee</th>
                    <th className="px-3 py-3">Rating</th>
                    <th className="px-3 py-3">Type</th>
                    <th className="px-3 py-3">Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReviews.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-8 text-center text-slate-500 dark:text-slate-400">
                        No reviews found
                      </td>
                    </tr>
                  ) : (
                    filteredReviews.map((review) => (
                      <tr
                        key={review._id}
                        className="border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800/60"
                      >
                        <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{review.reviewer || "-"}</td>
                        <td className="px-3 py-3 font-medium text-slate-900 dark:text-slate-100">{review.reviewee}</td>
                        <td className="px-3 py-3 font-semibold text-yellow-600">{Number(review.rating || 0).toFixed(1)}</td>
                        <td className="px-3 py-3 text-xs capitalize text-slate-600 dark:text-slate-400">{review.type || "-"}</td>
                        <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{review.comment || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">KYC Verification Queue</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">Pending submissions: {kycQueue.length}</span>
          </div>

          <div className="overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                <tr>
                  <th className="px-3 py-3">User</th>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Documents</th>
                  <th className="px-3 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {kycQueue.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-slate-500 dark:text-slate-400">
                      No pending KYC requests
                    </td>
                  </tr>
                ) : (
                  kycQueue.map((u) => (
                    <tr
                      key={u._id}
                      className="border-t border-slate-100 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-800/60"
                    >
                      <td className="px-3 py-3 font-medium text-slate-900 dark:text-slate-100">{u.username}</td>
                      <td className="px-3 py-3 text-slate-700 dark:text-slate-300">{u.email}</td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-2">
                          {u.kycDocFront && (
                            <a
                              href={u.kycDocFront}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                            >
                              Front
                            </a>
                          )}
                          {u.kycDocBack && (
                            <a
                              href={u.kycDocBack}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                            >
                              Back
                            </a>
                          )}
                          {u.kycSelfie && (
                            <a
                              href={u.kycSelfie}
                              target="_blank"
                              rel="noreferrer"
                              className="rounded border border-slate-300 px-2 py-1 text-xs hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                            >
                              Selfie
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleKycAction(u.username, "approve")}
                            className="rounded bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleKycAction(u.username, "reject")}
                            className="rounded bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            Owner payout (90% of GMV): <span className="font-semibold text-slate-900 dark:text-slate-100">{formatCurrency(ownerPayout)}</span> •
            Cancelled bookings: <span className="font-semibold text-slate-900 dark:text-slate-100">{cancelledBookings}</span>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Admin;
