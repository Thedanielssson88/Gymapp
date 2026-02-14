// utils/progression.ts
import { UserMission, SmartGoalConfig, WorkoutSession, BiometricLog, PlannedExercise } from '../types';

interface ProgressionResult {
  expectedValue: number; // Var borde jag vara idag? (Vikt)
  expectedReps: number;  // Vad är dagens reps-mål?
  statusDiff: number;    // Positivt = Ligger efter (om man ska öka), Negativt = Ligger före
  progressRatio: number; // 0.0 till 1.0 (Tid)
  unit: string;
}

// Hjälpfunktion för att hämta historisk data för grafer
export const getHistoryForGoal = (config: SmartGoalConfig, historyLogs: WorkoutSession[], bioLogs: BiometricLog[]) => {
  if (config.targetType === 'exercise') {
    // Hitta maxvikt för övningen i varje pass
    return historyLogs
      .filter(h => h.exercises && h.exercises.some((e: PlannedExercise) => e.exerciseId === config.exerciseId))
      .map(h => {
        const ex = h.exercises.find((e: PlannedExercise) => e.exerciseId === config.exerciseId);
        // Hitta tyngsta setet i passet
        const maxWeight = ex.sets ? Math.max(...ex.sets.map((s: any) => s.weight || 0)) : 0;
        return { date: h.date, value: maxWeight };
      })
      .filter(d => d.value > 0);
  } else {
    // Hitta kroppsvikt eller mått
    return bioLogs.map(log => ({
      date: log.date,
      value: config.targetType === 'body_weight' 
        ? log.weight 
        : (log.measurements?.[config.measurementKey as string] || 0)
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