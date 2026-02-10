
import React, { useState, useMemo } from 'react';
import { 
  WorkoutSession, 
  Exercise, 
  UserMission, // Use the new UserMission type
  UserProfile,
  BiometricLog, // Pass biometric logs for measurement missions
  BodyMeasurements,
  MuscleGroup
} from '../types';
import { 
  Trophy, 
  Target as TargetIcon, 
  TrendingUp, 
  Plus, 
  Zap, 
  Star, 
  Flame, 
  ChevronRight,
  Award,
  X,
  Check,
  Dumbbell
} from 'lucide-react';
import { calculate1RM } from '../utils/fitness';
import { ALL_MUSCLE_GROUPS } from '../utils/recovery';
import { AddMissionModal } from './AddMissionModal'; // Import the new modal component

interface TargetsViewProps {
  userMissions: UserMission[]; // Changed from 'targets' to 'userMissions'
  history: WorkoutSession[];
  exercises: Exercise[];
  userProfile: UserProfile; // Pass user profile for current measurements
  biometricLogs: BiometricLog[]; // Pass biometric logs for historical measurements
  onAddMission: (mission: UserMission) => void;
  onDeleteMission: (id: string) => void;
}

export const TargetsView: React.FC<TargetsViewProps> = ({
  userMissions,
  history,
  exercises,
  userProfile,
  biometricLogs,
  onAddMission,
  onDeleteMission
}) => {
  const [showAddModal, setShowAddModal] = useState(false);

  // --- GAMIFICATION LOGIK: Beräkna XP baserat på historik ---
  const stats = useMemo(() => {
    const totalWorkouts = history.length;
    const totalSets = history.reduce((acc, s) => acc + s.exercises.reduce((a, e) => a + e.sets.length, 0), 0);
    // Nivå-logik: 500 XP per nivå
    const totalXP = totalWorkouts * 50 + totalSets * 10;
    const level = Math.floor(totalXP / 500) + 1;
    const currentLevelXP = totalXP % 500;
    const xpProgress = (currentLevelXP / 500) * 100;

    // Calculate streak (consecutive days with a workout)
    const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let currentStreak = 0;
    if (sortedHistory.length > 0) {
      let lastWorkoutDate = new Date(sortedHistory[0].date);
      lastWorkoutDate.setHours(0,0,0,0);
      
      // If the latest workout was today, count it
      const today = new Date();
      today.setHours(0,0,0,0);
      if (sortedHistory.some(s => new Date(s.date).toDateString() === today.toDateString())) {
        currentStreak = 1;
      }

      for (let i = sortedHistory.length - 1; i >= 0; i--) {
        const workoutDate = new Date(sortedHistory[i].date);
        workoutDate.setHours(0,0,0,0);

        let nextExpectedDate = new Date(workoutDate);
        nextExpectedDate.setDate(workoutDate.getDate() + 1);

        const hasNextWorkout = sortedHistory.some(s => {
          const sDate = new Date(s.date);
          sDate.setHours(0,0,0,0);
          return sDate.toDateString() === nextExpectedDate.toDateString();
        });

        if (hasNextWorkout) {
          currentStreak++;
        } else {
          // If the latest workout wasn't today, and there's no workout for tomorrow,
          // we might need to adjust the streak if today is part of a potential streak.
          // For simplicity, we'll stop if the streak breaks.
          if (new Date().toDateString() !== workoutDate.toDateString() && new Date().toDateString() !== nextExpectedDate.toDateString()) {
             break;
          }
        }
      }
      // Ensure streak calculation is accurate for "today"
      const mostRecentWorkoutDate = new Date(sortedHistory[sortedHistory.length - 1].date);
      mostRecentWorkoutDate.setHours(0,0,0,0);
      const daysSinceLastWorkout = (today.getTime() - mostRecentWorkoutDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceLastWorkout === 0) { // If last workout was today
        currentStreak = currentStreak === 0 ? 1 : currentStreak; // At least 1 if a workout was done today
      } else if (daysSinceLastWorkout > 1) { // If last workout was not today or yesterday
        currentStreak = 0;
      }
    }


    return { totalWorkouts, totalSets, totalXP, level, xpProgress, streak: currentStreak };
  }, [history]);

  // --- BERÄKNA PROGRESS FÖR SPECIFIKA MÅL ---
  const getTargetProgress = (mission: UserMission) => {
    if (mission.isCompleted) return 100;

    let currentValue = 0;
    if (mission.type === 'weight') {
      // Hitta maxlyft för specifik övning
      const relevantSets = history.flatMap(s => 
        s.exercises.filter(e => e.exerciseId === mission.exerciseId)
        .flatMap(e => e.sets)
      );
      const maxWeight = Math.max(...relevantSets.map(set => calculate1RM(set.weight, set.reps) || 0), 0);
      currentValue = maxWeight;
    }
    
    if (mission.type === 'frequency') {
      // Kolla pass de senaste 30 dagarna
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentWorkouts = history.filter(s => new Date(s.date) > thirtyDaysAgo).length;
      currentValue = recentWorkouts;
    }

    if (mission.type === 'measurement' && mission.measurementKey && userProfile.measurements) {
        currentValue = userProfile.measurements[mission.measurementKey] || 0;
        // For measurements, if target is higher, progress is higher. If target is lower (e.g., body fat, waist),
        // we need to invert the progress calculation or assume smaller is better.
        // For simplicity, assume higher is better for now, or direct match.
        // A more robust solution would be to add a 'direction' to the mission (e.g., 'increase', 'decrease').
        // For now, if current > target, it's 100%. If current < target it's proportional.
        if (currentValue >= mission.targetValue) {
            return 100;
        }
    }

    return Math.min(Math.round((currentValue / (mission.targetValue || 1)) * 100), 100);
  };

  return (
    <div className="pb-32 space-y-8 animate-in fade-in px-4 pt-8">
      {/* --- LEVEL CARD (Gamification Header) --- */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1a1721] to-[#25212d] rounded-[32px] p-6 border border-white/10 shadow-2xl">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Trophy size={120} />
        </div>
        
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
                {stats.totalXP % 500} / 500 XP
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

      {/* --- AKTIVA MÅL --- */}
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
            <div className="py-12 text-center bg-white/5 rounded-[32px] border border-dashed border-white/10">
              <Award size={40} className="mx-auto mb-4 text-text-dim opacity-20" />
              <p className="text-xs font-bold text-text-dim uppercase tracking-widest">Inga uppdrag satta. Börja din resa idag!</p>
            </div>
          ) : (
            userMissions.map(mission => { // Renamed 'target' to 'mission'
              const progress = getTargetProgress(mission);
              const exercise = exercises.find(e => e.id === mission.exerciseId);
              
              return (
                <div key={mission.id} className={`group bg-[#1a1721] border rounded-[32px] p-5 transition-all ${mission.isCompleted ? 'border-green-500/30' : 'border-white/5 hover:border-accent-blue/30'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${mission.isCompleted ? 'bg-green-500/20 text-green-500 border-green-500/30' : 'bg-white/5 border-white/5'}`}>
                        {mission.isCompleted ? <Check size={24} className="text-green-500" /> : <Zap size={24} className="text-text-dim" />}
                      </div>
                      <div>
                        <h4 className="text-base font-black italic uppercase text-white">
                          {mission.name} {/* Display the mission's name */}
                        </h4>
                        <p className="text-[10px] font-bold text-text-dim uppercase tracking-widest">
                          {mission.type === 'weight' && exercise?.name}
                          {mission.type === 'frequency' && 'Träningsfrekvens'}
                          {mission.type === 'measurement' && `Mått: ${mission.measurementKey}`}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => onDeleteMission(mission.id)}
                      className="p-2 text-text-dim opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                      <span className={`${mission.isCompleted ? 'text-green-500' : 'text-accent-blue'}`}>{progress}% Slutfört</span>
                      <span className="text-text-dim">{mission.isCompleted ? `Slutfört: ${new Date(mission.completedAt || '').toLocaleDateString('sv-SE')}` : 'Kämpa på!'}</span>
                    </div>
                    <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${mission.isCompleted ? 'bg-green-500' : 'bg-accent-blue'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* --- MILSTOLPAR (Gamified Stats) --- */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <Star size={18} className="text-yellow-500" />
          <h3 className="text-xs font-black uppercase text-white tracking-widest">Prestationer</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#1a1721] p-4 rounded-[28px] border border-white/5 space-y-2">
            <Award className="text-yellow-500" size={24} />
            <p className="text-xs font-black text-white uppercase italic">Early Bird</p>
            <p className="text-[9px] text-text-dim uppercase font-bold">5 pass innan kl 07:00</p>
          </div>
          <div className="bg-[#1a1721] p-4 rounded-[28px] border border-white/5 space-y-2 opacity-40">
            <Zap className="text-text-dim" size={24} />
            <p className="text-xs font-black text-white uppercase italic">Iron Master</p>
            <p className="text-[9px] text-text-dim uppercase font-bold">Lyft totalt 10 ton</p>
          </div>
        </div>
      </section>

      {/* Add Mission Modal */}
      {showAddModal && (
        <AddMissionModal
          allExercises={exercises}
          userProfile={userProfile}
          onSave={onAddMission}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
};
