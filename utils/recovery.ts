
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
  const validSets = sets.filter(s => (s.reps || 0) > 0 || (s.duration || 0) > 0 || (s.distance || 0) > 0);
  if (validSets.length === 0) return 0;

  const totalImpact = validSets.reduce((sum, s) => {
    const trackingType = exData.trackingType || 'reps_weight';
    let setImpact = 0;
    
    switch(trackingType) {
        case 'time_only':
            const duration = s.duration || 0;
            const effectiveBodyweightTime = userBodyWeight * (exData.bodyweightCoefficient || 0.5);
            // 10 sekunders ansträngning motsvarar ungefär 1 "rep" med kroppsvikten
            setImpact = (duration / 10) * effectiveBodyweightTime;
            break;
            
        case 'time_distance':
            // Anta att 1 meter i en tung konditionsövning motsvarar ca 10 poäng (10kg * 1 rep)
            const distance = s.distance || 0;
            setImpact = distance * 10;
            break;
            
        case 'reps_only':
            const bodyweightLoadReps = userBodyWeight * (exData.bodyweightCoefficient || 0.7);
            setImpact = bodyweightLoadReps * (s.reps || 0);
            break;
            
        case 'reps_weight':
        default:
            const addedBodyweightLoad = userBodyWeight * (exData.bodyweightCoefficient || 0);
            const effectiveLoad = addedBodyweightLoad + (s.weight || 0);
            setImpact = effectiveLoad * (s.reps || 0);
            break;
    }
    return sum + setImpact;
  }, 0);
  
  return totalImpact * exData.difficultyMultiplier;
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
      const finalFatigue = (baseFatigue / 250) * intensityFactor;

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

export interface WorkloadDetail {
  date: string;
  exerciseName: string;
  sets: WorkoutSet[];
  role: 'Primär' | 'Sekundär';
  impactScore: number;
}

export const getMuscleWorkloadDetails = (
  muscle: MuscleGroup, 
  history: WorkoutSession[],
  allExercises: Exercise[]
): WorkloadDetail[] => {
  const details: WorkloadDetail[] = [];
  const now = new Date();
  const RECOVERY_WINDOW_HOURS = 96; // 4 dagar

  const recentHistory = history.filter(h => {
      const diff = now.getTime() - new Date(h.date).getTime();
      return diff < (1000 * 60 * 60 * RECOVERY_WINDOW_HOURS); 
  });

  recentHistory.forEach(session => {
    session.exercises.forEach(sessionEx => {
      const exDef = allExercises.find(e => e.id === sessionEx.exerciseId);
      if (!exDef) return;

      const hitsPrimary = exDef.primaryMuscles?.includes(muscle);
      const hitsSecondary = exDef.secondaryMuscles?.includes(muscle);

      if (hitsPrimary || hitsSecondary) {
        const completedSets = sessionEx.sets.filter(s => s.completed);
        if (completedSets.length === 0) return;
        
        const hoursSince = (now.getTime() - new Date(session.date).getTime()) / 3600000;
        
        const rawScore = completedSets.length * (exDef.difficultyMultiplier || 1) * (hitsPrimary ? 10 : 5);
        const decayedScore = Math.max(0, rawScore * (1 - hoursSince / RECOVERY_WINDOW_HOURS));

        if (decayedScore > 0.5) {
          details.push({
            date: session.date,
            exerciseName: exDef.name,
            sets: completedSets,
            role: hitsPrimary ? 'Primär' : 'Sekundär',
            impactScore: decayedScore
          });
        }
      }
    });
  });
  
  const groupedDetails = details.reduce((acc, curr) => {
    const key = `${curr.date}-${curr.exerciseName}`;
    if (!acc[key]) {
      acc[key] = { ...curr, impactScore: 0, sets: [] };
    }
    acc[key].impactScore += curr.impactScore;
    acc[key].sets.push(...curr.sets);
    return acc;
  }, {} as Record<string, WorkloadDetail>);

  return Object.values(groupedDetails).sort((a, b) => b.impactScore - a.impactScore);
};