
import { WorkoutSession, MuscleGroup } from '../types';
import { storage } from '../services/storage';

export type MuscleStatus = {
  [key in MuscleGroup]: number; // 0 to 100
};

const MUSCLE_RECOVERY_HOURS = 72;

export const ALL_MUSCLE_GROUPS: MuscleGroup[] = [
  'Mage', 'Rygg', 'Biceps', 'Bröst', 'Säte', 'Baksida lår', 
  'Framsida lår', 'Axlar', 'Triceps', 'Ryggslut', 'Vader', 
  'Trapezius', 'Abduktorer', 'Adduktorer', 'Underarmar', 'Nacke'
];

export const calculateMuscleRecovery = (history: WorkoutSession[]): MuscleStatus => {
  const status: MuscleStatus = {} as MuscleStatus;
  ALL_MUSCLE_GROUPS.forEach(m => status[m] = 100);

  const allExercises = storage.getAllExercises();
  const userProfile = storage.getUserProfile();
  const now = new Date().getTime();

  const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  sortedHistory.forEach(session => {
    const sessionTime = new Date(session.date).getTime();
    const hoursSince = (now - sessionTime) / (1000 * 60 * 60);
    if (hoursSince > 168) return;

    session.exercises.forEach(plannedEx => {
      const exData = allExercises.find(e => e.id === plannedEx.exerciseId);
      if (!exData) return;

      const completedSets = plannedEx.sets.filter(s => s.completed);
      if (completedSets.length === 0) return;

      const totalEffectiveVolume = completedSets.reduce((sum, s) => {
        const bodyweightLoad = userProfile.weight * (exData.bodyweightCoefficient || 0);
        const effectiveLoad = bodyweightLoad + s.weight;
        return sum + (effectiveLoad * s.reps);
      }, 0);

      const fatiguePerSet = (totalEffectiveVolume / 250 + (completedSets.length * 2)) * exData.difficultyMultiplier;

      exData.muscleGroups.forEach(muscle => {
        if (status[muscle] !== undefined) {
          const recoveryRate = hoursSince / MUSCLE_RECOVERY_HOURS;
          const remainingFatigue = fatiguePerSet * Math.max(0, 1 - recoveryRate);
          
          status[muscle] = Math.max(0, status[muscle] - remainingFatigue);
        }
      });
    });
  });

  return status;
};

export const getRecoveryColor = (score: number, isSelected?: boolean) => {
  if (isSelected) return '#ff2d55'; 
  if (score >= 95) return 'rgba(255, 255, 255, 0.2)'; 
  if (score >= 80) return '#ffd6dd'; 
  if (score >= 65) return '#ff8095'; 
  if (score >= 45) return '#ff2d55'; 
  return '#990022'; 
};

export const getRecoveryStatus = (score: number): string => {
  if (score >= 95) return 'Fräsch';
  if (score >= 80) return 'OK';
  if (score >= 65) return 'Trött';
  if (score >= 45) return 'Sliten';
  return 'Maximal utmattning';
};
