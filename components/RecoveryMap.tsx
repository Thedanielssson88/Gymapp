import React, { useMemo } from 'react';
import { MuscleGroup } from '../types';

export type MapMode = 'recovery' | 'injuries' | 'load';

interface RecoveryMapProps {
  mode: MapMode;
  recoveryScores?: Record<MuscleGroup, number>;
  loadScores?: Record<MuscleGroup, number>;
  injuries?: MuscleGroup[];
  onToggle?: (muscle: MuscleGroup) => void;
}

export const RecoveryMap: React.FC<RecoveryMapProps> = ({ 
  mode,
  recoveryScores, 
  loadScores,
  injuries = [], 
  onToggle
}) => {

  const maxLoad = useMemo(() => {
    if (mode !== 'load' || !loadScores) return 1;
    const values = Object.values(loadScores);
    if (values.length === 0) return 1;
    // FIX: The type of `values` can be inferred as `unknown[]`, which is not compatible with `Math.max`.
    // Casting to `number[]` resolves the type mismatch.
    return Math.max(...(values as number[]), 1);
  }, [mode, loadScores]);

  const getColor = (muscle: MuscleGroup) => {
    const isInjured = injuries.includes(muscle);

    // SKADELÄGE (Eller om muskeln är skadad i recovery-läge)
    if (isInjured) return '#ef4444'; 

    // REDIGERING AV SKADOR (Ej valda är grå)
    if (mode === 'injuries') return 'rgba(255, 255, 255, 0.1)';

    // BELASTNINGSLÄGE (för pågående pass)
    if (mode === 'load') {
      const load = loadScores?.[muscle] ?? 0;
      const percentage = (load / maxLoad) * 100;
      if (percentage > 75) return '#ff2d55'; // High load - accent-pink
      if (percentage > 40) return '#3b82f6'; // Medium load - accent-blue
      if (percentage > 0) return 'rgba(59, 130, 246, 0.4)'; // Low load - transparent blue
      return 'rgba(255, 255, 255, 0.1)'; // No load
    }

    // RECOVERYLÄGE
    const score = recoveryScores?.[muscle] ?? 100;
    if (score >= 90) return '#22c55e'; // Grön
    if (score >= 50) return '#eab308'; // Gul
    return '#f97316'; // Orange
  };

  const handleClick = (muscle: MuscleGroup) => {
    if ((mode === 'injuries' || mode === 'recovery') && onToggle) {
       onToggle(muscle);
    }
  };

  const p = (muscle: MuscleGroup) => ({
    fill: getColor(muscle),
    onClick: () => handleClick(muscle),
    className: `transition-all duration-300 ${mode === 'injuries' ? 'cursor-pointer hover:opacity-80 active:scale-95' : ''}`,
    stroke: 'rgba(255,255,255,0.1)',
    strokeWidth: "0.5"
  });

  return (
    <div className="flex justify-center gap-4 py-4 select-none overflow-x-auto scrollbar-hide">
      
      {/* --- FRAMSIDA --- */}
      <svg viewBox="0 0 200 500" className="h-80 w-auto drop-shadow-xl shrink-0">
        <text x="100" y="20" textAnchor="middle" fill="white" fontSize="10" opacity="0.3" fontWeight="900">FRONT</text>
        
        {/* Nacke */}
        <rect x="90" y="35" width="20" height="15" rx="5" {...p('Nacke')} />
        
        {/* Trapezius (Övre) */}
        <path d="M70,55 L90,40 L110,40 L130,55" {...p('Trapezius')} />

        {/* Axlar */}
        <circle cx="55" cy="75" r="18" {...p('Axlar')} />
        <circle cx="145" cy="75" r="18" {...p('Axlar')} />

        {/* Bröst */}
        <path d="M73,75 Q100,95 127,75 L120,130 Q100,140 80,130 Z" {...p('Bröst')} />

        {/* Biceps */}
        <ellipse cx="40" cy="115" rx="12" ry="22" {...p('Biceps')} />
        <ellipse cx="160" cy="115" rx="12" ry="22" {...p('Biceps')} />

        {/* Underarmar */}
        <path d="M35,145 L55,145 L50,190 L40,190 Z" {...p('Underarmar')} />
        <path d="M165,145 L145,145 L150,190 L160,190 Z" {...p('Underarmar')} />

        {/* Mage */}
        <rect x="80" y="135" width="40" height="75" rx="5" {...p('Mage')} />

        {/* Framsida lår */}
        <path d="M75,220 L95,220 L95,330 L65,330 Z" {...p('Framsida lår')} />
        <path d="M125,220 L105,220 L105,330 L135,330 Z" {...p('Framsida lår')} />

        {/* Adduktorer (Insida lår) */}
        <path d="M95,230 L95,300 L100,230 Z" {...p('Adduktorer')} />
        <path d="M105,230 L105,300 L100,230 Z" {...p('Adduktorer')} />

        {/* Abduktorer (Utsida höft/lår) */}
        <path d="M65,220 L60,280 L75,230 Z" {...p('Abduktorer')} />
        <path d="M135,220 L140,280 L125,230 Z" {...p('Abduktorer')} />
        
        {/* Vader (Syns lite framifrån) */}
        <path d="M70,340 L90,340 L85,420 L75,420 Z" {...p('Vader')} />
        <path d="M130,340 L110,340 L115,420 L125,420 Z" {...p('Vader')} />
      </svg>

      {/* --- BAKSIDA --- */}
      <svg viewBox="0 0 200 500" className="h-80 w-auto drop-shadow-xl shrink-0">
        <text x="100" y="20" textAnchor="middle" fill="white" fontSize="10" opacity="0.3" fontWeight="900">BACK</text>
        
        {/* Nacke */}
        <rect x="90" y="35" width="20" height="15" rx="5" {...p('Nacke')} />

        {/* Trapezius (Stor diamant på ryggen) */}
        <path d="M70,55 L130,55 L100,140 Z" {...p('Trapezius')} />

        {/* Axlar (Baksida) */}
        <circle cx="50" cy="75" r="15" {...p('Axlar')} />
        <circle cx="150" cy="75" r="15" {...p('Axlar')} />

        {/* Rygg (Lats) */}
        <path d="M65,80 L55,160 L100,190 L145,160 L135,80 L100,140 Z" {...p('Rygg')} />

        {/* Ryggslut (Lower Back) */}
        <rect x="85" y="190" width="30" height="25" {...p('Ryggslut')} />

        {/* Triceps */}
        <ellipse cx="40" cy="115" rx="11" ry="20" {...p('Triceps')} />
        <ellipse cx="160" cy="115" rx="11" ry="20" {...p('Triceps')} />

        {/* Underarmar (Bak) */}
        <path d="M30,145 L50,145 L45,190 L35,190 Z" {...p('Underarmar')} />
        <path d="M170,145 L150,145 L155,190 L165,190 Z" {...p('Underarmar')} />

        {/* Säte */}
        <path d="M60,220 Q100,210 140,220 Q140,260 100,260 Q60,260 60,220" {...p('Säte')} />

        {/* Baksida lår */}
        <path d="M70,265 L95,265 L90,340 L75,340 Z" {...p('Baksida lår')} />
        <path d="M130,265 L105,265 L110,340 L125,340 Z" {...p('Baksida lår')} />

        {/* Vader */}
        <ellipse cx="82" cy="380" rx="13" ry="35" {...p('Vader')} />
        <ellipse cx="118" cy="380" rx="13" ry="35" {...p('Vader')} />
      </svg>

    </div>
  );
};
