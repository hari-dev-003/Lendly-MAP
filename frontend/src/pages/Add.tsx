import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import MapPickerModal from "@/components/MapPickerModal";

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface Coords { lat: number; lng: number; }

export default function Add() {
  const navigate = useNavigate();
  const raw = localStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : null;

  const [image, setImage] = useState<File | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [pinnedAddress, setPinnedAddress] = useState("");
  const [mapOpen, setMapOpen] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<Coords | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    period: "day",
    location: "",
    category: "",
    condition: "Good",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Reset pin when location text changes
    if (name === "location") { setCoords(null); setPinnedAddress(""); }
  };

  // Step 1: Geocode the typed location, then open the map modal
  const handlePinClick = async () => {
    if (!formData.location.trim()) {
      toast.error("Please enter a location first");
      return;
    }
    setGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.location)}&limit=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      if (data[0]) {
        const c: Coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        setPendingCoords(c);
        setMapOpen(true);
      } else {
        // Fall back to Bangalore center so map still opens
        setPendingCoords({ lat: 12.9716, lng: 77.5946 });
        setMapOpen(true);
        toast.info("Location not found on map — drag the pin to your exact location.");
      }
    } catch {
      toast.error("Geocoding failed. Check your internet connection.");
    } finally {
      setGeocoding(false);
    }
  };

  // Step 2: User confirmed location in modal
  const handleMapConfirm = (confirmedCoords: Coords, address: string) => {
    setCoords(confirmedCoords);
    setPinnedAddress(address);
    setMapOpen(false);
    toast.success("Location pinned!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) { toast.error("Please select an image"); return; }
    setLoading(true);

    try {
      const data = new FormData();
      data.append("title",       formData.title);
      data.append("description", formData.description);
      data.append("price",       formData.price);
      data.append("period",      formData.period);
      data.append("location",    formData.location);
      data.append("owner",       user?.user?.username ?? "");
      data.append("category",    formData.category);
      data.append("condition",   formData.condition);
      if (coords) {
        data.append("lat", String(coords.lat));
        data.append("lng", String(coords.lng));
      }
      data.append("image", image);

      const res = await fetch("http://localhost:3000/api/upload", { method: "POST", body: data });
      if (!res.ok) throw new Error("Upload failed");

      toast.success("Item listed successfully!");
      navigate("/list");
    } catch {
      toast.error("Upload failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 mt-12 mb-20">
        <div className="w-full max-w-2xl bg-white p-8 rounded-2xl shadow-lg">
          <h1 className="text-3xl font-bold mb-6 text-center">Add New Listing</h1>

          <form onSubmit={handleSubmit} className="space-y-5">

            <input type="text" name="title" placeholder="Item Title"
              value={formData.title} onChange={handleChange} required
              className="w-full border px-4 py-2 rounded" />

            <input type="file" name="image" accept="image/*"
              onChange={(e) => e.target.files && setImage(e.target.files[0])} required
              className="w-full border px-4 py-2 rounded" />

            <div className="grid grid-cols-2 gap-3">
              <input type="number" name="price" placeholder="Price (₹)"
                value={formData.price} onChange={handleChange} required
                className="w-full border px-4 py-2 rounded" />
              <select name="period" value={formData.period} onChange={handleChange}
                className="w-full border px-4 py-2 rounded">
                <option value="hour">Per Hour</option>
                <option value="day">Per Day</option>
                <option value="week">Per Week</option>
              </select>
            </div>

            {/* Location + Pin button */}
            <div>
              <div className="flex gap-2">
                <input type="text" name="location"
                  placeholder="Location (e.g. Koramangala, Bangalore)"
                  value={formData.location} onChange={handleChange}
                  className="flex-1 border px-4 py-2 rounded" />
                <button
                  type="button"
                  onClick={handlePinClick}
                  disabled={geocoding || !formData.location.trim()}
                  className={`flex items-center gap-1.5 rounded border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                    coords
                      ? "border-green-400 bg-green-50 text-green-700 hover:bg-green-100"
                      : "bg-gray-50 hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  {geocoding
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <MapPin className={`h-4 w-4 ${coords ? "text-green-600" : ""}`} />
                  }
                  {coords ? "Pinned ✓" : "Pin on Map"}
                </button>
              </div>

              {/* Mini map preview after pinning */}
              {coords && (
                <div className="mt-3 relative rounded-xl overflow-hidden border border-green-300 shadow-sm">
                  <MapContainer
                    center={[coords.lat, coords.lng]}
                    zoom={15}
                    style={{ height: 180, width: "100%" }}
                    zoomControl={false}
                    scrollWheelZoom={false}
                    dragging={false}
                    doubleClickZoom={false}
                    attributionControl={false}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <Marker position={[coords.lat, coords.lng]} />
                  </MapContainer>

                  {/* Address overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm px-3 py-2 flex items-start justify-between gap-2">
                    <div className="flex items-start gap-1.5 min-w-0">
                      <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-green-600 mt-0.5" />
                      <p className="text-xs text-gray-700 line-clamp-1">{pinnedAddress}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setCoords(null); setPinnedAddress(""); }}
                      className="flex-shrink-0 rounded-full p-0.5 hover:bg-gray-200 transition-colors"
                      title="Remove pin"
                    >
                      <X className="h-3.5 w-3.5 text-gray-500" />
                    </button>
                  </div>

                  {/* Edit pin button */}
                  <button
                    type="button"
                    onClick={handlePinClick}
                    className="absolute right-2 top-2 z-[1000] rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium shadow hover:bg-gray-50 transition-colors"
                  >
                    Edit Pin
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <select name="category" value={formData.category} onChange={handleChange} required
                className="w-full border px-4 py-2 rounded">
                <option value="">Select Category</option>
                <option value="cameras">Cameras</option>
                <option value="electronics">Electronics</option>
                <option value="tools">Tools</option>
                <option value="bikes">Bikes</option>
                <option value="outdoor">Outdoor</option>
                <option value="party">Party</option>
                <option value="gaming">Gaming</option>
                <option value="music">Music</option>
              </select>
              <select name="condition" value={formData.condition} onChange={handleChange}
                className="w-full border px-4 py-2 rounded">
                <option value="Like New">Like New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
              </select>
            </div>

            <textarea name="description" placeholder="Description" rows={3}
              value={formData.description} onChange={handleChange}
              className="w-full border px-4 py-2 rounded resize-none" />

            <button type="submit" disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-60">
              {loading ? "Uploading..." : "Add Listing"}
            </button>

          </form>
        </div>
      </div>

      <Footer />

      {/* Map Picker Modal */}
      <AnimatePresence>
        {mapOpen && pendingCoords && (
          <MapPickerModal
            initialCoords={pendingCoords}
            initialAddress={formData.location}
            onConfirm={handleMapConfirm}
            onCancel={() => setMapOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
