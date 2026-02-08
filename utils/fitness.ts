
import { Exercise, WorkoutSession, WorkoutSet, PlannedExercise, Zone, MuscleGroup, Equipment, Goal } from '../types';

/**
 * Epley Formula for Estimated 1RM
 */
export const calculate1RM = (weight: number, reps: number): number => {
  if (reps === 1) return weight;
  if (reps === 0) return 0;
  return weight * (1 + reps / 30);
};

/**
 * Finds the best replacement exercise in a target zone based on movement pattern.
 */
export const findReplacement = (
  currentExercise: Exercise,
  targetZone: Zone,
  allExercises: Exercise[]
): Exercise => {
  // Filter DB for same movement pattern and available equipment
  const candidates = allExercises.filter(ex => 
    ex.pattern === currentExercise.pattern &&
    ex.equipment.every(eq => targetZone.inventory.includes(eq))
  );

  if (candidates.length === 0) {
    // Fallback: search for just ONE of the equipments matching
    const fallback = allExercises.find(ex => 
      ex.pattern === currentExercise.pattern &&
      ex.equipment.some(eq => targetZone.inventory.includes(eq))
    );
    return fallback || currentExercise;
  }

  // Choose the one closest in difficulty to the original
  return candidates.sort((a, b) => 
    Math.abs(b.difficultyMultiplier - currentExercise.difficultyMultiplier) - 
    Math.abs(a.difficultyMultiplier - currentExercise.difficultyMultiplier)
  )[0];
};

/**
 * Adapts volume when context switching (e.g. Barbell to Bodyweight)
 */
export const adaptVolume = (
  originalSets: WorkoutSet[],
  originalEx: Exercise,
  newEx: Exercise,
  userGoal: Goal
): WorkoutSet[] => {
  const diffRatio = originalEx.difficultyMultiplier / newEx.difficultyMultiplier;
  
  return originalSets.map(set => {
    let newReps = Math.ceil(set.reps * diffRatio);
    if (newReps > 30) newReps = 30; 
    
    return {
      ...set,
      reps: newReps,
      weight: set.weight / diffRatio,
      completed: false
    };
  });
};

export const suggestOverload = (lastSet: WorkoutSet): { weight: number; reps: number } => {
  const newWeight = Math.round((lastSet.weight * 1.025) * 2) / 2;
  return {
    weight: newWeight,
    reps: lastSet.reps
  };
};

/**
 * 1. HISTORY LOOKUP
 * Hittar senaste passet där övningen utfördes.
 */
export const getLastPerformance = (exerciseId: string, history: WorkoutSession[]): WorkoutSet[] | null => {
  // Sortera pass nyast först
  const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  for (const session of sortedHistory) {
    const ex = session.exercises.find(e => e.exerciseId === exerciseId);
    // Vi vill ha set som faktiskt utfördes (completed) och har vikt eller reps
    if (ex && ex.sets.some(s => s.completed)) {
      return ex.sets.filter(s => s.completed); // Returnera bara de genomförda seten
    }
  }
  return null;
};

/**
 * 2. PROGRESSION LOGIC
 * Skapar nya set baserat på historik, med valfri överbelastning.
 */
export const createSmartSets = (lastSets: WorkoutSet[], applyOverload: boolean): WorkoutSet[] => {
  return lastSets.map(s => {
    let newWeight = s.weight;
    let newReps = s.reps;

    if (applyOverload) {
      // Enkel progressiv överbelastning: Öka vikten med 2.5kg om man gjorde >= 8 reps
      // Eller öka reps om vikten är låg.
      if (newReps >= 8) {
         newWeight += 2.5; 
      } else {
         newReps += 1;
      }
    }

    return {
      reps: newReps,
      weight: newWeight,
      completed: false,
      rpe: undefined // Nollställ RPE för nya passet
    };
  });
};

/**
 * 3. WORKOUT GENERATOR
 * Genererar ett pass baserat på muskler och utrustning.
 */
export const generateWorkoutSession = (
  targetMuscles: MuscleGroup[], 
  zone: Zone, 
  allExercises: Exercise[]
): PlannedExercise[] => {
  
  const plannedExercises: PlannedExercise[] = [];
  const selectedIds = new Set<string>();

  // Filtrera övningar som går att göra i zonen OCH träffar rätt muskler
  const availableExercises = allExercises.filter(ex => 
    // Måste ha utrustning som finns i zonen
    ex.equipment.every(eq => zone.inventory.includes(eq)) &&
    // Måste träffa någon av målmusklerna (Primär eller Sekundär)
    (
       ex.primaryMuscles?.some(m => targetMuscles.includes(m)) || 
       ex.muscleGroups.some(m => targetMuscles.includes(m))
    )
  );

  // Strategi: 1 Tung Basövning, 2-3 Komplement, 1-2 Isolering
  // Sortera efter "Difficulty" (Tungst först)
  availableExercises.sort((a, b) => b.difficultyMultiplier - a.difficultyMultiplier);

  // Välj övningar
  availableExercises.forEach(ex => {
    if (plannedExercises.length >= 6) return; // Max 6 övningar
    if (selectedIds.has(ex.id)) return;

    // Undvik att bomba samma muskel för många gånger direkt, sprid ut det
    plannedExercises.push({
      exerciseId: ex.id,
      sets: [
        { reps: 10, weight: 0, completed: false },
        { reps: 10, weight: 0, completed: false },
        { reps: 10, weight: 0, completed: false }
      ]
    });
    selectedIds.add(ex.id);
  });

  return plannedExercises;
};