
import { Exercise, Equipment, MovementPattern, PlannedExercise, WorkoutSet, Zone, Goal } from '../types';
import { storage } from '../services/storage';

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
  targetZone: Zone
): Exercise => {
  const allExercises = storage.getAllExercises();
  
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
