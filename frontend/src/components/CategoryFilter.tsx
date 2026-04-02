import { Camera, Wrench, Tent, Bike, PartyPopper, Laptop, Gamepad2, Music } from "lucide-react";
import { motion } from "framer-motion";

const categories = [
  { id: "all", label: "All", icon: null },
  { id: "electronics", label: "Electronics", icon: Laptop },
  { id: "cameras", label: "Cameras", icon: Camera },
  { id: "tools", label: "Tools", icon: Wrench },
  { id: "outdoor", label: "Outdoor", icon: Tent },
  { id: "bikes", label: "Bikes", icon: Bike },
  { id: "party", label: "Party", icon: PartyPopper },
  { id: "gaming", label: "Gaming", icon: Gamepad2 },
  { id: "music", label: "Music", icon: Music },
];

interface CategoryFilterProps {
  active: string;
  onChange: (id: string) => void;
}

const CategoryFilter = ({ active, onChange }: CategoryFilterProps) => (
  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
    {categories.map((cat) => {
      const isActive = active === cat.id;
      return (
        <button
          key={cat.id}
          onClick={() => onChange(cat.id)}
          className={`relative flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
            isActive
              ? "text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          }`}
        >
          {isActive && (
            <motion.div
              layoutId="activeCat"
              className="absolute inset-0 rounded-full bg-primary"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            {cat.icon && <cat.icon className="h-4 w-4" />}
            {cat.label}
          </span>
        </button>
      );
    })}
  </div>
);

export default CategoryFilter;
