// src/components/MapView.tsx
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const MapView = () => {
  const thikaCoords: [number, number] = [-1.045, 37.070];

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h2 className="font-display text-2xl font-semibold text-bark">
        Restoration Zones
      </h2>
      <p className="mt-1 text-sm text-bark/60">
        Explore logged planting activity across our restoration zones.
      </p>
      <div className="mt-6 overflow-hidden rounded-lg border border-clay/40">
        <MapContainer
          center={thikaCoords}
          zoom={8}
          style={{ height: '70vh', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap contributors"
          />
          <Marker position={thikaCoords}>
            <Popup>Thika — Reforestation Hub</Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
};

export default MapView;
