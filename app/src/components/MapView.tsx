// src/components/MapView.tsx
import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { listZones, listPlantingLogs, Zone, PlantingLogRecord } from '../services/api';
import { Input } from './ui/input';

const THIKA: [number, number] = [-1.045, 37.07];

const MapView = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [logs, setLogs] = useState<PlantingLogRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [zoneFilter, setZoneFilter] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    listZones().then(setZones).catch(err => console.error('Failed to load zones:', err));
  }, []);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    listPlantingLogs({
      zone: zoneFilter || undefined,
      species: speciesFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    })
      .then(setLogs)
      .catch(err => console.error('Failed to load planting logs:', err))
      .finally(() => setLoading(false));
  }, [zoneFilter, speciesFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h2 className="font-display text-2xl font-semibold text-bark">Restoration Zones</h2>
      <p className="mt-1 text-sm text-bark/60">
        Every marker is a real logged planting. Filter to explore by zone, species, or date.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        <select
          value={zoneFilter}
          onChange={e => setZoneFilter(e.target.value)}
          className="flex h-10 w-full rounded-md border border-clay bg-white px-3 py-2 text-sm text-bark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss"
        >
          <option value="">All zones</option>
          {zones.map(zone => (
            <option key={zone._id} value={zone._id}>{zone.name}</option>
          ))}
        </select>
        <Input
          placeholder="Filter by species"
          value={speciesFilter}
          onChange={e => setSpeciesFilter(e.target.value)}
        />
        <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-clay/40">
        <MapContainer center={THIKA} zoom={8} style={{ height: '65vh', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="© OpenStreetMap contributors"
          />

          {zones.map(zone => (
            <CircleMarker
              key={zone._id}
              center={[zone.latitude, zone.longitude]}
              radius={12}
              pathOptions={{ color: '#0F3D2E', fillColor: '#0F3D2E', fillOpacity: 0.5 }}
            >
              <Popup>
                <strong>{zone.name}</strong>
                {zone.description && <p className="mt-1">{zone.description}</p>}
              </Popup>
            </CircleMarker>
          ))}

          {logs.map(log => (
            <CircleMarker
              key={log._id}
              center={[log.latitude, log.longitude]}
              radius={6}
              pathOptions={{ color: '#1F6F4F', fillColor: '#6FCF7A', fillOpacity: 0.9 }}
            >
              <Popup>
                <strong>{log.species}</strong> ({log.quantity})
                <br />
                {log.zone?.name || 'Unknown zone'}
                <br />
                {new Date(log.date).toLocaleDateString()}
                {log.notes && <p className="mt-1">{log.notes}</p>}
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <p className="mt-2 text-xs text-bark/50">
        {loading ? 'Loading...' : `${logs.length} planting${logs.length === 1 ? '' : 's'} shown`}
      </p>
    </div>
  );
};

export default MapView;
