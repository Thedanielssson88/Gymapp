import React, { useEffect, useRef, useMemo } from 'react';
import { X, Check } from 'lucide-react';
import { registerBackHandler } from '../utils/backHandler';

interface TimePickerModalProps {
  title: string;
  totalSeconds: number;
  onClose: () => void;
  onSelect: (seconds: number) => void;
}

export const TimePickerModal: React.FC<TimePickerModalProps> = ({ title, totalSeconds, onClose, onSelect }) => {
  const currentMins = Math.floor(totalSeconds / 60);
  const currentSecs = totalSeconds % 60;

  const minScrollRef = useRef<HTMLDivElement>(null);
  const secScrollRef = useRef<HTMLDivElement>(null);

  const minuteOptions = useMemo(() => Array.from({ length: 61 }, (_, i) => i), []); // 0-60 min
  const secondOptions = useMemo(() => Array.from({ length: 12 }, (_, i) => i * 5), []); // 0, 5, 10... 55 sek
  
  const closestSecs = useMemo(() => secondOptions.reduce((prev, curr) => (Math.abs(curr - currentSecs) < Math.abs(prev - currentSecs) ? curr : prev)), [currentSecs, secondOptions]);

  useEffect(() => {
    const unregister = registerBackHandler(onClose);
    
    // Auto-scroll till nuvarande värden
    const scrollToValue = (ref: React.RefObject<HTMLDivElement>, val: number) => {
      if (ref.current) {
        const el = ref.current.querySelector(`[data-value="${val}"]`);
        if (el) el.scrollIntoView({ inline: 'center', behavior: 'auto' });
      }
    };

    setTimeout(() => {
      scrollToValue(minScrollRef, currentMins);
      scrollToValue(secScrollRef, closestSecs);
    }, 50);

    return unregister;
  }, []); // Run only on mount

  const handleSave = () => {
    // onSelect is called on click, so here we just close
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[400] bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
      <div className="bg-[#1a1721] w-full max-w-sm rounded-[40px] border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-xl font-black italic uppercase text-white tracking-tighter">{title}</h3>
          <button onClick={onClose} className="p-2 text-text-dim"><X size={24}/></button>
        </div>

        <div className="p-8 space-y-8">
          {/* MINUTER */}
          <div>
            <label className="text-[10px] font-black uppercase text-accent-blue tracking-widest ml-4 mb-2 block">Minuter</label>
            <div ref={minScrollRef} className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory px-[40%]">
              {minuteOptions.map(m => (
                <button
                  key={m}
                  data-value={m}
                  onClick={() => onSelect(m * 60 + closestSecs)} // Use closestSecs to keep seconds aligned
                  className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black snap-center transition-all ${
                    m === currentMins ? 'bg-accent-blue text-black scale-110' : 'bg-white/5 text-text-dim'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* SEKUNDER */}
          <div>
            <label className="text-[10px] font-black uppercase text-accent-pink tracking-widest ml-4 mb-2 block">Sekunder</label>
            <div ref={secScrollRef} className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory px-[40%]">
              {secondOptions.map(s => (
                <button
                  key={s}
                  data-value={s}
                  onClick={() => onSelect(currentMins * 60 + s)}
                  className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black snap-center transition-all ${
                    s === closestSecs ? 'bg-accent-pink text-white scale-110' : 'bg-white/5 text-text-dim'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full py-5 bg-white text-black rounded-[24px] font-black uppercase italic tracking-widest active:scale-95 transition-all shadow-xl"
          >
            Spara tid
          </button>
        </div>
      </div>
    </div>
  );
};
