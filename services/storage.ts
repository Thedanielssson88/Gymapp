
import { UserProfile, Zone, WorkoutSession, Goal, Equipment, Exercise, BiometricLog } from '../types';
import { INITIAL_ZONES, EXERCISE_DATABASE } from '../constants';

const KEYS = {
  USER_PROFILE: 'morphfit_user_profile',
  ZONES: 'morphfit_zones',
  WORKOUT_HISTORY: 'morphfit_workout_history',
  ACTIVE_SESSION: 'morphfit_active_session',
  CUSTOM_EXERCISES: 'morphfit_custom_exercises',
  BIOMETRIC_LOGS: 'morphfit_biometric_logs'
};

const DEFAULT_PROFILE: UserProfile = {
  name: "Atlet",
  weight: 80,
  height: 180,
  level: "Medel",
  goal: Goal.HYPERTROPHY,
  injuries: [],
  measurements: {
    chest: 0,
    waist: 0,
    bicepsL: 0,
    bicepsR: 0,
    thighL: 0,
    thighR: 0
  }
};

export const storage = {
  getUserProfile: (): UserProfile => {
    const data = localStorage.getItem(KEYS.USER_PROFILE);
    if (!data) return DEFAULT_PROFILE;
    const parsed = JSON.parse(data);
    return { ...DEFAULT_PROFILE, ...parsed };
  },
  setUserProfile: (profile: UserProfile) => {
    localStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
    // Also log this change
    const logs = storage.getBiometricLogs();
    logs.push({
      date: new Date().toISOString(),
      weight: profile.weight,
      measurements: profile.measurements
    });
    localStorage.setItem(KEYS.BIOMETRIC_LOGS, JSON.stringify(logs.slice(-50)));
  },

  getBiometricLogs: (): BiometricLog[] => {
    const data = localStorage.getItem(KEYS.BIOMETRIC_LOGS);
    return data ? JSON.parse(data) : [];
  },

  getZones: (): Zone[] => {
    const data = localStorage.getItem(KEYS.ZONES);
    return data ? JSON.parse(data) : INITIAL_ZONES;
  },
  saveZones: (zones: Zone[]) => {
    localStorage.setItem(KEYS.ZONES, JSON.stringify(zones));
  },
  
  getHistory: (): WorkoutSession[] => {
    const data = localStorage.getItem(KEYS.WORKOUT_HISTORY);
    return data ? JSON.parse(data) : [];
  },
  saveToHistory: (session: WorkoutSession) => {
    const history = storage.getHistory();
    history.push({ 
      ...session, 
      isCompleted: true, 
      date: session.date || new Date().toISOString() 
    });
    localStorage.setItem(KEYS.WORKOUT_HISTORY, JSON.stringify(history));
  },

  getActiveSession: (): WorkoutSession | null => {
    const data = localStorage.getItem(KEYS.ACTIVE_SESSION);
    return data ? JSON.parse(data) : null;
  },
  setActiveSession: (session: WorkoutSession | null) => {
    if (session) {
      localStorage.setItem(KEYS.ACTIVE_SESSION, JSON.stringify(session));
    } else {
      localStorage.removeItem(KEYS.ACTIVE_SESSION);
    }
  },

  getCustomExercises: (): Exercise[] => {
    const data = localStorage.getItem(KEYS.CUSTOM_EXERCISES);
    return data ? JSON.parse(data) : [];
  },
  saveExercise: (exercise: Exercise) => {
    const custom = storage.getCustomExercises();
    const index = custom.findIndex(ex => ex.id === exercise.id);
    if (index > -1) {
      custom[index] = exercise;
    } else {
      custom.push(exercise);
    }
    localStorage.setItem(KEYS.CUSTOM_EXERCISES, JSON.stringify(custom));
  },
  deleteExercise: (id: string) => {
    const custom = storage.getCustomExercises();
    const filtered = custom.filter(ex => ex.id !== id);
    localStorage.setItem(KEYS.CUSTOM_EXERCISES, JSON.stringify(filtered));
  },
  getAllExercises: (): Exercise[] => {
    const custom = storage.getCustomExercises();
    const exerciseMap = new Map<string, Exercise>();
    EXERCISE_DATABASE.forEach(ex => exerciseMap.set(ex.id, ex));
    custom.forEach(ex => exerciseMap.set(ex.id, ex));
    return Array.from(exerciseMap.values());
  }
};
