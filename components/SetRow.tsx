
import React, { memo } from 'react';
import { Check, Plus } from 'lucide-react';
import { WorkoutSet } from '../types';

interface SetRowProps {
  set: WorkoutSet;
  setIdx: number;
  onUpdateSet: (updates: Partial<WorkoutSet>) => void;
}

export const SetRow = memo(({ set, setIdx, onUpdateSet }: SetRowProps) => {
  return (
    <div className={`bg-[#0f0d15] rounded-2xl p-4 flex items-center gap-4 border transition-all ${set.completed ? 'border-green-500/30 opacity-40 grayscale' : 'border-white/5'}`}>
      <span className="text-lg font-black italic text-text-dim w-6 text-center">{setIdx + 1}</span>
      <div className="flex-1 grid grid-cols-2 gap-4">
        <div className="flex flex-col">
          <span className="text-[8px] font-black text-text-dim uppercase mb-1">KG</span>
          <input 
            type="number" 
            value={set.weight || ''} 
            onChange={(e) => onUpdateSet({ weight: Number(e.target.value) })} 
            className="bg-transparent font-black text-2xl outline-none w-full" 
            placeholder="0" 
          />
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] font-black text-text-dim uppercase mb-1">Reps</span>
          <input 
            type="number" 
            value={set.reps || ''} 
            onChange={(e) => onUpdateSet({ reps: Number(e.target.value) })} 
            className="bg-transparent font-black text-2xl outline-none w-full" 
            placeholder="0" 
          />
        </div>
      </div>
      <button 
        onClick={() => onUpdateSet({ completed: !set.completed })} 
        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${set.completed ? 'bg-green-500 text-white' : 'bg-white/5 text-text-dim'}`}
      >
        {set.completed ? <Check size={28} /> : <Plus size={28} />}
      </button>
    </div>
  );
});
