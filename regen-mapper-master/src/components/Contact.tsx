import React, { useState } from 'react';
import { sendContactMessage } from '../services/api';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { Alert } from './ui/alert';
import { Spinner } from './ui/spinner';

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

const Contact: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    message: '',
  });

  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      await sendContactMessage(formData);

      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      console.error('Error:', error);
      setStatus('error');
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Contact ReGen Mapper</CardTitle>
          <p className="mt-1 text-sm text-bark/70">
            Have a question, feedback, or collaboration idea? Reach out below.
          </p>
        </CardHeader>
        <CardContent>
          {status === 'success' && (
            <Alert variant="success" className="mb-4">
              Thank you for your message — we'll get back to you soon.
            </Alert>
          )}
          {status === 'error' && (
            <Alert variant="error" className="mb-4">
              Sorry, there was an error sending your message. Please try again.
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter name"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows={4}
                placeholder="Your message..."
                required
              />
            </div>

            <Button type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? <Spinner className="mr-2" /> : null}
              {status === 'loading' ? 'Sending...' : 'Send'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Contact;
