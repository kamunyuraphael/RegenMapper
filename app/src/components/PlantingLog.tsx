// PlantingLog.tsx
import React, { useState, useEffect } from 'react';
import { createPlantingLog, listZones, createZone, Zone } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Alert } from './ui/alert';
import { Spinner } from './ui/spinner';
import LocationPicker from './LocationPicker';

const THIKA: [number, number] = [-1.045, 37.07];

interface PlantingFormData {
  species: string;
  quantity: string;
  zone: string;
  date: string;
  notes: string;
}

const PlantingLog = () => {
  const [zones, setZones] = useState<Zone[]>([]);
  const [formData, setFormData] = useState<PlantingFormData>({
    species: '',
    quantity: '',
    zone: '',
    date: new Date().toISOString().slice(0, 10),
    notes: '',
  });
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({ lat: THIKA[0], lng: THIKA[1] });

  const [showNewZone, setShowNewZone] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneCoords, setNewZoneCoords] = useState<{ lat: number; lng: number }>({ lat: THIKA[0], lng: THIKA[1] });
  const [zoneStatus, setZoneStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [zoneError, setZoneError] = useState('');

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    listZones()
      .then(setZones)
      .catch(err => console.error('Failed to load zones:', err));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setZoneStatus('loading');
    setZoneError('');

    try {
      const zone = await createZone({
        name: newZoneName,
        latitude: newZoneCoords.lat,
        longitude: newZoneCoords.lng,
      });
      setZones(prev => [...prev, zone].sort((a, b) => a.name.localeCompare(b.name)));
      setFormData(prev => ({ ...prev, zone: zone._id }));
      setCoords({ lat: zone.latitude, lng: zone.longitude });
      setNewZoneName('');
      setShowNewZone(false);
      setZoneStatus('idle');
    } catch (err: any) {
      setZoneError(err.message || 'Could not create zone.');
      setZoneStatus('error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      await createPlantingLog({
        species: formData.species,
        quantity: parseInt(formData.quantity) || 0,
        zone: formData.zone,
        latitude: coords.lat,
        longitude: coords.lng,
        date: formData.date,
        notes: formData.notes,
      });

      setStatus('success');
      setFormData(prev => ({
        ...prev,
        species: '',
        quantity: '',
        notes: '',
      }));
    } catch (error) {
      console.error('Error:', error);
      setStatus('error');
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Log a Tree Planting</CardTitle>
          <p className="mt-1 text-sm text-bark/70">
            Every log becomes part of a growing record of restoration, rooted in purpose and
            connected through every seed sown.
          </p>
        </CardHeader>
        <CardContent>
          {status === 'success' && (
            <Alert variant="success" className="mb-4">Log submitted successfully.</Alert>
          )}
          {status === 'error' && (
            <Alert variant="error" className="mb-4">Something went wrong. Please try again.</Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="species">Species</Label>
                <Input
                  id="species"
                  name="species"
                  value={formData.species}
                  onChange={handleChange}
                  placeholder="e.g. Grevillea"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleChange}
                  placeholder="Number of trees"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="zone">Restoration Zone</Label>
                <button
                  type="button"
                  className="text-xs font-medium text-moss hover:underline"
                  onClick={() => setShowNewZone(v => !v)}
                >
                  {showNewZone ? 'Cancel' : '+ New zone'}
                </button>
              </div>

              {!showNewZone ? (
                <select
                  id="zone"
                  name="zone"
                  value={formData.zone}
                  onChange={e => {
                    handleChange(e);
                    const zone = zones.find(z => z._id === e.target.value);
                    if (zone) setCoords({ lat: zone.latitude, lng: zone.longitude });
                  }}
                  required
                  className="flex h-10 w-full rounded-md border border-clay bg-white px-3 py-2 text-sm text-bark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss"
                >
                  <option value="" disabled>Select a zone</option>
                  {zones.map(zone => (
                    <option key={zone._id} value={zone._id}>{zone.name}</option>
                  ))}
                </select>
              ) : (
                <div className="space-y-3 rounded-md border border-clay/60 bg-mist p-3">
                  {zoneError && <p className="text-sm text-red-600">{zoneError}</p>}
                  <Input
                    placeholder="Zone name, e.g. Kilimambogo Ridge"
                    value={newZoneName}
                    onChange={e => setNewZoneName(e.target.value)}
                  />
                  <LocationPicker
                    latitude={newZoneCoords.lat}
                    longitude={newZoneCoords.lng}
                    onChange={(lat, lng) => setNewZoneCoords({ lat, lng })}
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={!newZoneName || zoneStatus === 'loading'}
                    onClick={handleCreateZone}
                  >
                    {zoneStatus === 'loading' ? <Spinner className="mr-2" /> : null}
                    Create Zone
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Planting Location</Label>
              <LocationPicker
                latitude={coords.lat}
                longitude={coords.lng}
                onChange={(lat, lng) => setCoords({ lat, lng })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                placeholder="Optional comments"
              />
            </div>

            <Button type="submit" disabled={status === 'loading' || !formData.zone}>
              {status === 'loading' ? <Spinner className="mr-2" /> : null}
              {status === 'loading' ? 'Submitting...' : 'Submit Log'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlantingLog;
