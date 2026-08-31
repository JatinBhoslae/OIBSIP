import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons issue with builder/bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icon for Driver
const driverIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2972/2972185.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
  popupAnchor: [0, -35],
});

// Dynamically adjust map bounds when locations change
function ChangeMapView({ locations }) {
  const map = useMap();
  useEffect(() => {
    if (locations && locations.length > 0) {
      const validCoords = locations.filter(c => c && c.lat !== 0 && c.lng !== 0).map(c => [c.lat, c.lng]);
      if (validCoords.length === 1) {
        map.setView(validCoords[0], 12, { animate: true });
      } else if (validCoords.length > 1) {
        const bounds = L.latLngBounds(validCoords);
        map.fitBounds(bounds, { padding: [50, 50], animate: true });
      }
    }
  }, [locations, map]);
  return null;
}

export default function AdminFleetMap({ partners = [], activeLocations = {}, outlets = [] }) {
  // Center of Mumbai as default fallback
  const defaultCenter = [19.0760, 72.8777];
  
  // Combine all coordinates to set map bounds
  const allLocations = [];
  
  outlets.forEach(o => {
    if (o.location?.lat && o.location?.lng) {
      allLocations.push({ lat: o.location.lat, lng: o.location.lng });
    }
  });

  partners.forEach(p => {
    const liveLoc = activeLocations[p._id];
    if (liveLoc && liveLoc.lat && liveLoc.lng) {
      allLocations.push({ lat: liveLoc.lat, lng: liveLoc.lng });
    } else if (p.currentLocation?.lat && p.currentLocation?.lng) {
      allLocations.push({ lat: p.currentLocation.lat, lng: p.currentLocation.lng });
    }
  });

  return (
    <div className="w-full h-full min-h-[400px] rounded-2xl overflow-hidden border border-neutral-800 relative z-10">
      <MapContainer
        center={defaultCenter}
        zoom={11}
        scrollWheelZoom={true}
        className="w-full h-full min-h-[400px]"
        style={{ background: '#111827' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {/* Plot Outlets as RED DOTS with name */}
        {outlets.map((outlet) => (
          outlet.location?.lat && outlet.location?.lng && (
            <CircleMarker
              key={`outlet-${outlet._id}`}
              center={[outlet.location.lat, outlet.location.lng]}
              pathOptions={{
                color: '#FF0000',
                fillColor: '#FF0000',
                fillOpacity: 0.9,
                weight: 2,
                radius: 10,
              }}
            >
              <Tooltip direction="top" offset={[0, -10]} permanent className="outlet-tooltip">
                🍕 {outlet.name}
              </Tooltip>
              <Popup>
                <div style={{ fontSize: '12px' }}>
                  <strong style={{ color: '#FF0000' }}>🍕 Pizza Outlet</strong><br/>
                  <strong>{outlet.name}</strong><br/>
                  <span style={{ color: '#666' }}>{outlet.address}</span><br/>
                  <span style={{ color: '#666' }}>Service Radius: {outlet.serviceRadiusKm}km</span>
                </div>
              </Popup>
            </CircleMarker>
          )
        ))}

        {/* Plot Partners as motorcycle icons */}
        {partners.map((partner) => {
          const liveLoc = activeLocations[partner._id];
          const lat = liveLoc?.lat || partner.currentLocation?.lat;
          const lng = liveLoc?.lng || partner.currentLocation?.lng;
          
          if (!lat || !lng) return null;

          return (
            <Marker key={`partner-${partner._id}`} position={[lat, lng]} icon={driverIcon}>
              <Popup>
                <div style={{ fontSize: '12px' }}>
                  <strong style={{ color: '#FF6B00' }}>{partner.name}</strong><br/>
                  <span style={{ color: '#666' }}>Status: {partner.availabilityStatus}</span><br/>
                  <span style={{ color: '#666' }}>Vehicle: {partner.vehicleType} | {partner.vehicleNumber}</span>
                  {liveLoc?.etaMinutes && (
                    <div style={{ color: '#22C55E', fontWeight: 'bold', marginTop: '4px' }}>ETA: ~{Math.round(liveLoc.etaMinutes)} mins</div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        <ChangeMapView locations={allLocations} />
      </MapContainer>
    </div>
  );
}
