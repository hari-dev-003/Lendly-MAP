import { useState, useCallback, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { X, MapPin, Check, Loader2, Navigation } from "lucide-react";
import { motion } from "framer-motion";

// Fix Leaflet default marker icons in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface Coords { lat: number; lng: number; }

interface MapPickerModalProps {
  initialCoords: Coords;
  initialAddress: string;
  onConfirm: (coords: Coords, address: string) => void;
  onCancel: () => void;
}

// Inner component: handles map clicks to reposition pin
function ClickHandler({ onMapClick }: { onMapClick: (c: Coords) => void }) {
  useMapEvents({
    click: (e) => onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng }),
  });
  return null;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    return data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

export default function MapPickerModal({
  initialCoords,
  initialAddress,
  onConfirm,
  onCancel,
}: MapPickerModalProps) {
  const [pin, setPin] = useState<Coords>(initialCoords);
  const [address, setAddress] = useState(initialAddress);
  const [resolving, setResolving] = useState(false);
  const markerRef = useRef<L.Marker>(null);

  const updatePin = useCallback(async (coords: Coords) => {
    setPin(coords);
    setResolving(true);
    const addr = await reverseGeocode(coords.lat, coords.lng);
    setAddress(addr);
    setResolving(false);
  }, []);

  const handleDragEnd = useCallback(() => {
    const marker = markerRef.current;
    if (!marker) return;
    const { lat, lng } = marker.getLatLng();
    updatePin({ lat, lng });
  }, [updatePin]);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => updatePin({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative flex w-full max-w-2xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden"
        style={{ maxHeight: "90vh" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="font-semibold text-lg">Pin Your Location</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Drag the pin or click anywhere on the map to adjust
            </p>
          </div>
          <button
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Map */}
        <div className="relative flex-1" style={{ height: 380 }}>
          <MapContainer
            center={[pin.lat, pin.lng]}
            zoom={15}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickHandler onMapClick={updatePin} />
            <Marker
              position={[pin.lat, pin.lng]}
              draggable
              ref={markerRef}
              eventHandlers={{ dragend: handleDragEnd }}
            />
          </MapContainer>

          {/* Use my location button */}
          <button
            onClick={handleUseMyLocation}
            className="absolute bottom-4 right-4 z-[1000] flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-medium shadow-md hover:bg-gray-50 transition-colors"
          >
            <Navigation className="h-3.5 w-3.5 text-blue-600" />
            Use my location
          </button>
        </div>

        {/* Address bar + footer */}
        <div className="border-t bg-gray-50 px-5 py-4">
          <div className="mb-4 flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
            <div className="flex-1 min-w-0">
              {resolving ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Resolving address...
                </div>
              ) : (
                <p className="text-sm text-gray-700 leading-snug line-clamp-2">{address}</p>
              )}
              <p className="mt-0.5 text-xs text-gray-400">
                {pin.lat.toFixed(6)}, {pin.lng.toFixed(6)}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(pin, address)}
              disabled={resolving}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              <Check className="h-4 w-4" />
              Confirm Location
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
