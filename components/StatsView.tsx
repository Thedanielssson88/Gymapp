import React, { useState, useMemo } from 'react';
import { BiometricLog, WorkoutSession, Exercise, UserProfile, MuscleGroup } from '../types';
import { storage } from '../services/storage';
import { Zap, ShieldAlert, AlertTriangle } from 'lucide-react';
import { RecoveryMap, MapMode } from './RecoveryMap';
import { calculateMuscleRecovery, ALL_MUSCLE_GROUPS } from '../utils/recovery';

interface StatsViewProps {
  logs: BiometricLog[];
  history: WorkoutSession[];
  allExercises: Exercise[];
  userProfile: UserProfile;
  onUpdateProfile: () => void;
}

const RecoveryList = ({ activeTab, recoveryScores, injuries, onToggleInjury }: any) => {
  const sortedMuscles = [...ALL_MUSCLE_GROUPS].sort((a, b) => {
     if (activeTab === 'injuries') {
         const aInjured = injuries?.includes(a);
         const bInjured = injuries?.includes(b);
         if (aInjured && !bInjured) return -1;
         if (!aInjured && bInjured) return 1;
         return a.localeCompare(b);
     } else {
         const scoreA = recoveryScores[a] || 100;
         const scoreB = recoveryScores[b] || 100;
         return scoreA - scoreB;
     }
  });

  const getRecoveryColor = (score: number) => {
      if (score >= 90) return 'bg-green-500 text-green-500';
      if (score >= 50) return 'bg-yellow-500 text-yellow-500';
      return 'bg-orange-500 text-orange-500';
  };

  return (
    <div className="p-4 space-y-2">
      {sortedMuscles.map(muscle => {
         const isInjured = injuries?.includes(muscle);
         const score = recoveryScores[muscle] ?? 100;
         const colorClass = getRecoveryColor(score);
         const [bgColor, textColor] = colorClass.split(' ');

         if (activeTab === 'injuries') {
             return (
               <button 
                 key={muscle}
                 onClick={() => onToggleInjury(muscle)}
                 className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all border ${
                    isInjured ? 'bg-red-500/10 border-red-500/50' : 'bg-white/5 border-white/5 hover:bg-white/10'
                 }`}
               >
                  <span className={`font-black uppercase italic text-sm ${isInjured ? 'text-red-500' : 'text-white'}`}>{muscle}</span>
                  {isInjured ? <AlertTriangle size={18} className="text-red-500" /> : <div className="w-5 h-5 rounded-full border border-white/10" />}
               </button>
             );
         } else {
             return (
               <div key={muscle} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                     <span className="font-black uppercase italic text-sm text-white">{muscle}</span>
                     <span className={`text-[10px] font-black uppercase tracking-widest ${textColor}`}>{score >= 90 ? 'Utvilad' : score >= 50 ? 'Ok' : 'Trött'}</span>
                  </div>
                  <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                     <div className={`h-full rounded-full transition-all duration-1000 ${bgColor}`} style={{ width: `${score}%` }} />
                  </div>
               </div>
             );
         }
      })}
    </div>
  );
};

export const StatsView: React.FC<StatsViewProps> = ({ history, allExercises, userProfile, onUpdateProfile }) => {
  const [activeTab, setActiveTab] = useState<MapMode>('recovery');
  const viewMode = userProfile.settings?.bodyViewMode || 'list';
  const recoveryScores = useMemo(() => calculateMuscleRecovery(history, allExercises, userProfile), [history, allExercises, userProfile]);

  const handleToggleInjury = async (muscle: MuscleGroup) => {
    const currentInjuries = userProfile.injuries || [];
    let newInjuries;
    if (currentInjuries.includes(muscle)) {
      newInjuries = currentInjuries.filter(m => m !== muscle);
    } else {
      newInjuries = [...currentInjuries, muscle];
    }
    const updatedProfile = { ...userProfile, injuries: newInjuries };
    await storage.setUserProfile(updatedProfile);
    onUpdateProfile();
  };

  return (
    <div className="space-y-6 pb-24 animate-in fade-in">
      <div className="bg-[#1a1721] rounded-[32px] border border-white/5 overflow-hidden shadow-2xl">
        <div className="p-2 flex gap-2 border-b border-white/5">
          <button 
            onClick={() => setActiveTab('recovery')}
            className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'recovery' ? 'bg-white/10 text-white shadow-lg' : 'text-text-dim hover:bg-white/5'}`}
          >
            <Zap size={14} className={activeTab === 'recovery' ? 'text-accent-green' : ''} /> Status
          </button>
          <button 
            onClick={() => setActiveTab('injuries')}
            className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === 'injuries' ? 'bg-red-500/20 text-red-500 shadow-lg border border-red-500/20' : 'text-text-dim hover:bg-white/5'}`}
          >
            <ShieldAlert size={14} /> Skador
          </button>
        </div>

        <div className="p-4">
          {viewMode === 'map' ? (
            <RecoveryMap mode={activeTab} recoveryScores={recoveryScores} injuries={userProfile.injuries} onToggle={handleToggleInjury} />
          ) : (
            <RecoveryList activeTab={activeTab} recoveryScores={recoveryScores} injuries={userProfile.injuries} onToggleInjury={handleToggleInjury} />
          )}
        </div>
      </div>
    </div>
  );
};