import React, { useState } from 'react';
import { X, Check, Activity, Clock, Flame } from 'lucide-react';

interface WorkoutSummaryModalProps {
  duration: number; // sekunder
  onConfirm: (rpe: number, feeling: string, manualDuration?: number) => void;
  onCancel: () => void;
}

export const WorkoutSummaryModal: React.FC<WorkoutSummaryModalProps> = ({ duration, onConfirm, onCancel }) => {
  const [rpe, setRpe] = useState(7);
  const [feeling, setFeeling] = useState('stark');
  const [manualDurationMin, setManualDurationMin] = useState(Math.round(duration / 60) || 60);

  const getRpeDescription = (val: number) => {
    if (val <= 4) return "Lätt återhämtning";
    if (val <= 6) return "Moderat ansträngning";
    if (val <= 8) return "Tungt & Utvecklande";
    if (val <= 9) return "Mycket tungt";
    return "Maximal ansträngning (Failure)";
  };

  return (
    <div className="fixed inset-0 bg-[#0f0d15]/95 z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-[#1a1721] border border-white/10 rounded-[40px] p-8 space-y-8 relative shadow-2xl overflow-y-auto max-h-[90vh] scrollbar-hide">
        
        <button onClick={onCancel} className="absolute top-6 right-6 p-2 text-white/30 hover:text-white">
          <X size={24} />
        </button>

        <div className="text-center space-y-2">
           <h2 className="text-3xl font-black italic uppercase text-white tracking-tighter">Sammanfattning</h2>
           <p className="text-[10px] text-text-dim font-black uppercase tracking-widest">Granska och spara ditt pass</p>
        </div>

        {/* DURATION INPUT */}
        <div className="space-y-4">
           <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dim block mb-2">Träningstid (minuter)</label>
           <div className="flex items-center gap-4 bg-white/5 p-5 rounded-2xl border border-white/10 group focus-within:border-accent-blue/50 transition-all">
              <Clock size={24} className="text-accent-blue" />
              <input 
                type="number" 
                value={manualDurationMin}
                onChange={(e) => setManualDurationMin(Number(e.target.value))}
                className="bg-transparent text-3xl font-black text-white w-full outline-none"
                placeholder="0"
              />
              <span className="text-xs font-black text-text-dim uppercase tracking-widest shrink-0">Min</span>
           </div>
        </div>

        {/* RPE SLIDER */}
        <div className="space-y-4">
           <div className="flex justify-between items-end">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dim">Ansträngning (RPE)</label>
              <span className="text-2xl font-black italic text-accent-blue">{rpe}</span>
           </div>
           
           <input 
             type="range" 
             min="1" max="10" step="1"
             value={rpe}
             onChange={(e) => setRpe(Number(e.target.value))}
             className="w-full h-4 bg-white/10 rounded-full appearance-none cursor-pointer accent-accent-blue"
           />
           <p className="text-xs text-center font-bold text-white/50 italic">{getRpeDescription(rpe)}</p>
        </div>

        {/* FEELING SELECTOR */}
        <div className="space-y-4">
           <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dim block mb-2">Känsla</label>
           <div className="grid grid-cols-4 gap-2">
              {['pigg', 'stark', 'trött', 'sliten'].map((f) => (
                 <button
                   key={f}
                   onClick={() => setFeeling(f)}
                   className={`py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                      feeling === f 
                      ? 'bg-white text-black border-white scale-105 shadow-lg shadow-white/5' 
                      : 'bg-white/5 text-text-dim border-transparent hover:bg-white/10'
                   }`}
                 >
                   {f}
                 </button>
              ))}
           </div>
        </div>

        <button 
           onClick={() => onConfirm(rpe, feeling, manualDurationMin * 60)}
           className="w-full py-5 bg-[#2ed573] text-[#0f0d15] rounded-[24px] font-black italic text-xl uppercase tracking-widest shadow-[0_0_20px_rgba(46,213,115,0.3)] flex items-center justify-center gap-3 active:scale-95 transition-all mt-4"
        >
           <Check size={24} strokeWidth={3} /> Bekräfta & Spara
        </button>

      </div>
    </div>
  );
};