import { useState, useEffect } from "react";
import { Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";
import ItemCard from "@/components/ItemCard";
import CategoryFilter from "@/components/CategoryFilter";
import Navbar from "@/components/Navbar";
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
}

export default function List() {

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  /* ---------------- FETCH PRODUCTS ---------------- */

  useEffect(() => {

    const fetchProducts = async () => {

      try {

        const res = await axios.get("http://localhost:3000/api/products");

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

      } catch (error) {

        console.log("Error fetching products", error);

      }

    };

    fetchProducts();

  }, []);

  /* ---------------- FILTER PRODUCTS ---------------- */

  const filtered = products.filter((item) => {

    const matchCategory =
      category === "all" || item.category === category;

    const matchSearch =
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());

    return matchCategory && matchSearch;

  });

  return (

    <div className="min-h-screen bg-gray-50">

      <Navbar />

      {/* Header */}

      <div className="bg-white shadow-sm">

        <div className="max-w-7xl mx-auto px-4 py-6">

          <h1 className="font-bold text-center text-3xl mb-6">
            Search Products
          </h1>

          <div className="relative">

            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />

            <input
              type="text"
              placeholder="Search products, description or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />

          </div>

        </div>

      </div>

      {/* Listings */}

      <section className="container py-10 mb-32">

        <div className="mb-6 flex items-center justify-between">

          <h2 className="text-2xl font-bold">
            Browse Rentals
          </h2>

          <Button variant="ghost" className="gap-1 text-primary">
            View All
            <ArrowRight className="h-4 w-4" />
          </Button>

        </div>

        {/* Category Filter */}

        <CategoryFilter
          active={category}
          onChange={setCategory}
        />

        {/* Product Grid */}

        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

          {filtered.map((item) => (

            <ItemCard key={item._id} item={item} />

          ))}

        </div>

        {/* Empty State */}

        {filtered.length === 0 && (

          <div className="py-20 text-center text-gray-500">

            <p className="text-lg">
              No items found. Try a different search or category.
            </p>

          </div>

        )}

      </section>

      <Footer />

    </div>

  );
}