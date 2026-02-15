
import React from 'react';
import { X, Play, Calendar, Repeat } from 'lucide-react';
import { ScheduledActivity, Exercise } from '../types';

interface WorkoutDetailsModalProps {
  activity: ScheduledActivity;
  allExercises: Exercise[];
  onClose: () => void;
  onStart: (activity: ScheduledActivity) => void;
}

export const WorkoutDetailsModal: React.FC<WorkoutDetailsModalProps> = ({ activity, allExercises, onClose, onStart }) => {
  const getExerciseName = (exerciseId: string) => {
    return allExercises.find(ex => ex.id === exerciseId)?.name || exerciseId;
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#1a1721] w-full max-w-md max-h-[80vh] flex flex-col rounded-3xl border border-white/10 shadow-2xl animate-in zoom-in-95">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-start bg-gradient-to-r from-white/5 to-transparent rounded-t-3xl">
          <div>
            <span className="text-[10px] text-accent-blue font-black uppercase tracking-widest mb-1 block">
              AI Program
            </span>
            <h3 className="text-xl font-black italic text-white uppercase leading-none">
              {activity.title}
            </h3>
            {activity.date && (
               <div className="flex items-center gap-1 text-xs text-text-dim mt-2">
                 <Calendar size={12} /> Planerat: {activity.date}
               </div>
            )}
          </div>
          <button onClick={onClose} className="p-2 bg-black/20 rounded-full hover:bg-white/10 text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {(activity.exercises || []).map((plannedEx, idx) => (
            <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white mb-1">
                   {getExerciseName(plannedEx.exerciseId)}
                </p>
                <div className="flex gap-3 text-xs text-text-dim">
                  <span className="flex items-center gap-1"><Repeat size={12}/> {plannedEx.sets.length} set</span>
                  <span className="bg-white/10 px-1.5 rounded text-white">{plannedEx.sets[0]?.reps} reps</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-accent-blue font-black text-lg block">
                  {plannedEx.sets[0]?.weight ? `${plannedEx.sets[0].weight}kg` : '-'}
                </span>
                <span className="text-[10px] text-text-dim uppercase">Vikt</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer / Action */}
        <div className="p-6 border-t border-white/5 bg-[#1a1721] rounded-b-3xl">
          <button 
            onClick={() => onStart(activity)}
            className="w-full bg-green-500 hover:bg-green-400 text-black font-black py-4 rounded-2xl uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 transition-all hover:scale-[1.02]"
          >
            <Play size={20} fill="black" /> STARTA PASSET NU
          </button>
          <p className="text-[10px] text-text-dim text-center mt-3">
            Passet startas med dagens datum.
          </p>
        </div>

      </div>
    </div>
  );
};
