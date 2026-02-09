



// FIX: Switched to a named import for Dexie to resolve issues with type resolution.
import { Dexie, type Table } from 'dexie';
import { 
  UserProfile, Zone, Exercise, WorkoutSession, BiometricLog, 
  GoalTarget, WorkoutRoutine, ScheduledActivity, RecurringPlan 
} from '../types';

export interface StoredImage {
  id: string;
  blob: Blob;
  mimeType: string;
  date: string;
}

// GymDatabase extends Dexie to provide a typed interface to the IndexedDB.
// Always use named imports for Dexie to ensure proper type resolution in modern TypeScript environments.
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
  scheduledActivities!: Table<ScheduledActivity, string>;
  recurringPlans!: Table<RecurringPlan, string>;

  constructor() {
    super('MorphFitDB');
    
    // Schema definition for the Dexie database. The version number must be incremented for migrations.
    this.version(4).stores({
      userProfile: 'id',
      zones: 'id',
      exercises: 'id, name, muscleGroups',
      workoutHistory: 'id, date',
      biometricLogs: 'id, date',
      activeSession: 'id',
      goalTargets: 'id',
      workoutRoutines: 'id',
      images: 'id',
      scheduledActivities: 'id, date, type, recurrenceId',
      recurringPlans: 'id'
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
    // Perform migration within a transaction for data integrity.
    await db.transaction('rw', [db.userProfile, db.zones, db.exercises, db.workoutHistory, db.biometricLogs, db.activeSession, db.goalTargets, db.workoutRoutines], async () => {
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