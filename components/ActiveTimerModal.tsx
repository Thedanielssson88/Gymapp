import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { haptics } from '../utils/haptics';
import { registerBackHandler } from '../utils/backHandler';

interface ActiveTimerModalProps {
  initialSeconds: number;
  onClose: () => void;
  onComplete: (actualSeconds: number) => void;
  exerciseName: string;
}

export const ActiveTimerModal: React.FC<ActiveTimerModalProps> = ({
  initialSeconds, onClose, onComplete, exerciseName
}) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [isOvertime, setIsOvertime] = useState(false);

  // Centrerad och säker radie för att rymmas på alla skärmar
  const radius = 110; 
  const circumference = 2 * Math.PI * radius;
  const progress = isOvertime ? 1 : (initialSeconds > 0 ? timeLeft / initialSeconds : 0);
  const strokeDashoffset = circumference - progress * circumference;

  useEffect(() => {
    const unregister = registerBackHandler(onClose);
    const timer = setInterval(() => {
      setTotalElapsed(prev => prev + 1);
      if (!isOvertime) {
        if (timeLeft > 0) setTimeLeft(prev => prev - 1);
        else { setIsOvertime(true); haptics.impact(); }
      } else {
        setTimeLeft(prev => prev + 1);
      }
    }, 1000);
    return () => { clearInterval(timer); unregister(); };
  }, [timeLeft, isOvertime]);

  return (
    <div className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-sm flex flex-col items-center">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-text-dim mb-12">{exerciseName}</h3>
        
        {/* Centrerad Cirkel-container */}
        <div className="relative flex items-center justify-center w-64 h-64 mb-16">
          <svg className="transform -rotate-90 w-full h-full overflow-visible">
            <circle cx="50%" cy="50%" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/5" />
            <circle
              cx="50%" cy="50%" r={radius} stroke="currentColor" strokeWidth="12" fill="transparent"
              strokeDasharray={circumference}
              style={{ strokeDashoffset, transition: isOvertime ? 'none' : 'stroke-dashoffset 1s linear' }}
              className={`${isOvertime ? 'text-green-500' : 'text-accent-blue'}`}
              strokeLinecap="round"
            />
          </svg>
          
          <div className="absolute flex flex-col items-center">
            <div className={`text-6xl font-black italic tracking-tighter ${isOvertime ? 'text-green-500' : 'text-white'}`}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
            {isOvertime && <span className="text-[10px] font-black text-green-500 uppercase tracking-widest animate-pulse mt-2">Övertid</span>}
          </div>
        </div>

        <div className="w-full space-y-4 px-6">
          <button onClick={() => onComplete(totalElapsed)} className="w-full py-5 bg-green-500 text-white rounded-3xl font-black uppercase italic tracking-widest shadow-xl flex items-center justify-center gap-2">
            <Check size={20} strokeWidth={3} /> Klar (Total: {Math.floor(totalElapsed / 60)}:{(totalElapsed % 60).toString().padStart(2, '0')})
          </button>
          <button onClick={() => onComplete(initialSeconds)} className="w-full py-4 bg-white/5 text-white/40 rounded-2xl text-[10px] font-black uppercase tracking-widest">
            Klar (Enligt pass: {Math.floor(initialSeconds / 60)}:{(initialSeconds % 60).toString().padStart(2, '0')})
          </button>
          <button onClick={onClose} className="w-full text-red-500/50 text-[10px] font-black uppercase tracking-widest mt-4">Avbryt</button>
        </div>
      </div>
    </div>
  );
};
