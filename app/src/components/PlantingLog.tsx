// PlantingLog.tsx
import React, { useState } from 'react';
import { createPlantingLog } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Alert } from './ui/alert';
import { Spinner } from './ui/spinner';

interface PlantingFormData {
  species: string;
  quantity: string;
  location: string;
  date: string;
  notes: string;
}

const PlantingLog = () => {
  const [formData, setFormData] = useState<PlantingFormData>({
    species: '',
    quantity: '',
    location: '',
    date: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      await createPlantingLog({
        ...formData,
        quantity: parseInt(formData.quantity) || 0,
      });

      setStatus('success');
      setFormData({
        species: '',
        quantity: '',
        location: '',
        date: new Date().toISOString().slice(0, 10),
        notes: '',
      });
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

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="GPS or zone name"
                  required
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

            <Button type="submit" disabled={status === 'loading'}>
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
