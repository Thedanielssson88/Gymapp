import React, { useState } from 'react';
import { X, Check, ChevronUp, ChevronDown } from 'lucide-react';

interface NumberPickerModalProps {
  title: string;
  unit: string;
  value: number;
  step?: number;
  min?: number;
  max?: number;
  onSave: (value: number) => void;
  onClose: () => void;
}


export const NumberPickerModal: React.FC<NumberPickerModalProps> = ({
  title, unit, value, step = 1, min = 0, max = 999, onSave, onClose
}) => {
  const [localVal, setLocalVal] = useState(value);
  
  // Funktion för att hantera formatering av decimaler
  const handleStep = (direction: 'up' | 'down') => {
    setLocalVal(prev => {
      const newValue = direction === 'up' ? prev + step : prev - step;
      const roundedValue = parseFloat(newValue.toFixed(2)); // Behåll max 2 decimaler
      return Math.max(min, Math.min(max, roundedValue));
    });
  };

  return (
    // Z-index 200 säkerställer att den ligger över ALLT annat, inklusive footer-knappar
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 animate-in fade-in duration-200">
      
      {/* Backdrop - klick på denna stänger också modalen för säkerhets skull */}
      <div className="absolute inset-0 bg-[#0f0d15]/90 backdrop-blur-sm" onClick={onClose} />

      {/* MODAL-KORTET - Flyttat från botten till mitten */}
      <div className="relative w-full max-w-sm bg-[#1a1721] rounded-[40px] border border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.5)] p-8 animate-in zoom-in-95 duration-300">
        
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black italic uppercase text-white tracking-tighter">{title}</h3>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-text-dim hover:text-white transition-colors">
            <X size={20}/>
          </button>
        </div>

        {/* INPUT SEKTION MED STEG-KNAPPAR */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => handleStep('down')}
              className="p-4 bg-white/5 rounded-2xl text-accent-blue active:scale-90 transition-transform"
            >
              <ChevronDown size={32} strokeWidth={3} />
            </button>

            <div className="flex flex-col items-center">
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-black text-white">{localVal}</span>
                <span className="text-xl font-black italic text-accent-blue uppercase">{unit}</span>
              </div>
            </div>

            <button 
              onClick={() => handleStep('up')}
              className="p-4 bg-white/5 rounded-2xl text-accent-blue active:scale-90 transition-transform"
            >
              <ChevronUp size={32} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* SNABBVAL (RELATIVE) */}
        <div className="flex gap-2 overflow-x-auto pb-6 mb-4 scrollbar-hide justify-center">
          {[-10, -5, -2.5, 1, 2.5, 5, 10].map(diff => {
            const val = parseFloat((value + diff).toFixed(2));
            if (val < min || val > max) return null;
            return (
              <button
                key={diff}
                onClick={() => setLocalVal(val)}
                className="flex-shrink-0 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-black text-white hover:bg-white/10 transition-colors"
              >
                {val}
              </button>
            );
          })}
        </div>

        {/* SPARAKNAPP - Nu långt ifrån botten av skärmen */}
        <button 
          onClick={() => onSave(localVal)}
          className="w-full py-5 bg-white text-black rounded-[24px] font-black italic uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <Check size={24} strokeWidth={4} /> Spara
        </button>
      </div>
    </div>
  );
};
