
import { db, migrateFromLocalStorage } from './db';
import { UserProfile, Zone, WorkoutSession, Exercise, BiometricLog, GoalTarget, WorkoutRoutine, Goal } from '../types';
import { EXERCISE_DATABASE, INITIAL_ZONES, INITIAL_GOAL_TARGETS } from '../constants';

const DEFAULT_PROFILE: UserProfile = {
  name: "Atlet",
  weight: 80,
  height: 180,
  level: "Medel",
  goal: Goal.HYPERTROPHY,
  injuries: [],
  measurements: {}
};

export const storage = {
  init: async () => {
    // 1. Kör migrering från localStorage om det behövs
    await migrateFromLocalStorage();

    // 2. Seeda standard-data om databasen är tom
    const exCount = await db.exercises.count();
    if (exCount === 0) {
      await db.exercises.bulkAdd(EXERCISE_DATABASE);
      await db.zones.bulkAdd(INITIAL_ZONES);
      await db.goalTargets.bulkAdd(INITIAL_GOAL_TARGETS);
    }
    
    const profileCount = await db.userProfile.count();
    if (profileCount === 0) {
      await db.userProfile.put({ id: 'current', ...DEFAULT_PROFILE });
    }
  },

  // --- USER PROFILE ---
  getUserProfile: async (): Promise<UserProfile> => {
    const profile = await db.userProfile.get('current');
    return profile || { id: 'current', ...DEFAULT_PROFILE };
  },

  setUserProfile: async (profile: UserProfile) => {
    await db.userProfile.put({ ...profile, id: 'current' });
    // Logga vikt automatiskt om den ändras
    const newLog: BiometricLog = {
      id: `log-${Date.now()}`,
      date: new Date().toISOString(),
      weight: profile.weight,
      measurements: profile.measurements
    };
    await db.biometricLogs.put(newLog);
  },

  // --- BASIC GETTERS ---
  getBiometricLogs: async (): Promise<BiometricLog[]> => await db.biometricLogs.toArray(),
  getZones: async (): Promise<Zone[]> => await db.zones.toArray(),
  saveZone: async (zone: Zone) => await db.zones.put(zone),
  deleteZone: async (id: string) => await db.zones.delete(id),

  // --- HISTORY ---
  getHistory: async (): Promise<WorkoutSession[]> => await db.workoutHistory.toArray(),
  saveToHistory: async (session: WorkoutSession) => {
    const completedSession = { 
      ...session, 
      isCompleted: true, 
      date: session.date || new Date().toISOString() 
    };
    await db.workoutHistory.add(completedSession);
  },

  // --- ACTIVE SESSION ---
  getActiveSession: async (): Promise<WorkoutSession | undefined> => await db.activeSession.get('current'),
  setActiveSession: async (session: WorkoutSession | null) => {
    if (session) {
      await db.activeSession.put({ ...session, id: 'current' });
    } else {
      await db.activeSession.clear();
    }
  },

  // --- EXERCISES ---
  getAllExercises: async (): Promise<Exercise[]> => await db.exercises.toArray(),
  getCustomExercises: async (): Promise<Exercise[]> => {
    return await db.exercises.filter(ex => ex.id.startsWith('custom-')).toArray();
  },
  saveExercise: async (exercise: Exercise) => await db.exercises.put(exercise),
  deleteExercise: async (id: string) => await db.exercises.delete(id),

  // --- GOALS & ROUTINES ---
  getGoalTargets: async (): Promise<GoalTarget[]> => await db.goalTargets.toArray(),
  saveGoalTarget: async (target: GoalTarget) => await db.goalTargets.put(target),
  
  getRoutines: async (): Promise<WorkoutRoutine[]> => await db.workoutRoutines.toArray(),
  saveRoutine: async (routine: WorkoutRoutine) => await db.workoutRoutines.put(routine),
  deleteRoutine: async (id: string) => await db.workoutRoutines.delete(id)
};
