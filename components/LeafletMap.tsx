import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { useState, useEffect } from "react";
import L from "leaflet";

// Fix default marker icon issue in Leaflet
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Create a custom red marker icon for selected locations
// Using default icon for now to avoid type issues
const customIcon = L.Icon.Default.prototype;

const LocationMarker = ({
  onClick,
}: {
  onClick: (lat: number, lng: number) => void;
}) => {
  useMapEvents({
    click(e: L.LeafletMouseEvent) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

interface MarkerData {
  position: [number, number]; // [latitude, longitude]
  popup?: string;
  isSelected?: boolean; // To distinguish selected location from other markers
}

interface LeafletMapProps {
  center: [number, number]; // [latitude, longitude]
  zoom?: number;
  onMapClick?: (lat: number, lng: number) => void;
  markers?: MarkerData[];
  height?: string;
}

const LeafletMap = ({
  center,
  zoom = 13,
  onMapClick,
  markers = [],
  height = "400px"
}: LeafletMapProps) => {
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    setMapReady(true);
  }, []);

  // Ensure center coordinates are valid
  const validCenter: [number, number] = Array.isArray(center) && center.length === 2 && 
    typeof center[0] === 'number' && typeof center[1] === 'number' && 
    !isNaN(center[0]) && !isNaN(center[1]) && 
    center[0] !== 0 && center[1] !== 0
    ? center
    : [23.8103, 90.4125]; // Default to Dhaka coordinates if invalid

  if (!mapReady) {
    return <div style={{ height, backgroundColor: '#f3f4f6' }} className="animate-pulse rounded-lg" />;
  }

  return (
    <div style={{ height, width: "100%" }}>
      <MapContainer
        center={validCenter}
        zoom={zoom}
        style={{ width: "100%", height: "100%" }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {onMapClick && <LocationMarker onClick={onMapClick} />}
        
        {markers.map((marker, index) => (
          <Marker 
            key={index} 
            position={marker.position}
          >
            {marker.popup && (
              <div className="text-center">
                <div className="font-semibold text-gray-800">{marker.popup}</div>
                <div className="text-sm text-gray-600 mt-1">
                  Lat: {marker.position[0].toFixed(6)}, Lng: {marker.position[1].toFixed(6)}
                </div>
              </div>
            )}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default LeafletMap;
