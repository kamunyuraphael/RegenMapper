// src/components/JoinCampaign.tsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { forgotPassword } from '../services/api';
import type { View } from '../App';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Alert } from './ui/alert';
import { Spinner } from './ui/spinner';
{/**import joinImg from '../assets/join-campaign.png';**/}

const MIN_PASSWORD_LENGTH = 8;

type Mode = 'signup' | 'signin' | 'forgot';

interface JoinCampaignProps {
  onNavigate: (view: View) => void;
}

const HEADINGS: Record<Mode, string> = {
  signup: 'Join the Campaign',
  signin: 'Welcome back',
  forgot: 'Reset your password',
};

const JoinCampaign = ({ onNavigate }: JoinCampaignProps) => {
  const { signup, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<Mode>('signup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const switchMode = (next: Mode) => {
    setMode(next);
    setPassword('');
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (mode === 'signup' && password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    setLoading(true);

    try {
      if (mode === 'forgot') {
        const { message } = await forgotPassword(email);
        setSuccess(message);
      } else if (mode === 'signup') {
        try {
          await signup(email, password);
          onNavigate('log');
        } catch (err: any) {
          if (err.message?.toLowerCase().includes('already registered')) {
            setMode('signin');
            setPassword('');
            setError('An account with this email already exists. Please sign in.');
            return;
          }
          throw err;
        }
      } else {
        await login(email, password);
        onNavigate('log');
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const submitLabel = mode === 'signup' ? 'Sign Up' : mode === 'signin' ? 'Sign In' : 'Send reset link';

  return (
    <div className="grid min-h-[75vh] md:grid-cols-2">
      <div
        className="hidden bg-canopy bg-cover bg-center md:block"
        style={{ backgroundImage: `linear-gradient(to top, rgba(15,61,46,0.75), rgba(15,61,46,0.2)), url(https://res.cloudinary.com/iprdnhzp/image/upload/v1790754874/pexels-lauripoldre-16983197_wtwduf.jpg)` }}
      />

      <div className="flex items-center px-6 py-16">
        <div className="mx-auto w-full max-w-sm">
          <h2 className="font-display text-3xl font-semibold text-bark">{HEADINGS[mode]}</h2>
          <p className="mt-2 text-sm text-bark/70">
            {mode === 'forgot'
              ? "Enter your account email and we'll send you a link to choose a new password."
              : 'Become a contributor, mapper, or ambassador for restoration — log your plantings and help others see the impact grow.'}
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

            {mode !== 'forgot' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      className="text-xs font-medium text-moss hover:underline"
                      onClick={() => switchMode('forgot')}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder={mode === 'signup' ? `At least ${MIN_PASSWORD_LENGTH} characters` : 'Enter password'}
                />
              </div>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? <Spinner className="mr-2" /> : null}
              {loading ? 'Please wait...' : submitLabel}
            </Button>
          </form>

          {mode === 'forgot' ? (
            <Button variant="link" className="mt-3 w-full text-center text-moss" onClick={() => switchMode('signin')}>
              Back to sign in
            </Button>
          ) : (
            <Button
              variant="link"
              className="mt-3 w-full text-center text-moss"
              onClick={() => switchMode(mode === 'signup' ? 'signin' : 'signup')}
            >
              {mode === 'signup' ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </Button>
          )}

          {success && <Alert variant="success" className="mt-4">{success}</Alert>}
        </div>
      </div>
    </div>
  );
};

export default JoinCampaign;
