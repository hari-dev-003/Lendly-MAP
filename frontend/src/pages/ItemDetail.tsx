import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, MapPin, Calendar, Shield, MessageCircle, Heart,
  Share2, ChevronLeft, ChevronRight, Star, Package, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";
import axios from "axios";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import RatingStars from "@/components/RatingStars";
import TrustBadge from "@/components/TrustBadge";
import ChatWidget from "@/components/ChatWidget";

interface Product {
  _id: string;
  title: string;
  image: string;
  price: number;
  period: string;
  location: string;
  owner: string;
  category: string;
  description: string;
}

interface Review {
  _id: string;
  reviewer: string;
  rating: number;
  comment: string;
  createdAt: string;
}

const ItemDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [item, setItem] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgIndex, setImgIndex] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  const raw = localStorage.getItem("user");
  const currentUser = raw ? JSON.parse(raw)?.user?.username : null;

  useEffect(() => {
    if (!id) return;
    axios.get(`http://localhost:3000/api/products/${id}`)
      .then((res) => {
        setItem(res.data.product);
        return axios.get(`http://localhost:3000/api/reviews/item/${id}`);
      })
      .then((res) => {
        setReviews(res.data.reviews);
        setAvgRating(res.data.avgRating);
      })
      .catch(() => toast.error("Failed to load item"))
      .finally(() => setLoading(false));
  }, [id]);

  const totalDays = (() => {
    if (!startDate || !endDate) return 0;
    const diff = new Date(endDate).getTime() - new Date(startDate).getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  })();

  const totalPrice = item ? totalDays * item.price : 0;

  const handleBookNow = async () => {
    if (!currentUser) { navigate("/login"); return; }
    if (!startDate || !endDate) { toast.error("Please select rental dates"); return; }
    if (totalDays <= 0) { toast.error("End date must be after start date"); return; }
    if (item && currentUser === item.owner) { toast.error("You cannot book your own item"); return; }

    setBookingLoading(true);
    try {
      const res = await axios.post("http://localhost:3000/api/bookings", {
        itemId: item!._id,
        itemTitle: item!.title,
        itemImage: item!.image,
        renter: currentUser,
        owner: item!.owner,
        startDate,
        endDate,
        pricePerDay: item!.price,
      });
      toast.success("Booking confirmed!");
      navigate(`/my-bookings`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Booking failed");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <div className="container flex flex-1 items-center justify-center">
          <div className="text-center space-y-3">
            <div className="h-10 w-64 animate-pulse rounded-lg bg-muted mx-auto" />
            <div className="h-4 w-48 animate-pulse rounded bg-muted mx-auto" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <div className="container flex flex-1 items-center justify-center">
          <div className="text-center">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="mb-2 font-heading text-2xl font-bold">Item Not Found</h2>
            <Link to="/list" className="text-primary hover:underline">Back to Browse</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const images = [item.image, item.image];
  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <div className="container py-6">
        <Link to="/list" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back to Browse
        </Link>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Image Carousel */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-muted"
            >
              <img src={images[imgIndex]} alt={item.title} className="h-full w-full object-cover" />
              <span className="absolute left-4 top-4 rounded-full bg-card/80 px-3 py-1 text-xs font-medium backdrop-blur-sm capitalize">
                {item.category}
              </span>
              <div className="absolute right-4 top-4 flex gap-2">
                <button className="flex h-9 w-9 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm transition hover:bg-card">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Link copied!"); }}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm transition hover:bg-card"
                >
                  <Share2 className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              <button
                onClick={() => setImgIndex((i) => (i - 1 + images.length) % images.length)}
                className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setImgIndex((i) => (i + 1) % images.length)}
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setImgIndex(i)}
                    className={`h-2 w-2 rounded-full transition ${i === imgIndex ? "bg-white" : "bg-white/40"}`}
                  />
                ))}
              </div>
            </motion.div>

            {/* Description */}
            <div className="mt-6 rounded-xl border border-border bg-card p-5">
              <h2 className="mb-2 font-heading text-lg font-semibold">About this item</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
            </div>

            {/* Reviews */}
            <div className="mt-6 rounded-xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-heading text-lg font-semibold">
                  Reviews ({reviews.length})
                </h2>
                {avgRating > 0 && (
                  <div className="flex items-center gap-1.5">
                    <RatingStars rating={avgRating} size={16} />
                    <span className="text-sm font-semibold">{avgRating}</span>
                  </div>
                )}
              </div>
              {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reviews yet. Be the first to rent and review!</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r._id} className="border-t border-border pt-4 first:border-0 first:pt-0">
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
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground capitalize">
                  {item.category}
                </span>
              </div>

              <h1 className="mb-2 font-heading text-2xl font-bold md:text-3xl">{item.title}</h1>

              <div className="mb-4 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> {item.location}
                </span>
                {avgRating > 0 && (
                  <span className="flex items-center gap-1.5">
                    <RatingStars rating={avgRating} size={14} />
                    <span>{avgRating} ({reviews.length})</span>
                  </span>
                )}
              </div>

              {/* Booking Card */}
              <div className="mb-6 rounded-xl border border-border bg-card p-6 shadow-sm">
                <div className="mb-4">
                  <span className="font-heading text-3xl font-bold text-primary">₹{item.price}</span>
                  <span className="text-muted-foreground">/{item.period}</span>
                </div>

                {/* Date Pickers */}
                <div className="mb-4 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Start Date
                    </label>
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <input
                        type="date"
                        min={today}
                        value={startDate}
                        onChange={(e) => { setStartDate(e.target.value); if (endDate && e.target.value >= endDate) setEndDate(""); }}
                        className="flex-1 bg-transparent text-sm outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      End Date
                    </label>
                    <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
                      <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <input
                        type="date"
                        min={startDate || today}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="flex-1 bg-transparent text-sm outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Price Breakdown */}
                {totalDays > 0 && (
                  <div className="mb-4 rounded-lg bg-muted/50 p-3 space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">₹{item.price} × {totalDays} day{totalDays !== 1 ? "s" : ""}</span>
                      <span>₹{totalPrice}</span>
                    </div>
                    <div className="flex justify-between font-semibold border-t border-border pt-1.5 mt-1.5">
                      <span>Total</span>
                      <span className="text-primary">₹{totalPrice}</span>
                    </div>
                  </div>
                )}

                {/* Escrow badge */}
                <div className="mb-3 flex items-center gap-2 rounded-lg border border-trust/20 bg-trust/5 px-3 py-2 text-xs text-trust">
                  <Shield className="h-3.5 w-3.5 flex-shrink-0" />
                  Escrow-protected · funds released after return
                </div>

                <Button
                  className="mb-3 w-full gap-2"
                  size="lg"
                  onClick={handleBookNow}
                  disabled={bookingLoading}
                >
                  <Calendar className="h-4 w-4" />
                  {bookingLoading ? "Booking..." : "Book Now"}
                </Button>

                <Button
                  variant="outline"
                  className="w-full gap-2"
                  size="lg"
                  onClick={() => {
                    if (!currentUser) { navigate("/login"); return; }
                    setChatOpen(true);
                  }}
                >
                  <MessageCircle className="h-4 w-4" />
                  Message Owner
                </Button>
              </div>

              {/* Owner Card */}
              <div className="rounded-xl border border-border bg-card p-4">
                <p className="mb-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Listed by</p>
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <span className="font-heading text-sm font-bold text-primary">
                      {item.owner.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{item.owner}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <TrustBadge level="verified" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-trust">
                  <Shield className="h-4 w-4" />
                  <span>Identity verified · Escrow protected</span>
                </div>
              </div>

              {/* Transaction Timeline */}
              <div className="mt-4 rounded-xl border border-border bg-card p-4">
                <h3 className="mb-3 text-sm font-semibold">How it works</h3>
                <div className="space-y-3">
                  {[
                    { icon: Calendar, label: "Book & pay into escrow" },
                    { icon: Package, label: "Pick up with pre-handover photos" },
                    { icon: Clock, label: "Enjoy your rental" },
                    { icon: Shield, label: "Return & funds released" },
                  ].map(({ icon: Icon, label }, i) => (
                    <div key={i} className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                        <span className="text-xs font-bold text-primary">{i + 1}</span>
                      </div>
                      <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Chat Widget */}
      {chatOpen && (
        <ChatWidget
          ownerName={item.owner}
          itemTitle={item.title}
          onClose={() => setChatOpen(false)}
        />
      )}
    </div>
  );
};

export default ItemDetail;
