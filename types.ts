
export interface WorkoutSet {
  id: string;
  reps: number;
  weight: number;
}

export interface Exercise {
  id: string;
  name: string;
  sets: WorkoutSet[];
}

export interface WorkoutSession {
  id: string;
  date: string;
  name: string;
  startTime: string;
  endTime?: string;
  pausedMs?: number;
  exercises: Exercise[];
  notes?: string;
}

export interface AiInsight {
  title: string;
  suggestion: string;
  motivation: string;
}

export interface OverloadAdvice {
  exerciseName: string;
  currentStats: string;
  targetStats: string;
  reason: string;
}

export interface WeeklyProgressData {
  advice: OverloadAdvice[];
  summary: string;
}
