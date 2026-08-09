import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons issue with builder/bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons for Map
const customerIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/619/619034.png', // Red house pin
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

const driverIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png', // Motorcycle pin
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

// Component to dynamically adjust map bounds when coordinates shift
function ChangeMapView({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 0) {
      // Filter out invalid zero lat/lng values
      const validCoords = coords.filter(c => c && c[0] !== 0 && c[1] !== 0);
      if (validCoords.length === 1) {
        map.setView(validCoords[0], 15, { animate: true });
      } else if (validCoords.length > 1) {
        const bounds = L.latLngBounds(validCoords);
        map.fitBounds(bounds, { padding: [50, 50], animate: true });
      }
    }
  }, [coords, map]);
  return null;
}

export default function LiveTrackingMap({ customerLocation, driverLocation }) {
  // Validate coordinates. Fallback to center of Mumbai if missing
  const custLat = customerLocation?.lat || 19.0760;
  const custLng = customerLocation?.lng || 72.8777;

  const hasDriver = driverLocation && driverLocation.lat && driverLocation.lng;
  const driverLat = driverLocation?.lat;
  const driverLng = driverLocation?.lng;

  const activeCoords = [
    [custLat, custLng],
    ...(hasDriver ? [[driverLat, driverLng]] : []),
  ];

  return (
    <div className="w-full h-80 rounded-2xl overflow-hidden border border-neutral-800 shadow-inner relative z-10">
      <MapContainer
        center={[custLat, custLng]}
        zoom={14}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Customer Location Marker */}
        <Marker position={[custLat, custLng]} icon={customerIcon}>
          <Popup>
            <div className="text-xs font-bold text-neutral-900">Your Delivery Address</div>
          </Popup>
        </Marker>

        {/* Live Rider Marker */}
        {hasDriver && (
          <Marker position={[driverLat, driverLng]} icon={driverIcon}>
            <Popup>
              <div className="text-xs font-bold text-neutral-900">Your Delivery Executive</div>
            </Popup>
          </Marker>
        )}

        <ChangeMapView coords={activeCoords} />
      </MapContainer>
    </div>
  );
}
