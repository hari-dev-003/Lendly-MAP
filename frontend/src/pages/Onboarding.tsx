import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Upload, Camera, Shield, ChevronRight, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";

type Step = 0 | 1 | 2 | 3;

const STEPS = [
  { label: "Identity",  icon: Shield },
  { label: "Upload ID", icon: Upload },
  { label: "Selfie",    icon: Camera },
  { label: "Done",      icon: CheckCircle },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(0);
  const [submitting, setSubmitting] = useState(false);

  const raw = localStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : null;
  const username = user?.user?.username ?? "";
  const email    = user?.user?.email    ?? "";

  // Step 2 — ID docs
  const [docFront, setDocFront] = useState<File | null>(null);
  const [docBack,  setDocBack]  = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState("");
  const [backPreview,  setBackPreview]  = useState("");

  // Step 3 — Selfie via webcam
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream,      setStream]      = useState<MediaStream | null>(null);
  const [selfieUrl,   setSelfieUrl]   = useState("");
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    if (step === 2) startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [step]);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch {
      setCameraError("Camera access denied. Please allow camera permission.");
    }
  };

  const stopCamera = () => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  };

  const captureSelfie = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d")!;
    canvasRef.current.width  = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    setSelfieUrl(canvasRef.current.toDataURL("image/jpeg", 0.8));
    stopCamera();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, side: "front" | "back") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (side === "front") { setDocFront(file);  setFrontPreview(url); }
    else                  { setDocBack(file);   setBackPreview(url);  }
  };

  const handleSubmit = async () => {
    if (!docFront) { toast.error("Please upload the front of your ID"); return; }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("selfieUrl", selfieUrl);
      if (docFront) formData.append("docFront", docFront);
      if (docBack)  formData.append("docBack",  docBack);

      const res = await fetch("http://localhost:3000/api/kyc/submit", { method: "POST", body: formData });
      if (!res.ok) throw new Error("KYC submission failed");

      // Update localStorage with pending KYC status
      if (user) {
        user.user.kycStatus = "pending";
        localStorage.setItem("user", JSON.stringify(user));
      }

      setStep(3);
    } catch (err: any) {
      toast.error(err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="container max-w-2xl py-12">
        {/* Stepper */}
        <div className="mb-10 flex items-center justify-between">
          {STEPS.map(({ label, icon: Icon }, i) => (
            <div key={i} className="flex items-center">
              <div className="flex flex-col items-center">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                  step > i  ? "border-green-500 bg-green-500 text-white" :
                  step === i ? "border-primary bg-primary text-primary-foreground" :
                               "border-border bg-muted text-muted-foreground"
                }`}>
                  {step > i ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                </div>
                <span className={`mt-1.5 text-xs font-medium ${step === i ? "text-primary" : "text-muted-foreground"}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`mx-3 mb-5 h-0.5 w-12 sm:w-20 transition-colors ${step > i ? "bg-green-500" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 0 — Identity */}
          {step === 0 && (
            <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="rounded-2xl border border-border bg-card p-8 shadow-sm">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Shield className="h-7 w-7 text-primary" />
              </div>
              <h2 className="mb-2 font-heading text-2xl font-bold">Verify Your Identity</h2>
              <p className="mb-6 text-muted-foreground">
                KYC verification builds trust in the Lendly community. Your data is encrypted and secure.
              </p>
              <div className="mb-6 space-y-3 rounded-xl bg-muted/50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Username</span>
                  <span className="font-semibold">{username}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-semibold">{email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">KYC Status</span>
                  <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">Not Verified</span>
                </div>
              </div>
              <div className="mb-6 space-y-2 text-sm text-muted-foreground">
                {["Upload a Government ID (Aadhaar/PAN/Passport)", "Take a live selfie for face match", "Verification takes 24–48 hours"].map((t) => (
                  <div key={t} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {t}
                  </div>
                ))}
              </div>
              <Button className="w-full gap-2" onClick={() => setStep(1)}>
                Start Verification <ChevronRight className="h-4 w-4" />
              </Button>
            </motion.div>
          )}

          {/* Step 1 — Upload ID */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="rounded-2xl border border-border bg-card p-8 shadow-sm">
              <h2 className="mb-1 font-heading text-2xl font-bold">Upload Government ID</h2>
              <p className="mb-6 text-sm text-muted-foreground">Aadhaar card, PAN card, or Passport</p>

              <div className="space-y-4">
                {(["front", "back"] as const).map((side) => {
                  const preview = side === "front" ? frontPreview : backPreview;
                  return (
                    <div key={side}>
                      <label className="mb-1.5 block text-sm font-medium capitalize">
                        ID {side} {side === "front" && <span className="text-red-500">*</span>}
                      </label>
                      <label className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-6 cursor-pointer transition-colors ${
                        preview ? "border-green-400 bg-green-50" : "border-border hover:border-primary/50"
                      }`}>
                        {preview ? (
                          <>
                            <img src={preview} alt={side} className="h-32 rounded object-contain" />
                            <span className="mt-2 text-xs text-green-600 font-medium">Uploaded ✓</span>
                          </>
                        ) : (
                          <>
                            <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Click to upload {side}</span>
                          </>
                        )}
                        <input type="file" accept="image/*" className="hidden"
                          onChange={(e) => handleFileChange(e, side)} />
                      </label>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>Back</Button>
                <Button className="flex-1 gap-2" disabled={!docFront} onClick={() => setStep(2)}>
                  Continue <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2 — Selfie */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="rounded-2xl border border-border bg-card p-8 shadow-sm">
              <h2 className="mb-1 font-heading text-2xl font-bold">Live Selfie</h2>
              <p className="mb-6 text-sm text-muted-foreground">Look straight at the camera in a well-lit area</p>

              <div className="mb-4 flex justify-center">
                {selfieUrl ? (
                  <div className="relative">
                    <img src={selfieUrl} alt="selfie" className="h-56 w-56 rounded-full object-cover border-4 border-green-400" />
                    <button onClick={() => { setSelfieUrl(""); startCamera(); }}
                      className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : cameraError ? (
                  <div className="text-center text-sm text-red-500 py-8">{cameraError}</div>
                ) : (
                  <div className="relative h-56 w-56 overflow-hidden rounded-full bg-muted border-4 border-primary/30">
                    <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
                  </div>
                )}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {!selfieUrl && !cameraError && (
                <div className="mb-4 flex justify-center">
                  <Button onClick={captureSelfie} className="gap-2">
                    <Camera className="h-4 w-4" /> Capture Photo
                  </Button>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                <Button className="flex-1 gap-2" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</> : "Submit for Review"}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3 — Done */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="rounded-2xl border border-border bg-card p-8 shadow-sm text-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mx-auto">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="mb-2 font-heading text-2xl font-bold">Submitted!</h2>
              <p className="mb-6 text-muted-foreground max-w-sm mx-auto">
                Your KYC documents are under review. You'll be notified within 24–48 hours. You can continue using Lendly in the meantime.
              </p>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-700">
                <Loader2 className="h-4 w-4 animate-spin" /> Verification Pending
              </div>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => navigate("/home")}>Go to Home</Button>
                <Button variant="outline" onClick={() => navigate("/list")}>Browse Items</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
