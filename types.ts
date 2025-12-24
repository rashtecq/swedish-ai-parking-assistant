
export type ParkingStatus = 'ALLOWED' | 'FORBIDDEN' | 'UNKNOWN';

export interface ParkingAnalysis {
  status: ParkingStatus;
  summary: string;
  details: string[];
  durationLimit?: string;
  costInfo?: string;
  timeWindow?: string;
}

export interface EditHistoryItem {
  id: string;
  imageUrl: string;
  prompt: string;
  timestamp: number;
}
