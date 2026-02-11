import React, { useState, useEffect } from 'react';
import { PlannedExercise, Exercise, WorkoutSet, UserProfile, Zone } from '../types';
import { SetRow } from './SetRow';
import { MoreVertical, MessageSquare, Info, Trash2, Plus, ArrowUp, ArrowDown, Link, Unlink, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { useExerciseImage } from '../hooks/useExerciseImage';

interface ExerciseCardProps {
  item: PlannedExercise;
  exData: Exercise;
  exIdx: number;
  userProfile: UserProfile;
  activeZone: Zone;
  
  // Superset props
  isFirst: boolean;
  isLast: boolean;
  isInSuperset: boolean;
  isSupersetStart: boolean;
  isSupersetEnd: boolean;
  
  // Actions
  onUpdateSet: (setIdx: number, updates: Partial<WorkoutSet>) => void;
  onAddSet: () => void;
  onRemove: () => void;
  onToggleNotes: () => void;
  isNotesOpen: boolean;
  onUpdateNotes: (text: string) => void;
  onShowInfo: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggleSuperset: () => void;
  onUpdateConfig?: (updates: Partial<PlannedExercise>) => void; // Gjorde denna optional för bakåtkompatibilitet
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({ 
  item, exData, exIdx, userProfile, activeZone,
  isFirst, isLast, isInSuperset, isSupersetStart, isSupersetEnd,
  onUpdateSet, onAddSet, onRemove, 
  onToggleNotes, isNotesOpen, onUpdateNotes, onShowInfo,
  onMoveUp, onMoveDown, onToggleSuperset, onUpdateConfig
}) => {
  const imageSrc = useExerciseImage(exData);
  const [showMenu, setShowMenu] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const allSetsCompleted = item.sets.length > 0 && item.sets.every(s => s.completed);

  useEffect(() => {
    if (allSetsCompleted) {
      const timer = setTimeout(() => setIsCollapsed(true), 500);
      return () => clearTimeout(timer);
    } else {
        setIsCollapsed(false);
    }
  }, [allSetsCompleted]);

  const handleToggleCollapse = () => {
    if (allSetsCompleted) {
        setIsCollapsed(!isCollapsed);
    }
  };

  // --- DESIGN LOGIK FÖR SUPERSETS ---
  
  // 1. Färgen på vänsterkanten (Blå normalt, Grön om klar)
  const leftBorderColor = (isCollapsed && allSetsCompleted) ? 'border-l-green-500' : 'border-l-accent-blue';
  
  const supersetClass = isInSuperset 
    ? `border-l-4 ${leftBorderColor} rounded-l-none ml-4` 
    : '';

  // 2. Rundade hörn och marginaler (Viktigt: mb-4 på sista kortet fixar layouten)
  const roundingClass = 
    (isInSuperset && !isSupersetStart && !isSupersetEnd) ? 'rounded-none border-t-0 border-b-0 my-0' :
    (isSupersetStart) ? 'rounded-b-none border-b-0 mb-0' :
    (isSupersetEnd) ? 'rounded-t-none border-t-0 mt-0 mb-4' : 
    'rounded-[32px] mb-4';

  // 3. Kantlinje för själva kortet (Måste matcha grannarna i superset)
  // Om det är superset: Använd alltid vit/svag border så skarvarna syns inte.
  // Om det är fristående: Använd grön border för att visa att den är klar.
  const borderClass = (isCollapsed && allSetsCompleted && !isInSuperset) 
    ? 'border-green-500/30' 
    : 'border-white/5';

  // --- KOLLAPSAT LÄGE ---
  if (isCollapsed && allSetsCompleted) {
      return (
        <div 
            onClick={handleToggleCollapse}
            className={`bg-[#1a1721] overflow-hidden border ${borderClass} shadow-lg relative transition-all cursor-pointer group ${supersetClass} ${roundingClass} p-4 flex justify-between items-center animate-in fade-in slide-in-from-bottom-1`}
        >
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500 text-black flex items-center justify-center shadow-[0_0_10px_rgba(34,197,94,0.5)]">
                    <CheckCircle2 size={18} strokeWidth={3} />
                </div>
                <div>
                    <h3 className="text-sm font-black italic uppercase text-green-500 line-through decoration-green-500/50 decoration-2">{exData.name}</h3>
                    <p className="text-[9px] font-bold text-green-500/60 uppercase tracking-widest">{item.sets.length} Set Klara</p>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                {/* Behåll pilar även i kollapsat läge så man kan flytta runt klara övningar */}
                <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isFirst && <button onClick={(e) => { e.stopPropagation(); onMoveUp(); }} className="p-1 hover:bg-white/10 rounded"><ArrowUp size={12} className="text-text-dim"/></button>}
                    {!isLast && <button onClick={(e) => { e.stopPropagation(); onMoveDown(); }} className="p-1 hover:bg-white/10 rounded"><ArrowDown size={12} className="text-text-dim"/></button>}
                </div>
                <ChevronDown size={16} className="text-green-500/50 group-hover:text-green-500 transition-colors" />
            </div>
            
            {/* Liten separator-linje om det är starten på ett superset, för struktur */}
            {isSupersetStart && <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/5 mx-4" />}
        </div>
      );
  }

  // --- EXPANDERAT LÄGE (STANDARD) ---
  return (
    <div className={`bg-[#1a1721] overflow-hidden border border-white/5 shadow-xl relative transition-all ${supersetClass} ${roundingClass}`}>
      
      {/* HEADER */}
      <div className="p-5 pb-2 flex flex-col gap-4">
        <div className="flex gap-4 items-start">
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
                <h3 
                    onClick={handleToggleCollapse}
                    className={`text-xl font-black italic uppercase leading-none truncate pr-2 ${allSetsCompleted ? 'text-green-500 cursor-pointer hover:underline' : 'text-white'}`}
                >
                    {exData.name} {allSetsCompleted && <span className="inline-block align-middle ml-1"><ChevronUp size={14}/></span>}
                </h3>
                
                <button 
                  onClick={onToggleNotes} 
                  className={`mt-2 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-colors ${item.notes ? 'text-accent-blue' : 'text-text-dim hover:text-white'}`}
                >
                  <MessageSquare size={12} /> {item.notes ? 'Visa Notering' : 'Lägg till anteckning'}
                </button>
              </div>

              {/* MENY & SUPERSET PILAR */}
              <div className="flex flex-col gap-1 items-end relative z-10">
                 <div className="flex flex-col gap-1 absolute right-[-8px] top-[-8px]">
                    {!isFirst && (
                      <button onClick={onMoveUp} className="p-1.5 bg-black/40 rounded-full hover:bg-white/10 text-text-dim">
                        <ArrowUp size={14} />
                      </button>
                    )}
                    {!isFirst && (
                       <button 
                         onClick={onToggleSuperset} 
                         className={`p-1.5 rounded-full ${isInSuperset && !isSupersetStart ? 'bg-accent-blue text-black' : 'bg-black/40 text-text-dim hover:bg-white/10'}`}
                         title={isInSuperset ? "Bryt superset" : "Koppla med föregående"}
                       >
                         {isInSuperset && !isSupersetStart ? <Unlink size={14} /> : <Link size={14} />}
                       </button>
                    )}
                    {!isLast && (
                      <button onClick={onMoveDown} className="p-1.5 bg-black/40 rounded-full hover:bg-white/10 text-text-dim">
                        <ArrowDown size={14} />
                      </button>
                    )}
                    <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 bg-black/40 rounded-full hover:bg-white/10 text-text-dim mt-2">
                        <MoreVertical size={14} />
                    </button>
                 </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Dropdown Menu */}
        {showMenu && (
          <div className="absolute right-10 top-10 bg-[#25222e] border border-white/10 rounded-xl shadow-2xl p-1 z-20 w-40 animate-in zoom-in-95 duration-100 origin-top-right">
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

        {isNotesOpen && (
          <div className="animate-in slide-in-from-top-2">
            <textarea 
              autoFocus
              value={item.notes || ''}
              onChange={(e) => onUpdateNotes(e.target.value)}
              placeholder="Skriv en kommentar..."
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
            trackingType={exData.trackingType}
            exData={exData}
            userProfile={userProfile}
            availablePlates={activeZone?.availablePlates}
          />
        ))}

        <button 
          onClick={onAddSet}
          className="w-full py-3 mt-2 bg-white/5 hover:bg-white/10 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-text-dim hover:text-white transition-all active:scale-95 border border-dashed border-white/10 group"
        >
          <Plus size={14} className="group-hover:scale-110 transition-transform"/> Lägg till Set
        </button>
      </div>
      
      {/* FOOTER */}
      <div className="px-5 py-3.5 border-t border-white/5 flex justify-end items-center bg-black/20">
         <div className={`text-[9px] font-black uppercase tracking-widest ${allSetsCompleted ? 'text-green-500' : 'text-white/20'}`}>
            {item.sets.filter(s => s.completed).length} / {item.sets.length} Set Klara
         </div>
      </div>

      {isSupersetStart && <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-white/5 mx-4" />}
    </div>
  );
};
