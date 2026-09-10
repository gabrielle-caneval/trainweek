export interface User {
  firstName: string;
  lastName: string;
  age: number;
  weight: number;
  height: number;
  gender: 'H' | 'F' | 'A';
  goal: string;
  level: string;
  equipment: 'bodyweight' | 'home' | 'gym';
  avatarSeed?: string;
  createdAt: string;
}

export interface Exercise {
  name: string;
  sets: string;
  note: string;
  customName: string;
  customSets: string;
  customWeight: string;
  customRest: string;
  customImg: string;
  done?: boolean;
}

export interface Section {
  title: string;
  exercises: Exercise[];
}

export interface WorkoutDay {
  name: string;
  label: string;
  tag: 'push' | 'pull' | 'legs' | 'full' | 'arms' | 'rest';
  color: string;
  subtitle: string;
  img: string;
  note?: string;
  rest?: boolean;
  sections?: Section[];
}

export interface Program {
  [key: number]: WorkoutDay;
}

export interface WorkoutLog {
  date: string;
  dayIndex: number;
  dayName: string;
  exercisesDone: number;
  totalExercises: number;
  duration?: number;
  volume?: number;
}

export interface WeightEntry {
  date: string;
  weight: number;
}

export interface PersonalRecord {
  exercise: string;
  weight: number;
  reps: string;
  date: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ExerciseInfo {
  m: string;
  t: string;
  r: string;
  d: string;
  err: string;
}

export interface BadgeData {
  id: string;
  icon: string;
  name: string;
  desc: string;
  unlocked: boolean;
}
