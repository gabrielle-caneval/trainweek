import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getWeekDays(offset = 0): Date[] {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

export function calculateBMI(weight: number, height: number): number {
  const h = height / 100;
  return Math.round((weight / (h * h)) * 10) / 10;
}

export function getBMICategory(bmi: number): { label: string; color: string; bg: string } {
  if (bmi < 16.5) return { label:'Maigreur sévère',      color:'#3B82F6', bg:'rgba(59,130,246,0.10)' };
  if (bmi < 18.5) return { label:'Insuffisance pondérale', color:'#60A5FA', bg:'rgba(96,165,250,0.10)' };
  if (bmi < 25.0) return { label:'Corpulence normale',    color:'#22C55E', bg:'rgba(34,197,94,0.10)' };
  if (bmi < 30.0) return { label:'Surpoids',              color:'#F97316', bg:'rgba(249,115,22,0.10)' };
  if (bmi < 35.0) return { label:'Obésité modérée',       color:'#EF4444', bg:'rgba(239,68,68,0.10)' };
  if (bmi < 40.0) return { label:'Obésité sévère',        color:'#DC2626', bg:'rgba(220,38,38,0.10)' };
  return             { label:'Obésité morbide',            color:'#991B1B', bg:'rgba(153,27,27,0.10)' };
}

export function calculateBMR(weight: number, height: number, age: number, gender: string): number {
  if (gender === 'H') return Math.round(88.362 + 13.397 * weight + 4.799 * height - 5.677 * age);
  return Math.round(447.593 + 9.247 * weight + 3.098 * height - 4.330 * age);
}

export function calculateTDEE(bmr: number, activityLevel = 1.55): number {
  return Math.round(bmr * activityLevel);
}

export function getMassGainCalories(tdee: number): number {
  return tdee + 300;
}

export function formatWeight(w: number): string {
  return `${w} kg`;
}

export function getDayName(index: number): string {
  const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  return days[index] || '';
}

export function getTagColor(tag: string): string {
  const colors: Record<string, string> = {
    push: '#ff6b35',
    pull: '#3b9eff',
    legs: '#30d158',
    full: '#ffd60a',
    arms: '#bf5af2',
    rest: 'rgba(255,255,255,0.25)',
  };
  return colors[tag] || '#d4ff33';
}

export function getStreakFromLogs(logs: { date: string }[]): number {
  if (!logs.length) return 0;
  const today = new Date();
  const sorted = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  let streak = 0;
  let current = new Date(today);
  current.setHours(0, 0, 0, 0);
  for (const log of sorted) {
    const logDate = new Date(log.date);
    logDate.setHours(0, 0, 0, 0);
    const diff = Math.round((current.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0 || diff === 1) {
      streak++;
      current = logDate;
    } else {
      break;
    }
  }
  return streak;
}

export function getWeekLabel(offset: number): string {
  const days = getWeekDays(offset);
  const start = days[0];
  const end = days[6];
  const fmt = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  if (offset === 0) return `Cette semaine`;
  if (offset === -1) return `Sem. passée`;
  return `${fmt(start)} – ${fmt(end)}`;
}
