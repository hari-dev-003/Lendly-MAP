import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  User, Package, Star, Shield, Edit2, Check, X, Award,
  MapPin, Phone, Home, Map, Plus, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";
import axios from "axios";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrustBadge from "@/components/TrustBadge";
import RatingStars from "@/components/RatingStars";

type Tab = "profile" | "bookings" | "listings" | "trust";

interface UserProfile { phone: string; address: string; district: string; state: string; }

interface Booking {
  _id: string; itemTitle: string; itemImage: string;
  renter: string; owner: string; startDate: string; endDate: string;
  totalDays: number; totalPrice: number; status: string;
}

interface Product {
  _id: string; title: string; image: string;
  price: number; period: string; location: string; category: string;
}

interface Review { _id: string; reviewer: string; rating: number; comment: string; createdAt: string; }

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  active: "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-700",
  cancelled: "bg-red-100 text-red-700",
  disputed: "bg-orange-100 text-orange-700",
};

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [username, setUsername] = useState("");
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState<UserProfile>({ phone: "", address: "", district: "", state: "" });
  const [draft, setDraft] = useState<UserProfile>({ phone: "", address: "", district: "", state: "" });

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [listings, setListings] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (!raw) { navigate("/login"); return; }
    const parsed = JSON.parse(raw);
    const uname = parsed?.user?.username;
    if (!uname) { navigate("/login"); return; }
    setUsername(uname);

    Promise.all([
      axios.get(`http://localhost:3000/api/profile/${uname}`).catch(() => null),
      axios.get(`http://localhost:3000/api/bookings/user/${uname}`).catch(() => null),
      axios.get(`http://localhost:3000/api/products`).catch(() => null),
      axios.get(`http://localhost:3000/api/reviews/user/${uname}`).catch(() => null),
    ]).then(([profileRes, bookingsRes, productsRes, reviewsRes]) => {
      if (profileRes?.data?.user) {
        const u = profileRes.data.user;
        const p = { phone: u.phone || "", address: u.address || "", district: u.district || "", state: u.state || "" };
        setProfile(p);
        setDraft(p);
      }
      if (bookingsRes?.data?.bookings) setBookings(bookingsRes.data.bookings);
      if (productsRes?.data?.products) {
        setListings(productsRes.data.products.filter((p: Product & { owner: string }) => p.owner === uname));
      }
      if (reviewsRes?.data) {
        setReviews(reviewsRes.data.reviews);
        setAvgRating(reviewsRes.data.avgRating);
      }
    }).finally(() => setLoading(false));
  }, [navigate]);

  const handleSave = async () => {
    try {
      await axios.put("http://localhost:3000/api/profile", { username, ...draft });
      setProfile(draft);
      setEditing(false);
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to update profile");
    }
  };

  const handleCancel = () => { setDraft(profile); setEditing(false); };

  // Trust score: based on bookings + reviews
  const completedBookings = bookings.filter((b) => b.status === "completed").length;
  const trustScore = Math.min(100, completedBookings * 10 + Math.round(avgRating * 10) + (reviews.length > 0 ? 20 : 0));
  const trustLevel: "verified" | "trusted" | "top" =
    trustScore >= 80 ? "top" : trustScore >= 40 ? "trusted" : "verified";

  const TRUST_BADGES = [
    { level: "verified" as const, label: "Verified", desc: "Identity verified", min: 0 },
    { level: "trusted" as const, label: "Trusted", desc: "4+ completed rentals", min: 40 },
    { level: "top" as const, label: "Top Lender", desc: "8+ rentals + 4.5★ rating", min: 80 },
  ];

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: "profile", label: "Profile", icon: User },
    { key: "bookings", label: `Bookings (${bookings.length})`, icon: Package },
    { key: "listings", label: `Listings (${listings.length})`, icon: Home },
    { key: "trust", label: "Trust Score", icon: Award },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <div className="container py-12 flex justify-center">
          <div className="w-full max-w-2xl space-y-4">
            <div className="h-32 animate-pulse rounded-2xl bg-muted" />
            <div className="h-64 animate-pulse rounded-2xl bg-muted" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <div className="container py-8 max-w-3xl">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl font-bold text-primary">
              {username.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-heading text-xl font-bold">{username}</h1>
                <TrustBadge level={trustLevel} />
              </div>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                {avgRating > 0 && (
                  <span className="flex items-center gap-1">
                    <RatingStars rating={avgRating} size={14} />
                    <span>{avgRating} ({reviews.length} reviews)</span>
                  </span>
                )}
                <span>{completedBookings} completed rental{completedBookings !== 1 ? "s" : ""}</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-2xl font-bold text-primary">{trustScore}</div>
              <div className="text-xs text-muted-foreground">Trust Score</div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl bg-muted p-1 overflow-x-auto">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold">Contact & Location</h2>
              {!editing ? (
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Edit2 className="mr-1.5 h-3.5 w-3.5" /> Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave}><Check className="mr-1 h-3.5 w-3.5" /> Save</Button>
                  <Button size="sm" variant="ghost" onClick={handleCancel}><X className="h-3.5 w-3.5" /></Button>
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { key: "phone", label: "Phone", icon: Phone, placeholder: "+91 98765 43210" },
                { key: "district", label: "District", icon: Map, placeholder: "Koramangala" },
                { key: "address", label: "Address", icon: MapPin, placeholder: "123, Main Street" },
                { key: "state", label: "State", icon: Home, placeholder: "Karnataka" },
              ].map(({ key, label, icon: Icon, placeholder }) => (
                <div key={key}>
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    <Icon className="h-3 w-3" /> {label}
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={draft[key as keyof UserProfile]}
                      onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                    />
                  ) : (
                    <p className="text-sm font-medium text-foreground">
                      {profile[key as keyof UserProfile] || <span className="text-muted-foreground italic">Not set</span>}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            {bookings.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center rounded-2xl border border-border bg-card">
                <Package className="h-12 w-12 mb-3 text-muted-foreground" />
                <p className="font-semibold mb-1">No bookings yet</p>
                <p className="text-sm text-muted-foreground mb-4">Start renting items from the marketplace</p>
                <Button size="sm" asChild><Link to="/list">Browse Items</Link></Button>
              </div>
            ) : (
              bookings.slice(0, 5).map((b) => (
                <div key={b._id} className="flex gap-3 rounded-xl border border-border bg-card p-4 items-center">
                  <div className="h-12 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                    {b.itemImage
                      ? <img src={b.itemImage} alt="" className="h-full w-full object-cover" />
                      : <Package className="h-6 w-6 m-auto mt-3 text-muted-foreground" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold line-clamp-1">{b.itemTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {b.renter === username ? `Owner: ${b.owner}` : `Renter: ${b.renter}`} · {b.totalDays}d
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-bold text-primary">₹{b.totalPrice}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[b.status] || "bg-gray-100 text-gray-700"}`}>
                      {b.status}
                    </span>
                  </div>
                </div>
              ))
            )}
            {bookings.length > 0 && (
              <Link to="/my-bookings" className="block text-center text-sm text-primary hover:underline pt-2">
                View all bookings →
              </Link>
            )}
          </motion.div>
        )}

        {/* Listings Tab */}
        {activeTab === "listings" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <div className="flex justify-end mb-2">
              <Button size="sm" asChild>
                <Link to="/add"><Plus className="mr-1.5 h-3.5 w-3.5" /> Add Item</Link>
              </Button>
            </div>
            {listings.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-center rounded-2xl border border-border bg-card">
                <Plus className="h-12 w-12 mb-3 text-muted-foreground" />
                <p className="font-semibold mb-1">No listings yet</p>
                <p className="text-sm text-muted-foreground mb-4">Start earning by listing your items for rent</p>
                <Button size="sm" asChild><Link to="/add">Add Your First Item</Link></Button>
              </div>
            ) : (
              listings.map((p) => (
                <Link key={p._id} to={`/item/${p._id}`} className="flex gap-3 rounded-xl border border-border bg-card p-4 items-center hover:shadow-sm transition-shadow">
                  <div className="h-14 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                    <img src={p.image} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold line-clamp-1">{p.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {p.location}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">{p.category}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-sm font-bold text-primary">₹{p.price}</p>
                    <p className="text-xs text-muted-foreground">/{p.period}</p>
                  </div>
                </Link>
              ))
            )}
          </motion.div>
        )}

        {/* Trust Score Tab */}
        {activeTab === "trust" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Score Meter */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-heading text-lg font-semibold">Your Trust Score</h2>
                <span className="text-3xl font-bold text-primary">{trustScore}</span>
              </div>
              <div className="mb-2 h-3 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                  initial={{ width: 0 }}
                  animate={{ width: `${trustScore}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0</span><span>Verified</span><span>Trusted</span><span>Top 100</span>
              </div>
            </div>

            {/* Badges */}
            <div className="grid gap-3 sm:grid-cols-3">
              {TRUST_BADGES.map((badge) => {
                const earned = trustScore >= badge.min;
                return (
                  <div
                    key={badge.level}
                    className={`rounded-xl border p-4 text-center transition-all ${
                      earned ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30 opacity-60"
                    }`}
                  >
                    <div className="mb-2 flex justify-center">
                      <TrustBadge level={badge.level} size="md" />
                    </div>
                    <p className="text-sm font-semibold">{badge.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{badge.desc}</p>
                    {!earned && <p className="text-xs text-muted-foreground mt-1">Score: {badge.min}+ needed</p>}
                  </div>
                );
              })}
            </div>

            {/* Reviews received */}
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-heading text-base font-semibold">Reviews Received ({reviews.length})</h2>
                {avgRating > 0 && (
                  <div className="flex items-center gap-1.5">
                    <RatingStars rating={avgRating} size={16} />
                    <span className="font-bold">{avgRating}</span>
                  </div>
                )}
              </div>
              {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">Complete a rental to receive reviews.</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r._id} className="border-t border-border pt-3 first:border-0 first:pt-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {r.reviewer.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold">{r.reviewer}</span>
                        <RatingStars rating={r.rating} size={12} />
                        <span className="ml-auto text-xs text-muted-foreground">
                          {new Date(r.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {r.comment && <p className="text-sm text-muted-foreground pl-9">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Score Breakdown */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h3 className="font-semibold text-sm mb-3">Score Breakdown</h3>
              <div className="space-y-2 text-sm">
                {[
                  { label: "Completed rentals", value: `${completedBookings} × 10 pts`, pts: completedBookings * 10 },
                  { label: "Average rating", value: `${avgRating}★ × 10 pts`, pts: Math.round(avgRating * 10) },
                  { label: "Review bonus", value: reviews.length > 0 ? "+20 pts" : "0 pts", pts: reviews.length > 0 ? 20 : 0 },
                ].map(({ label, value, pts }) => (
                  <div key={label} className="flex justify-between text-muted-foreground">
                    <span>{label}</span>
                    <span className="font-medium text-foreground">{value} = {pts}pts</span>
                  </div>
                ))}
                <div className="border-t border-border pt-2 flex justify-between font-semibold">
                  <span>Total Score</span>
                  <span className="text-primary">{trustScore} / 100</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Profile;
