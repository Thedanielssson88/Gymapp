import React, { useState } from 'react';
import { X, Check, Timer, ChevronRight, ChevronLeft } from 'lucide-react';

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
  
  // Paginering state för minuter: 0 = 0-4, 5 = 5-9, osv.
  const [minutePageStart, setMinutePageStart] = useState(0); 

  const quickSecs = [0, 15, 30, 45];
  
  // Generera knappar för minuter baserat på vilken "sida" vi är på
  // Om minutePageStart är 0, får vi [0, 1, 2, 3, 4]
  const minuteButtons = Array.from({ length: 5 }, (_, i) => i + minutePageStart);

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center px-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-[#0f0d15]/90 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-sm bg-[#1a1721] rounded-[40px] border border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.5)] p-8 animate-in zoom-in-95 duration-300">
        
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Timer className="text-accent-blue" size={20} />
            <h3 className="text-xl font-black italic uppercase text-white">{title}</h3>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-text-dim"><X size={20}/></button>
        </div>

        {/* TIME DISPLAY (MANUAL INPUT) */}
        <div className="flex justify-center items-center gap-4 mb-8">
          <div className="flex flex-col items-center">
            <input 
              type="number"
              value={mins}
              onChange={(e) => setMins(Math.min(999, Number(e.target.value)))}
              className="bg-white/5 w-20 h-20 rounded-2xl text-3xl font-black text-white text-center outline-none border border-white/10 focus:border-accent-blue transition-colors"
            />
            <span className="text-[10px] font-black uppercase text-text-dim mt-2 tracking-widest">Min</span>
          </div>

          <span className="text-2xl font-black text-white/20">:</span>

          <div className="flex flex-col items-center">
            <input 
              type="number"
              value={secs}
              onChange={(e) => setSecs(Math.min(59, Number(e.target.value)))}
              className="bg-white/5 w-20 h-20 rounded-2xl text-3xl font-black text-white text-center outline-none border border-white/10 focus:border-accent-blue transition-colors"
            />
            <span className="text-[10px] font-black uppercase text-text-dim mt-2 tracking-widest">Sek</span>
          </div>
        </div>

        {/* MINUTE SELECTOR */}
        <div className="mb-6">
            <div className="flex justify-between items-center mb-2 px-1">
                <span className="text-[10px] font-black uppercase text-text-dim tracking-widest">
                    Välj Minuter ({minutePageStart}-{minutePageStart + 4})
                </span>
                <div className="flex gap-1">
                    <button 
                        onClick={() => setMinutePageStart(Math.max(0, minutePageStart - 5))}
                        disabled={minutePageStart === 0}
                        className="p-1 rounded hover:bg-white/10 disabled:opacity-20 text-white transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button 
                        onClick={() => setMinutePageStart(minutePageStart + 5)}
                        className="p-1 rounded hover:bg-white/10 text-white transition-colors"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-5 gap-2">
                {minuteButtons.map(m => (
                    <button
                        key={m}
                        onClick={() => setMins(m)}
                        className={`h-12 rounded-xl text-sm font-black transition-all border border-transparent ${
                            mins === m 
                            ? 'bg-accent-blue text-black shadow-lg shadow-accent-blue/20' 
                            : 'bg-white/5 text-white hover:bg-white/10 hover:border-white/10'
                        }`}
                    >
                        {m}
                    </button>
                ))}
            </div>
        </div>

        {/* SECOND SELECTOR */}
        <div className="mb-8">
            <span className="text-[10px] font-black uppercase text-text-dim tracking-widest mb-2 block px-1">
                Välj Sekunder
            </span>
            <div className="grid grid-cols-4 gap-2">
            {quickSecs.map(s => (
                <button
                key={s}
                onClick={() => setSecs(s)}
                className={`h-12 rounded-xl text-sm font-black transition-all border border-transparent ${
                    secs === s 
                    ? 'bg-white text-black shadow-lg' 
                    : 'bg-white/5 text-white hover:bg-white/10 hover:border-white/10'
                }`}
                >
                :{s.toString().padStart(2, '0')}
                </button>
            ))}
            </div>
        </div>

        <button 
          onClick={() => onSave((mins * 60) + secs)}
          className="w-full py-5 bg-accent-blue text-white rounded-3xl font-black italic uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform hover:brightness-110"
        >
          <Check size={24} strokeWidth={3} /> SPARA TID
        </button>
      </div>
    </div>
  );
};
