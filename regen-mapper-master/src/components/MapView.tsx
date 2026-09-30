// src/components/MapView.tsx
import { useEffect, useState, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, GeoJSON } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  listZones,
  listPlantingLogs,
  getForestHexes,
  Zone,
  PlantingLogRecord,
  ForestHexCollection,
  ForestHexFeature,
} from '../services/api';
import { Input } from './ui/input';

const THIKA: [number, number] = [-1.045, 37.07];

const LIGHT_TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const LIGHT_ATTRIBUTION = '© OpenStreetMap contributors';
// Free, no API key required. Check CartoDB's current attribution/usage terms
// before high-traffic production use: https://carto.com/attributions
const DARK_TILES = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const DARK_ATTRIBUTION = '© OpenStreetMap contributors © <a href="https://carto.com/attributions">CARTO</a>';

// Loss-severity scale: transparent (none) through amber to deep red.
// Deliberately outside the canopy/moss/sprout growth palette — this layer
// shows loss, not restoration, and shouldn't borrow the "good" color.
function lossColor(value: number, max: number): string {
  if (max <= 0 || value <= 0) return 'transparent';
  const t = Math.min(value / max, 1);
  if (t < 0.5) {
    return interpolate('#FDE68A', '#F59E0B', t / 0.5);
  }
  return interpolate('#F59E0B', '#991B1B', (t - 0.5) / 0.5);
}

function interpolate(hexA: string, hexB: string, t: number): string {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function hexLossTotal(feature: ForestHexFeature, yearIndex: number | 'all'): number {
  const { loss } = feature.properties;
  return yearIndex === 'all' ? loss.reduce((a, b) => a + b, 0) : loss[yearIndex] ?? 0;
}

const MapView = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [logs, setLogs] = useState<PlantingLogRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [zoneFilter, setZoneFilter] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [darkBasemap, setDarkBasemap] = useState(false);
  const [showForestLoss, setShowForestLoss] = useState(false);
  const [forestData, setForestData] = useState<ForestHexCollection | null>(null);
  const [selectedYearIndex, setSelectedYearIndex] = useState<number | 'all'>('all');

  useEffect(() => {
    listZones().then(setZones).catch(err => console.error('Failed to load zones:', err));
    getForestHexes().then(setForestData).catch(err => console.error('Failed to load forest-hex data:', err));
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

  const maxLoss = useMemo(() => {
    if (!forestData) return 0;
    return Math.max(...forestData.features.map(f => hexLossTotal(f, selectedYearIndex)), 0);
  }, [forestData, selectedYearIndex]);

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

      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-bark/70">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={darkBasemap} onChange={e => setDarkBasemap(e.target.checked)} />
          Dark basemap
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showForestLoss}
            onChange={e => setShowForestLoss(e.target.checked)}
            disabled={!forestData}
          />
          Forest-loss layer{!forestData && ' (loading...)'}
        </label>
        {showForestLoss && forestData && (
          <select
            value={selectedYearIndex}
            onChange={e => setSelectedYearIndex(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="h-8 rounded-md border border-clay bg-white px-2 text-sm text-bark"
          >
            <option value="all">All years ({forestData.metadata.years[0]}–{forestData.metadata.years[forestData.metadata.years.length - 1]})</option>
            {forestData.metadata.years.map((year, i) => (
              <option key={year} value={i}>{year}</option>
            ))}
          </select>
        )}
        {showForestLoss && forestData?.metadata.source === 'demo' && (
          <span className="text-xs text-bark/40">Demo data — not real satellite data</span>
        )}
      </div>

      <div className="relative mt-4 overflow-hidden rounded-lg border border-clay/40">
        <MapContainer center={THIKA} zoom={8} style={{ height: '65vh', width: '100%' }}>
          <TileLayer
            key={darkBasemap ? 'dark' : 'light'}
            url={darkBasemap ? DARK_TILES : LIGHT_TILES}
            attribution={darkBasemap ? DARK_ATTRIBUTION : LIGHT_ATTRIBUTION}
          />

          {showForestLoss && forestData && (
            <GeoJSON
              key={`hexes-${selectedYearIndex}-${darkBasemap}`}
              data={forestData as any}
              style={feature => {
                const loss = hexLossTotal(feature as unknown as ForestHexFeature, selectedYearIndex);
                const fill = lossColor(loss, maxLoss);
                return {
                  color: darkBasemap ? '#F59E0B' : '#991B1B',
                  weight: 0.5,
                  fillColor: fill,
                  fillOpacity: fill === 'transparent' ? 0 : 0.65,
                };
              }}
              onEachFeature={(feature, layer) => {
                const props = feature.properties as ForestHexFeature['properties'];
                const loss = hexLossTotal(feature as unknown as ForestHexFeature, selectedYearIndex);
                layer.bindPopup(
                  `<strong>Tree cover (2000):</strong> ${props.treeHa2000.toLocaleString()} ha<br/>` +
                    `<strong>Loss${selectedYearIndex === 'all' ? ' (all years)' : ''}:</strong> ${loss.toLocaleString()} ha`
                );
              }}
            />
          )}

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

        {showForestLoss && forestData && maxLoss > 0 && (
          <div className="absolute bottom-3 right-3 rounded-md bg-white/90 px-3 py-2 text-xs shadow">
            <p className="mb-1 font-medium text-bark/70">Tree cover loss (ha)</p>
            <div className="h-2 w-32 rounded" style={{ background: 'linear-gradient(to right, #FDE68A, #F59E0B, #991B1B)' }} />
            <div className="mt-1 flex justify-between text-bark/50">
              <span>0</span>
              <span>{Math.round(maxLoss).toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      <p className="mt-2 text-xs text-bark/50">
        {loading ? 'Loading...' : `${logs.length} planting${logs.length === 1 ? '' : 's'} shown`}
      </p>
    </div>
  );
};

export default MapView;
