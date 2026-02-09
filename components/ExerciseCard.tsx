import React, { useState } from 'react';
import { PlannedExercise, Exercise, WorkoutSet } from '../types';
import { SetRow } from './SetRow';
import { MoreVertical, MessageSquare, Info, X, Trash2 } from 'lucide-react';
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
    <div className="bg-[#1a1721] rounded-[32px] overflow-hidden border border-white/5 shadow-xl mb-4 relative animate-in fade-in slide-in-from-bottom-2">
      
      {/* HEADER: Bild & Titel */}
      <div className="p-5 pb-2 flex gap-4 items-start">
        {/* Klickbar bild för info */}
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
               {/* SVENSKA NAMNET (Stort) */}
               <h3 className="text-xl font-black italic uppercase text-white leading-none truncate pr-2">
                 {exData.name}
               </h3>
               
               {/* ENGELSKA NAMNET (Mindre, under) */}
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
               className="text-text-dim p-2 -mr-2 active:bg-white/5 rounded-full transition-colors relative z-10"
             >
               <MoreVertical size={20} />
             </button>
          </div>
          
          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-4 top-14 bg-[#25222e] border border-white/10 rounded-xl shadow-2xl p-1 z-20 w-40 animate-in zoom-in-95 duration-100 origin-top-right">
               <button onClick={onShowInfo} className="w-full text-left px-3 py-2.5 text-xs font-bold text-white hover:bg-white/5 rounded-lg flex items-center gap-2">
                  <Info size={14} className="text-accent-blue"/> Info & Historik
               </button>
               <div className="h-px bg-white/5 my-1" />
               <button onClick={() => { onRemove(); setShowMenu(false); }} className="w-full text-left px-3 py-2.5 text-xs font-bold text-red-500 hover:bg-red-500/10 rounded-lg flex items-center gap-2">
                  <Trash2 size={14} /> Ta bort övning
               </button>
            </div>
          )}
          {showMenu && <div className="fixed inset-0 z-0" onClick={() => setShowMenu(false)} />}
        </div>
      </div>

      {/* ANTECKNINGAR (Utfällbar) */}
      {isNotesOpen && (
        <div className="px-5 pb-4 animate-in slide-in-from-top-2">
           <textarea 
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
         <div className="text-[9px] font-black uppercase tracking-widest text-white/20">
            {item.sets.filter(s => s.completed).length} / {item.sets.length} Set Klara
         </div>
      </div>
    </div>
  );
};
