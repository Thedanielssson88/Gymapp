
import React from 'react';
import { MuscleGroup } from '../types';
import { MuscleStatus, getRecoveryColor } from '../utils/recovery';

interface RecoveryMapProps {
  status?: MuscleStatus;
  loadMap?: Record<string, number>;
  selectedMuscles?: MuscleGroup[];
  onToggleMuscle?: (muscle: MuscleGroup) => void;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const RecoveryMap: React.FC<RecoveryMapProps> = ({ 
  status, 
  loadMap,
  selectedMuscles = [], 
  onToggleMuscle, 
  interactive = false,
  size = 'md'
}) => {
  
  const getFill = (muscle: MuscleGroup | MuscleGroup[]) => {
    const muscles = Array.isArray(muscle) ? muscle : [muscle];
    
    if (interactive) {
      return muscles.some(m => selectedMuscles.includes(m)) ? '#ff2d55' : 'rgba(255,255,255,0.05)';
    }
    
    if (loadMap) {
      const count = muscles.reduce((acc, m) => acc + (loadMap[m] || 0), 0);
      if (count === 0) return 'rgba(255,255,255,0.03)';
      if (count === 1) return '#ff2d5588';
      if (count === 2) return '#ff2d55cc';
      return '#ff2d55';
    }
    
    if (status) {
      const scores = muscles.map(m => status[m] || 100);
      const minScore = Math.min(...scores);
      return getRecoveryColor(minScore);
    }
    
    return 'rgba(255,255,255,0.05)';
  };

  const handleClick = (muscle: MuscleGroup) => {
    if (interactive && onToggleMuscle) {
      onToggleMuscle(muscle);
    }
  };

  const dimensions = {
    sm: 'w-48 h-72',
    md: 'w-72 h-96',
    lg: 'w-96 h-[500px]'
  }[size];

  return (
    <div className={`flex flex-col items-center gap-4 py-4 w-full bg-gradient-to-b from-transparent to-[#0f0d15]/50 rounded-3xl`}>
      <div className={`relative ${dimensions} flex items-center justify-center`}>
        <svg viewBox="0 0 200 400" className="w-full h-full drop-shadow-[0_0_30px_rgba(255,45,85,0.1)]">
          {/* Detailed anatomical SVG mapping */}
          {/* Head & Neck */}
          <path d="M90 20 q10 -15 20 0 v20 h-20 z" fill="rgba(255,255,255,0.05)" />
          
          {/* Chest */}
          <path d="M65 50 h70 v40 q-35 15 -70 0 z" fill={getFill('Bröst')} className="cursor-pointer" onClick={() => handleClick('Bröst')} />
          
          {/* Abs */}
          <path d="M75 95 h50 v55 q-25 10 -50 0 z" fill={getFill('Mage')} className="cursor-pointer" onClick={() => handleClick('Mage')} />
          
          {/* Shoulders */}
          <circle cx="55" cy="55" r="14" fill={getFill('Axlar')} className="cursor-pointer" onClick={() => handleClick('Axlar')} />
          <circle cx="145" cy="55" r="14" fill={getFill('Axlar')} className="cursor-pointer" onClick={() => handleClick('Axlar')} />
          
          {/* Biceps */}
          <path d="M35 70 q-10 20 5 45 h10 q10 -25 0 -45 z" fill={getFill('Biceps')} className="cursor-pointer" onClick={() => handleClick('Biceps')} />
          <path d="M165 70 q10 20 -5 45 h-10 q-10 -25 0 -45 z" fill={getFill('Biceps')} className="cursor-pointer" onClick={() => handleClick('Biceps')} />
          
          {/* Forearms */}
          <path d="M35 125 v40 q0 10 5 10 h5 v-50 z" fill={getFill('Underarmar')} className="cursor-pointer" onClick={() => handleClick('Underarmar')} />
          <path d="M165 125 v40 q0 10 -5 10 h-5 v-50 z" fill={getFill('Underarmar')} className="cursor-pointer" onClick={() => handleClick('Underarmar')} />
          
          {/* Lats (Visible from front) - Fixed: Changed 'Lats' to 'Rygg' to match MuscleGroup type */}
          <path d="M60 80 q-15 30 0 60 h10 q-10 -30 0 -60 z" fill={getFill('Rygg')} />
          <path d="M140 80 q 15 30 0 60 h-10 q 10 -30 0 -60 z" fill={getFill('Rygg')} />

          {/* Quads */}
          <path d="M70 160 h25 v80 q-25 0 -25 -20 z" fill={getFill('Framsida lår')} className="cursor-pointer" onClick={() => handleClick('Framsida lår')} />
          <path d="M105 160 h25 v60 q0 20 -25 20 z" fill={getFill('Framsida lår')} className="cursor-pointer" onClick={() => handleClick('Framsida lår')} />
          
          {/* Calves */}
          <path d="M75 260 h15 v70 q-15 0 -15 -20 z" fill={getFill('Vader')} className="cursor-pointer" onClick={() => handleClick('Vader')} />
          <path d="M110 260 h15 v50 q0 20 -15 20 z" fill={getFill('Vader')} className="cursor-pointer" onClick={() => handleClick('Vader')} />
          
          {/* Outline Body */}
          <path d="M100 20 q20 0 20 20 v10 q40 0 50 15 q10 10 10 30 v100 q0 20 -10 20 h-10 v180 h-30 v-180 h-60 v 180 h-30 v -180 h-10 q-10 0 -10 -20 v-100 q0 -20 10 -30 q10 -15 50 -15 v-10 q0 -20 20 -20" 
                fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
        </svg>

        {/* Legend */}
        {!interactive && !loadMap && (
          <div className="absolute bottom-4 left-4 flex flex-col gap-2 bg-black/60 p-3 rounded-2xl backdrop-blur-md border border-white/5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ff2d55]" />
              <span className="text-[9px] font-black text-white/80 uppercase tracking-widest italic">Fatigued</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#5c5c66]" />
              <span className="text-[9px] font-black text-white/80 uppercase tracking-widest italic">Recovering</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-white/10" />
              <span className="text-[9px] font-black text-white/80 uppercase tracking-widest italic">Fresh</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
