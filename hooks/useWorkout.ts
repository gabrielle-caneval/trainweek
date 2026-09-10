'use client';
import { useLocalStorage } from './useStorage';
import type { Program, WorkoutLog, WeightEntry, PersonalRecord } from '@/lib/types';
import { DEFAULT_PROGRAM } from '@/lib/data';
import { formatDate } from '@/lib/utils';

export function useWorkout() {
  const [program, setProgram] = useLocalStorage<Program>('tw_program', DEFAULT_PROGRAM);
  const [logs, setLogs] = useLocalStorage<WorkoutLog[]>('tw_logs', []);
  const [weights, setWeights] = useLocalStorage<WeightEntry[]>('tw_weights', []);
  const [prs, setPrs] = useLocalStorage<PersonalRecord[]>('tw_prs', []);

  const logWorkout = (log: Omit<WorkoutLog, 'date'>) => {
    const entry: WorkoutLog = { ...log, date: formatDate(new Date()) };
    setLogs(prev => [entry, ...prev.filter(l => l.date !== entry.date || l.dayIndex !== entry.dayIndex)]);
  };

  const addWeight = (weight: number) => {
    const entry: WeightEntry = { date: formatDate(new Date()), weight };
    setWeights(prev => [entry, ...prev.filter(w => w.date !== entry.date)]);
  };

  const addPR = (pr: PersonalRecord) => {
    setPrs(prev => [pr, ...prev.filter(p => p.exercise !== pr.exercise)]);
  };

  const getWeeklyStats = () => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 6);
    const weekLogs = logs.filter(l => new Date(l.date) >= weekStart);
    return {
      sessions: weekLogs.length,
      completedDays: new Set(weekLogs.map(l => l.dayName)).size,
    };
  };

  return {
    program, setProgram,
    logs, logWorkout,
    weights, addWeight,
    prs, addPR,
    getWeeklyStats,
  };
}
