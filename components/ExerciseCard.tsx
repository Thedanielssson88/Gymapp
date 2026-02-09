import React, { useState } from 'react';
import { PlannedExercise, Exercise, WorkoutSet } from '../types';
import { SetRow } from './SetRow';
import { MoreVertical, MessageSquare, Info, X } from 'lucide-react';
import { useExerciseImage } from '../hooks/useExerciseImage';

interface ExerciseCardProps {
  item: PlannedExercise;
  exData: Exercise;
  exIdx: number;
  userWeight: number;
  onUpdateSet: (setIdx: number, updates: Partial<WorkoutSet>) => void;
  onAddSet: () => void;
  onRemove: () => void;
  onToggleNotes: () => void;
  isNotesOpen: boolean;
  onUpdateNotes: (text: string) => void;
  onShowInfo: () => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({ 
  item, exData, exIdx,
  onUpdateSet, onAddSet, onRemove, 
  onToggleNotes, isNotesOpen, onUpdateNotes, onShowInfo 
}) => {
  const imageSrc = useExerciseImage(exData);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-[#1a1721] rounded-[32px] overflow-hidden border border-white/5 shadow-xl mb-4 relative">
      
      {/* HEADER: Bild & Titel */}
      <div className="p-5 pb-2 flex gap-4 items-start">
        <button 
          onClick={onShowInfo}
          className="w-16 h-16 rounded-2xl bg-white/5 overflow-hidden shrink-0 border border-white/5 active:scale-95 transition-transform"
        >
          {imageSrc ? (
            <img src={imageSrc} className="w-full h-full object-cover opacity-80" alt={exData.name} />
          ) : (
             <div className="w-full h-full flex items-center justify-center text-xl font-black text-white/10 italic">
               {exData.name.charAt(0)}
             </div>
          )}
        </button>

        <div className="flex-1 min-w-0 pt-1">
          <div className="flex justify-between items-start">
             <div className="min-w-0">
               <h3 className="text-xl font-black italic uppercase text-white leading-none truncate pr-2">
                 {exData.name}
               </h3>
               {exData.englishName && (
                  <p className="text-[11px] font-bold text-white/30 italic leading-none mt-1 mb-1 tracking-tight truncate">
                    {exData.englishName}
                  </p>
               )}
               <p className="text-[10px] font-bold text-accent-pink uppercase tracking-widest mt-1.5 truncate">
                 {exData.primaryMuscles?.[0] || exData.muscleGroups[0]} • {exData.equipment[0]}
               </p>
             </div>
             
             <button 
               onClick={() => setShowMenu(!showMenu)} 
               className="text-text-dim p-2 -mr-2 active:bg-white/5 rounded-full transition-colors"
             >
               <MoreVertical size={20} />
             </button>
          </div>
          
          {/* Dropdown Menu */}
          {showMenu && (
             <>
               <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
               <div className="absolute right-5 mt-2 bg-[#25222e] rounded-2xl border border-white/10 shadow-2xl z-20 py-1 min-w-[160px] animate-in fade-in zoom-in-95 backdrop-blur-xl">
                  <button onClick={() => { onShowInfo(); setShowMenu(false); }} className="w-full text-left px-5 py-4 text-xs font-black uppercase tracking-widest text-white hover:bg-white/5 flex items-center gap-3">
                    <Info size={16} className="text-accent-blue" /> Info
                  </button>
                  <button onClick={() => { onRemove(); setShowMenu(false); }} className="w-full text-left px-5 py-4 text-xs font-black uppercase tracking-widest text-red-400 hover:bg-white/5 border-t border-white/5 flex items-center gap-3">
                    <X size={16} /> Ta bort
                  </button>
               </div>
             </>
          )}
        </div>
      </div>

      {/* ANTECKNINGAR */}
      {item.notes && !isNotesOpen && (
        <button 
          onClick={onToggleNotes} 
          className="mx-5 mb-4 px-3 py-2.5 bg-accent-blue/5 border border-accent-blue/10 rounded-xl flex items-center gap-3 text-left active:scale-[0.98] transition-all"
        >
           <MessageSquare size={14} className="text-accent-blue" />
           <p className="text-[10px] font-bold text-accent-blue/80 italic truncate">{item.notes}</p>
        </button>
      )}
      
      {isNotesOpen && (
        <div className="mx-5 mb-4 animate-in slide-in-from-top-2">
           <textarea 
             autoFocus
             value={item.notes || ''} 
             onChange={(e) => onUpdateNotes(e.target.value)}
             placeholder="Anteckningar..."
             className="w-full bg-[#0f0d15] text-white text-xs font-bold p-4 rounded-2xl border border-white/10 outline-none focus:border-accent-blue/50 min-h-[80px]"
           />
        </div>
      )}

      {/* SET LISTA */}
      <div className="px-3 pb-3">
        {item.sets.map((set, i) => (
          <SetRow
            key={i}
            setIdx={i}
            set={set}
            isCompleted={set.completed}
            onUpdate={(updates) => onUpdateSet(i, updates)}
            onAddSet={onAddSet}
            isLast={i === item.sets.length - 1}
            trackingType={exData.trackingType}
          />
        ))}
      </div>
      
      {/* FOOTER */}
      <div className="px-5 py-3.5 border-t border-white/5 flex justify-between items-center bg-black/20">
         <button onClick={onToggleNotes} className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors ${item.notes ? 'text-accent-blue' : 'text-text-dim hover:text-white'}`}>
            <MessageSquare size={14} /> {item.notes ? 'Redigera Notis' : 'Lägg till anteckning'}
         </button>
         <div className="text-[9px] font-black uppercase tracking-widest text-white/20 italic">
            Volym: {exData.trackingType === 'time_only' ? '--' : item.sets.reduce((sum, s) => s.completed ? sum + (s.weight * s.reps) : sum, 0).toLocaleString() + ' kg'}
         </div>
      </div>
    </div>
  );
};