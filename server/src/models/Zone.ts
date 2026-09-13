import { Schema, model, Document } from 'mongoose';

export interface IZone extends Document {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  targetTrees?: number;
  createdAt: Date;
}

const zoneSchema = new Schema<IZone>({
  name: { type: String, required: true, trim: true, unique: true },
  description: { type: String, trim: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  targetTrees: { type: Number, min: 0 },
  createdAt: { type: Date, default: Date.now },
});

export const Zone = model<IZone>('Zone', zoneSchema);
