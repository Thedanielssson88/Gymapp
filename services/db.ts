import Dexie, { Table } from 'dexie';
import { UserProfile, Zone, Exercise, WorkoutSession, BiometricLog, GoalTarget, WorkoutRoutine } from '../types';

export interface StoredImage {
  id: string;
  blob: Blob;
  mimeType: string;
  date: string;
}

export class GymDatabase extends Dexie {
  userProfile!: Table<UserProfile, string>; 
  zones!: Table<Zone, string>;
  exercises!: Table<Exercise, string>;
  workoutHistory!: Table<WorkoutSession, string>;
  biometricLogs!: Table<BiometricLog, string>;
  activeSession!: Table<WorkoutSession, string>;
  goalTargets!: Table<GoalTarget, string>;
  workoutRoutines!: Table<WorkoutRoutine, string>;
  images!: Table<StoredImage, string>;

  constructor() {
    super('MorphFitDB');
    
    // Increment version to 2 to add the images table
    (this as Dexie).version(2).stores({
      userProfile: 'id',
      zones: 'id',
      exercises: 'id, name, muscleGroups',
      workoutHistory: 'id, date',
      biometricLogs: 'id, date',
      activeSession: 'id',
      goalTargets: 'id',
      workoutRoutines: 'id',
      images: 'id'
    });
  }
}

export const db = new GymDatabase();

// --- MIGRERINGS-SKRIPT ---
export const migrateFromLocalStorage = async () => {
  const ALREADY_MIGRATED_KEY = 'morphfit_db_migrated';
  if (localStorage.getItem(ALREADY_MIGRATED_KEY)) return;

  console.log("Startar migrering till IndexedDB...");

  const tables = [
    { key: 'db_table_user_profile', table: db.userProfile },
    { key: 'db_table_zones', table: db.zones },
    { key: 'db_table_exercises', table: db.exercises },
    { key: 'db_table_workout_history', table: db.workoutHistory },
    { key: 'db_table_biometric_logs', table: db.biometricLogs },
    { key: 'db_table_active_session', table: db.activeSession },
    { key: 'db_table_goal_targets', table: db.goalTargets },
    { key: 'db_table_workout_routines', table: db.workoutRoutines },
  ];

  try {
    await (db as Dexie).transaction('rw', (db as Dexie).tables, async () => {
      for (const { key, table } of tables) {
        const raw = localStorage.getItem(key);
        if (raw) {
          try {
            const data = JSON.parse(raw);
            if (Array.isArray(data) && data.length > 0) {
              await table.bulkPut(data);
            } else if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
              await table.put(data);
            }
          } catch (e) {
            console.error(`Fel vid migrering av ${key}`, e);
          }
        }
      }
    });

    localStorage.setItem(ALREADY_MIGRATED_KEY, 'true');
    console.log("Migrering klar!");
  } catch(e) {
    console.error("Allvarligt fel under databasmigrering: ", e);
  }
};