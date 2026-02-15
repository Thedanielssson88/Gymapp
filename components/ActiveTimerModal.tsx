import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { UserProfile } from '../types';

interface ActiveTimerModalProps {
  initialSeconds: number;
  onClose: () => void;
  onComplete: (actualSeconds: number) => void;
  exerciseName: string;
  userProfile: UserProfile | null;
}

export const ActiveTimerModal: React.FC<ActiveTimerModalProps> = ({
  initialSeconds,
  onClose,
  onComplete,
  exerciseName,
  userProfile
}) => {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isOvertime, setIsOvertime] = useState(false);
  const [totalElapsed, setTotalElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTotalElapsed(prev => prev + 1);
      
      if (!isOvertime) {
        if (timeLeft > 0) {
          setTimeLeft(prev => prev - 1);
        } else {
          setIsOvertime(true);
          if (userProfile?.settings?.vibrateTimer) {
            triggerHaptic.success(userProfile);
          }
          setTimeLeft(1); // Börja räkna uppåt
        }
      } else {
        setTimeLeft(prev => prev + 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isOvertime, userProfile]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[500] bg-black/95 flex items-center justify-center p-6 animate-in fade-in">
      <div className="bg-[#1a1721] w-full max-w-sm rounded-[40px] border border-white/10 p-8 flex flex-col items-center text-center shadow-2xl">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-text-dim mb-2">{exerciseName}</h3>
        
        {/* Timer Display */}
        <div className={`text-7xl font-black italic mb-2 ${isOvertime ? 'text-green-500' : 'text-white'}`}>
          {isOvertime ? `+${formatTime(timeLeft)}` : formatTime(timeLeft)}
        </div>
        
        {isOvertime && (
          <div className="text-[10px] font-black uppercase tracking-widest text-green-500/60 mb-8 animate-pulse">
            Övertid pågår
          </div>
        )}

        <div className="w-full space-y-3 mt-4">
          {/* Huvudknapp: Klar med TOTAL tid */}
          <button 
            onClick={() => onComplete(totalElapsed)}
            className="w-full py-5 bg-green-500 text-white rounded-[24px] font-black uppercase italic tracking-widest shadow-lg shadow-green-900/20 active:scale-95 transition-all"
          >
            Klar ({formatTime(totalElapsed)})
          </button>

          {/* Sekundär knapp: Sluta på förinställd tid */}
          {!isOvertime && (
            <button 
              onClick={() => onComplete(initialSeconds)}
              className="w-full py-4 bg-white/5 text-white/60 rounded-[20px] text-xs font-black uppercase tracking-widest active:scale-95 transition-all"
            >
              Klar ({formatTime(initialSeconds)})
            </button>
          )}

          <button 
            onClick={onClose}
            className="w-full py-4 text-red-500/50 text-[10px] font-black uppercase tracking-widest"
          >
            Avbryt
          </button>
        </div>
      </div>
    </div>
  );
};
