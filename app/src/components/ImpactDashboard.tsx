// src/components/ImpactDashboard.tsx
import { useEffect, useState } from 'react';
import { getImpactStatus } from '../services/api';
import { Spinner } from './ui/spinner';

const ImpactDashboard = () => {
  const [stats, setStats] = useState({ totalTrees: 0, zones: 0, contributors: 0 });
  const [loading, setLoading] = useState(true);

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
  }, []);

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
    </div>
  );
};

export default ImpactDashboard;
