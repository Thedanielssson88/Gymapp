
import { Exercise, WorkoutSession, WorkoutSet, PlannedExercise, Zone, MuscleGroup, Equipment, Goal, UserProfile, ExerciseTier, MovementPattern } from '../types';
import { calculateMuscleRecovery } from './recovery';

/**
 * PT Blueprints per Goal
 */
const SESSION_BLUEPRINTS: Record<string, { tier: ExerciseTier; sets: number; reps: number }[]> = {
  [Goal.STRENGTH]: [
    { tier: 'tier_1', sets: 5, reps: 5 },  // Main Lift
    { tier: 'tier_2', sets: 3, reps: 8 },  // Heavy Accessory
    { tier: 'tier_2', sets: 3, reps: 8 },  // Accessory
    { tier: 'tier_3', sets: 3, reps: 12 }  // Support/Prehab
  ],
  [Goal.HYPERTROPHY]: [
    { tier: 'tier_1', sets: 3, reps: 8 },  // Main Base
    { tier: 'tier_2', sets: 3, reps: 10 }, // Volume
    { tier: 'tier_2', sets: 3, reps: 12 }, // Volume
    { tier: 'tier_3', sets: 3, reps: 12 }, // Isolation
    { tier: 'tier_3', sets: 2, reps: 15 }  // Finisher/Pump
  ],
  [Goal.ENDURANCE]: [
    { tier: 'tier_1', sets: 3, reps: 12 },
    { tier: 'tier_2', sets: 3, reps: 15 },
    { tier: 'tier_2', sets: 3, reps: 15 },
    { tier: 'tier_3', sets: 3, reps: 20 }
  ],
  [Goal.REHAB]: [
    { tier: 'tier_3', sets: 3, reps: 15 },
    { tier: 'tier_3', sets: 3, reps: 15 },
    { tier: 'tier_3', sets: 3, reps: 15 }
  ]
};

export const calculate1RM = (weight: number, reps: number): number => {
  if (reps === 1) return weight;
  if (reps === 0) return 0;
  // Beräkna 1RM och avrunda till närmaste 0.5
  const raw1RM = weight * (1 + reps / 30);
  return Math.round(raw1RM * 2) / 2;
};

export const findReplacement = (currentExercise: Exercise, targetZone: Zone, allExercises: Exercise[]): Exercise => {
  const candidates = allExercises.filter(ex => 
    ex.pattern === currentExercise.pattern &&
    ex.equipment.every(eq => targetZone.inventory.includes(eq))
  );
  if (candidates.length === 0) return currentExercise;
  return candidates.sort((a, b) => 
    Math.abs(b.difficultyMultiplier - currentExercise.difficultyMultiplier) - 
    Math.abs(a.difficultyMultiplier - currentExercise.difficultyMultiplier)
  )[0];
};

export const adaptVolume = (originalSets: WorkoutSet[], originalEx: Exercise, newEx: Exercise, userGoal: Goal): WorkoutSet[] => {
  const diffRatio = originalEx.difficultyMultiplier / newEx.difficultyMultiplier;
  return originalSets.map(set => ({
    ...set,
    reps: Math.min(30, Math.ceil(set.reps * diffRatio)),
    weight: Math.round((set.weight / diffRatio) * 2) / 2,
    completed: false
  }));
};

export const getLastPerformance = (exerciseId: string, history: WorkoutSession[]): WorkoutSet[] | null => {
  const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  for (const session of sortedHistory) {
    const ex = session.exercises.find(e => e.exerciseId === exerciseId);
    if (ex && ex.sets.some(s => s.completed)) return ex.sets.filter(s => s.completed); 
  }
  return null;
};

/**
 * Creates sets with Progressive Overload logic.
 */
export const createSmartSets = (lastSets: WorkoutSet[], applyOverload: boolean): WorkoutSet[] => {
  return lastSets.map(s => {
    let newWeight = s.weight;
    let newReps = s.reps;

    if (applyOverload && s.completed && s.type !== 'warmup') {
      const rpe = s.rpe || 8;
      if (rpe < 7) {
        newWeight += 2.5; // Too light
      } else if (rpe >= 9) {
        // Heavy: maintain weight, UI will manage reps
      } else {
        newWeight += 1.25; // Standard micro-loading
      }
    }

    return { 
      reps: newReps, 
      weight: newWeight, 
      type: s.type || 'normal', 
      completed: false 
    };
  });
};

/**
 * SMART WORKOUT GENERATOR
 */
export const generateWorkoutSession = (
  targetMuscles: MuscleGroup[], 
  zone: Zone, 
  allExercises: Exercise[],
  userProfile: UserProfile,
  history: WorkoutSession[]
): PlannedExercise[] => {
  
  const plannedExercises: PlannedExercise[] = [];
  const blueprint = SESSION_BLUEPRINTS[userProfile.goal] || SESSION_BLUEPRINTS[Goal.HYPERTROPHY];
  const recoveryStatus = calculateMuscleRecovery(history, allExercises, userProfile);
  const injuries = userProfile.injuries || [];

  // 1. Filter candidates by Zone and INJURIES
  let candidates = allExercises.filter(ex => {
    const hasEquipment = ex.equipment.every(eq => zone.inventory.includes(eq));
    if (!hasEquipment) return false;

    // INJURY PROTECTION
    const impactsInjuredMuscle = ex.primaryMuscles.some(m => injuries.includes(m));
    if (impactsInjuredMuscle) {
      // If muscle is injured, strictly only allow REHAB exercises
      return ex.pattern === MovementPattern.REHAB;
    }

    return true;
  });

  // 2. Build session based on Blueprint
  blueprint.forEach(slot => {
    // Priority: Find exercises that target the muscle AND match the blueprint slot
    const slotCandidates = candidates.filter(ex => 
      ex.tier === slot.tier && 
      ex.primaryMuscles.some(m => targetMuscles.includes(m)) &&
      !plannedExercises.find(p => p.exerciseId === ex.id)
    );

    if (slotCandidates.length === 0) {
      // Fallback: If no tier matches (especially common with injuries), try any tier for that muscle
      const fallbackCandidates = candidates.filter(ex => 
        ex.primaryMuscles.some(m => targetMuscles.includes(m)) &&
        !plannedExercises.find(p => p.exerciseId === ex.id)
      );
      if (fallbackCandidates.length === 0) return;
      
      // Select the fallback
      selectAndPlan(fallbackCandidates, slot);
    } else {
      selectAndPlan(slotCandidates, slot);
    }
  });

  function selectAndPlan(pool: Exercise[], slot: any) {
    // 3. Prioritize Recovery Score
    pool.sort((a, b) => {
       const scoreA = recoveryStatus[a.primaryMuscles[0]] || 100;
       const scoreB = recoveryStatus[b.primaryMuscles[0]] || 100;
       
       if (Math.abs(scoreA - scoreB) > 15) return scoreB - scoreA;
       return 0.5 - Math.random();
    });

    const chosen = pool[0];
    const historyData = getLastPerformance(chosen.id, history);

    plannedExercises.push({
      exerciseId: chosen.id,
      sets: historyData 
        ? createSmartSets(historyData, true) 
        : Array(slot.sets).fill({ reps: slot.reps, weight: 0, completed: false, type: 'normal' }),
      notes: chosen.pattern === MovementPattern.REHAB ? 'Rehab-fokus pga skada.' : (historyData ? 'Coach: Baserat på din förra prestation!' : 'Ny utmaning!')
    });
  }

  return plannedExercises;
};
