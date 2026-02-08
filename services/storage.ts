
import { UserProfile, Zone, WorkoutSession, Goal, Equipment, Exercise, BiometricLog, GoalTarget, WorkoutRoutine } from '../types';
import { INITIAL_ZONES, EXERCISE_DATABASE, INITIAL_GOAL_TARGETS } from '../constants';

class SQLiteShim {
  private storage: Storage = window.localStorage;

  execSync(sql: string) {
    if (sql.includes('CREATE TABLE')) {
      const tableName = sql.split('TABLE IF NOT EXISTS ')[1].split(' ')[0];
      if (!this.storage.getItem(`db_table_${tableName}`)) {
        this.storage.setItem(`db_table_${tableName}`, JSON.stringify([]));
      }
    }
  }

  runSync(sql: string, params: any[] = []) {
    const tableName = this.extractTable(sql);
    const data = this.getTableData(tableName);

    if (sql.startsWith('INSERT') || sql.startsWith('REPLACE')) {
      const newItem = params[0];
      const id = newItem.id;
      const index = data.findIndex((item: any) => item.id === id);
      
      if (index > -1) data[index] = newItem;
      else data.push(newItem);
      
      this.setTableData(tableName, data);
    } else if (sql.startsWith('DELETE')) {
      const id = params[0];
      const filtered = data.filter((item: any) => item.id !== id);
      this.setTableData(tableName, filtered);
    }
  }

  getFirstSync(sql: string, params: any[] = []): any {
    const tableName = this.extractTable(sql);
    const data = this.getTableData(tableName);
    if (sql.includes('WHERE id =')) {
      return data.find((item: any) => item.id === params[0]);
    }
    return data[0];
  }

  getAllSync(sql: string, params: any[] = []): any[] {
    const tableName = this.extractTable(sql);
    let data = this.getTableData(tableName);
    if (sql.includes('id LIKE "custom%"')) {
      return data.filter((ex: any) => ex.id.startsWith('custom-'));
    }
    return data;
  }

  private extractTable(sql: string): string {
    const matches = sql.match(/(?:FROM|INTO|UPDATE|TABLE)\s+([a-zA-Z_]+)/i);
    return matches ? matches[1] : '';
  }

  private getTableData(name: string) {
    const raw = this.storage.getItem(`db_table_${name}`);
    return raw ? JSON.parse(raw) : [];
  }

  private setTableData(name: string, data: any) {
    this.storage.setItem(`db_table_${name}`, JSON.stringify(data));
  }
}

const db = new SQLiteShim();

const DEFAULT_PROFILE: UserProfile = {
  name: "Atlet",
  weight: 80,
  height: 180,
  level: "Medel",
  goal: Goal.HYPERTROPHY,
  injuries: [],
  measurements: { chest: 0, waist: 0, bicepsL: 0, bicepsR: 0, thighL: 0, thighR: 0 }
};

export const storage = {
  init: async () => {
    db.execSync('CREATE TABLE IF NOT EXISTS user_profile (id TEXT PRIMARY KEY, data TEXT)');
    db.execSync('CREATE TABLE IF NOT EXISTS zones (id TEXT PRIMARY KEY, data TEXT)');
    db.execSync('CREATE TABLE IF NOT EXISTS exercises (id TEXT PRIMARY KEY, data TEXT)');
    db.execSync('CREATE TABLE IF NOT EXISTS workout_history (id TEXT PRIMARY KEY, data TEXT)');
    db.execSync('CREATE TABLE IF NOT EXISTS biometric_logs (id TEXT PRIMARY KEY, data TEXT)');
    db.execSync('CREATE TABLE IF NOT EXISTS active_session (id TEXT PRIMARY KEY, data TEXT)');
    db.execSync('CREATE TABLE IF NOT EXISTS goal_targets (id TEXT PRIMARY KEY, data TEXT)');
    db.execSync('CREATE TABLE IF NOT EXISTS workout_routines (id TEXT PRIMARY KEY, data TEXT)');

    const existing = db.getAllSync('SELECT * FROM exercises');
    if (existing.length === 0) {
      EXERCISE_DATABASE.forEach(ex => db.runSync('INSERT INTO exercises (id, data) VALUES (?, ?)', [ex]));
      INITIAL_ZONES.forEach(zone => db.runSync('INSERT INTO zones (id, data) VALUES (?, ?)', [zone]));
      INITIAL_GOAL_TARGETS.forEach(target => db.runSync('INSERT INTO goal_targets (id, data) VALUES (?, ?)', [target]));
    }
    
    if (!db.getFirstSync('SELECT * FROM user_profile')) {
      db.runSync('INSERT INTO user_profile (id, data) VALUES (?, ?)', [{ id: 'current', ...DEFAULT_PROFILE }]);
    }
  },

  getUserProfile: (): UserProfile => {
    const row = db.getFirstSync('SELECT * FROM user_profile WHERE id = ?', ['current']);
    return row || DEFAULT_PROFILE;
  },

  setUserProfile: (profile: UserProfile) => {
    db.runSync('REPLACE INTO user_profile (id, data) VALUES (?, ?)', [{ id: 'current', ...profile }]);
    const logs = storage.getBiometricLogs();
    const newLog = {
      date: new Date().toISOString(),
      weight: profile.weight,
      measurements: profile.measurements
    };
    db.runSync('INSERT INTO biometric_logs (id, data) VALUES (?, ?)', [{ id: `log-${Date.now()}`, ...newLog }]);
  },

  getBiometricLogs: (): BiometricLog[] => db.getAllSync('SELECT * FROM biometric_logs'),
  getZones: (): Zone[] => db.getAllSync('SELECT * FROM zones'),
  saveZones: (zones: Zone[]) => zones.forEach(z => db.runSync('REPLACE INTO zones (id, data) VALUES (?, ?)', [z])),
  getHistory: (): WorkoutSession[] => db.getAllSync('SELECT * FROM workout_history'),
  saveToHistory: (session: WorkoutSession) => {
    db.runSync('INSERT INTO workout_history (id, data) VALUES (?, ?)', [{ ...session, isCompleted: true, date: session.date || new Date().toISOString() }]);
  },
  getActiveSession: (): WorkoutSession | null => db.getFirstSync('SELECT * FROM active_session WHERE id = ?', ['current']),
  setActiveSession: (session: WorkoutSession | null) => {
    if (session) db.runSync('REPLACE INTO active_session (id, data) VALUES (?, ?)', [{ id: 'current', ...session }]);
    else db.runSync('DELETE FROM active_session WHERE id = ?', ['current']);
  },
  getAllExercises: (): Exercise[] => db.getAllSync('SELECT * FROM exercises'),
  getCustomExercises: (): Exercise[] => db.getAllSync('SELECT * FROM exercises WHERE id LIKE "custom%"'),
  saveExercise: (exercise: Exercise) => db.runSync('REPLACE INTO exercises (id, data) VALUES (?, ?)', [exercise]),
  deleteExercise: (id: string) => db.runSync('DELETE FROM exercises WHERE id = ?', [id]),
  getGoalTargets: (): GoalTarget[] => db.getAllSync('SELECT * FROM goal_targets'),
  saveGoalTarget: (target: GoalTarget) => db.runSync('REPLACE INTO goal_targets (id, data) VALUES (?, ?)', [target]),
  
  // Routine Management
  getRoutines: (): WorkoutRoutine[] => db.getAllSync('SELECT * FROM workout_routines'),
  saveRoutine: (routine: WorkoutRoutine) => db.runSync('REPLACE INTO workout_routines (id, data) VALUES (?, ?)', [routine]),
  deleteRoutine: (id: string) => db.runSync('DELETE FROM workout_routines WHERE id = ?', [id])
};
