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
  const candidates = allExercises.filter(ex => 
    ex.pattern === currentExercise.pattern &&
    ex.equipment.every(eq => targetZone.inventory.includes(eq))
  );

  if (candidates.length === 0) {
    const fallback = allExercises.find(ex => 
      ex.pattern === currentExercise.pattern &&
      ex.equipment.some(eq => targetZone.inventory.includes(eq))
    );
    return fallback || currentExercise;
  }

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
      weight: Math.round((set.weight / diffRatio) * 2) / 2,
      completed: false
    };
  });
};

/**
 * 1. HISTORY LOOKUP
 * Hittar senaste passet där övningen utfördes.
 */
export const getLastPerformance = (exerciseId: string, history: WorkoutSession[]): WorkoutSet[] | null => {
  const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  for (const session of sortedHistory) {
    const ex = session.exercises.find(e => e.exerciseId === exerciseId);
    if (ex && ex.sets.some(s => s.completed)) {
      return ex.sets.filter(s => s.completed); 
    }
  }
  return null;
};

/**
 * Hämtar de senaste passen där en specifik övning utfördes.
 */
export const getExerciseHistory = (exerciseId: string, allHistory: WorkoutSession[], limit = 5) => {
  const relevantSessions = allHistory.filter(session => 
    session.exercises.some(e => e.exerciseId === exerciseId)
  );

  relevantSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return relevantSessions.slice(0, limit).map(session => {
    const exData = session.exercises.find(e => e.exerciseId === exerciseId);
    return {
      date: session.date,
      sets: exData?.sets || [],
      sessionName: session.name
    };
  });
};


/**
 * 2. PROGRESSION LOGIC
 * Skapar nya set baserat på historik, med valfri överbelastning.
 * Viktigt: Behåller SetType (Warmup, Drop etc.) från föregående pass.
 */
export const createSmartSets = (lastSets: WorkoutSet[], applyOverload: boolean): WorkoutSet[] => {
  return lastSets.map(s => {
    let newWeight = s.weight;
    let newReps = s.reps;

    // Vi applicerar bara progression på "normala" set eller failure-set. 
    // Uppvärmning lämnas oftast oförändrad om vikten inte är extremt låg.
    if (applyOverload && s.type !== 'warmup') {
      if (newReps >= 10) {
         newWeight += 2.5; 
      } else {
         newReps += 1;
      }
    }

    return {
      reps: newReps,
      weight: newWeight,
      type: s.type || 'normal', // Ärv taggar (Warmup, Drop, Failure)
      completed: false,
      rpe: undefined 
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

  const availableExercises = allExercises.filter(ex => 
    ex.equipment.every(eq => zone.inventory.includes(eq)) &&
    ex.muscleGroups.some(m => targetMuscles.includes(m))
  );

  availableExercises.sort((a, b) => b.difficultyMultiplier - a.difficultyMultiplier);

  availableExercises.forEach(ex => {
    if (plannedExercises.length >= 6) return; 
    if (selectedIds.has(ex.id)) return;

    plannedExercises.push({
      exerciseId: ex.id,
      sets: [
        { reps: 10, weight: 0, completed: false, type: 'normal' },
        { reps: 10, weight: 0, completed: false, type: 'normal' },
        { reps: 10, weight: 0, completed: false, type: 'normal' }
      ]
    });
    selectedIds.add(ex.id);
  });

  return plannedExercises;
};