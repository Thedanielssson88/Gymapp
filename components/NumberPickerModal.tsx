import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Check, ChevronUp, ChevronDown, Scale } from 'lucide-react';
import { PlateDisplay } from './PlateDisplay';
import { UserProfile } from '../types';
import { triggerHaptic } from '../utils/haptics';
import { registerBackHandler } from '../utils/backHandler';

interface NumberPickerModalProps {
  title: string;
  unit: string;
  value: number;
  step?: number;
  min?: number;
  max?: number;
  precision?: number;
  barWeight?: number;
  availablePlates?: number[];
  onSave: (value: number) => void;
  onClose: () => void;
  userProfile?: UserProfile;
}

export const NumberPickerModal: React.FC<NumberPickerModalProps> = ({
  title, unit, value, step = 1, min = 0, max = 99999, precision = 2, barWeight = 0, onSave, onClose, availablePlates, userProfile
}) => {
  const [localVal, setLocalVal] = useState(value);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return registerBackHandler(onClose);
  }, [onClose]);

  const handleFinalSave = () => {
    const num = localVal || 0;
    
    // Special rounding for barbell exercises
    if (unit === 'kg' && barWeight > 0 && step === 2.5) {
        const plateWeight = num - barWeight;
        if (plateWeight > 0) {
            const roundedPlateWeight = Math.round(plateWeight / 2.5) * 2.5;
            const finalWeight = barWeight + roundedPlateWeight;
            onSave(Math.max(min, Math.min(max, finalWeight)));
        } else {
            onSave(Math.max(min, Math.min(max, barWeight)));
        }
    } else {
        const rounded = precision === 0 ? Math.round(num) : parseFloat(num.toFixed(precision));
        onSave(Math.max(min, Math.min(max, rounded)));
    }
  };

  // --- METER-SPECIFIC UI ---
  if (unit === 'm') {
    const m_step = 50;
    const m_max = 10000;
    const options = useMemo(() => {
      const opts = [];
      for (let i = 0; i <= m_max; i += m_step) {
        opts.push(i);
      }
      return opts;
    }, []);
    
    const formatDisplayValue = (val: number) => {
      if (val >= 1000) {
        const km = val / 1000;
        return `${km.toLocaleString('sv-SE')} Km`;
      }
      return val.toString();
    };

    useEffect(() => {
        if (scrollRef.current) {
            const el = scrollRef.current.querySelector(`[data-value="${localVal}"]`);
            if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center' });
        }
    }, [localVal]);

    return (
      <div className="fixed inset-0 z-[300] flex items-center justify-center px-4 animate-in fade-in duration-200">
        <div className="absolute inset-0 bg-[#0f0d15]/95 backdrop-blur-sm" onClick={onClose} />
        <div className="relative w-full max-w-sm bg-[#1a1721] rounded-[40px] border border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.5)] p-8 animate-in zoom-in-95 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black italic uppercase text-white tracking-tighter">{title}</h3>
            <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-text-dim hover:text-white transition-colors"><X size={20}/></button>
          </div>
          <div className="text-center text-5xl font-black italic text-accent-blue mb-10 flex items-baseline justify-center gap-2">
            {formatDisplayValue(localVal)}
            {localVal < 1000 && <span className="text-xl uppercase not-italic text-text-dim">m</span>}
          </div>
          <div ref={scrollRef} className="w-full flex gap-4 overflow-x-auto pb-8 scrollbar-hide snap-x snap-mandatory px-[40%] mb-6">
            {options.map((opt) => (
              <button key={opt} data-value={opt} onClick={() => setLocalVal(opt)} className={`flex-shrink-0 min-w-[64px] h-16 px-4 rounded-2xl flex items-center justify-center text-sm font-black snap-center transition-all ${opt === localVal ? 'bg-accent-blue text-black scale-125 shadow-lg' : 'bg-white/5 text-text-dim'}`}>
                {formatDisplayValue(opt)}
              </button>
            ))}
          </div>
          <button onClick={() => { onSave(localVal); onClose(); }} className="w-full py-5 bg-white text-black rounded-[24px] font-black italic uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-transform">
            <Check size={24} strokeWidth={4} /> Spara
          </button>
        </div>
      </div>
    );
  }

  // --- UI FOR KG (NEW) & REPS (OLD) ---
  const quickWeights = Array.from({ length: 30 }, (_, i) => (i + 1) * 5);

  const scrollToCurrent = (val: number, behavior: ScrollBehavior = 'smooth') => {
    if (scrollRef.current) {
      const closestQuickValue = Math.round(val / 5) * 5;
      const element = scrollRef.current.querySelector(`[id="quick-weight-${closestQuickValue}"]`);
      if (element) {
        element.scrollIntoView({ behavior, block: 'nearest', inline: 'center' });
      }
    }
  };
  
  useEffect(() => {
    if (unit === 'kg') {
      const timer = setTimeout(() => scrollToCurrent(localVal, 'auto'), 50);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleStepChange = (delta: number) => {
    const newValue = Math.max(0, localVal + delta);
    setLocalVal(newValue);
    if (unit === 'kg') scrollToCurrent(newValue);
    if (userProfile && newValue !== localVal) {
      triggerHaptic.tick(userProfile);
    }
  };

  const quickValuesReps = useMemo(() => {
    if(unit !== 'reps') return [];
    if (localVal <= 5) return [1, 3, 5, 8, 10, 12, 15];
    return [localVal - 5, localVal - 2, localVal - 1, localVal + 1, localVal + 2, localVal + 5];
  }, [localVal, unit]);

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center px-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-[#0f0d15]/95 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-[#1a1721] rounded-[40px] border border-white/10 shadow-[0_32px_64px_rgba(0,0,0,0.5)] p-6 animate-in zoom-in-95 duration-300">
        
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black italic uppercase text-white tracking-tighter">{title}</h3>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-text-dim hover:text-white transition-colors"><X size={20}/></button>
        </div>

        {unit === 'kg' ? (
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => handleStepChange(-step)} className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 text-xl font-bold text-white active:scale-90 transition-transform flex items-center justify-center">
              -{step}
            </button>
            <div className="text-center">
              <span className="text-6xl font-black text-white italic tracking-tighter">
                {localVal % 1 === 0 ? localVal : localVal.toFixed(1)}
              </span>
              <span className="text-text-dim ml-2 font-bold uppercase text-xs">{unit}</span>
            </div>
            <button onClick={() => handleStepChange(step)} className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 text-xl font-bold text-white active:scale-90 transition-transform flex items-center justify-center">
              +{step}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center mb-6">
            <div className="flex items-center gap-4 w-full justify-between">
              <button onClick={() => handleStepChange(-step)} className="p-4 bg-white/5 rounded-2xl text-accent-blue active:scale-90 transition-transform"><ChevronDown size={32} strokeWidth={3} /></button>
              <div className="flex-1 flex flex-col items-center">
                <input type="text" inputMode={precision === 0 ? "numeric" : "decimal"} value={localVal.toString()} onChange={(e) => setLocalVal(Number(e.target.value.replace(/[^0-9.,]/g, '').replace(',', '.')))} onFocus={(e) => e.target.select()} className="text-6xl font-black text-white w-full bg-transparent outline-none text-center py-2 select-all"/>
                <span className="text-sm font-black italic text-accent-blue uppercase tracking-widest mt-1">{unit}</span>
              </div>
              <button onClick={() => handleStepChange(step)} className="p-4 bg-white/5 rounded-2xl text-accent-blue active:scale-90 transition-transform"><ChevronUp size={32} strokeWidth={3} /></button>
            </div>
          </div>
        )}
        
        {unit === 'kg' && barWeight > 0 && <PlateDisplay weight={localVal} barWeight={barWeight} availablePlates={availablePlates} />}
        
        {unit === 'kg' ? (
          <div className="my-8 relative">
            <div className="flex justify-between items-center mb-3 px-1">
              <p className="text-[10px] text-text-dim font-bold uppercase tracking-wider">Dra för att snabbspola</p>
              <span className="text-[10px] text-accent-blue font-black uppercase">5kg intervall</span>
            </div>
            <div ref={scrollRef} className="flex gap-3 overflow-x-auto pb-6 pt-2 px-10 scrollbar-hide snap-x" style={{ scrollbarWidth: 'none' }}>
              {quickWeights.map((w) => {
                const isSelected = Math.round(localVal / 5) * 5 === w;
                return (
                  <button key={w} id={`quick-weight-${w}`} onClick={() => { setLocalVal(w); scrollToCurrent(w); }} className={`flex-shrink-0 w-16 h-16 rounded-2xl border-2 snap-center flex flex-col items-center justify-center transition-all duration-300 ${isSelected ? 'bg-accent-blue border-accent-blue text-white scale-110 shadow-xl shadow-accent-blue/30 z-10' : 'bg-white/5 border-white/10 text-text-dim scale-90 opacity-60'}`}>
                    <span className="text-lg font-black">{w}</span>
                    <span className="text-[8px] font-bold uppercase opacity-60">kg</span>
                  </button>
                );
              })}
            </div>
            <div className="absolute left-0 top-8 bottom-8 w-10 bg-gradient-to-r from-[#1a1721] to-transparent pointer-events-none z-10" />
            <div className="absolute right-0 top-8 bottom-8 w-10 bg-gradient-to-l from-[#1a1721] to-transparent pointer-events-none z-10" />
          </div>
        ) : (
          <div className="border-t border-white/5 pt-6 space-y-3 mb-6">
            <p className="text-center text-[10px] font-black uppercase tracking-widest text-text-dim">Smarta Förslag</p>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide justify-center">
              {quickValuesReps.map(val => (
                <button key={val} onClick={() => setLocalVal(val)} className="flex-shrink-0 px-5 py-3 bg-white/5 border border-white/10 rounded-xl text-[11px] font-black text-white hover:bg-accent-blue/20 hover:border-accent-blue/50 transition-colors">
                  {val}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <button onClick={onClose} className="py-4 rounded-2xl bg-white/5 text-text-dim font-bold uppercase tracking-widest text-xs active:bg-white/10 transition-colors">Avbryt</button>
          <button onClick={handleFinalSave} className="py-4 rounded-2xl bg-accent-blue text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-accent-blue/20 active:scale-95 transition-all">Bekräfta</button>
        </div>
      </div>
    </div>
  );
};
