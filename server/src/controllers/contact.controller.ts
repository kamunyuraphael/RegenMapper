import { Request, Response, NextFunction } from 'express';
import { Contact } from '../models/Contact';

export const createContactMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'name, email and message are required' });
    }

    const contact = await Contact.create({ name, email, message });
    res.status(201).json(contact);
  } catch (err) {
    next(err);
  }
};
