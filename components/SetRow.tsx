import React, { useState, useEffect, useRef } from 'react';
import { WorkoutSet, SetType, TrackingType } from '../types';
import { calculatePlates } from '../utils/plates';
import { Check, Plus, Calculator, Thermometer, Zap, AlertCircle, Clock, Play, Pause } from 'lucide-react';

interface SetRowProps {
  setIdx: number;
  set: WorkoutSet;
  isCompleted: boolean;
  onUpdate: (updates: Partial<WorkoutSet>) => void;
  onAddSet?: () => void;
  isLast?: boolean;
  trackingType?: TrackingType;
}

export const SetRow: React.FC<SetRowProps> = ({ 
  setIdx, 
  set, 
  isCompleted, 
  onUpdate,
  onAddSet,
  isLast,
  trackingType = 'reps_weight'
}) => {
  const [showPlates, setShowPlates] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // --- TIMER STATE ---
  const [timeLeft, setTimeLeft] = useState(set.reps || 0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const isTimeBased = trackingType === 'time_only';

  // Synka timeLeft om användaren ändrar sekunder manuellt och timern inte körs
  useEffect(() => {
    if (!isTimerRunning && !isCompleted) {
      setTimeLeft(set.reps || 0);
    }
  }, [set.reps, isTimerRunning, isCompleted]);

  // Timer Logik
  useEffect(() => {
    let interval: any;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      // Tiden är ute! Slutför setet automatiskt
      setIsTimerRunning(false);
      onUpdate({ completed: true });
      
      // Valfritt: Spela upp ett litet ljud eller vibration här om möjligt
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft, onUpdate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        setShowPlates(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const plates = calculatePlates(set.weight || 0);

  // --- LOGIK FÖR ATT BYTA TYP ---
  const toggleSetType = () => {
    const types: SetType[] = ['normal', 'warmup', 'drop', 'failure'];
    const currentType = set.type || 'normal';
    const nextIndex = (types.indexOf(currentType) + 1) % types.length;
    onUpdate({ type: types[nextIndex] });
  };

  // --- TIMER KONTROLL ---
  const handleTimerToggle = () => {
    if (isCompleted) {
      // Om setet redan är klart, återställ det för att kunna köra timern igen
      onUpdate({ completed: false });
      setTimeLeft(set.reps || 0);
    } else {
      setIsTimerRunning(!isTimerRunning);
    }
  };

  // --- DESIGN BASERAT PÅ TYP ---
  const getStyle = () => {
    switch (set.type) {
      case 'warmup': return {
        container: 'bg-yellow-500/5 border-yellow-500/30',
        text: 'text-yellow-500',
        subText: 'text-yellow-500/60',
        label: 'VÄRM',
        icon: <Thermometer size={12} className="text-yellow-500" />
      };
      case 'drop': return {
        container: 'bg-purple-500/5 border-purple-500/30',
        text: 'text-purple-500',
        subText: 'text-purple-500/60',
        label: 'DROP',
        icon: <Zap size={12} className="text-purple-500" />
      };
      case 'failure': return {
        container: 'bg-red-500/5 border-red-500/30',
        text: 'text-red-500',
        subText: 'text-red-500/60',
        label: 'FAIL',
        icon: <AlertCircle size={12} className="text-red-500" />
      };
      default: return {
        container: 'bg-[#13111a] border-white/5',
        text: 'text-white',
        subText: 'text-text-dim',
        label: 'SET',
        icon: null
      };
    }
  };

  const style = getStyle();

  return (
    <div className={`relative flex items-center gap-3 p-3 mb-2 rounded-2xl transition-all duration-300 border ${
      isCompleted 
        ? 'bg-green-500/5 border-green-500/10 opacity-60 grayscale-[0.3]' 
        : `${style.container} shadow-lg scale-[1.01]`
    }`}>
      
      {/* 1. SET NUMMER / TYP-KNAPP */}
      <button 
        onClick={toggleSetType}
        className="w-10 flex flex-col items-center justify-center border-r border-white/5 pr-2 active:scale-90 transition-transform cursor-pointer group"
      >
        <div className="flex items-center gap-1 mb-0.5">
           {style.icon}
           <span className={`text-[9px] font-black uppercase tracking-wider ${style.subText}`}>
             {style.label}
           </span>
        </div>
        <span className={`text-xl font-black italic ${isCompleted ? 'text-green-500' : style.text}`}>
          {setIdx + 1}
        </span>
      </button>

      {/* 2. VIKT (KG) ELLER KLOCKA */}
      <div className="flex-1 relative">
        {isTimeBased ? (
          <div className="flex items-center justify-center h-full opacity-20 py-2">
            <Clock size={20} />
          </div>
        ) : (
          <>
            <label className={`text-[8px] font-black uppercase tracking-wider block mb-0.5 ${style.subText}`}>KG</label>
            <div className="relative flex items-center">
              <input 
                type="number" 
                value={set.weight || ''} 
                onChange={(e) => onUpdate({ weight: Number(e.target.value) })} 
                className={`w-full bg-transparent text-2xl font-black outline-none placeholder-white/10 transition-colors ${isCompleted ? 'text-green-500/50' : 'text-white'}`}
                placeholder="0"
              />
              {!isCompleted && set.weight > 20 && (
                 <button 
                   onClick={() => setShowPlates(!showPlates)}
                   className="absolute right-0 p-2 text-accent-blue opacity-50 hover:opacity-100 active:scale-95"
                 >
                   <Calculator size={16} />
                 </button>
              )}
            </div>
          </>
        )}

        {/* PLATE CALCULATOR POPUP */}
        {showPlates && !isTimeBased && (
          <div ref={popupRef} className="absolute bottom-full left-0 mb-3 bg-[#1a1721] border border-white/10 p-4 rounded-2xl shadow-2xl z-50 w-48 animate-in slide-in-from-bottom-2 fade-in">
             <div className="text-[10px] font-bold text-text-dim mb-2 text-center uppercase tracking-wider">
               Per sida (Stång 20kg)
             </div>
             <div className="space-y-1.5">
                {plates.map((p, i) => (
                  <div key={i} className="flex justify-between text-xs font-bold">
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-4 rounded-sm" style={{backgroundColor: p.color, border: '1px solid rgba(255,255,255,0.2)'}}></div>
                       <span className="text-white">{p.weight}kg</span>
                    </div>
                    <span className="text-text-dim">x{p.count}</span>
                  </div>
                ))}
                {plates.length === 0 && <span className="text-xs text-text-dim text-center block">Inga skivor</span>}
             </div>
          </div>
        )}
      </div>

      {/* 3. REPS ELLER SEKUNDER */}
      <div className="flex-1 border-l border-white/5 pl-3">
        <label className={`text-[8px] font-black uppercase tracking-wider block mb-0.5 ${style.subText}`}>
          {isTimeBased ? 'SEK' : 'REPS'}
        </label>
        <input 
          type="number" 
          value={set.reps || ''} 
          onChange={(e) => onUpdate({ reps: Number(e.target.value) })} 
          disabled={isTimerRunning}
          className={`w-full bg-transparent text-2xl font-black outline-none placeholder-white/10 transition-colors ${isCompleted ? 'text-green-500/50' : 'text-white'} ${isTimerRunning ? 'opacity-50' : ''}`}
          placeholder="0"
        />
      </div>

      {/* 4. CHECK BUTTON ELLER TIMER */}
      <div className="pl-2">
        {isTimeBased ? (
           <button 
             onClick={handleTimerToggle}
             className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-90 shadow-lg ${
               isCompleted 
                 ? 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.4)]' 
                 : isTimerRunning
                   ? 'bg-accent-blue text-white animate-pulse'
                   : 'bg-[#25222e] text-accent-blue border border-accent-blue/30 hover:border-accent-blue'
             }`}
           >
             {isCompleted ? (
               <Check size={24} strokeWidth={4} />
             ) : isTimerRunning ? (
               <span className="text-sm font-black font-mono">{timeLeft}</span>
             ) : (
               <Play size={20} fill="currentColor" />
             )}
           </button>
        ) : isLast && !isCompleted ? (
           <button 
             onClick={onAddSet}
             className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-text-dim hover:bg-white/10 hover:text-white transition-all active:scale-90"
           >
             <Plus size={20} />
           </button>
        ) : (
           <button 
             onClick={() => onUpdate({ completed: !isCompleted })}
             className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-90 shadow-lg ${
               isCompleted 
                 ? 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.4)]' 
                 : 'bg-[#25222e] text-white/20 border border-white/5 hover:border-accent-pink/50 hover:text-accent-pink'
             }`}
           >
             <Check size={24} strokeWidth={4} />
           </button>
        )}
      </div>
    </div>
  );
};