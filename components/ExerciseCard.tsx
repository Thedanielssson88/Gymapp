
import React, { memo } from 'react';
import { Info, FileText, Trash2 } from 'lucide-react';
import { PlannedExercise, Exercise, WorkoutSet } from '../types';
import { SetRow } from './SetRow';

interface ExerciseCardProps {
  item: PlannedExercise;
  exIdx: number;
  exData: Exercise;
  userWeight: number;
  isNotesOpen: boolean;
  onToggleNotes: () => void;
  onUpdateNotes: (notes: string) => void;
  onRemove: () => void;
  onAddSet: () => void;
  onUpdateSet: (setIdx: number, updates: Partial<WorkoutSet>) => void;
  onShowInfo: () => void;
}

export const ExerciseCard = memo(({
  item,
  exIdx,
  exData,
  userWeight,
  isNotesOpen,
  onToggleNotes,
  onUpdateNotes,
  onRemove,
  onAddSet,
  onUpdateSet,
  onShowInfo
}: ExerciseCardProps) => {
  const calculateEffectiveWeight = (w: number) => {
    const bwContr = userWeight * (exData.bodyweightCoefficient || 0);
    return Math.round(w + bwContr);
  };

  const totalSets = item.sets.length;
  const avgReps = Math.round(item.sets.reduce((sum, s) => sum + s.reps, 0) / (totalSets || 1));
  const currentWeight = item.sets[0]?.weight || 0;
  const estLoad = calculateEffectiveWeight(currentWeight);

  return (
    <div className="bg-[#1a1721] rounded-[32px] p-6 border border-white/5 shadow-xl relative group">
      <div className="flex justify-between items-start mb-6">
        <div className="flex gap-4 items-center flex-1">
          <div className="w-14 h-14 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center p-2 overflow-hidden">
            <img 
              src={exData.imageUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${exData.name}`} 
              className="w-full h-full object-cover opacity-30" 
              alt={exData.name}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-black uppercase italic tracking-tighter leading-none mb-1">{exData.name}</h3>
            <p className="text-[10px] font-black text-text-dim uppercase tracking-widest">{exData.pattern}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[10px] font-black text-white/60 uppercase">
                {totalSets} Set, {avgReps} Reps, {currentWeight}Kg 
              </span>
              <span className="text-[10px] font-black text-accent-pink uppercase italic">
                (Beräknad {estLoad}Kg)
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={onShowInfo}
            className="p-2 text-text-dim/40 hover:text-accent-blue transition-colors"
          >
            <Info size={18} />
          </button>
          <button 
            onClick={onToggleNotes}
            className={`p-2 transition-colors ${isNotesOpen ? 'text-accent-pink' : 'text-text-dim/40 hover:text-white'}`}
          >
            <FileText size={18} />
          </button>
          <button 
            onClick={onRemove} 
            className="p-2 text-text-dim/20 hover:text-red-500 transition-colors active:scale-95"
          >
            <Trash2 size={18}/>
          </button>
        </div>
      </div>

      {isNotesOpen && (
        <div className="mb-6 animate-in slide-in-from-top-2 fade-in duration-300">
          <textarea 
            placeholder="Anteckningar för övningen (t.ex. inställningar)..."
            value={item.notes || ''}
            onChange={(e) => onUpdateNotes(e.target.value)}
            className="w-full bg-[#0f0d15] border border-accent-pink/20 rounded-2xl p-4 text-[11px] font-bold text-white placeholder:text-white/20 outline-none focus:border-accent-pink/50 transition-all shadow-inner"
            rows={3}
            autoFocus
          />
        </div>
      )}

      <div className="space-y-3">
        {item.sets.map((set, setIdx) => (
          <SetRow 
            key={setIdx} 
            set={set} 
            setIdx={setIdx} 
            onUpdateSet={(updates) => onUpdateSet(setIdx, updates)} 
          />
        ))}
      </div>

      <button 
        onClick={onAddSet}
        className="w-full py-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-text-dim mt-4 active:scale-[0.98] transition-all"
      >
        + Lägg till set
      </button>
    </div>
  );
});
