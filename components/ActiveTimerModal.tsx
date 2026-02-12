import React, { useState, useEffect } from 'react';
import { X, Play, Pause, Check, AlertCircle } from 'lucide-react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

interface ActiveTimerModalProps {
  targetSeconds: number;
  onComplete: (seconds: number, isFail: boolean) => void;
  onCancel: () => void;
  vibrateEnabled?: boolean; // Ny prop för inställningar
}

export const ActiveTimerModal: React.FC<ActiveTimerModalProps> = ({ 
  targetSeconds, 
  onComplete, 
  onCancel, 
  vibrateEnabled = true 
}) => {
  const [timeLeft, setTimeLeft] = useState(targetSeconds);
  const [isActive, setIsActive] = useState(true);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const newValue = prev - 1;
          
          // Hantera vibrationer
          if (vibrateEnabled) {
            if (newValue <= 5 && newValue > 0) {
              Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
            } else if (newValue === 0) {
              Haptics.notification({ type: NotificationType.Success }).catch(() => {});
            }
          }
          
          return newValue;
        });
        setElapsed((prev) => prev + 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, vibrateEnabled]);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // SVG Cirkel-matematik
  const radius = 100; // Något mindre för att garantera att den får plats
  const circumference = 2 * Math.PI * radius;
  const progress = targetSeconds > 0 ? Math.min(100, (elapsed / targetSeconds) * 100) : 0;
  const strokeDashoffset = circumference * (1 - progress / 100);

  return (
    <div className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
      <div className="w-full max-w-sm bg-[#1a1721] border border-white/10 rounded-[40px] p-8 flex flex-col items-center relative shadow-2xl">
        
        <button onClick={onCancel} className="absolute top-6 right-6 p-2 bg-white/5 rounded-full text-text-dim hover:text-white">
          <X size={24} />
        </button>

        <h3 className="text-sm font-black uppercase text-text-dim tracking-widest mb-8">Timer</h3>

        {/* SVG CONTAINER 
            Använder viewBox för att skala innehållet korrekt oavsett storlek på div.
            padding på 10px inuti viewBoxen (center 120, radie 100 + stroke 8 = 108)
        */}
        <div className="relative mb-10 w-64 h-64 flex items-center justify-center">
           <svg className="w-full h-full transform -rotate-90" viewBox="0 0 240 240">
             {/* Bakgrundscirkel */}
             <circle 
               cx="120" cy="120" r={radius} 
               stroke="currentColor" strokeWidth="12" fill="transparent" 
               className="text-white/5" 
             />
             {/* Progresscirkel */}
             <circle 
                cx="120" cy="120" r={radius} 
                stroke="currentColor" strokeWidth="12" fill="transparent" 
                strokeDasharray={circumference} 
                strokeDashoffset={strokeDashoffset} 
                strokeLinecap="round"
                className="text-accent-blue transition-all duration-1000 ease-linear" 
             />
           </svg>
           
           <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-6xl font-black italic text-white tabular-nums tracking-tighter">
                {formatTime(timeLeft)}
              </span>
              <span className="text-xs font-bold text-text-dim uppercase mt-2">Kvar</span>
           </div>
        </div>

        <div className="flex gap-4 w-full mb-8">
           <button 
             onClick={() => setIsActive(!isActive)}
             className={`flex-1 h-16 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-sm transition-all ${isActive ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'bg-green-500 text-black shadow-lg shadow-green-500/20'}`}
           >
             {isActive ? <><Pause size={20} fill="currentColor" /> Pausa</> : <><Play size={20} fill="currentColor" /> Starta</>}
           </button>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full">
           <button 
             onClick={() => onComplete(elapsed, true)} 
             className="h-14 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center gap-2 font-black uppercase text-xs tracking-widest hover:bg-red-500/20 active:scale-95 transition-all"
           >
             <AlertCircle size={16} /> Fail ({formatTime(elapsed)})
           </button>
           <button 
             onClick={() => onComplete(targetSeconds, false)} 
             className="h-14 rounded-xl bg-green-500 text-black flex items-center justify-center gap-2 font-black uppercase text-xs tracking-widest shadow-lg hover:bg-green-400 active:scale-95 transition-all"
           >
             <Check size={18} strokeWidth={4} /> Klar ({formatTime(targetSeconds)})
           </button>
        </div>

      </div>
    </div>
  );
};
