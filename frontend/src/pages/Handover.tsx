import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Upload, Camera, CheckCircle, AlertTriangle, ArrowLeft,
  Shield, X, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import axios from "axios";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type HandoverPhase = "pre" | "post";

interface PhotoSet {
  pre: string[];
  post: string[];
}

const CONDITION_LEVELS = [
  { label: "Perfect", color: "bg-green-500", score: 100 },
  { label: "Good", color: "bg-lime-500", score: 80 },
  { label: "Minor Wear", color: "bg-yellow-500", score: 60 },
  { label: "Damage", color: "bg-orange-500", score: 30 },
  { label: "Severe", color: "bg-red-500", score: 10 },
];

const Handover = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();

  const [phase, setPhase] = useState<HandoverPhase>("pre");
  const [photos, setPhotos] = useState<PhotoSet>({ pre: [], post: [] });
  const [dragging, setDragging] = useState(false);
  const [conditionScore, setConditionScore] = useState(100);
  const [disputeOpen, setDisputeOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const currentPhotos = photos[phase];

  const addPhotoUrls = (urls: string[]) => {
    setPhotos((prev) => ({
      ...prev,
      [phase]: [...prev[phase], ...urls].slice(0, 5),
    }));
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    // Create local object URLs for preview
    const urls = Array.from(files)
      .slice(0, 5 - currentPhotos.length)
      .map((f) => URL.createObjectURL(f));
    addPhotoUrls(urls);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [phase, currentPhotos]
  );

  const removePhoto = (index: number) => {
    setPhotos((prev) => ({
      ...prev,
      [phase]: prev[phase].filter((_, i) => i !== index),
    }));
  };

  const handleSubmitHandover = async () => {
    if (photos.pre.length === 0 && phase === "pre") {
      toast.error("Upload at least one pre-handover photo");
      return;
    }
    if (photos.post.length === 0 && phase === "post") {
      toast.error("Upload at least one post-handover photo");
      return;
    }

    setUploading(true);
    try {
      if (bookingId) {
        await axios.patch(`http://localhost:3000/api/bookings/${bookingId}/photos`, {
          type: phase,
          photos: photos[phase],
        });
        if (phase === "pre") {
          await axios.patch(`http://localhost:3000/api/bookings/${bookingId}/status`, { status: "active" });
          toast.success("Pre-handover photos saved. Rental is now active!");
          setPhase("post");
        } else {
          await axios.patch(`http://localhost:3000/api/bookings/${bookingId}/status`, { status: "completed" });
          toast.success("Return confirmed! Funds will be released.");
          setSubmitted(true);
        }
      } else {
        // Demo mode (no bookingId)
        if (phase === "pre") {
          setPhase("post");
          toast.success("Pre-handover photos saved!");
        } else {
          setSubmitted(true);
          toast.success("Return confirmed!");
        }
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setUploading(false);
    }
  };

  const handleDispute = async () => {
    if (!disputeReason.trim()) { toast.error("Please describe the issue"); return; }
    try {
      if (bookingId) {
        await axios.patch(`http://localhost:3000/api/bookings/${bookingId}/status`, {
          status: "disputed",
          disputeReason,
        });
      }
      toast.success("Dispute raised. Our team will review within 24 hours.");
      setDisputeOpen(false);
      navigate("/my-bookings");
    } catch {
      toast.error("Failed to raise dispute");
    }
  };

  const conditionLevel = CONDITION_LEVELS.find((c) => c.score <= conditionScore) || CONDITION_LEVELS[4];

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <div className="container flex flex-1 flex-col items-center justify-center py-20 text-center">
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-100 mx-auto">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </motion.div>
          <h1 className="mb-2 font-heading text-3xl font-bold">Return Confirmed!</h1>
          <p className="mb-8 text-muted-foreground max-w-sm">
            The rental has been completed. Escrow funds will be released to the owner within 24 hours.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => navigate("/my-bookings")}>View My Bookings</Button>
            <Button variant="outline" onClick={() => navigate("/list")}>Browse More Items</Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      <div className="container py-8 max-w-4xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <h1 className="mb-1 font-heading text-2xl font-bold">
          {phase === "pre" ? "Pre-Handover Documentation" : "Return & Condition Check"}
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {phase === "pre"
            ? "Take photos of the item before the renter picks it up to document its current condition."
            : "Document the returned item's condition and compare with pre-handover photos."}
        </p>

        {/* Phase Progress */}
        <div className="mb-8 flex items-center gap-3">
          {(["pre", "post"] as HandoverPhase[]).map((p, i) => (
            <div key={p} className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                phase === p ? "bg-primary text-primary-foreground" :
                (p === "pre" && phase === "post") ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
              }`}>
                {p === "pre" && phase === "post" ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-sm font-medium ${phase === p ? "text-foreground" : "text-muted-foreground"}`}>
                {p === "pre" ? "Pre-Handover" : "Post-Return"}
              </span>
              {i === 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          ))}
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Upload Zone */}
          <div className="space-y-4">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              {phase === "pre" ? "Pre-Handover Photos" : "Post-Return Photos"} ({currentPhotos.length}/5)
            </h2>

            {/* Drag & Drop */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors py-10 cursor-pointer ${
                dragging ? "border-primary bg-primary/5" : "border-border bg-muted/30 hover:border-primary/50"
              }`}
              onClick={() => document.getElementById("fileInput")?.click()}
            >
              <Upload className="h-8 w-8 mb-2 text-muted-foreground" />
              <p className="text-sm font-medium">Drop photos here or click to upload</p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB each (max 5)</p>
              <input
                id="fileInput"
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>

            {/* Photo Grid */}
            {currentPhotos.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {currentPhotos.map((url, i) => (
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

          {/* Right Panel */}
          <div className="space-y-4">
            {/* Comparison (post phase only) */}
            {phase === "post" && photos.pre.length > 0 && (
              <div>
                <h2 className="mb-2 font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Pre-Handover Reference
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {photos.pre.map((url, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                      <img src={url} alt={`Pre ${i + 1}`} className="h-full w-full object-cover" />
                      <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1 text-xs text-white">Before</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Condition Indicator */}
            {phase === "post" && (
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Camera className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">Condition Assessment</h3>
                  <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">AI Powered</span>
                </div>
                <div className="mb-3 flex gap-2 flex-wrap">
                  {CONDITION_LEVELS.map((c) => (
                    <button
                      key={c.label}
                      onClick={() => setConditionScore(c.score)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-all border ${
                        conditionScore === c.score
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:border-foreground/50"
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${conditionLevel.color}`}
                    animate={{ width: `${conditionScore}%` }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Condition: <span className="font-semibold text-foreground">{conditionLevel.label}</span>
                </p>
              </div>
            )}

            {/* Escrow Info */}
            <div className="rounded-xl border border-trust/20 bg-trust/5 p-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-trust flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-trust">Escrow Protected</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {phase === "pre"
                      ? "Payment is held in escrow until the item is returned in agreed condition."
                      : "Confirming return will trigger escrow release within 24 hours."}
                  </p>
                </div>
              </div>
            </div>

            <Button className="w-full" size="lg" onClick={handleSubmitHandover} disabled={uploading}>
              {uploading ? "Saving..." : phase === "pre" ? "Confirm Handover & Start Rental" : "Confirm Return & Release Funds"}
            </Button>

            {phase === "post" && (
              <Button
                variant="outline"
                className="w-full border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => setDisputeOpen(true)}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Raise a Dispute
              </Button>
            )}
          </div>
        </div>
      </div>

      <Footer />

      {/* Dispute Modal */}
      <AnimatePresence>
        {disputeOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setDisputeOpen(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl"
            >
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

              <div className="mb-4 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                <strong>What happens next:</strong> We'll review your photos, contact both parties, and mediate a fair resolution. Funds remain in escrow during this process.
              </div>

              <textarea
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="Describe the issue in detail — what damage was found, what you expected, any agreements made..."
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
