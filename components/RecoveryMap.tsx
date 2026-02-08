
import React, { useState } from 'react';
import { MuscleGroup } from '../types';
import { MuscleStatus, getRecoveryColor } from '../utils/recovery';
import { RotateCcw } from 'lucide-react';

interface RecoveryMapProps {
  status?: MuscleStatus;
  loadMap?: Record<string, number>;
  selectedMuscles?: MuscleGroup[];
  onToggleMuscle?: (muscle: MuscleGroup) => void;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

type ViewSide = 'front' | 'back';

export const RecoveryMap: React.FC<RecoveryMapProps> = ({ 
  status, 
  loadMap,
  selectedMuscles = [], 
  onToggleMuscle, 
  interactive = false,
  size = 'md'
}) => {
  const [side, setSide] = useState<ViewSide>('front');

  const getFill = (muscle: MuscleGroup | MuscleGroup[]) => {
    const muscles = Array.isArray(muscle) ? muscle : [muscle];
    
    if (interactive) {
      return muscles.some(m => selectedMuscles.includes(m)) ? '#ff2d55' : 'rgba(255,255,255,0.05)';
    }
    
    if (loadMap) {
      const count = muscles.reduce((acc, m) => acc + (loadMap[m] || 0), 0);
      if (count === 0) return 'rgba(255,255,255,0.03)';
      if (count === 1) return '#ff2d5588';
      if (count >= 2) return '#ff2d55';
      return 'rgba(255,255,255,0.05)';
    }
    
    if (status) {
      const scores = muscles.map(m => status[m] ?? 100);
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
    md: 'w-72 h-[400px]',
    lg: 'w-full h-[500px]'
  }[size];

  const renderFront = () => (
    <svg viewBox="0 0 200 400" className="w-full h-full animate-in fade-in zoom-in-95 duration-500">
      {/* Head & Neck */}
      <path d="M90 20 q10 -15 20 0 v20 h-20 z" fill={getFill('Nacke')} onClick={() => handleClick('Nacke')} className="cursor-pointer" />
      
      {/* Shoulders (Front) */}
      <circle cx="55" cy="65" r="12" fill={getFill('Axlar')} onClick={() => handleClick('Axlar')} className="cursor-pointer" />
      <circle cx="145" cy="65" r="12" fill={getFill('Axlar')} onClick={() => handleClick('Axlar')} className="cursor-pointer" />
      
      {/* Chest */}
      <path d="M68 62 h28 v35 q-14 10 -28 0 z" fill={getFill('Bröst')} onClick={() => handleClick('Bröst')} className="cursor-pointer" />
      <path d="M104 62 h28 v35 q-14 10 -28 0 z" fill={getFill('Bröst')} onClick={() => handleClick('Bröst')} className="cursor-pointer" />
      
      {/* Abs */}
      <path d="M80 105 h40 v50 q-20 8 -40 0 z" fill={getFill('Mage')} onClick={() => handleClick('Mage')} className="cursor-pointer" />
      
      {/* Biceps */}
      <path d="M38 78 q-8 20 2 40 h8 q8 -20 0 -40 z" fill={getFill('Biceps')} onClick={() => handleClick('Biceps')} className="cursor-pointer" />
      <path d="M162 78 q8 20 -2 40 h-8 q-8 -20 0 -40 z" fill={getFill('Biceps')} onClick={() => handleClick('Biceps')} className="cursor-pointer" />
      
      {/* Forearms */}
      <path d="M35 125 v40 q2 8 8 0 l2 -40 z" fill={getFill('Underarmar')} onClick={() => handleClick('Underarmar')} className="cursor-pointer" />
      <path d="M165 125 v40 q-2 8 -8 0 l-2 -40 z" fill={getFill('Underarmar')} onClick={() => handleClick('Underarmar')} className="cursor-pointer" />
      
      {/* Quads */}
      <path d="M72 165 h25 v85 q-20 5 -25 -10 z" fill={getFill('Framsida lår')} onClick={() => handleClick('Framsida lår')} className="cursor-pointer" />
      <path d="M103 165 h25 v85 q0 15 -25 10 z" fill={getFill('Framsida lår')} onClick={() => handleClick('Framsida lår')} className="cursor-pointer" />

      {/* Adduktorer (Small inner thigh) */}
      <path d="M97 170 h6 v50 q-3 5 -6 0 z" fill={getFill('Adduktorer')} onClick={() => handleClick('Adduktorer')} className="cursor-pointer" />
      
      {/* Outline */}
      <path d="M100 20 q20 0 20 20 v10 q40 0 50 15 q10 10 10 30 v100 q0 20 -10 20 h-10 v180 h-30 v-180 h-60 v 180 h-30 v -180 h-10 q-10 0 -10 -20 v-100 q0 -20 10 -30 q10 -15 50 -15 v-10 q0 -20 20 -20" 
            fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
    </svg>
  );

  const renderBack = () => (
    <svg viewBox="0 0 200 400" className="w-full h-full animate-in fade-in zoom-in-95 duration-500">
      {/* Trapezius / Neck Back */}
      <path d="M85 45 q15 -10 30 0 v15 h-30 z" fill={getFill('Trapezius')} onClick={() => handleClick('Trapezius')} className="cursor-pointer" />
      
      {/* Upper Back / Lats */}
      <path d="M65 65 h70 v45 q-35 15 -70 0 z" fill={getFill('Rygg')} onClick={() => handleClick('Rygg')} className="cursor-pointer" />
      
      {/* Triceps */}
      <path d="M40 78 q-10 25 0 50 h8 q10 -25 0 -50 z" fill={getFill('Triceps')} onClick={() => handleClick('Triceps')} className="cursor-pointer" />
      <path d="M160 78 q10 25 0 50 h-8 q-10 -25 0 -50 z" fill={getFill('Triceps')} onClick={() => handleClick('Triceps')} className="cursor-pointer" />
      
      {/* Lower Back */}
      <path d="M80 115 h40 v25 q-20 5 -40 0 z" fill={getFill('Ryggslut')} onClick={() => handleClick('Ryggslut')} className="cursor-pointer" />
      
      {/* Glutes (Säte) */}
      <path d="M72 145 h27 v30 q-15 10 -27 0 z" fill={getFill('Säte')} onClick={() => handleClick('Säte')} className="cursor-pointer" />
      <path d="M101 145 h27 v30 q-12 10 -27 0 z" fill={getFill('Säte')} onClick={() => handleClick('Säte')} className="cursor-pointer" />
      
      {/* Hamstrings */}
      <path d="M72 180 h25 v75 q-20 5 -25 -10 z" fill={getFill('Baksida lår')} onClick={() => handleClick('Baksida lår')} className="cursor-pointer" />
      <path d="M103 180 h25 v75 q0 15 -25 10 z" fill={getFill('Baksida lår')} onClick={() => handleClick('Baksida lår')} className="cursor-pointer" />
      
      {/* Calves (Vader) */}
      <path d="M75 270 h18 v65 q-18 0 -18 -15 z" fill={getFill('Vader')} onClick={() => handleClick('Vader')} className="cursor-pointer" />
      <path d="M107 270 h18 v65 q0 15 -18 15 z" fill={getFill('Vader')} onClick={() => handleClick('Vader')} className="cursor-pointer" />
      
      {/* Outline */}
      <path d="M100 20 q20 0 20 20 v10 q40 0 50 15 q10 10 10 30 v100 q0 20 -10 20 h-10 v180 h-30 v-180 h-60 v 180 h-30 v -180 h-10 q-10 0 -10 -20 v-100 q0 -20 10 -30 q10 -15 50 -15 v-10 q0 -20 20 -20" 
            fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" />
    </svg>
  );

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className={`relative ${dimensions} flex items-center justify-center`}>
        {side === 'front' ? renderFront() : renderBack()}

        {/* Legend Overlay */}
        {!interactive && !loadMap && (
          <div className="absolute top-0 right-0 flex flex-col gap-1.5 bg-black/40 p-3 rounded-2xl backdrop-blur-md border border-white/5">
             <div className="w-2 h-2 rounded-full bg-[#ff2d55] shadow-[0_0_8px_#ff2d55]" />
             <div className="w-2 h-2 rounded-full bg-[#ff8095]" />
             <div className="w-2 h-2 rounded-full bg-white/10" />
          </div>
        )}
      </div>

      <button 
        onClick={() => setSide(side === 'front' ? 'back' : 'front')}
        className="flex items-center gap-3 px-8 py-3 bg-white/5 rounded-full border border-white/10 hover:bg-white/10 transition-all active:scale-95 group shadow-xl"
      >
        <RotateCcw size={16} className={`text-accent-pink transition-transform duration-500 ${side === 'back' ? 'rotate-180' : ''}`} />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] italic">
          Visa {side === 'front' ? 'Baksida' : 'Framsida'}
        </span>
      </button>
    </div>
  );
};
