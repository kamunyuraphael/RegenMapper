import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Landing from './components/Landing';
import MapView from './components/MapView';
import PlantingLog from './components/PlantingLog';
import ImpactDashboard from './components/ImpactDashboard';
import Contact from './components/Contact';
import JoinCampaign from './components/JoinCampaign';
import Footer from './components/Footer';
import { Button } from './components/ui/button';
import { useAuth } from './context/AuthContext';

export type View = 'landing' | 'map' | 'log' | 'dashboard' | 'contact' | 'join';

const NAV_LINKS: { label: string; view: View }[] = [
  { label: 'Map', view: 'map' },
  { label: 'Log Planting', view: 'log' },
  { label: 'Impact', view: 'dashboard' },
  { label: 'Contact', view: 'contact' },
];

function App() {
  const [view, setView] = useState<View>('landing');
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  const go = (next: View) => {
    setView(next);
    setMenuOpen(false);
  };

  return (
    <div className="flex min-h-screen flex-col bg-mist">
      <nav className="bg-canopy text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <button onClick={() => go('landing')} className="flex items-center gap-2">
            <img src="/assets/logo.png" alt="ReGen Mapper" className="h-8 w-auto" />
            <span className="font-display text-lg font-semibold">ReGen Mapper</span>
          </button>

          <div className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map(link => (
              <button
                key={link.view}
                onClick={() => go(link.view)}
                className={`text-sm transition-colors hover:text-sprout ${
                  view === link.view ? 'text-sprout' : 'text-white/90'
                }`}
              >
                {link.label}
              </button>
            ))}
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/70">{user?.email}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/40 text-white hover:bg-white/10"
                  onClick={() => { logout(); go('landing'); }}
                >
                  Log Out
                </Button>
              </div>
            ) : (
              <Button size="sm" onClick={() => go('join')}>
                Join Campaign
              </Button>
            )}
          </div>

          <button className="md:hidden" onClick={() => setMenuOpen(v => !v)} aria-label="Toggle menu">
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {menuOpen && (
          <div className="flex flex-col gap-1 border-t border-white/10 px-4 py-3 md:hidden">
            {NAV_LINKS.map(link => (
              <button
                key={link.view}
                onClick={() => go(link.view)}
                className="py-2 text-left text-sm text-white/90 hover:text-sprout"
              >
                {link.label}
              </button>
            ))}
            {isAuthenticated ? (
              <>
                <span className="py-2 text-sm text-white/60">{user?.email}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-white/40 text-white hover:bg-white/10"
                  onClick={() => { logout(); go('landing'); }}
                >
                  Log Out
                </Button>
              </>
            ) : (
              <Button size="sm" className="w-full" onClick={() => go('join')}>
                Join Campaign
              </Button>
            )}
          </div>
        )}
      </nav>

      <main className="flex-1">
        {view === 'landing' && <Landing onNavigate={go} />}
        {view === 'map' && <MapView />}
        {view === 'log' && <PlantingLog />}
        {view === 'dashboard' && <ImpactDashboard />}
        {view === 'contact' && <Contact />}
        {view === 'join' && <JoinCampaign onNavigate={go} />}
      </main>

      <Footer onNavigate={go} />
    </div>
  );
}

export default App;
