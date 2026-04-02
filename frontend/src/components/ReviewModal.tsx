import { useState } from "react";
import { X, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";

interface ReviewModalProps {
  bookingId: string;
  itemId: string;
  reviewer: string;
  reviewee: string;
  itemTitle: string;
  type: "renter_to_owner" | "owner_to_renter";
  onClose: () => void;
  onSubmitted: () => void;
}

const ReviewModal = ({
  bookingId, itemId, reviewer, reviewee, itemTitle, type, onClose, onSubmitted
}: ReviewModalProps) => {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const labels = ["Terrible", "Poor", "Okay", "Good", "Excellent"];

  const handleSubmit = async () => {
    if (rating === 0) { toast.error("Please select a rating"); return; }
    setSubmitting(true);
    try {
      await axios.post("http://localhost:3000/api/reviews", {
        itemId, bookingId, reviewer, reviewee, rating, comment, type
      });
      toast.success("Review submitted! Thank you.");
      onSubmitted();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl"
        >
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h2 className="font-heading text-xl font-bold">Leave a Review</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {type === "renter_to_owner" ? `How was ${reviewee} as an owner?` : `How was ${reviewee} as a renter?`}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 italic">"{itemTitle}"</p>
            </div>
            <button onClick={onClose} className="rounded-full p-1 hover:bg-muted transition-colors">
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Stars */}
          <div className="mb-4 flex flex-col items-center">
            <div className="flex gap-2 mb-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className="h-9 w-9 transition-colors"
                    fill={(hovered || rating) >= star ? "#F59E0B" : "transparent"}
                    stroke={(hovered || rating) >= star ? "#F59E0B" : "#D1D5DB"}
                  />
                </button>
              ))}
            </div>
            {(hovered || rating) > 0 && (
              <p className="text-sm font-medium text-amber-600">
                {labels[(hovered || rating) - 1]}
              </p>
            )}
          </div>

          {/* Comment */}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience (optional)..."
            rows={3}
            className="mb-4 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary resize-none"
          />

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Skip
            </Button>
            <Button className="flex-1" onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReviewModal;
