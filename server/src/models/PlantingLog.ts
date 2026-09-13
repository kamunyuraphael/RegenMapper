import { Schema, model, Document, Types } from 'mongoose';

export interface IPlantingLog extends Document {
  species: string;
  quantity: number;
  zone: Types.ObjectId;
  latitude: number;
  longitude: number;
  date: Date;
  notes?: string;
  user?: Types.ObjectId; // optional: set when the submitter is signed in
  createdAt: Date;
}

const plantingLogSchema = new Schema<IPlantingLog>({
  species: { type: String, required: true, trim: true },
  quantity: { type: Number, required: true, min: 0 },
  zone: { type: Schema.Types.ObjectId, ref: 'Zone', required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  date: { type: Date, required: true },
  notes: { type: String, trim: true },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

export const PlantingLog = model<IPlantingLog>('PlantingLog', plantingLogSchema);
