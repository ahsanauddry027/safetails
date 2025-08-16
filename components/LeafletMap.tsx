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
  position: [number, number];
  popup?: string;
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
    : [0, 0]; // Default to [0, 0] if invalid

  if (!mapReady) {
    return <div style={{ height, backgroundColor: '#f3f4f6' }} className="animate-pulse rounded-lg" />;
  }

  return (
    <div style={{ height, width: "100%" }}>
      <MapContainer
        center={[validCenter[0], validCenter[1]]}
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
            position={[marker.position[0], marker.position[1]]}
          />
        ))}
      </MapContainer>
    </div>
  );
};

export default LeafletMap;
