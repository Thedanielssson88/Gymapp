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

  history.forEach(session => {
    const sessionTime = new Date(session.date).getTime();
    const hoursSince = (now - sessionTime) / (1000 * 60 * 60);
    if (hoursSince > 168) return; // 7 day lookback

    session.exercises.forEach(plannedEx => {
      const exData = allExercises.find(e => e.id === plannedEx.exerciseId);
      if (!exData) return;

      const completedSets = plannedEx.sets.filter(s => s.completed);
      if (completedSets.length === 0) return;

      // Calculate Biomechanical Volume
      // Formula: (user_bodyweight * exercise.bodyweight_coefficient) + added_weight_kg
      const totalEffectiveVolume = completedSets.reduce((sum, s) => {
        const bodyweightLoad = userProfile.weight * exData.bodyweightCoefficient;
        const effectiveLoad = bodyweightLoad + s.weight;
        return sum + (effectiveLoad * s.reps);
      }, 0);

      const fatigueAmount = Math.min(35, (totalEffectiveVolume / 500 + 5) * exData.difficultyMultiplier);

      exData.muscleGroups.forEach(muscle => {
        if (status[muscle] !== undefined) {
          const recoveryRate = hoursSince / MUSCLE_RECOVERY_HOURS;
          const remainingFatigue = fatigueAmount * Math.max(0, 1 - recoveryRate);
          status[muscle] = Math.max(0, status[muscle] - remainingFatigue);
        }
      });
    });
  });

  return status;
};

export const getRecoveryColor = (score: number, isSelected?: boolean) => {
  if (isSelected) return '#ff2d55'; 
  if (score >= 98) return 'rgba(255, 255, 255, 0.05)';
  if (score >= 80) return '#ffccd5';
  if (score >= 60) return '#ff8095';
  if (score >= 40) return '#ff2d55';
  return '#b31535'; 
};