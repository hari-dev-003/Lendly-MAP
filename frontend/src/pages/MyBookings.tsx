import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Package, Calendar, Clock, CheckCircle, XCircle, AlertTriangle,
  ChevronRight, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";
import axios from "axios";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ReviewModal from "@/components/ReviewModal";

interface Booking {
  _id: string;
  itemId: string;
  itemTitle: string;
  itemImage: string;
  renter: string;
  owner: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  totalPrice: number;
  pricePerDay: number;
  status: string;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:   { label: "Pending",   color: "bg-yellow-100 text-yellow-700",  icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-700",      icon: CheckCircle },
  active:    { label: "Active",    color: "bg-green-100 text-green-700",    icon: Package },
  completed: { label: "Completed", color: "bg-gray-100 text-gray-700",      icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700",        icon: XCircle },
  disputed:  { label: "Disputed",  color: "bg-orange-100 text-orange-700",  icon: AlertTriangle },
};

const MyBookings = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "renting" | "lending">("all");
  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null);

  const raw = localStorage.getItem("user");
  const currentUser = raw ? JSON.parse(raw)?.user?.username : null;

  useEffect(() => {
    if (!currentUser) { navigate("/login"); return; }
    axios.get(`http://localhost:3000/api/bookings/user/${currentUser}`)
      .then((res) => setBookings(res.data.bookings))
      .catch(() => toast.error("Failed to load bookings"))
      .finally(() => setLoading(false));
  }, [currentUser]);

  const filtered = bookings.filter((b) => {
    if (filter === "renting") return b.renter === currentUser;
    if (filter === "lending") return b.owner === currentUser;
    return true;
  });

  const handleCancel = async (id: string) => {
    try {
      await axios.patch(`http://localhost:3000/api/bookings/${id}/status`, { status: "cancelled" });
      setBookings((prev) => prev.map((b) => b._id === id ? { ...b, status: "cancelled" } : b));
      toast.success("Booking cancelled");
    } catch {
      toast.error("Failed to cancel booking");
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await axios.patch(`http://localhost:3000/api/bookings/${id}/status`, { status: "confirmed" });
      setBookings((prev) => prev.map((b) => b._id === id ? { ...b, status: "confirmed" } : b));
      toast.success("Booking confirmed!");
    } catch {
      toast.error("Failed to confirm booking");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <div className="container py-8 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <div className="container py-8 max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">My Bookings</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{bookings.length} total booking{bookings.length !== 1 ? "s" : ""}</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/list"><ArrowLeft className="mr-1 h-3.5 w-3.5" /> Browse</Link>
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 rounded-xl bg-muted p-1 w-fit">
          {(["all", "renting", "lending"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors ${
                filter === f ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Package className="h-16 w-16 mb-4 text-muted-foreground" />
            <h2 className="font-heading text-xl font-bold mb-2">No bookings yet</h2>
            <p className="text-muted-foreground mb-6 max-w-xs">
              {filter === "lending" ? "No one has booked your items yet." : "You haven't rented anything yet."}
            </p>
            <Button asChild>
              <Link to="/list">Browse Items</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((booking, i) => {
              const cfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
              const Icon = cfg.icon;
              const isRenter = booking.renter === currentUser;
              const canReview = booking.status === "completed";
              const canCancel = ["pending", "confirmed"].includes(booking.status) && isRenter;
              const canConfirm = booking.status === "pending" && !isRenter;
              const canHandover = ["confirmed", "active"].includes(booking.status);

              return (
                <motion.div
                  key={booking._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-border bg-card overflow-hidden shadow-sm"
                >
                  <div className="flex gap-4 p-4">
                    {/* Image */}
                    <div className="h-20 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                      {booking.itemImage ? (
                        <img src={booking.itemImage} alt={booking.itemTitle} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Package className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-semibold text-sm leading-tight line-clamp-1">{booking.itemTitle}</h3>
                        <span className={`flex-shrink-0 flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${cfg.color}`}>
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground mb-1">
                        {isRenter ? `Owner: ${booking.owner}` : `Renter: ${booking.renter}`}
                      </p>

                      <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                        <Calendar className="h-3 w-3 flex-shrink-0" />
                        {new Date(booking.startDate).toLocaleDateString()} → {new Date(booking.endDate).toLocaleDateString()}
                        <span className="ml-1">({booking.totalDays} day{booking.totalDays !== 1 ? "s" : ""})</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-primary">₹{booking.totalPrice}</span>
                        <div className="flex gap-2">
                          {canCancel && (
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => handleCancel(booking._id)}>
                              Cancel
                            </Button>
                          )}
                          {canConfirm && (
                            <Button size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700"
                              onClick={() => handleConfirm(booking._id)}>
                              Accept
                            </Button>
                          )}
                          {canHandover && (
                            <Button size="sm" variant="outline" className="h-7 text-xs gap-1"
                              onClick={() => navigate(`/handover/${booking._id}`)}>
                              Handover <ChevronRight className="h-3 w-3" />
                            </Button>
                          )}
                          {canReview && (
                            <Button size="sm" variant="outline" className="h-7 text-xs"
                              onClick={() => setReviewTarget(booking)}>
                              Review
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <Footer />

      {/* Review Modal */}
      {reviewTarget && currentUser && (
        <ReviewModal
          bookingId={reviewTarget._id}
          itemId={reviewTarget.itemId}
          reviewer={currentUser}
          reviewee={reviewTarget.renter === currentUser ? reviewTarget.owner : reviewTarget.renter}
          itemTitle={reviewTarget.itemTitle}
          type={reviewTarget.renter === currentUser ? "renter_to_owner" : "owner_to_renter"}
          onClose={() => setReviewTarget(null)}
          onSubmitted={() => setReviewTarget(null)}
        />
      )}
    </div>
  );
};

export default MyBookings;
