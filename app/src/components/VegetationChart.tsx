interface Point {
  date: string;
  ndvi: number;
}

interface VegetationChartProps {
  series: Point[];
  forecast: Point[];
}

const WIDTH = 600;
const HEIGHT = 200;
const PADDING = 24;

function toPath(points: Point[], allDates: string[], minY: number, maxY: number): string {
  const xStep = (WIDTH - PADDING * 2) / Math.max(allDates.length - 1, 1);

  return points
    .map(p => {
      const xIndex = allDates.indexOf(p.date);
      const x = PADDING + xIndex * xStep;
      const y = HEIGHT - PADDING - ((p.ndvi - minY) / (maxY - minY || 1)) * (HEIGHT - PADDING * 2);
      return `${xIndex === 0 || points[0] === p ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

const VegetationChart = ({ series, forecast }: VegetationChartProps) => {
  const allPoints = [...series, ...forecast];
  const allDates = allPoints.map(p => p.date);
  const values = allPoints.map(p => p.ndvi);
  const minY = Math.min(...values) - 0.05;
  const maxY = Math.max(...values) + 0.05;

  const historyPath = toPath(series, allDates, minY, maxY);
  // Connect the forecast line starting from the last real data point.
  const forecastPath = toPath([series[series.length - 1], ...forecast], allDates, minY, maxY);

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="NDVI trend chart">
      <path d={historyPath} fill="none" stroke="#1F6F4F" strokeWidth={2} />
      <path d={forecastPath} fill="none" stroke="#6FCF7A" strokeWidth={2} strokeDasharray="4 4" />
    </svg>
  );
};

export default VegetationChart;
