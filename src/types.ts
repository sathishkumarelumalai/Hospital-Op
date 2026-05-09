export interface OPRecord {
  date: string;
  department: string;
  visitorCount: number;
}

export interface PredictionResult {
  date: string;
  predictedCount: number;
  confidence: number;
  reasoning?: string;
}

export type View = 'dashboard' | 'history' | 'forecast';
