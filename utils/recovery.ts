
import { WorkoutSession, MuscleGroup, Exercise, WorkoutSet, UserProfile } from '../types';

export type MuscleStatus = {
  [key in MuscleGroup]: number; // 0 to 100
};

const RECOVERY_HOURS = 48; // 48h för full återhämtning (mer responsivt)

export const ALL_MUSCLE_GROUPS: MuscleGroup[] = [
  'Mage', 'Rygg', 'Biceps', 'Bröst', 'Säte', 'Baksida lår', 
  'Framsida lår', 'Axlar', 'Triceps', 'Ryggslut', 'Vader', 
  'Trapezius', 'Abduktorer', 'Adduktorer', 'Underarmar', 'Nacke'
];

/**
 * Räknar ut belastningspåverkan (Fatigue) för en specifik övning.
 * Används både för live-visualisering och långsiktig återhämtningslogik.
 */
export const calculateExerciseImpact = (
  exData: Exercise, 
  sets: WorkoutSet[], 
  userBodyWeight: number
): number => {
  // 1. Filtrera bort set som inte är relevanta (0 reps)
  const validSets = sets.filter(s => s.reps > 0);
  if (validSets.length === 0) return 0;

  // 2. Räkna ut total volym (inkl kroppsvikt för övningar som Chins)
  const totalVolume = validSets.reduce((sum, s) => {
    const bodyweightLoad = userBodyWeight * (exData.bodyweightCoefficient || 0);
    const effectiveLoad = bodyweightLoad + s.weight;
    return sum + (effectiveLoad * s.reps);
  }, 0);

  // 3. Beräkna Fatigue (Trötthet)
  // Formel: (Volym / 250 + Bonus för antal set) * Svårighetsgrad
  let fatigue = (totalVolume / 250) + (validSets.length * 1.5);
  
  return fatigue * exData.difficultyMultiplier;
};


export const calculateMuscleRecovery = (
  history: WorkoutSession[], 
  allExercises: Exercise[], 
  userProfile: UserProfile | null
): MuscleStatus => {
  const status: MuscleStatus = {} as MuscleStatus;
  ALL_MUSCLE_GROUPS.forEach(m => status[m] = 100);

  if (!userProfile) return status;

  const now = new Date().getTime();
  const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  sortedHistory.forEach(session => {
    const sessionTime = new Date(session.date).getTime();
    const hoursSince = (now - sessionTime) / (1000 * 60 * 60);
    
    if (hoursSince > 120) return;

    const sessionRpe = session.rpe || 7.5; 
    const intensityFactor = sessionRpe / 7.5; 

    session.exercises.forEach(plannedEx => {
      const exData = allExercises.find(e => e.id === plannedEx.exerciseId);
      if (!exData) return;

      const setsToCount = (plannedEx.sets.filter(s => s.completed).length > 0)
        ? plannedEx.sets.filter(s => s.completed)
        : (session.isCompleted ? plannedEx.sets : []);

      if (setsToCount.length === 0) return;

      const baseFatigue = calculateExerciseImpact(exData, setsToCount, userProfile.weight);
      const finalFatigue = baseFatigue * intensityFactor;

      const primaries = exData.primaryMuscles?.length ? exData.primaryMuscles : exData.muscleGroups;
      primaries?.forEach(m => applyFatigue(status, m, finalFatigue, hoursSince));
      exData.secondaryMuscles?.forEach(m => applyFatigue(status, m, finalFatigue * 0.5, hoursSince));
    });
  });

  return status;
};

const applyFatigue = (status: MuscleStatus, muscle: MuscleGroup, amount: number, hoursSince: number) => {
  if (status[muscle] === undefined) return;
  
  const recoveryFactor = Math.min(1, hoursSince / RECOVERY_HOURS);
  const remainingFatigue = amount * (1 - recoveryFactor);

  if (remainingFatigue > 0) {
    status[muscle] = Math.max(0, status[muscle] - remainingFatigue);
  }
};

export const getRecoveryColor = (score: number, isSelected?: boolean) => {
  if (isSelected) return '#ff2d55'; 
  if (score >= 90) return 'rgba(255, 255, 255, 0.2)'; 
  if (score >= 70) return '#ffd6dd'; 
  if (score >= 50) return '#ff8095'; 
  if (score >= 30) return '#ff2d55'; 
  return '#990022'; 
};

export const getRecoveryStatus = (score: number): string => {
  if (score >= 90) return 'Fräsch';
  if (score >= 70) return 'OK';
  if (score >= 50) return 'Trött';
  if (score >= 30) return 'Sliten';
  return 'Utmattad';
};
