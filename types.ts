export type EventSize = 'large' | 'medium' | 'small';

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: string; // YYYY-MM-DD
  size: EventSize;
  createdAt: number;
  isCompleted?: boolean;
  linkedGoalId?: string;
}

export interface BucketGoal {
  id: string;
  title: string;
  targetCount: number;
  currentCount: number;
  reward: string;
  // milestones stores base64 photos for specific progress percentages: 25, 50, 75, 100
  milestones?: Record<number, string>;
  lastUpdated: number;
  size?: EventSize;
}

export type ViewState = 'plan' | 'add' | 'bucket';