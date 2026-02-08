
import React, { useMemo, useState } from 'react';
import { WorkoutSession, GoalTarget } from '../types';
import { Target, ChevronDown, MoreHorizontal, Plus, Settings } from 'lucide-react';
import { storage } from '../services/storage';

interface TargetsViewProps {
  history: WorkoutSession[];
}

export const TargetsView: React.FC<TargetsViewProps> = ({ history }) => {
  const goalTargets = useMemo(() => storage.getGoalTargets(), []);
  const allExercises = useMemo(() => storage.getAllExercises(), []);
  
  // Calculate current sets completed this week (last 7 days)
  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);

    const weekHistory = history.filter(s => new Date(s.date) >= weekAgo);
    
    const results = goalTargets.map(target => {
      let currentSets = 0;
      weekHistory.forEach(session => {
        session.exercises.forEach(pe => {
          const exData = allExercises.find(e => e.id === pe.exerciseId);
          if (exData && target.muscleGroups.some(mg => exData.muscleGroups.includes(mg))) {
            currentSets += pe.sets.filter(s => s.completed).length;
          }
        });
      });
      return {
        ...target,
        currentSets
      };
    });

    const totalTarget = results.reduce((sum, r) => sum + r.targetSets, 0);
    const totalCurrent = results.reduce((sum, r) => sum + r.currentSets, 0);
    const overallProgress = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;

    return { results, overallProgress };
  }, [history, goalTargets, allExercises]);

  return (
    <div className="min-h-screen pb-40 animate-in fade-in duration-700 bg-[#0f0d15] text-white">
      {/* HEADER SECTION WITH LARGE HEXAGON PROGRESS */}
      <div className="pt-12 pb-10 flex flex-col items-center">
        <div className="relative w-48 h-48 flex items-center justify-center mb-4">
          <div className="hexagon absolute inset-0 bg-[#1a1721] border border-white/5 flex items-center justify-center">
             <div className="hexagon absolute inset-1 bg-[#0f0d15] flex items-center justify-center">
               <span className="text-6xl font-black italic tracking-tighter">{stats.overallProgress}%</span>
             </div>
          </div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/40">Total Veckovolym</p>
      </div>

      {/* TARGET CARDS */}
      <div className="px-6 space-y-4">
        {stats.results.map((target) => (
          <div key={target.id} className="bg-[#1a1721] rounded-[32px] p-6 border border-white/5 flex justify-between items-center group transition-all active:scale-[0.98]">
            <div className="flex gap-4 items-center">
              <div className="hexagon w-12 h-12 bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-accent-pink/10 transition-colors">
                <Target size={20} className="text-white group-hover:text-accent-pink transition-colors" />
              </div>
              <div>
                <h3 className="font-black italic uppercase tracking-tight text-lg leading-none">{target.name}</h3>
                <p className="text-[10px] font-black text-white/30 uppercase mt-1 tracking-widest">{target.currentSets} / {target.targetSets} Set</p>
              </div>
            </div>
            
            <div className="text-right flex flex-col items-end">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black italic">{Math.max(0, target.targetSets - target.currentSets)}</span>
                <ChevronDown size={14} className="text-white/20" />
              </div>
              <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Kvar</span>
            </div>
          </div>
        ))}
      </div>

      {/* HISTORIK SECTION */}
      <div className="px-6 mt-12">
        <h2 className="text-2xl font-black italic tracking-tighter mb-6">Historik</h2>
        <div className="flex gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="hexagon w-20 h-20 bg-white/5 border border-white/5 flex items-center justify-center opacity-40">
               <div className="hexagon w-12 h-12 bg-white/5"></div>
            </div>
          ))}
        </div>
      </div>

      {/* SETTINGS FLOATING BUTTON */}
      <div className="fixed bottom-36 right-6 z-[80]">
        <button className="bg-white/5 p-4 rounded-full border border-white/10 backdrop-blur-xl text-white shadow-2xl active:scale-90 transition-all">
          <Settings size={24} />
        </button>
      </div>
    </div>
  );
};
