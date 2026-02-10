
import React, { useState, useMemo } from 'react';
import { 
  WorkoutSession, 
  Exercise, 
  UserMission,
  UserProfile,
  BiometricLog,
  BodyMeasurements,
  MuscleGroup,
  MovementPattern
} from '../types';
import { 
  Trophy, Target as TargetIcon, TrendingUp, Plus, Zap, Star, Flame, Award, X, Check, Dumbbell,
  Sunrise, Moon, CalendarDays, Link, CalendarCheck, Crown, Weight, Globe, Gem, Timer, Wind,
  RotateCcw, Hourglass, Layers, Compass, MapPin, ArrowUp, ArrowDown, Anchor, Shield, Swords
} from 'lucide-react';
import { calculate1RM } from '../utils/fitness';
import { AddMissionModal } from './AddMissionModal';
import { ALL_MUSCLE_GROUPS } from '../utils/recovery'; // Import ALL_MUSCLE_GROUPS

interface TargetsViewProps {
  userMissions: UserMission[];
  history: WorkoutSession[];
  exercises: Exercise[];
  userProfile: UserProfile;
  biometricLogs: BiometricLog[];
  onAddMission: (mission: UserMission) => void;
  onDeleteMission: (id: string) => void;
}

// Helper function to get muscle groups from a workout session for a given period
const getMuscleGroupsTrainedInPeriod = (
  sessions: WorkoutSession[],
  exercisesMeta: Exercise[],
  days: number,
  now: Date
): Set<MuscleGroup> => {
  const cutoffDate = new Date(now);
  cutoffDate.setDate(now.getDate() - days);

  const trainedMuscles = new Set<MuscleGroup>();

  sessions.filter(s => new Date(s.date) >= cutoffDate).forEach(session => {
    session.exercises.forEach(plannedEx => {
      const exData = exercisesMeta.find(e => e.id === plannedEx.exerciseId);
      if (exData) {
        exData.primaryMuscles.forEach(m => trainedMuscles.add(m));
        exData.secondaryMuscles?.forEach(m => trainedMuscles.add(m));
      }
    });
  });
  return trainedMuscles;
};

// Helper function to calculate progress for a user mission
const getTargetProgress = (
  mission: UserMission,
  history: WorkoutSession[],
  exercises: Exercise[],
  userProfile: UserProfile,
  biometricLogs: BiometricLog[]
): { current: number; total: number; unit: string; percentage: number } => {
  let currentProgress = 0;
  let totalTarget = mission.targetValue;
  let unit = '';

  if (mission.type === 'weight' && mission.exerciseId) {
    unit = 'kg';
    const relevantSets = history.flatMap(s =>
      s.exercises.filter(e => e.exerciseId === mission.exerciseId)
        .flatMap(e => e.sets)
    ).filter(set => set.completed);
    
    // Find max weight lifted for any single set of this exercise
    currentProgress = Math.max(...relevantSets.map(set => set.weight || 0), 0);
  } else if (mission.type === 'frequency') {
    unit = 'pass';
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentWorkoutsCount = new Set(history.filter(s => new Date(s.date) > thirtyDaysAgo).map(s => s.date.split('T')[0])).size; // Count unique days with workouts
    currentProgress = recentWorkoutsCount;
  } else if (mission.type === 'measurement' && mission.measurementKey) {
    const measurementKey = mission.measurementKey;

    if (measurementKey === 'weight') {
      // If mission is for 'weight', check userProfile.weight or latest BiometricLog
      const sortedBiometricLogs = [...biometricLogs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latestWeightLog = sortedBiometricLogs.find(log => log.weight !== undefined);
      currentProgress = latestWeightLog?.weight || userProfile.weight || 0;
    } else {
      // Look at latest biometric log first for other body measurements
      const sortedBiometricLogs = [...biometricLogs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const latestMeasurementLog = sortedBiometricLogs.find(log => log.measurements[measurementKey!]);

      if (latestMeasurementLog) {
        currentProgress = latestMeasurementLog.measurements[measurementKey!] || 0;
      } else if (userProfile.measurements && userProfile.measurements[measurementKey!]) {
        currentProgress = userProfile.measurements[measurementKey!] || 0;
      }
    }

    // Determine unit based on key (simple heuristic)
    if (['neck', 'shoulders', 'chest', 'waist', 'hips', 'bicepsL', 'bicepsR', 'thighL', 'thighR', 'calves'].includes(measurementKey as string)) {
      unit = 'cm';
    } else if (measurementKey === 'bodyFat') {
      unit = '%';
    } else if (measurementKey === 'weight') { 
      unit = 'kg';
    }
  }

  const percentage = totalTarget > 0 ? Math.min(100, Math.round((currentProgress / totalTarget) * 100)) : (currentProgress > 0 ? 100 : 0);

  return { 
    current: currentProgress, 
    total: totalTarget, 
    unit, 
    percentage 
  };
};

export const TargetsView: React.FC<TargetsViewProps> = ({
  userMissions, history, exercises, userProfile, biometricLogs, onAddMission, onDeleteMission
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMission, setEditingMission] = useState<UserMission | null>(null);

  // --- BERÄKNA XP OCH GRUNDSTATISTIK ---
  const stats = useMemo(() => {
    const totalWorkouts = history.length;
    const allExercisesLogged = history.flatMap(s => s.exercises);
    const totalSets = allExercisesLogged.reduce((acc, e) => acc + e.sets.filter(s => s.completed).length, 0);
    
    const totalXP = totalWorkouts * 50 + totalSets * 10;
    const level = Math.floor(totalXP / 500) + 1;
    const xpProgress = (totalXP % 500) / 500 * 100;

    // Calculate streak (consecutive days with a workout)
    const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let currentStreak = 0;
    if (sortedHistory.length > 0) {
      let lastWorkoutDate = new Date(sortedHistory[0].date);
      lastWorkoutDate.setHours(0,0,0,0);
      
      const today = new Date();
      today.setHours(0,0,0,0);
      
      let currentStreakCount = 0;
      let lastConsideredDate: Date | null = null;

      // Iterate backwards to find the most recent streak
      for (let i = sortedHistory.length - 1; i >= 0; i--) {
        const workoutDate = new Date(sortedHistory[i].date);
        workoutDate.setHours(0, 0, 0, 0);

        if (lastConsideredDate === null) {
          // If the latest workout was today or yesterday, start a streak
          const daysAgo = (today.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24);
          if (daysAgo === 0 || daysAgo === 1) { 
            currentStreakCount = 1;
            lastConsideredDate = workoutDate;
          } else { 
            break; // Workout was older, no current streak
          }
        } else {
          const daysDiff = (lastConsideredDate.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24);
          if (daysDiff === 1) { // Consecutive day
            currentStreakCount++;
            lastConsideredDate = workoutDate;
          } else if (daysDiff > 1) { // Gap, streak broken
            break;
          }
          // If daysDiff is 0, it's the same day, continue loop
        }
      }
      currentStreak = currentStreakCount;
    }

    return { totalWorkouts, totalSets, totalXP, level, xpProgress, streak: currentStreak };
  }, [history]);

  // --- LOGIK FÖR DE 30 MILSTOLPARNA ---
  const achievedMilestones = useMemo(() => {
    const now = new Date();
    const allSessions = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const allSets = history.flatMap(s => s.exercises.flatMap(e => e.sets.filter(set => set.completed).map(set => ({ ...set, sessionId: s.id, exerciseId: e.exerciseId, date: s.date }))));
    
    const totalVolume = allSets.reduce((acc, s) => acc + ((s.weight || 0) * (s.reps || 0)), 0);
    const totalDistance = allSets.reduce((acc, s) => acc + (s.distance || 0), 0);
    const totalDurationMin = history.reduce((acc, s) => acc + (s.duration || 0), 0) / 60;
    const uniqueExercises = new Set(allSets.map(s => s.exerciseId));
    const uniqueZones = new Set(history.map(s => s.zoneId));

    // Helper: Hämta pattern för en övning
    const getPattern = (id: string) => exercises.find(e => e.id === id)?.pattern;

    // Milestone 21: Allätaren
    const musclesTrainedLast7Days = getMuscleGroupsTrainedInPeriod(history, exercises, 7, now);
    const allEatableMuscles = new Set<MuscleGroup>(ALL_MUSCLE_GROUPS.filter(m => 
      m !== 'Hela kroppen' && m !== 'Rörlighet' && m !== 'Balans' && m !== 'Greppstyrka' && m !== 'Rotatorcuff' && m !== 'Tibialis'
    )); 
    const achievedAllEater = (musclesTrainedLast7Days.size >= allEatableMuscles.size) && (musclesTrainedLast7Days.size > 0);


    const milestones = [
      { id: 1, name: 'Gryningskrigare', desc: '5 pass före kl 07:00', icon: <Sunrise size={24}/>, achieved: history.filter(s => new Date(s.date).getHours() < 7).length >= 5 },
      { id: 2, name: 'Nattugglan', desc: '5 pass efter kl 21:00', icon: <Moon size={24}/>, achieved: history.filter(s => new Date(s.date).getHours() >= 21).length >= 5 },
      { id: 3, name: 'Helgkrigaren', desc: 'Pass både lördag och söndag', icon: <CalendarDays size={24}/>, achieved: history.some(s => {
          const d = new Date(s.date);
          if (d.getDay() !== 0) return false; // Söndag (0)
          const prevDay = new Date(d); prevDay.setDate(d.getDate() - 1);
          return history.some(hs => new Date(hs.date).toDateString() === prevDay.toDateString() && prevDay.getDay() === 6); // Lördag (6)
        })
      },
      { id: 4, name: 'Obruten Kedja', desc: 'Tränat 4 veckor i rad', icon: <Link size={24}/>, achieved: stats.streak >= 4 }, // Uses the updated streak logic
      { id: 5, name: 'Månadens Maskin', desc: '15 pass på en kalendermånad', icon: <CalendarCheck size={24}/>, achieved: history.filter(s => new Date(s.date).getMonth() === now.getMonth() && new Date(s.date).getFullYear() === now.getFullYear()).length >= 15 },
      { id: 6, name: 'Veteranen', desc: '100 träningspass loggade', icon: <Award size={24}/>, achieved: history.length >= 100 },
      { id: 7, name: 'Legenden', desc: '500 träningspass loggade', icon: <Crown size={24}/>, achieved: history.length >= 500 },
      { id: 8, name: 'Järngreppet', desc: 'Lyft totalt 10 ton', icon: <Weight size={24}/>, achieved: totalVolume >= 10000 },
      { id: 9, name: 'Gudfader av Järn', desc: 'Lyft totalt 100 ton', icon: <Zap size={24}/>, achieved: totalVolume >= 100000 },
      { id: 10, name: 'Planetens Tyngd', desc: 'Lyft totalt 1 000 ton', icon: <Globe size={24}/>, achieved: totalVolume >= 1000000 },
      { id: 11, name: '100-klubben', desc: 'Första setet på 100 kg+', icon: <Trophy size={24}/>, achieved: allSets.some(s => s.weight >= 100) },
      { id: 12, name: 'Titanlyftet', desc: 'Första setet på 200 kg+', icon: <Gem size={24}/>, achieved: allSets.some(s => s.weight >= 200) },
      { id: 13, name: 'Bänkpress-beast', desc: '50 set Bänkpress', icon: <Dumbbell size={24}/>, achieved: allSets.filter(s => exercises.find(ex => ex.id === s.exerciseId)?.name.toLowerCase().includes('bänkpress')).length >= 50 },
      { id: 14, name: 'Knäböjs-kung', desc: '50 set Knäböj', icon: <Dumbbell size={24}/>, achieved: allSets.filter(s => exercises.find(ex => ex.id === s.exerciseId)?.name.toLowerCase().includes('knäböj')).length >= 50 },
      { id: 15, name: 'Marklyfts-monster', desc: '50 set Marklyft', icon: <Dumbbell size={24}/>, achieved: allSets.filter(s => exercises.find(ex => ex.id === s.exerciseId)?.name.toLowerCase().includes('marklyft')).length >= 50 },
      { id: 16, name: 'Maratonlöparen', desc: 'Sprungit 42.2 km totalt', icon: <Timer size={24}/>, achieved: totalDistance >= 42200 },
      { id: 17, name: 'Vindsnabba Steg', desc: '10 loggade löppass', icon: <Wind size={24}/>, achieved: history.filter(s => s.exercises.some(e => exercises.find(ex => ex.id === e.exerciseId)?.pattern === MovementPattern.CARDIO)).length >= 10 },
      { id: 18, name: 'Rep-maskinen', desc: 'Gjort ett set med 30+ reps', icon: <RotateCcw size={24}/>, achieved: allSets.some(s => s.reps >= 30) },
      { id: 19, name: 'Volym-frossa', desc: 'Ett pass med 10 ton+ volym', icon: <TrendingUp size={24}/>, achieved: history.some(s => s.exercises.flatMap(e => e.sets).reduce((sum, set) => sum + (set.weight * set.reps), 0) >= 10000) },
      { id: 20, name: 'Tidsresenären', desc: '100 timmar total träningstid', icon: <Hourglass size={24}/>, achieved: totalDurationMin >= 6000 },
      { id: 21, name: 'Allätaren', desc: 'Tränat alla viktiga muskelgrupper på 7 dagar', icon: <Layers size={24}/>, achieved: achievedAllEater }, 
      { id: 22, name: 'Upptäcktsresande', desc: 'Testat 30 unika övningar', icon: <Compass size={24}/>, achieved: uniqueExercises.size >= 30 },
      { id: 23, name: 'Zon-vandrare', desc: 'Tränat på 5 olika gym/platser', icon: <MapPin size={24}/>, achieved: uniqueZones.size >= 5 },
      { id: 24, name: 'Pattern Master (Push)', desc: '100 set press-övningar', icon: <ArrowUp size={24}/>, achieved: allSets.filter(s => getPattern(s.exerciseId)?.includes('Push')).length >= 100 },
      { id: 25, name: 'Pattern Master (Pull)', desc: '100 set drag-övningar', icon: <ArrowDown size={24}/>, achieved: allSets.filter(s => getPattern(s.exerciseId)?.includes('Pull')).length >= 100 },
      { id: 26, name: 'Leg Day Hero', desc: '100 set ben-övningar', icon: <Anchor size={24}/>, achieved: allSets.filter(s => getPattern(s.exerciseId) === MovementPattern.SQUAT || getPattern(s.exerciseId) === MovementPattern.LUNGE).length >= 100 },
      { id: 27, name: 'Ondskefull Core', desc: '100 set bålträning', icon: <Shield size={24}/>, achieved: allSets.filter(s => getPattern(s.exerciseId) === MovementPattern.CORE).length >= 100 },
      { id: 28, name: 'Intensitets-missbrukare', desc: '20 set med RPE 10', icon: <Flame size={24}/>, achieved: allSets.filter(s => s.rpe === 10).length >= 20 },
      { id: 29, name: 'Blixten', desc: 'Pass (5+ övn) under 30 min', icon: <Zap size={24}/>, achieved: history.some(s => s.exercises.length >= 5 && s.duration && s.duration < 1800) },
      { id: 30, name: 'Gladiatordoppet', desc: 'Pass längre än 120 minuter', icon: <Swords size={24}/>, achieved: history.some(s => s.duration && s.duration > 7200) },
    ];

    return milestones.filter(m => m.achieved);
  }, [history, exercises, stats.streak, userProfile]);

  return (
    <div className="pb-32 space-y-8 animate-in fade-in px-4 pt-8">
      {/* --- LEVEL CARD --- */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1a1721] to-[#25212d] rounded-[32px] p-6 border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy size={120} /></div>
        
        <div className="relative z-10 flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-accent-pink flex items-center justify-center shadow-[0_0_20px_rgba(255,45,85,0.4)]">
              <span className="text-3xl font-black italic text-white leading-none">{stats.level}</span>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-white text-black text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest">
              LVL
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex justify-between items-end">
              <h3 className="text-xl font-black italic uppercase text-white leading-none">Warrior Status</h3>
              <span className="text-[10px] font-black text-text-dim uppercase tracking-widest">
                {Math.round(stats.totalXP % 500)} / 500 XP
              </span>
            </div>
            <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[2px]">
              <div 
                className="h-full bg-accent-pink rounded-full transition-all duration-1000"
                style={{ width: `${stats.xpProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/5">
          <div className="text-center">
            <p className="text-[10px] font-black text-text-dim uppercase tracking-widest mb-1">Pass</p>
            <p className="text-xl font-black text-white italic">{stats.totalWorkouts}</p>
          </div>
          <div className="text-center border-x border-white/5">
            <p className="text-[10px] font-black text-text-dim uppercase tracking-widest mb-1">Total Set</p>
            <p className="text-xl font-black text-white italic">{stats.totalSets}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black text-text-dim uppercase tracking-widest mb-1">Streak</p>
            <div className="flex items-center justify-center gap-1">
              <Flame size={16} className="text-orange-500" />
              <p className="text-xl font-black text-white italic">{stats.streak}</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- AKTIVA UPPDRAG (Dina manuella mål) --- */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <div className="flex items-center gap-2">
            <TargetIcon size={18} className="text-accent-blue" />
            <h3 className="text-xs font-black uppercase text-white tracking-widest">Aktiva Uppdrag</h3>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="p-2 bg-accent-blue/10 text-accent-blue rounded-xl hover:bg-accent-blue/20 transition-colors"
          >
            <Plus size={20} />
          </button>
        </div>
        <div className="grid gap-4">
          {userMissions.length === 0 ? (
            <div className="py-8 text-center bg-white/5 rounded-[32px] border border-dashed border-white/10 opacity-50">
               <p className="text-[10px] font-black uppercase tracking-widest">Inga aktiva uppdrag</p>
            </div>
          ) : (
            userMissions.map(mission => {
              const { current, total, unit, percentage } = getTargetProgress(mission, history, exercises, userProfile, biometricLogs);
              const exercise = exercises.find(e => e.id === mission.exerciseId);

              return (
                <div 
                  key={mission.id} 
                  onClick={() => setEditingMission(mission)} // Make card clickable for editing
                  className={`group bg-[#1a1721] border rounded-[32px] p-5 active:scale-[0.98] transition-all cursor-pointer ${mission.isCompleted ? 'border-green-500/30' : 'border-white/5 hover:border-accent-blue/30'}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${mission.isCompleted ? 'bg-green-500/20 text-green-500 border-green-500/30' : 'bg-white/5 border-white/5'}`}>
                        {mission.isCompleted ? <Check size={24} className="text-green-500" /> : <TargetIcon size={24} className="text-text-dim" />}
                      </div>
                      <div>
                        <h4 className="text-base font-black italic uppercase text-white leading-tight">
                          {mission.name}
                        </h4>
                        <p className="text-[10px] font-bold uppercase tracking-widest mt-1 ${mission.isCompleted ? 'text-green-500/70' : 'text-accent-blue'}">
                          Mål: {mission.targetValue} {unit}
                          {exercise && ` • ${exercise.name}`}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteMission(mission.id); }} // Prevent modal from opening
                      className="p-2 text-text-dim opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                      <span className="text-text-dim">
                        {current} {unit} / {total} {unit}
                      </span>
                      <span className="${mission.isCompleted ? 'text-green-500' : 'text-accent-blue'}">
                        {percentage}% Slutfört
                      </span>
                    </div>
                    <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                      <div className={`h-full ${mission.isCompleted ? 'bg-green-500' : 'bg-accent-blue'} transition-all duration-1000`} style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* --- MILSTOLPAR (Dina uppnådda prestationer) --- */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <Star size={18} className="text-yellow-500" />
          <h3 className="text-xs font-black uppercase text-white tracking-widest">Uppnådda Prestationer ({achievedMilestones.length})</h3>
        </div>
        
        {achievedMilestones.length === 0 ? (
          <div className="py-12 text-center bg-white/5 rounded-[32px] border border-dashed border-white/10 opacity-30">
            <Swords size={40} className="mx-auto mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">Ge dig ut i strid för att<br/>låsa upp din första prestation</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {achievedMilestones.map(m => (
              <div key={m.id} className="bg-[#1a1721] p-4 rounded-[28px] border border-yellow-500/20 flex items-center gap-4 animate-in zoom-in-95 shadow-lg shadow-yellow-500/5">
                <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center text-yellow-500 border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                  {m.icon}
                </div>
                <div>
                  <h4 className="text-sm font-black text-white uppercase italic leading-none mb-1">{m.name}</h4>
                  <p className="text-[9px] text-text-dim uppercase font-bold tracking-tight">{m.desc}</p>
                </div>
                <div className="ml-auto">
                  <div className="bg-yellow-500 p-1 rounded-full"><Check size={12} strokeWidth={4} className="text-black" /></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* MODAL FÖR NYTT ELLER REDIGERA UPPDRAG */}
      {(showAddModal || editingMission) && (
        <AddMissionModal
          allExercises={exercises}
          userProfile={userProfile}
          initialMission={editingMission || undefined} // Pass initialMission if editing
          onSave={(mission) => {
            onAddMission(mission); // This handles both add and update as we replace by ID
            setShowAddModal(false);
            setEditingMission(null);
          }}
          onClose={() => {
            setShowAddModal(false);
            setEditingMission(null);
          }}
        />
      )}
    </div>
  );
};