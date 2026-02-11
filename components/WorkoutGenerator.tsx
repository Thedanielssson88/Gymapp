
import React, { useState } from 'react';
import { MuscleGroup, Zone } from '../types';
import { ALL_MUSCLE_GROUPS } from '../utils/recovery';
import { X, Zap, Dumbbell } from 'lucide-react';

interface WorkoutGeneratorProps {
  activeZone: Zone;
  onGenerate: (muscles: MuscleGroup[]) => void;
  onClose: () => void;
}

export const WorkoutGenerator: React.FC<WorkoutGeneratorProps> = ({ activeZone, onGenerate, onClose }) => {
  const [selectedMuscles, setSelectedMuscles] = useState<MuscleGroup[]>([]);

  const toggleMuscle = (m: MuscleGroup) => {
    if (selectedMuscles.includes(m)) {
      setSelectedMuscles(prev => prev.filter(i => i !== m));
    } else {
      setSelectedMuscles(prev => [...prev, m]);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0f0d15] z-[150] flex flex-col p-6 animate-in slide-in-from-bottom-10 duration-500">
      <header className="flex justify-between items-center mb-6">
        <div>
           <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter">Bygg Pass</h3>
           <p className="text-[10px] text-text-dim uppercase tracking-widest font-black">Baserat på {activeZone.name}</p>
        </div>
        <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl"><X size={28} className="text-text-dim" /></button>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <p className="text-white/60 mb-6 font-bold text-sm">Vad vill du träna idag?</p>
        <div className="grid grid-cols-2 gap-3 pb-24">
          {ALL_MUSCLE_GROUPS.map(m => (
            <button
              key={m}
              onClick={() => toggleMuscle(m)}
              className={`p-6 rounded-[24px] border text-left transition-all ${
                selectedMuscles.includes(m)
                  ? 'bg-accent-blue text-white border-accent-blue shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                  : 'bg-white/5 text-text-dim border-white/5 hover:bg-white/10'
              }`}
            >
              <span className="font-black uppercase italic text-xs tracking-tight">{m}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-[#0f0d15]/80 backdrop-blur-xl border-t border-white/5">
         <button
           disabled={selectedMuscles.length === 0}
           onClick={() => onGenerate(selectedMuscles)}
           className="w-full py-5 bg-accent-blue disabled:opacity-50 disabled:grayscale text-white rounded-[24px] font-black italic text-xl uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
         >
           <Zap size={24} fill="currentColor" /> Generera Pass
         </button>
      </div>
    </div>
  );
};