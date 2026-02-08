
import { WorkoutSession, MuscleGroup, Exercise, WorkoutSet } from '../types';
import { storage } from '../services/storage';

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
  // 1. Filtrera bort tomma set
  const validSets = sets.filter(s => s.reps > 0);
  if (validSets.length === 0) return 0;

  // 2. Räkna ut total volym (Belastning)
  const totalVolume = validSets.reduce((sum, s) => {
    // Inkludera kroppsvikt om övningen kräver det (t.ex. Chins/Dips)
    const exerciseLoad = s.weight + (userBodyWeight * (exData.bodyweightCoefficient || 0));
    
    // RPE-faktor (använd 8 som standard om ej angivet)
    const rpeMultiplier = s.rpe ? (1 + (s.rpe - 8) * 0.1) : 1.0; 
    
    return sum + (exerciseLoad * s.reps * rpeMultiplier);
  }, 0);

  // 3. Bas-formel för fatigue
  // Justera "300" här för att göra appen känsligare/trögare.
  let fatigue = (totalVolume / 300) * exData.difficultyMultiplier;

  // Bonus för antal set (Metabolisk stress)
  fatigue += validSets.length * 1.5;

  return fatigue; 
};

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
    
    if (hoursSince > 120) return; // Ignorera pass äldre än 5 dagar

    // HÄMTA PASS-RPE (Default 7 om det saknas för att normalisera)
    const sessionRpeFactor = session.rpe ? (session.rpe / 7) : 1.0;

    session.exercises.forEach(plannedEx => {
      const exData = allExercises.find(e => e.id === plannedEx.exerciseId);
      if (!exData) return;

      const setsToCount = (plannedEx.sets.filter(s => s.completed).length > 0)
        ? plannedEx.sets.filter(s => s.completed)
        : (session.isCompleted ? plannedEx.sets : []);

      if (setsToCount.length === 0) return;

      const fatigueAmount = calculateExerciseImpact(exData, setsToCount, userProfile.weight);
      
      // Applicera passets RPE-faktor på fatiguesumman
      const adjustedFatigue = fatigueAmount * sessionRpeFactor;

      // Applicera på Primära (100%)
      const primaries = exData.primaryMuscles?.length ? exData.primaryMuscles : exData.muscleGroups;
      primaries?.forEach(m => applyFatigue(status, m, adjustedFatigue, hoursSince));

      // Applicera på Sekundära (50%)
      exData.secondaryMuscles?.forEach(m => applyFatigue(status, m, adjustedFatigue * 0.5, hoursSince));
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
