import { useState, useEffect, lazy, Suspense } from 'react';
import { Menu, X } from 'lucide-react';
import Footer from './components/Footer';
import { Button } from './components/ui/button';
import { Spinner } from './components/ui/spinner';
import { useAuth } from './context/AuthContext';

// Code-split every view: MapView (Leaflet) and ImpactDashboard (Recharts) are
// each a few hundred KB on their own — no reason to load either one until
// the person actually navigates there.
const Landing = lazy(() => import('./components/Landing'));
const MapView = lazy(() => import('./components/MapView'));
const PlantingLog = lazy(() => import('./components/PlantingLog'));
const ImpactDashboard = lazy(() => import('./components/ImpactDashboard'));
const Contact = lazy(() => import('./components/Contact'));
const JoinCampaign = lazy(() => import('./components/JoinCampaign'));
const Profile = lazy(() => import('./components/Profile'));
const EmailVerification = lazy(() => import('./components/EmailVerification'));
const ResetPassword = lazy(() => import('./components/ResetPassword'));

export type View =
  | 'landing'
  | 'map'
  | 'log'
  | 'dashboard'
  | 'contact'
  | 'join'
  | 'profile'
  | 'verify-email'
  | 'reset-password';

// Emailed links look like /?mode=verify&token=... or /?mode=reset&token=...
function readEmailLink(): { view: View; token: string } | null {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  const token = params.get('token');
  if (!token) return null;
  if (mode === 'verify') return { view: 'verify-email', token };
  if (mode === 'reset') return { view: 'reset-password', token };
  return null;
}

const NAV_LINKS: { label: string; view: View }[] = [
  { label: 'Map', view: 'map' },
  { label: 'Log Planting', view: 'log' },
  { label: 'Impact', view: 'dashboard' },
  { label: 'Contact', view: 'contact' },
];

function App() {
  const [emailLink] = useState(readEmailLink);
  const [view, setView] = useState<View>(emailLink?.view ?? 'landing');
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();

  // Strip the one-time token from the address bar once we've captured it.
  useEffect(() => {
    if (emailLink) window.history.replaceState({}, '', window.location.pathname);
  }, [emailLink]);

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
                <button
                  onClick={() => go('profile')}
                  className={`text-sm transition-colors hover:text-sprout ${
                    view === 'profile' ? 'text-sprout' : 'text-white/70'
                  }`}
                >
                  {user?.displayName || user?.email}
                </button>
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
                <button
                  onClick={() => go('profile')}
                  className="py-2 text-left text-sm text-white/60 hover:text-sprout"
                >
                  {user?.displayName || user?.email}
                </button>
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
        <Suspense fallback={<div className="flex justify-center py-24"><Spinner className="h-8 w-8 text-moss" /></div>}>
          {view === 'landing' && <Landing onNavigate={go} />}
          {view === 'map' && <MapView />}
          {view === 'log' && <PlantingLog />}
          {view === 'dashboard' && <ImpactDashboard />}
          {view === 'contact' && <Contact />}
          {view === 'join' && <JoinCampaign onNavigate={go} />}
          {view === 'profile' &&
            (isAuthenticated ? <Profile /> : <JoinCampaign onNavigate={go} />)}
          {view === 'verify-email' && emailLink && (
            <EmailVerification token={emailLink.token} onNavigate={go} />
          )}
          {view === 'reset-password' && emailLink && (
            <ResetPassword token={emailLink.token} onNavigate={go} />
          )}
        </Suspense>
      </main>

      <Footer onNavigate={go} />
    </div>
  );
}

export default App;
