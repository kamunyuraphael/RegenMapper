// src/components/JoinCampaign.tsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { View } from '../App';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Alert } from './ui/alert';
import { Spinner } from './ui/spinner';
import joinImg from '../assets/join-campaign.png';

interface JoinCampaignProps {
  onNavigate: (view: View) => void;
}

const JoinCampaign = ({ onNavigate }: JoinCampaignProps) => {
  const { signup, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isSignUp) {
        try {
          await signup(email, password);
          setSuccess('Sign-up complete. Redirecting...');
          onNavigate('log');
        } catch (err: any) {
          if (err.message?.toLowerCase().includes('already registered')) {
            setError('User already exists. Switching to sign-in...');
            setIsSignUp(false);
            setLoading(false);
            return;
          }
          throw err;
        }
      } else {
        await login(email, password);
        setSuccess('Sign-in successful! Redirecting...');
        onNavigate('log');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-[75vh] md:grid-cols-2">
      <div
        className="hidden bg-canopy bg-cover bg-center md:block"
        style={{ backgroundImage: `linear-gradient(to top, rgba(15,61,46,0.75), rgba(15,61,46,0.2)), url(${joinImg})` }}
      />

      <div className="flex items-center px-6 py-16">
        <div className="mx-auto w-full max-w-sm">
          <h2 className="font-display text-3xl font-semibold text-bark">Join the Campaign</h2>
          <p className="mt-2 text-sm text-bark/70">
            Become a contributor, mapper, or ambassador for restoration — log your plantings and
            help others see the impact grow.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="Enter email"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Enter password"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Spinner className="mr-2" /> : null}
              {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
          </form>

          <Button
            variant="link"
            className="mt-3 w-full text-center text-moss"
            onClick={() => {
              setIsSignUp(!isSignUp);
              resetForm();
            }}
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </Button>

          {success && <Alert variant="success" className="mt-4">{success}</Alert>}
        </div>
      </div>
    </div>
  );
};

export default JoinCampaign;
