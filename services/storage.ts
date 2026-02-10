

import { db, migrateFromLocalStorage } from './db';
import { UserProfile, Zone, Exercise, WorkoutSession, BiometricLog, GoalTarget, WorkoutRoutine, Goal, ScheduledActivity, RecurringPlan, UserMission } from '../types';
import { DEFAULT_PROFILE } from '../constants';

export const storage = {
  init: async () => {
    await migrateFromLocalStorage();
    // Database population is now handled by the on('populate') event in db.ts.
    // This function's only responsibility is now migration from old storage.
    // Any DB operation will automatically open and populate it if needed.
  },

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

  getBiometricLogs: async (): Promise<BiometricLog[]> => await db.biometricLogs.toArray(),
  getZones: async (): Promise<Zone[]> => await db.zones.toArray(),
  saveZone: async (zone: Zone) => await db.zones.put(zone),
  deleteZone: async (id: string) => await db.zones.delete(id),

  getHistory: async (): Promise<WorkoutSession[]> => await db.workoutHistory.toArray(),
  saveToHistory: async (session: WorkoutSession) => {
    const completedSession = { 
      ...session, 
      isCompleted: true, 
      date: session.date || new Date().toISOString() 
    };
    await db.workoutHistory.put(completedSession);
    
    // Check if we can mark a scheduled activity as completed
    const dateStr = completedSession.date.split('T')[0];
    const scheduled = await db.scheduledActivities.where('date').equals(dateStr).and(a => !a.isCompleted).first();
    if (scheduled) {
      await db.scheduledActivities.update(scheduled.id, { isCompleted: true, linkedSessionId: completedSession.id });
    }
  },

  deleteWorkoutFromHistory: async (sessionId: string) => {
    await db.workoutHistory.delete(sessionId);
  },

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

  getAllExercises: async (): Promise<Exercise[]> => await db.exercises.toArray(),
  saveExercise: async (exercise: Exercise) => await db.exercises.put(exercise),
  deleteExercise: async (id: string) => {
    const ex = await db.exercises.get(id);
    if (ex?.imageId) {
      await storage.deleteImage(ex.imageId);
    }
    await db.exercises.delete(id);
  },

  getGoalTargets: async (): Promise<GoalTarget[]> => await db.goalTargets.toArray(),
  saveGoalTarget: async (target: GoalTarget) => await db.goalTargets.put(target),
  
  getRoutines: async (): Promise<WorkoutRoutine[]> => await db.workoutRoutines.toArray(),
  saveRoutine: async (routine: WorkoutRoutine) => await db.workoutRoutines.put(routine),
  deleteRoutine: async (id: string) => await db.workoutRoutines.delete(id),

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
  },

  // --- PLANNING METHODS ---
  getScheduledActivities: async (): Promise<ScheduledActivity[]> => {
    await storage.generateRecurringActivities();
    return await db.scheduledActivities.toArray();
  },

  addScheduledActivity: async (activity: ScheduledActivity) => {
    await db.scheduledActivities.put(activity);
  },

  deleteScheduledActivity: async (id: string) => {
    await db.scheduledActivities.delete(id);
  },

  toggleScheduledActivity: async (id: string) => {
    const act = await db.scheduledActivities.get(id);
    if (act) {
      await db.scheduledActivities.update(id, { isCompleted: !act.isCompleted });
    }
  },

  getRecurringPlans: async (): Promise<RecurringPlan[]> => await db.recurringPlans.toArray(),

  addRecurringPlan: async (plan: RecurringPlan) => {
    await db.recurringPlans.put(plan);
    await storage.generateRecurringActivities();
  },

  deleteRecurringPlan: async (id: string) => {
    await db.recurringPlans.delete(id);
    const today = new Date().toISOString().split('T')[0];
    // Delete future uncompleted activities from this plan
    await db.scheduledActivities
      .where('recurrenceId').equals(id)
      .filter(act => act.date >= today && !act.isCompleted)
      .delete();
  },

  generateRecurringActivities: async () => {
    const plans = await db.recurringPlans.toArray();
    const today = new Date();
    today.setHours(0,0,0,0);
    
    const generateUntil = new Date(today);
    generateUntil.setDate(today.getDate() + 30); // Generate 1 month ahead

    for (const plan of plans) {
      let loopDate = new Date(Math.max(new Date(plan.startDate).getTime(), today.getTime()));
      
      while (loopDate <= generateUntil) {
        if (plan.endDate && new Date(plan.endDate) < loopDate) break;

        if (plan.daysOfWeek.includes(loopDate.getDay())) {
          const dateStr = loopDate.toISOString().split('T')[0];
          
          const exists = await db.scheduledActivities
            .where({ recurrenceId: plan.id, date: dateStr })
            .first();

          if (!exists) {
            await db.scheduledActivities.put({
              id: `gen-${plan.id}-${dateStr}`,
              date: dateStr,
              type: plan.type,
              title: plan.title,
              isCompleted: false,
              recurrenceId: plan.id,
              exercises: plan.exercises
            });
          }
        }
        loopDate.setDate(loopDate.getDate() + 1);
      }
    }
  },

  // --- NEW: USER MISSIONS (Gamified Goals) ---
  getUserMissions: async (): Promise<UserMission[]> => await db.userMissions.toArray(),
  addUserMission: async (mission: UserMission) => await db.userMissions.put(mission),
  updateUserMission: async (mission: UserMission) => {
    await db.userMissions.update(mission.id, mission);
  },
  deleteUserMission: async (id: string) => await db.userMissions.delete(id),
};