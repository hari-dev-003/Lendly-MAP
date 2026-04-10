import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Link } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons broken by Vite bundling
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface MapItem {
  id: string;
  title: string;
  image: string;
  price: number;
  period: string;
  location: string;
  lat: number;
  lng: number;
}

interface MapViewProps {
  items: MapItem[];
}

const MapView = ({ items }: MapViewProps) => {
  const valid = items.filter((i) => i.lat && i.lng);

  const center: [number, number] =
    valid.length > 0
      ? [valid[0].lat, valid[0].lng]
      : [12.9716, 77.5946]; // Default: Bangalore

  return (
    <div className="w-full rounded-xl overflow-hidden border border-border" style={{ height: 480 }}>
      {valid.length === 0 ? (
        <div className="flex h-full items-center justify-center bg-muted text-sm text-muted-foreground">
          No items with location data yet. Add items with a location to see them here.
        </div>
      ) : (
        <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {valid.map((item) => (
            <Marker key={item.id} position={[item.lat, item.lng]}>
              <Popup maxWidth={220}>
                <div className="w-48">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="mb-2 h-28 w-full rounded object-cover"
                  />
                  <p className="font-semibold text-sm leading-tight">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{item.location}</p>
                  <p className="mt-1 font-bold text-blue-600 text-sm">
                    ₹{item.price}/{item.period}
                  </p>
                  <Link
                    to={`/item/${item.id}`}
                    className="mt-2 block w-full rounded bg-blue-600 py-1.5 text-center text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    View Item
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  );
};

export default MapView;
