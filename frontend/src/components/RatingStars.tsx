import { Star } from "lucide-react";

interface RatingStarsProps {
  rating: number;
  maxStars?: number;
  size?: number;
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

const RatingStars = ({ rating, maxStars = 5, size = 16, interactive = false, onRate }: RatingStarsProps) => {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxStars }, (_, i) => {
        const filled = i < Math.floor(rating);
        const half = !filled && i < rating;
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => onRate?.(i + 1)}
            className={interactive ? "cursor-pointer transition-transform hover:scale-125" : "cursor-default"}
          >
            <Star
              size={size}
              className={
                filled
                  ? "fill-warning text-warning"
                  : half
                  ? "fill-warning/50 text-warning"
                  : "fill-muted text-muted-foreground/30"
              }
            />
          </button>
        );
      })}
    </div>
  );
};

export default RatingStars;
