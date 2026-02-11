
import React, { useState } from 'react';
import { PlannedExercise, Exercise, WorkoutSet, UserProfile, Zone } from '../types';
import { SetRow } from './SetRow';
import { MoreVertical, MessageSquare, Info, X, Trash2 } from 'lucide-react';
import { useExerciseImage } from '../hooks/useExerciseImage';

interface ExerciseCardProps {
  item: PlannedExercise;
  exData: Exercise;
  exIdx: number;
  userProfile: UserProfile;
  activeZone: Zone;
  onUpdateSet: (setIdx: number, updates: Partial<WorkoutSet>) => void;
  onAddSet: () => void;
  onRemove: () => void;
  onToggleNotes: () => void;
  isNotesOpen: boolean;
  onUpdateNotes: (text: string) => void;
  onShowInfo: () => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({ 
  item, exData, exIdx, userProfile, activeZone,
  onUpdateSet, onAddSet, onRemove, 
  onToggleNotes, isNotesOpen, onUpdateNotes, onShowInfo 
}) => {
  const imageSrc = useExerciseImage(exData);
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-[#1a1721] rounded-[32px] overflow-hidden border border-white/5 shadow-xl mb-4 relative animate-in fade-in slide-in-from-bottom-2">
      
      {/* HEADER: Bild & Titel */}
      <div className="p-5 pb-2 flex flex-col gap-4">
        <div className="flex gap-4 items-start">
          {/* Större bildbehållare */}
          <button 
            onClick={onShowInfo}
            className="w-20 h-20 rounded-2xl bg-white/5 overflow-hidden shrink-0 border border-white/10 active:scale-95 transition-transform"
          >
            {imageSrc ? (
              <img src={imageSrc} className="w-full h-full object-cover" alt={exData.name} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white/10 italic">
                {exData.name.charAt(0)}
              </div>
            )}
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div className="min-w-0">
                <h3 className="text-xl font-black italic uppercase text-white leading-none truncate pr-2">{exData.name}</h3>
                {/* Flytta upp notis-knappen hit */}
                <button 
                  onClick={onToggleNotes} 
                  className={`mt-2 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors ${item.notes ? 'text-accent-blue' : 'text-text-dim hover:text-white'}`}
                >
                  <MessageSquare size={12} /> {item.notes ? 'Visa Notering' : 'Lägg till anteckning'}
                </button>
              </div>
              <button 
                onClick={() => setShowMenu(!showMenu)} 
                className="text-text-dim p-2 -mr-2 active:bg-white/5 rounded-full transition-colors relative z-10"
              >
                <MoreVertical size={20} />
              </button>
            </div>
          </div>
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
        {showMenu && <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />}

        {/* Anteckningsfältet visas nu direkt under titeln vid aktivering */}
        {isNotesOpen && (
          <div className="animate-in slide-in-from-top-2">
            <textarea 
              autoFocus
              value={item.notes || ''}
              onChange={(e) => onUpdateNotes(e.target.value)}
              placeholder="Skriv en kommentar om övningen..."
              className="w-full bg-[#0f0d15] text-white text-xs font-bold p-4 rounded-2xl border border-white/10 outline-none focus:border-accent-blue/50 min-h-[60px]"
            />
          </div>
        )}
      </div>


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
            exData={exData}
            userProfile={userProfile}
            availablePlates={activeZone?.availablePlates}
          />
        ))}
      </div>
      
      {/* FOOTER */}
      <div className="px-5 py-3.5 border-t border-white/5 flex justify-end items-center bg-black/20">
         <div className="text-[9px] font-black uppercase tracking-widest text-white/20">
            {item.sets.filter(s => s.completed).length} / {item.sets.length} Set Klara
         </div>
      </div>
    </div>
  );
};
