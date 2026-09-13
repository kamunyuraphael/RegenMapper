import { MapContainer, TileLayer, CircleMarker, useMapEvents } from 'react-leaflet';

interface LocationPickerProps {
  latitude: number;
  longitude: number;
  onChange: (lat: number, lng: number) => void;
  zoom?: number;
}

function ClickHandler({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const LocationPicker = ({ latitude, longitude, onChange, zoom = 10 }: LocationPickerProps) => {
  return (
    <div className="overflow-hidden rounded-md border border-clay">
      <MapContainer
        center={[latitude, longitude]}
        zoom={zoom}
        style={{ height: '220px', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />
        <CircleMarker
          center={[latitude, longitude]}
          radius={8}
          pathOptions={{ color: '#1F6F4F', fillColor: '#6FCF7A', fillOpacity: 0.9 }}
        />
        <ClickHandler onChange={onChange} />
      </MapContainer>
      <p className="bg-white px-2 py-1 text-xs text-bark/60">
        Click the map to set the exact location.
      </p>
    </div>
  );
};

export default LocationPicker;
