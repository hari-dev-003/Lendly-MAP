import { useState, useCallback, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Upload, Camera, CheckCircle, AlertTriangle, ArrowLeft,
  Shield, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import axios from "axios";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type HandoverPhase = "pre" | "post";
type WorkflowMode = "handover" | "return" | "review";

interface BookingDetail {
  _id: string;
  itemTitle: string;
  renter: string;
  owner: string;
  status: "pending" | "confirmed" | "active" | "completed" | "cancelled" | "disputed";
  preHandoverPhotos?: string[];
  preHandoverQualityScore?: number | null;
  preHandoverAt?: string | null;
  preHandoverBy?: string;
  postHandoverPhotos?: string[];
  postHandoverQualityScore?: number | null;
  postHandoverAt?: string | null;
  postHandoverBy?: string;
}

interface DraftState {
  photos: string[];
  qualityScore: number;
  eventAt: string;
}

const CONDITION_LEVELS = [
  { label: "Perfect", color: "bg-green-500", score: 100 },
  { label: "Good", color: "bg-lime-500", score: 80 },
  { label: "Minor Wear", color: "bg-yellow-500", score: 60 },
  { label: "Damage", color: "bg-orange-500", score: 30 },
  { label: "Severe", color: "bg-red-500", score: 10 },
];

const toLocalDateTimeInput = (date: Date) => {
  const tz = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tz).toISOString().slice(0, 16);
};

const Handover = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const raw = localStorage.getItem("user");
  const currentUser = raw ? JSON.parse(raw)?.user?.username : null;

  const [booking, setBooking] = useState<BookingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [qualityScore, setQualityScore] = useState(100);
  const [eventAt, setEventAt] = useState(toLocalDateTimeInput(new Date()));
  const [submitted, setSubmitted] = useState(false);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");

  const mode: WorkflowMode = useMemo(() => {
    if (!booking || !currentUser) return "review";
    const isOwner = booking.owner === currentUser;
    const isRenter = booking.renter === currentUser;
    if (isOwner && booking.status === "confirmed") return "handover";
    if (isRenter && booking.status === "active") return "return";
    return "review";
  }, [booking, currentUser]);

  const phase: HandoverPhase = mode === "return" ? "post" : "pre";
  const storageKey = useMemo(
    () => `lendly_handover_draft_${bookingId || "demo"}_${phase}`,
    [bookingId, phase],
  );

  useEffect(() => {
    if (!bookingId || !currentUser) {
      navigate("/login");
      return;
    }
    axios
      .get(`http://localhost:3000/api/bookings/${bookingId}`)
      .then((res) => setBooking(res.data.booking))
      .catch(() => toast.error("Unable to load booking"))
      .finally(() => setLoading(false));
  }, [bookingId, currentUser]);

  useEffect(() => {
    if (loading) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return;
      const parsed: DraftState = JSON.parse(saved);
      if (Array.isArray(parsed.photos)) setPhotos(parsed.photos.slice(0, 5));
      if (typeof parsed.qualityScore === "number") setQualityScore(parsed.qualityScore);
      if (typeof parsed.eventAt === "string" && parsed.eventAt) setEventAt(parsed.eventAt);
    } catch {
      // ignore broken draft
    }
  }, [loading, storageKey]);

  useEffect(() => {
    if (loading || mode === "review") return;
    const draft: DraftState = { photos, qualityScore, eventAt };
    localStorage.setItem(storageKey, JSON.stringify(draft));
  }, [loading, mode, photos, qualityScore, eventAt, storageKey]);

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const addPhotosFromFiles = async (files: FileList | null) => {
    if (!files) return;
    const selected = Array.from(files).slice(0, 5 - photos.length);
    try {
      const urls = await Promise.all(selected.map((f) => fileToDataUrl(f)));
      setPhotos((prev) => [...prev, ...urls].slice(0, 5));
    } catch {
      toast.error("Failed to process one or more photos");
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      addPhotosFromFiles(e.dataTransfer.files);
    },
    [photos.length],
  );

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!bookingId || !booking) return;
    if (!eventAt) {
      toast.error("Please select handover/return time");
      return;
    }
    if (photos.length === 0) {
      toast.error(mode === "handover" ? "Upload at least one handover photo" : "Upload at least one return photo");
      return;
    }

    setSaving(true);
    try {
      await axios.patch(`http://localhost:3000/api/bookings/${bookingId}/photos`, {
        type: phase,
        photos,
        qualityScore,
        recordedAt: new Date(eventAt).toISOString(),
        performedBy: currentUser,
      });

      const nextStatus = mode === "handover" ? "active" : "completed";
      await axios.patch(`http://localhost:3000/api/bookings/${bookingId}/status`, { status: nextStatus });

      localStorage.removeItem(storageKey);
      setSubmitted(true);
      toast.success(mode === "handover" ? "Handover saved. Booking is now active." : "Return saved. Booking completed.");
    } catch {
      toast.error("Failed to save details");
    } finally {
      setSaving(false);
    }
  };

  const handleDispute = async () => {
    if (!disputeReason.trim() || !bookingId) {
      toast.error("Please describe the issue");
      return;
    }
    try {
      await axios.patch(`http://localhost:3000/api/bookings/${bookingId}/status`, {
        status: "disputed",
        disputeReason,
      });
      toast.success("Dispute raised. Our team will review within 24 hours.");
      setDisputeOpen(false);
      navigate("/my-bookings");
    } catch {
      toast.error("Failed to raise dispute");
    }
  };

  const conditionLevel = CONDITION_LEVELS.find((c) => c.score <= qualityScore) || CONDITION_LEVELS[CONDITION_LEVELS.length - 1];

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <div className="container py-10">
          <div className="h-8 w-72 animate-pulse rounded bg-muted mb-4" />
          <div className="h-56 animate-pulse rounded-xl bg-muted" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <div className="container py-10 text-center">
          <p className="text-muted-foreground">Booking not found.</p>
          <Button className="mt-4" onClick={() => navigate("/my-bookings")}>Go Back</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const prePhotos = booking.preHandoverPhotos || [];
  const postPhotos = booking.postHandoverPhotos || [];

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <div className="container flex flex-1 flex-col items-center justify-center py-20 text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="mb-2 font-heading text-3xl font-bold">{mode === "handover" ? "Handover Saved" : "Return Saved"}</h1>
          <p className="mb-8 text-muted-foreground max-w-sm">
            {mode === "handover"
              ? "Item handover details were captured and booking moved to active state."
              : "Return details were captured and booking moved to completed state."}
          </p>
          <Button onClick={() => navigate("/my-bookings")}>Back to My Bookings</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <div className="container py-8 max-w-4xl">
        <button onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <h1 className="mb-1 font-heading text-2xl font-bold">
          {mode === "handover" && "Owner Handover"}
          {mode === "return" && "Renter Return"}
          {mode === "review" && "Handover Evidence Review"}
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {mode === "handover" && "Upload current product photos, quality, and handover time before giving the item to renter."}
          {mode === "return" && "Upload return photos, quality, and return time before handing item back to owner."}
          {mode === "review" && "Review saved pre-handover and post-return evidence."}
        </p>

        <div className="mb-4 rounded-xl border border-border bg-card p-4 text-sm">
          <p><span className="font-semibold">Item:</span> {booking.itemTitle}</p>
          <p><span className="font-semibold">Owner:</span> {booking.owner}</p>
          <p><span className="font-semibold">Renter:</span> {booking.renter}</p>
          <p><span className="font-semibold">Current Status:</span> {booking.status}</p>
        </div>

        {mode !== "review" && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {mode === "handover" ? "Handover Photos" : "Return Photos"} ({photos.length}/5)
              </h2>

              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors py-10 cursor-pointer ${
                  dragging ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:border-primary/50"
                }`}
                onClick={() => document.getElementById("handoverFiles")?.click()}
              >
                <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
                <p className="text-sm font-medium">Drop photos here or click to upload</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB each (max 5)</p>
                <input
                  id="handoverFiles"
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => addPhotosFromFiles(e.target.files)}
                />
              </div>

              {photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photos.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
                      <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                      <button
                        onClick={() => removePhoto(i)}
                        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              {mode === "return" && prePhotos.length > 0 && (
                <div>
                  <h2 className="mb-2 font-semibold text-sm text-muted-foreground uppercase tracking-wide">Pre-Handover Reference</h2>
                  <div className="grid grid-cols-3 gap-2">
                    {prePhotos.slice(0, 3).map((url, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                        <img src={url} alt={`Pre ${i + 1}`} className="h-full w-full object-cover" />
                        <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-xs text-white">Before</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Camera className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Product Quality</h3>
                </div>
                <div className="mb-3 flex gap-2 flex-wrap">
                  {CONDITION_LEVELS.map((c) => (
                    <button
                      key={c.label}
                      onClick={() => setQualityScore(c.score)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-all border ${
                        qualityScore === c.score ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/50"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <motion.div className={`h-full rounded-full ${conditionLevel.color}`} animate={{ width: `${qualityScore}%` }} transition={{ duration: 0.4 }} />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Selected quality: <span className="font-semibold text-foreground">{conditionLevel.label}</span>
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4">
                <label className="mb-1 block text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {mode === "handover" ? "Handover Time" : "Return Time"}
                </label>
                <input
                  type="datetime-local"
                  value={eventAt}
                  onChange={(e) => setEventAt(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="rounded-xl border border-trust/20 bg-trust/5 p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-trust flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    This evidence will be saved for admin review and dispute resolution.
                  </p>
                </div>
              </div>

              <Button className="w-full" size="lg" onClick={handleSubmit} disabled={saving}>
                {saving ? "Saving..." : mode === "handover" ? "Save Handover & Start Rental" : "Save Return & Complete Rental"}
              </Button>

              {mode === "return" && (
                <Button variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50" onClick={() => setDisputeOpen(true)}>
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  Raise a Dispute
                </Button>
              )}
            </div>
          </div>
        )}

        {mode === "review" && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="mb-3 text-sm font-semibold">Pre-Handover Evidence</h2>
              <p className="text-xs text-muted-foreground mb-2">
                By: {booking.preHandoverBy || "-"} | Time: {booking.preHandoverAt ? new Date(booking.preHandoverAt).toLocaleString() : "-"} | Quality:{" "}
                {booking.preHandoverQualityScore ?? "-"}
              </p>
              {prePhotos.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pre-handover photos uploaded.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {prePhotos.map((url, i) => (
                    <img key={i} src={url} alt={`Pre ${i + 1}`} className="aspect-square rounded-lg object-cover" />
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="mb-3 text-sm font-semibold">Post-Return Evidence</h2>
              <p className="text-xs text-muted-foreground mb-2">
                By: {booking.postHandoverBy || "-"} | Time: {booking.postHandoverAt ? new Date(booking.postHandoverAt).toLocaleString() : "-"} | Quality:{" "}
                {booking.postHandoverQualityScore ?? "-"}
              </p>
              {postPhotos.length === 0 ? (
                <p className="text-sm text-muted-foreground">No return photos uploaded.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {postPhotos.map((url, i) => (
                    <img key={i} src={url} alt={`Post ${i + 1}`} className="aspect-square rounded-lg object-cover" />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer />

      <AnimatePresence>
        {disputeOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setDisputeOpen(false);
            }}
          >
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h2 className="font-heading text-lg font-bold">Raise a Dispute</h2>
                  <p className="text-xs text-muted-foreground">Our team will review within 24 hours</p>
                </div>
                <button onClick={() => setDisputeOpen(false)} className="ml-auto">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Describe the issue in detail..."
                rows={4}
                className="mb-4 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary resize-none"
              />

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setDisputeOpen(false)}>
                  Cancel
                </Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleDispute}>
                  Submit Dispute
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Handover;
