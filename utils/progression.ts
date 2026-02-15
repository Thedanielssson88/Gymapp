
// utils/progression.ts
import { UserMission, SmartGoalConfig, WorkoutSession, BiometricLog, PlannedExercise, Exercise, MuscleGroup } from '../types';
import { calculate1RM } from './fitness'; // Importera från fitness för att undvika dubbletter

// --- NY KOD FÖR PPL-ANALYS OCH VIKTFÖRSLAG ---

// Kategoriserar muskler för PPL-analys
const MUSCLE_CATS: Record<string, MuscleGroup[]> = {
  push: ['Bröst', 'Axlar', 'Triceps', 'Framsida lår'],
  pull: ['Rygg', 'Biceps', 'Underarmar', 'Trapezius', 'Baksida lår'],
  legs: ['Framsida lår', 'Baksida lår', 'Säte', 'Vader', 'Adduktorer', 'Abduktorer']
};

export const calculatePPLStats = (history: WorkoutSession[], allExercises: Exercise[]) => {
  const stats = {
    push: { max1RM: 0, score: 0, level: 'Nybörjare' as 'Nybörjare' | 'Motionär' | 'Erfaren' | 'Atlet' | 'Elit' },
    pull: { max1RM: 0, score: 0, level: 'Nybörjare' as 'Nybörjare' | 'Motionär' | 'Erfaren' | 'Atlet' | 'Elit' },
    legs: { max1RM: 0, score: 0, level: 'Nybörjare' as 'Nybörjare' | 'Motionär' | 'Erfaren' | 'Atlet' | 'Elit' }
  };

  history.forEach(session => {
    session.exercises.forEach(sessionEx => {
      const def = allExercises.find(e => e.id === sessionEx.exerciseId);
      if (!def) return;

      let category: 'push' | 'pull' | 'legs' | null = null;
      
      if (def.primaryMuscles.some(m => MUSCLE_CATS.legs.includes(m))) category = 'legs';
      else if (def.primaryMuscles.some(m => MUSCLE_CATS.pull.includes(m))) category = 'pull';
      else if (def.primaryMuscles.some(m => MUSCLE_CATS.push.includes(m))) category = 'push';

      if (category) {
        sessionEx.sets.forEach(set => {
          if (set.weight > 0 && set.reps > 0) {
            const e1rm = calculate1RM(set.weight, set.reps);
            if (e1rm > stats[category].max1RM) {
              stats[category].max1RM = Math.round(e1rm);
            }
          }
        });
      }
    });
  });

  stats.push.score = Math.min(100, Math.round((stats.push.max1RM / 140) * 100));
  stats.pull.score = Math.min(100, Math.round((stats.pull.max1RM / 200) * 100));
  stats.legs.score = Math.min(100, Math.round((stats.legs.max1RM / 180) * 100));

  const getLevel = (score: number): 'Nybörjare' | 'Motionär' | 'Erfaren' | 'Atlet' | 'Elit' => {
    if (score < 20) return "Nybörjare";
    if (score < 40) return "Motionär";
    if (score < 60) return "Erfaren";
    if (score < 80) return "Atlet";
    return "Elit";
  };

  stats.push.level = getLevel(stats.push.score);
  stats.pull.level = getLevel(stats.pull.score);
  stats.legs.level = getLevel(stats.legs.score);

  return stats;
};

// Räknar ut vikt baserat på historik. Returnerar 0 om ingen historik finns.
export const suggestWeightForReps = (
  exerciseId: string, 
  targetReps: number, 
  history: WorkoutSession[]
): number => {
  let max1RM = 0;
  
  history.forEach(session => {
    session.exercises.forEach(ex => {
      if (ex.exerciseId === exerciseId) {
        ex.sets.forEach(set => {
          if (set.weight > 0 && set.reps > 0) {
            const e1rm = calculate1RM(set.weight, set.reps);
            if (e1rm > max1RM) max1RM = e1rm;
          }
        });
      }
    });
  });

  if (max1RM === 0) return 0; 

  // Inverterad Epley: Vikt = 1RM / (1 + Reps/30)
  const suggestedWeight = max1RM / (1 + targetReps / 30);
  
  // Avrunda till närmaste 2.5kg
  return Math.round(suggestedWeight / 2.5) * 2.5;
};


// --- BEFINTLIG KOD ---

interface ProgressionResult {
  expectedValue: number; // Var borde jag vara idag? (Vikt)
  expectedReps: number;  // Vad är dagens reps-mål?
  statusDiff: number;    // Positivt = Ligger efter (om man ska öka), Negativt = Ligger före
  progressRatio: number; // 0.0 till 1.0 (Tid)
  unit: string;
}

// Hjälpfunktion för att hämta historisk data för grafer
export const getHistoryForGoal = (config: SmartGoalConfig, historyLogs: WorkoutSession[], bioLogs: BiometricLog[]) => {
  if (config.targetType === 'exercise' && config.exerciseId) {
    // Hitta maxvikt för övningen i varje pass
    return historyLogs
      .filter(h => h.exercises && h.exercises.some((e: PlannedExercise) => e.exerciseId === config.exerciseId))
      .map(h => {
        const ex = h.exercises.find((e: PlannedExercise) => e.exerciseId === config.exerciseId);
        // Hitta tyngsta setet i passet
        const maxWeight = ex && ex.sets ? Math.max(...ex.sets.map((s: any) => s.weight || 0)) : 0;
        return { date: h.date, value: maxWeight };
      })
      .filter(d => d.value > 0);
  } else {
    // Hitta kroppsvikt eller mått
    return bioLogs.map(log => ({
      date: log.date,
      value: config.targetType === 'body_weight' 
        ? log.weight 
        : (log.measurements?.[config.measurementKey as keyof typeof log.measurements] || 0)
    })).filter(d => d.value > 0);
  }
};

export const calculateSmartProgression = (
  mission: UserMission, 
  currentValue: number
): ProgressionResult | null => {
  if (mission.type !== 'smart_goal' || !mission.smartConfig) return null;

  const { startValue, targetValue, startReps = 8, targetReps = 5, deadline, strategy, targetType, measurementKey } = mission.smartConfig;
  
  const now = new Date().getTime();
  const start = new Date(mission.createdAt).getTime();
  const end = new Date(deadline).getTime();
  const totalTime = end - start;
  
  // Skydd mot division med noll
  const progressRatio = totalTime > 0 ? Math.min(Math.max((now - start) / totalTime, 0), 1) : 0;

  let expectedValue = startValue;
  let expectedReps = startReps;
  const totalChange = targetValue - startValue;

  switch (strategy) {
    case 'linear':
      expectedValue = startValue + (totalChange * progressRatio);
      expectedReps = startReps + ((targetReps - startReps) * progressRatio);
      break;
    case 'undulating':
      expectedValue = startValue + (totalChange * progressRatio);
      expectedReps = startReps + ((targetReps - startReps) * progressRatio);
      break;
    case 'peaking':
      const curve = progressRatio * progressRatio;
      expectedValue = startValue + (totalChange * curve);
      expectedReps = startReps + ((targetReps - startReps) * progressRatio);
      break;
  }

  // Avrundning
  if (targetType === 'exercise') {
    expectedValue = Math.round(expectedValue / 2.5) * 2.5; // Närmsta 2.5kg
    expectedReps = Math.round(expectedReps);
  } else {
    expectedValue = parseFloat(expectedValue.toFixed(1)); // 1 decimal för kropp
  }

  const statusDiff = expectedValue - currentValue;
  
  let unit = 'kg';
  if(targetType === 'body_measurement') {
    if(measurementKey === 'bodyFat') unit = '%';
    else unit = 'cm';
  }


  return {
    expectedValue,
    expectedReps,
    statusDiff,
    progressRatio,
    unit
  };
};
