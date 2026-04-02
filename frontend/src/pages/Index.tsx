import { useState, useEffect } from "react";
import { Search, MapPin, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ItemCard from "@/components/ItemCard";
import CategoryFilter from "@/components/CategoryFilter";
import TrustBadge from "@/components/TrustBadge";
import heroImage from "@/assets/hero-lendly.jpg";
import axios from "axios";

const Index = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    axios.get("http://localhost:3000/api/products")
      .then((res) => {
        setItems(res.data.products.map((p: any) => ({
          ...p,
          id: p._id,
          ownerName: p.owner,
          condition: p.condition || "Good",
          rating: 0,
          reviews: 0,
          ownerBadge: undefined,
        })));
      })
      .catch(() => {});
  }, []);

  const filtered = items.filter((item) => {
    const matchCat = category === "all" || item.category === category;
    const matchSearch =
      !search || item.title.toLowerCase().includes(search.toLowerCase()) || item.location.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Share anything" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/60 to-foreground/30" />
        </div>
        <div className="container relative z-10 py-20 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-xl"
          >
            <div className="mb-4 flex items-center gap-2">
              <TrustBadge level="verified" size="md" />
              <span className="text-sm text-primary-foreground/70">100% Verified Lenders</span>
            </div>
            <h1 className="mb-4 font-heading text-4xl font-bold leading-tight text-primary-foreground md:text-5xl lg:text-6xl">
              Rent Anything,
              <br />
              <span className="text-secondary">From Anyone</span>
            </h1>
            <p className="mb-8 max-w-md text-base text-primary-foreground/70 md:text-lg">
              The trusted marketplace to borrow cameras, tools, bikes, and more from verified people near you.
            </p>

            {/* Search Bar */}
            <div className="flex gap-2 rounded-xl bg-card/95 p-2 shadow-xl backdrop-blur-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search cameras, tools, bikes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border-0 bg-transparent pl-10 shadow-none focus-visible:ring-0"
                />
              </div>
              <div className="relative hidden sm:block sm:flex-1">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Location"
                  className="border-0 bg-transparent pl-10 shadow-none focus-visible:ring-0"
                />
              </div>
              <Button className="gap-2 px-6">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-b border-border bg-card">
        <div className="container flex flex-wrap items-center justify-center gap-8 py-5 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-trust" />
            <span>Escrow-Protected Payments</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span>ID-Verified Users</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-warning" />
            <span>Damage Protection</span>
          </div>
        </div>
      </section>

      <section className="container py-24">
  <div className="text-center mb-16">
    <h2 className="text-4xl font-bold mb-4">Why Choose Lendly?</h2>
    <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
      Lendly connects people who need items with those who own them,
      creating a trusted community for sharing resources efficiently.
    </p>
  </div>

  <div className="grid gap-10 md:grid-cols-3">

    <div className="p-8 border rounded-2xl text-center bg-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="w-14 h-14 flex items-center justify-center rounded-full bg-blue-100 mx-auto mb-5">
        <Shield className="h-7 w-7 text-blue-600" />
      </div>

      <h3 className="font-semibold text-xl mb-2">Secure Transactions</h3>

      <p className="text-muted-foreground text-sm leading-relaxed">
        Payments are protected through escrow to ensure safety for both
        lenders and borrowers.
      </p>
    </div>

    <div className="p-8 border rounded-2xl text-center bg-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="w-14 h-14 flex items-center justify-center rounded-full bg-green-100 mx-auto mb-5">
        <MapPin className="h-7 w-7 text-green-600" />
      </div>

      <h3 className="font-semibold text-xl mb-2">Local Community</h3>

      <p className="text-muted-foreground text-sm leading-relaxed">
        Discover items available nearby and connect with trusted people
        within your local community.
      </p>
    </div>

    <div className="p-8 border rounded-2xl text-center bg-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
      <div className="w-14 h-14 flex items-center justify-center rounded-full bg-purple-100 mx-auto mb-5">
        <Search className="h-7 w-7 text-purple-600" />
      </div>

      <h3 className="font-semibold text-xl mb-2">Easy Discovery</h3>

      <p className="text-muted-foreground text-sm leading-relaxed">
        Quickly search and filter thousands of items available for rent.
      </p>
    </div>

  </div>
</section>


        <section className="bg-muted/30 py-24 border-y">
          <div className="container">

            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-3">How Lendly Works</h2>
              <p className="text-muted-foreground text-lg">
                Renting and lending items is simple and secure.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12">

              <div className="text-center">
                <div className="w-16 h-16 flex items-center justify-center bg-blue-600 text-white rounded-full mx-auto mb-6 text-xl font-bold shadow-lg">
                  1
                </div>

                <h3 className="font-semibold text-xl mb-2">Find an Item</h3>

                <p className="text-muted-foreground text-sm leading-relaxed">
                  Search for cameras, tools, bikes, and more available from people
                  near your location.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 flex items-center justify-center bg-blue-600 text-white rounded-full mx-auto mb-6 text-xl font-bold shadow-lg">
                  2
                </div>

                <h3 className="font-semibold text-xl mb-2">Book Securely</h3>

                <p className="text-muted-foreground text-sm leading-relaxed">
                  Choose rental dates and confirm booking with our secure payment
                  system.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 flex items-center justify-center bg-blue-600 text-white rounded-full mx-auto mb-6 text-xl font-bold shadow-lg">
                  3
                </div>

                <h3 className="font-semibold text-xl mb-2">Borrow & Return</h3>

                <p className="text-muted-foreground text-sm leading-relaxed">
                  Pick up the item, use it for your needs, and return it safely
                  after your rental period.
                </p>
              </div>

            </div>

          </div>
        </section>


      <section className="py-24">
  <div className="container">

    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-14 text-center shadow-xl">

      <h2 className="text-4xl font-bold text-white mb-4">
        Start Sharing Today
      </h2>

      <p className="max-w-xl mx-auto mb-8 text-white/90 text-lg">
        Join the Lendly community today and start renting items from
        trusted people near you or earn money by lending your own.
      </p>

      <div className="flex justify-center gap-5 flex-wrap">

        <Button
          size="lg"
          className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-5 rounded-xl"
        >
          <a href="/list">Browse Rentals</a>
        </Button>

        <Button
          size="lg"
          className="bg-green-500 hover:bg-green-600 text-white font-bold px-8 py-5 rounded-xl shadow-md"
        >
          Add Your Item
        </Button>

      </div>

    </div>

  </div>
</section>
      <Footer />
    </div>
  );
};

export default Index;
