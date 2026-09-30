import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from 'recharts';
import type { AnalyticsOverview } from '../services/api';

const MOSS = '#1F6F4F';
const SPROUT = '#6FCF7A';
const CANOPY = '#0F3D2E';
const CLAY = '#C9BBA0';
const BARK = '#2B2622';

// A handful of zone/species bars need distinct colors; cycle through a small
// palette built from the design tokens rather than reaching for a generic
// rainbow scale.
const CATEGORY_COLORS = [MOSS, SPROUT, CANOPY, '#8B6F47', '#4A7C6F', CLAY, '#2F5233'];

function formatMonth(month: string): string {
  const [year, m] = month.split('-');
  const date = new Date(Number(year), Number(m) - 1, 1);
  return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
}

const axisStyle = { fontSize: 12, fill: BARK, fillOpacity: 0.6 };

interface AnalyticsChartsProps {
  data: AnalyticsOverview;
}

const AnalyticsCharts = ({ data }: AnalyticsChartsProps) => {
  const trendData = data.monthlyTrend.map(p => ({ ...p, label: formatMonth(p.month) }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-lg border border-clay/40 bg-white p-5 lg:col-span-2">
        <h4 className="text-sm font-medium text-bark/70">Trees planted over time</h4>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={trendData} margin={{ top: 12, right: 12, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CLAY} opacity={0.4} />
            <XAxis dataKey="label" tick={axisStyle} />
            <YAxis tick={axisStyle} allowDecimals={false} />
            <Tooltip
              contentStyle={{ borderColor: CLAY, borderRadius: 8, fontSize: 13 }}
              labelStyle={{ color: BARK }}
            />
            <Legend wrapperStyle={{ fontSize: 13 }} />
            <Line type="monotone" dataKey="trees" name="Planted that month" stroke={MOSS} strokeWidth={2} dot={false} />
            <Line
              type="monotone"
              dataKey="cumulative"
              name="Cumulative total"
              stroke={SPROUT}
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-lg border border-clay/40 bg-white p-5">
        <h4 className="text-sm font-medium text-bark/70">By species</h4>
        {data.bySpecies.length === 0 ? (
          <p className="mt-6 text-sm text-bark/50">No plantings logged yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.bySpecies} margin={{ top: 12, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CLAY} opacity={0.4} />
              <XAxis dataKey="species" tick={axisStyle} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={axisStyle} allowDecimals={false} />
              <Tooltip contentStyle={{ borderColor: CLAY, borderRadius: 8, fontSize: 13 }} />
              <Bar dataKey="trees" name="Trees" radius={[4, 4, 0, 0]}>
                {data.bySpecies.map((entry, i) => (
                  <Cell key={entry.species} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="rounded-lg border border-clay/40 bg-white p-5">
        <h4 className="text-sm font-medium text-bark/70">By zone</h4>
        {data.byZone.length === 0 ? (
          <p className="mt-6 text-sm text-bark/50">No zones logged yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.byZone} margin={{ top: 12, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={CLAY} opacity={0.4} />
              <XAxis dataKey="zone" tick={axisStyle} interval={0} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={axisStyle} allowDecimals={false} />
              <Tooltip contentStyle={{ borderColor: CLAY, borderRadius: 8, fontSize: 13 }} />
              <Bar dataKey="trees" name="Trees" radius={[4, 4, 0, 0]}>
                {data.byZone.map((entry, i) => (
                  <Cell key={entry.zone} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default AnalyticsCharts;
