import { Link } from "react-router-dom";
import { MapPin, Heart } from "lucide-react";
import { motion } from "framer-motion";
import RatingStars from "./RatingStars";
import TrustBadge from "./TrustBadge";

export interface ItemData {
  id: string;
  title: string;
  image: string;
  price: number;
  period: string;
  location: string;
  rating: number;
  reviews: number;
  ownerName: string;
  ownerBadge?: "verified" | "trusted" | "top";
  condition: string;
  category: string;
}

const ItemCard = ({ item }: { item: ItemData }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Link
        to={`/item/${item.id}`}
        className="group block overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg"
      >
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={item.image}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <button
            onClick={(e) => { e.preventDefault(); }}
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-card/80 backdrop-blur-sm transition-colors hover:bg-card"
          >
            <Heart className="h-4 w-4 text-muted-foreground" />
          </button>
          <span className="absolute left-3 top-3 rounded-full bg-card/80 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
            {item.condition}
          </span>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="mb-1 flex items-center justify-between">
            <h1 className="font-heading text-ls font-semibold text-foreground line-clamp-1">{item.title}</h1>
          </div>
          <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="font-bold">Location : </span>{item.location}
          </div>
          <div className="mb-3 flex items-center gap-2">
            {/* <RatingStars rating={item.rating} size={12} /> */}
            {/* <span className="text-xs text-muted-foreground">({item.reviews})</span> */}
          </div>
          <div className="flex items-center justify-between">
            <div>
              <span className="font-heading text-lg font-bold text-primary">₹{item.price}</span>
              <span className="text-xs text-muted-foreground font-bold"> / {item.period}</span>
              <br />
              <span className="text-xs text-muted-foreground"><span className="font-bold">Owner: </span>{item.owner}</span>
              <br />
              <span className="text-xs text-muted-foreground"><span className="font-bold">Description : </span>{item.description}</span>
            </div>
            {item.ownerBadge && <TrustBadge level={item.ownerBadge} />}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ItemCard;
