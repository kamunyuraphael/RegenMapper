import { useState, useEffect } from 'react';
import { getImpactStatus } from '../services/api';
import { Button } from './ui/button';
import type { View } from '../App';
import forestImg from '../assets/forest.png';

interface LandingProps {
  onNavigate: (view: View) => void;
}

const Landing = ({ onNavigate }: LandingProps) => {
  const [impact, setImpact] = useState({ trees: 0, zones: 0, contributors: 0 });

  useEffect(() => {
    const fetchImpact = async () => {
      try {
        const data = await getImpactStatus();
        setImpact({
          trees: data.trees_planted,
          zones: data.zones_mapped,
          contributors: data.contributors,
        });
      } catch (err) {
        console.error('Failed to load impact stats:', err);
      }
    };

    fetchImpact();
  }, []);

  return (
    <div>
      {/* Hero */}
      <section
        className="relative flex min-h-[85vh] items-center bg-canopy bg-cover bg-center"
        style={{ backgroundImage: `linear-gradient(to right, rgba(15,61,46,0.88), rgba(15,61,46,0.55)), url(${forestImg})` }}
      >
        <div className="mx-auto w-full max-w-6xl animate-hero-rise px-6 py-20 text-white">
          <h1 className="max-w-2xl font-display text-5xl font-semibold leading-tight sm:text-6xl">
            Mapping restoration, one tree at a time.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-white/85">
            ReGen Mapper brings communities, organizations, and individuals together to track
            and grow ecosystem restoration across Kenya — starting in Thika.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => onNavigate('map')}>View Map</Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
              onClick={() => onNavigate('log')}
            >
              Log Planting
            </Button>
          </div>

          <dl className="mt-14 flex flex-wrap gap-x-12 gap-y-6 border-t border-white/20 pt-8">
            <div>
              <dt className="text-sm text-white/70">Trees Planted</dt>
              <dd className="font-display text-4xl font-semibold text-sprout">
                {impact.trees.toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-white/70">Zones Mapped</dt>
              <dd className="font-display text-4xl font-semibold text-sprout">{impact.zones}</dd>
            </div>
            <div>
              <dt className="text-sm text-white/70">Contributors</dt>
              <dd className="font-display text-4xl font-semibold text-sprout">
                {impact.contributors}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* About */}
      <section className="mx-auto max-w-3xl px-6 py-20">
        <h2 className="font-display text-3xl font-semibold text-bark">About ReGen Mapper</h2>
        <p className="mt-4 text-lg leading-relaxed text-bark/80">
          ReGen Mapper is more than a map — it's a movement. Our platform brings together
          communities, organizations, and passionate individuals to restore ecosystems, one tree
          at a time. Track your planting projects, showcase your impact, and inspire others with
          real-time progress and transparent data.
        </p>
      </section>

      {/* How it works */}
      <section className="border-y border-clay/40 bg-white px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-display text-3xl font-semibold text-bark">How It Works</h2>
          <p className="mt-2 text-bark/70">Start regenerating in three steps.</p>
          <ol className="mt-10 grid gap-8 sm:grid-cols-3">
            <li>
              <span className="font-display text-2xl font-semibold text-moss">1</span>
              <h3 className="mt-2 font-semibold text-bark">Join</h3>
              <p className="mt-1 text-sm text-bark/70">Create your account and become a mapper.</p>
            </li>
            <li>
              <span className="font-display text-2xl font-semibold text-moss">2</span>
              <h3 className="mt-2 font-semibold text-bark">Log</h3>
              <p className="mt-1 text-sm text-bark/70">Record your planting efforts and locations.</p>
            </li>
            <li>
              <span className="font-display text-2xl font-semibold text-moss">3</span>
              <h3 className="mt-2 font-semibold text-bark">Track</h3>
              <p className="mt-1 text-sm text-bark/70">Visualize your impact and inspire others.</p>
            </li>
          </ol>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-canopy px-6 py-16 text-white">
        <div className="mx-auto max-w-3xl text-left">
          <h2 className="font-display text-3xl font-semibold">Ready to regenerate?</h2>
          <p className="mt-2 text-white/80">Join the movement and start mapping your impact today.</p>
          <Button size="lg" className="mt-6" onClick={() => onNavigate('join')}>
            Join the Campaign
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Landing;
