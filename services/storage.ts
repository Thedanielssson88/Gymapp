import { db, migrateFromLocalStorage } from './db';
import { UserProfile, Zone, Exercise, WorkoutSession, BiometricLog, GoalTarget, WorkoutRoutine, Goal } from '../types';
import { EXERCISE_DATABASE, INITIAL_GOAL_TARGETS, INITIAL_ZONES } from '../constants';

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

    // 2. Uppdatera övningsdatabasen intelligent.
    const existingExercises = await db.exercises.toArray();
    const existingMap = new Map<string, Exercise>(existingExercises.map(e => [e.id, e]));

    const updates: Exercise[] = [];
    for (const coreEx of EXERCISE_DATABASE) {
      const existing = existingMap.get(coreEx.id);
      
      if (!existing || !existing.userModified) {
        updates.push(coreEx);
      }
    }

    if (updates.length > 0) {
      await db.exercises.bulkPut(updates);
    }
    
    // 3. Seeda övrig data
    const zoneCount = await db.zones.count();
    if (zoneCount === 0) {
      await db.zones.bulkAdd(INITIAL_ZONES);
    }
    
    const targetCount = await db.goalTargets.count();
    if (targetCount === 0) {
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
    await db.workoutHistory.put(completedSession);
  },

  // --- ACTIVE SESSION ---
  getActiveSession: async (): Promise<WorkoutSession | undefined> => {
    const sess = await db.activeSession.get('current');
    if (sess) {
      return { ...sess, id: (sess as any).originalId || sess.id };
    }
    return undefined;
  },
  setActiveSession: async (session: WorkoutSession | null) => {
    if (session) {
      const sessionToStore = { 
        ...session, 
        originalId: session.id, 
        id: 'current' 
      };
      await db.activeSession.put(sessionToStore as any);
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
  deleteExercise: async (id: string) => {
    const ex = await db.exercises.get(id);
    if (ex?.imageId) {
      await storage.deleteImage(ex.imageId);
    }
    await db.exercises.delete(id);
  },

  // --- GOALS & ROUTINES ---
  getGoalTargets: async (): Promise<GoalTarget[]> => await db.goalTargets.toArray(),
  saveGoalTarget: async (target: GoalTarget) => await db.goalTargets.put(target),
  
  getRoutines: async (): Promise<WorkoutRoutine[]> => await db.workoutRoutines.toArray(),
  saveRoutine: async (routine: WorkoutRoutine) => await db.workoutRoutines.put(routine),
  deleteRoutine: async (id: string) => await db.workoutRoutines.delete(id),

  // --- BILDHANTERING ---
  saveImage: async (blob: Blob): Promise<string> => {
    const id = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await db.images.put({
      id,
      blob,
      mimeType: blob.type,
      date: new Date().toISOString()
    });
    return id;
  },

  getImage: async (id: string): Promise<string | null> => {
    const imgData = await db.images.get(id);
    if (!imgData) return null;
    return URL.createObjectURL(imgData.blob);
  },
  
  deleteImage: async (id: string) => {
    await db.images.delete(id);
  }
};