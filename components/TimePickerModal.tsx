import React, { useState } from 'react';
import { X, Check, Timer } from 'lucide-react';

interface TimePickerModalProps {
  title: string;
  totalSeconds: number;
  onSave: (seconds: number) => void;
  onClose: () => void;
}

export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  title, totalSeconds, onSave, onClose
}) => {
  const [mins, setMins] = useState(Math.floor(totalSeconds / 60));
  const [secs, setSecs] = useState(totalSeconds % 60);

  const quickSecs = [0, 15, 30, 45];

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center px-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-[#0f0d15]/90 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-sm bg-[#1a1721] rounded-[40px] border border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.5)] p-8 animate-in zoom-in-95 duration-300">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-2">
            <Timer className="text-accent-blue" size={20} />
            <h3 className="text-xl font-black italic uppercase text-white">{title}</h3>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-text-dim"><X size={20}/></button>
        </div>

        <div className="flex justify-center items-center gap-4 mb-10">
          <div className="flex flex-col items-center">
            <input 
              type="number"
              value={mins}
              onChange={(e) => setMins(Math.min(999, Number(e.target.value)))}
              className="bg-white/5 w-24 h-24 rounded-3xl text-4xl font-black text-white text-center outline-none border border-white/10 focus:border-accent-blue"
            />
            <span className="text-[10px] font-black uppercase text-text-dim mt-2 tracking-widest">Min</span>
          </div>

          <span className="text-4xl font-black text-white">:</span>

          <div className="flex flex-col items-center">
            <input 
              type="number"
              value={secs}
              onChange={(e) => setSecs(Math.min(59, Number(e.target.value)))}
              className="bg-white/5 w-24 h-24 rounded-3xl text-4xl font-black text-white text-center outline-none border border-white/10 focus:border-accent-blue"
            />
            <span className="text-[10px] font-black uppercase text-text-dim mt-2 tracking-widest">Sek</span>
          </div>
        </div>

        <div className="flex justify-center gap-3 mb-10">
          {quickSecs.map(s => (
            <button
              key={s}
              onClick={() => setSecs(s)}
              className={`px-5 py-3 rounded-xl font-black transition-all ${secs === s ? 'bg-accent-blue text-white' : 'bg-white/5 text-text-dim'}`}
            >
              :{s.toString().padStart(2, '0')}
            </button>
          ))}
        </div>

        <button 
          onClick={() => onSave((mins * 60) + secs)}
          className="w-full py-5 bg-accent-blue text-white rounded-3xl font-black italic uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <Check size={24} strokeWidth={3} /> Spara Tid
        </button>
      </div>
    </div>
  );
};
