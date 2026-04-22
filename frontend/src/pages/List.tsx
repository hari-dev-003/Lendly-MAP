import { useState, useEffect } from "react";
import { Search, ArrowRight, Map, Grid } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import ItemCard from "@/components/ItemCard";
import CategoryFilter from "@/components/CategoryFilter";
import Navbar from "@/components/Navbar";
import MapView from "@/components/MapView";
import axios from "axios";

interface Product {
  _id: string;
  id: string;
  title: string;
  price: number;
  period: string;
  location: string;
  image: string;
  category: string;
  description: string;
  owner: string;
  ownerName: string;
  condition: string;
  rating: number;
  reviews: number;
  ownerBadge: undefined;
  lat?: number;
  lng?: number;
}

export default function List() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");

  useEffect(() => {
    axios.get("http://localhost:3000/api/products")
      .then((res) => {
        const mapped = res.data.products.map((p: any) => ({
          ...p,
          id: p._id,
          ownerName: p.owner,
          condition: p.condition || "Good",
          rating: 0,
          reviews: 0,
          ownerBadge: undefined,
        }));
        setProducts(mapped);
      })
      .catch((err) => console.log("Error fetching products", err));
  }, []);

  const filtered = products.filter((item) => {
    const matchCategory = category === "all" || item.category === category;
    const matchSearch =
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const mapItems = filtered
    .filter((i) => i.lat && i.lng)
    .map((i) => ({ id: i.id, title: i.title, image: i.image, price: i.price, period: i.period, location: i.location, lat: i.lat!, lng: i.lng! }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="font-bold text-center text-3xl mb-6">Search Products</h1>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products, description or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-1 rounded-lg border bg-white p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Grid className="h-4 w-4" /> Grid
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`flex items-center gap-1.5 rounded px-3 py-1.5 text-sm font-medium transition-colors ${viewMode === "map" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Map className="h-4 w-4" /> Map
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Listings */}
      <section className="container py-10 mb-32">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            Browse Rentals
            <span className="ml-2 text-base font-normal text-muted-foreground">({filtered.length})</span>
          </h2>
          <Button variant="ghost" className="gap-1 text-primary">
            View All <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <CategoryFilter active={category} onChange={setCategory} />

        {viewMode === "map" ? (
          <div className="mt-6">
            <MapView items={mapItems} />
            {mapItems.length < filtered.length && (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                {filtered.length - mapItems.length} item(s) not shown on map (no coordinates). Switch to Grid view to see all.
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map((item) => (
                <ItemCard key={item._id} item={item} />
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="py-20 text-center text-gray-500">
                <p className="text-lg">No items found. Try a different search or category.</p>
              </div>
            )}
          </>
        )}
      </section>

      <Footer />
    </div>
  );
}
