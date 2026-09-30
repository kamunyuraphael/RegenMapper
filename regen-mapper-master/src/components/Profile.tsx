import React, { useEffect, useState } from 'react';
import {
  listPlantingLogs,
  resendVerification,
  updateProfile,
  PlantingLogRecord,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Alert } from './ui/alert';
import { Spinner } from './ui/spinner';

const Profile = () => {
  const { user, updateUser } = useAuth();

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const [resendStatus, setResendStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');

  const [logs, setLogs] = useState<PlantingLogRecord[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState('');

  useEffect(() => {
    listPlantingLogs({ mine: true })
      .then(setLogs)
      .catch(err => setLogsError(err.message || 'Could not load your plantings'))
      .finally(() => setLogsLoading(false));
  }, []);

  if (!user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('loading');
    try {
      const { user: updated } = await updateProfile({ displayName, bio });
      updateUser(updated);
      setSaveStatus('success');
    } catch {
      setSaveStatus('error');
    }
  };

  const handleResend = async () => {
    setResendStatus('loading');
    try {
      await resendVerification();
      setResendStatus('sent');
    } catch {
      setResendStatus('error');
    }
  };

  const totalTrees = logs.reduce((sum, log) => sum + log.quantity, 0);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-6 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Your profile</CardTitle>
          <p className="mt-1 text-sm text-bark/70">{user.email}</p>
        </CardHeader>
        <CardContent>
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                user.isVerified ? 'bg-sprout/15 text-moss-dark' : 'bg-clay-light text-bark/70'
              }`}
            >
              {user.isVerified ? 'Email verified' : 'Email not verified'}
            </span>
            {!user.isVerified && (
              <Button
                type="button"
                variant="link"
                className="text-xs text-moss"
                disabled={resendStatus === 'loading' || resendStatus === 'sent'}
                onClick={handleResend}
              >
                {resendStatus === 'sent' ? 'Verification email sent' : 'Resend verification email'}
              </Button>
            )}
            {resendStatus === 'error' && (
              <span className="text-xs text-red-600">Could not send the email. Try again.</span>
            )}
          </div>

          {saveStatus === 'success' && <Alert variant="success" className="mb-4">Profile saved.</Alert>}
          {saveStatus === 'error' && (
            <Alert variant="error" className="mb-4">Could not save your profile. Please try again.</Alert>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="displayName">Display name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="How you'd like to be known"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={e => setBio(e.target.value)}
                maxLength={280}
                rows={3}
                placeholder="A line or two about your restoration work"
              />
              <p className="text-right text-xs text-bark/40">{bio.length}/280</p>
            </div>
            <Button type="submit" disabled={saveStatus === 'loading'}>
              {saveStatus === 'loading' ? <Spinner className="mr-2" /> : null}
              Save changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <section>
        <div className="flex items-baseline justify-between">
          <h3 className="font-display text-xl font-semibold text-bark">My plantings</h3>
          {!logsLoading && !logsError && logs.length > 0 && (
            <p className="text-sm text-bark/60">
              {totalTrees.toLocaleString()} trees across {logs.length} log{logs.length === 1 ? '' : 's'}
            </p>
          )}
        </div>

        {logsLoading ? (
          <div className="mt-6 flex justify-center"><Spinner className="h-6 w-6 text-moss" /></div>
        ) : logsError ? (
          <p className="mt-4 text-sm text-red-600">{logsError}</p>
        ) : logs.length === 0 ? (
          <p className="mt-4 text-sm text-bark/60">
            You haven't logged any plantings while signed in yet.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-clay/40 rounded-lg border border-clay/40 bg-white">
            {logs.map(log => (
              <li key={log._id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-bark">{log.species}</p>
                  <p className="text-bark/60">{log.zone?.name || 'Unknown zone'}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-lg font-semibold text-moss">{log.quantity}</p>
                  <p className="text-xs text-bark/50">{new Date(log.date).toLocaleDateString()}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default Profile;
