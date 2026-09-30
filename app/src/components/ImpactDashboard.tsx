// src/components/ImpactDashboard.tsx
import { useEffect, useState } from 'react';
import { getImpactStatus, listZones, getZoneVegetation, Zone, VegetationAnalysis } from '../services/api';
import { Spinner } from './ui/spinner';
import VegetationChart from './VegetationChart';

const DIRECTION_STYLES: Record<string, string> = {
  improving: 'bg-sprout/15 text-moss-dark',
  declining: 'bg-red-50 text-red-700',
  stable: 'bg-clay-light text-bark/70',
};

const ImpactDashboard = () => {
  const [stats, setStats] = useState({ totalTrees: 0, zones: 0, contributors: 0 });
  const [loading, setLoading] = useState(true);

  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [vegetation, setVegetation] = useState<VegetationAnalysis | null>(null);
  const [vegLoading, setVegLoading] = useState(false);
  const [vegError, setVegError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getImpactStatus();
        setStats({
          totalTrees: data.trees_planted,
          zones: data.zones_mapped,
          contributors: data.contributors,
        });
      } catch (err) {
        console.error('Failed to load impact stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();

    listZones()
      .then(list => {
        setZones(list);
        if (list.length > 0) setSelectedZone(list[0]._id);
      })
      .catch(err => console.error('Failed to load zones:', err));
  }, []);

  useEffect(() => {
    if (!selectedZone) return;

    setVegLoading(true);
    setVegError('');

    getZoneVegetation(selectedZone)
      .then(setVegetation)
      .catch(err => setVegError(err.message || 'Could not load vegetation data'))
      .finally(() => setVegLoading(false));
  }, [selectedZone]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h2 className="font-display text-2xl font-semibold text-bark">Impact Dashboard</h2>
      <p className="mt-2 max-w-2xl text-bark/70">
        A living record of restoration, built zone by zone through community logging.
      </p>

      {loading ? (
        <div className="mt-10 flex justify-center">
          <Spinner className="h-8 w-8 text-moss" />
        </div>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-[2fr_1fr_1fr]">
          <div className="rounded-lg bg-canopy p-8 text-white">
            <p className="text-sm text-white/70">Trees Planted</p>
            <p className="mt-2 font-display text-6xl font-semibold text-sprout">
              {stats.totalTrees.toLocaleString()}
            </p>
          </div>
          <div className="rounded-lg border border-clay/40 bg-white p-6">
            <p className="text-sm text-bark/60">Zones Restored</p>
            <p className="mt-2 font-display text-3xl font-semibold text-moss">{stats.zones}</p>
          </div>
          <div className="rounded-lg border border-clay/40 bg-white p-6">
            <p className="text-sm text-bark/60">Contributors</p>
            <p className="mt-2 font-display text-3xl font-semibold text-moss">
              {stats.contributors}
            </p>
          </div>
        </div>
      )}

      <div className="mt-14 border-t border-clay/40 pt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-display text-xl font-semibold text-bark">Vegetation Insights</h3>
          {zones.length > 0 && (
            <select
              value={selectedZone}
              onChange={e => setSelectedZone(e.target.value)}
              className="h-9 rounded-md border border-clay bg-white px-3 text-sm text-bark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss"
            >
              {zones.map(zone => (
                <option key={zone._id} value={zone._id}>{zone.name}</option>
              ))}
            </select>
          )}
        </div>

        {zones.length === 0 ? (
          <p className="mt-4 text-sm text-bark/60">No zones logged yet.</p>
        ) : vegLoading ? (
          <div className="mt-8 flex justify-center">
            <Spinner className="h-6 w-6 text-moss" />
          </div>
        ) : vegError ? (
          <p className="mt-4 text-sm text-red-600">{vegError}</p>
        ) : vegetation ? (
          <div className="mt-6 rounded-lg border border-clay/40 bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm text-bark/60">NDVI trend — {vegetation.zone.name}</p>
                <p className="text-xs text-bark/40">
                  {vegetation.source === 'sample'
                    ? 'Demo data — connect Google Earth Engine for live satellite NDVI'
                    : 'Source: MODIS NDVI via Google Earth Engine'}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${DIRECTION_STYLES[vegetation.trend.direction]}`}>
                {vegetation.trend.direction}
              </span>
            </div>

            <div className="mt-4">
              <VegetationChart series={vegetation.series} forecast={vegetation.trend.forecast} />
            </div>

            <p className="mt-2 text-xs text-bark/50">
              Solid line: historical NDVI. Dashed: 6-month forecast from a linear trend
              (R² = {vegetation.trend.r_squared}).
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ImpactDashboard;
