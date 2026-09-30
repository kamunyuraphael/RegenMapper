// src/components/Footer.tsx
import type { View } from '../App';

interface FooterProps {
  onNavigate: (view: View) => void;
}

const Footer = ({ onNavigate }: FooterProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-canopy text-white/80">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-6 py-6 text-sm md:flex-row md:justify-between">
        <p>© {currentYear} ReGen Mapper</p>
        <div className="flex gap-5">
          <button className="hover:text-sprout" onClick={() => onNavigate('log')}>
            Planting Log
          </button>
          <button className="hover:text-sprout" onClick={() => onNavigate('dashboard')}>
            Impact Dashboard
          </button>
          <button className="hover:text-sprout" onClick={() => onNavigate('map')}>
            View Map
          </button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
