import React from 'react';
import { MuscleGroup } from '../types';

export type MapMode = 'recovery' | 'injuries';

interface RecoveryMapProps {
  mode: MapMode;
  recoveryScores?: Record<MuscleGroup, number>;
  injuries?: MuscleGroup[];
  onToggle?: (muscle: MuscleGroup) => void;
}

export const RecoveryMap: React.FC<RecoveryMapProps> = ({ 
  mode,
  recoveryScores, 
  injuries = [], 
  onToggle
}) => {

  const getColor = (muscle: MuscleGroup) => {
    const isInjured = injuries.includes(muscle);

    // 1. INJURY MODE (Editing)
    if (mode === 'injuries') {
      if (isInjured) return '#ef4444'; // Red
      return 'rgba(255, 255, 255, 0.1)'; // Gray
    }

    // 2. RECOVERY MODE (Status)
    if (isInjured) return '#ef4444'; 

    const score = recoveryScores?.[muscle] ?? 100;
    if (score >= 90) return '#22c55e'; // Green
    if (score >= 50) return '#eab308'; // Yellow
    return '#f97316'; // Orange
  };

  const handleClick = (muscle: MuscleGroup) => {
    if (mode === 'injuries' && onToggle) {
      onToggle(muscle);
    }
  };

  const pathProps = (muscle: MuscleGroup) => ({
    fill: getColor(muscle),
    onClick: () => handleClick(muscle),
    className: `transition-all duration-300 ${mode === 'injuries' ? 'cursor-pointer hover:opacity-80 active:scale-95' : ''}`,
    stroke: mode === 'injuries' ? 'rgba(255,255,255,0.05)' : 'none',
    strokeWidth: "1"
  });

  return (
    <div className="flex flex-col items-center gap-8 py-4 select-none">
      <div className="flex justify-center gap-12 w-full">
        <div className="flex flex-col items-center gap-2">
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20">Front</span>
          <svg viewBox="0 0 200 500" className="h-72 w-auto drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <path d="M65,95 Q100,105 135,95 L125,145 Q100,155 75,145 Z" {...pathProps('Bröst')} />
            <circle cx="50" cy="100" r="18" {...pathProps('Axlar')} />
            <circle cx="150" cy="100" r="18" {...pathProps('Axlar')} />
            <rect x="80" y="160" width="40" height="70" rx="8" {...pathProps('Mage')} />
            <path d="M65,240 L85,360 L55,360 Z" {...pathProps('Framsida lår')} />
            <path d="M135,240 L115,360 L145,360 Z" {...pathProps('Framsida lår')} />
            <ellipse cx="40" cy="140" rx="10" ry="22" {...pathProps('Biceps')} />
            <ellipse cx="160" cy="140" rx="10" ry="22" {...pathProps('Biceps')} />
          </svg>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20">Back</span>
          <svg viewBox="0 0 200 500" className="h-72 w-auto drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <path d="M60,90 L140,90 L125,200 L75,200 Z" {...pathProps('Rygg')} />
            <ellipse cx="40" cy="140" rx="10" ry="22" {...pathProps('Triceps')} />
            <ellipse cx="160" cy="140" rx="10" ry="22" {...pathProps('Triceps')} />
            <circle cx="75" cy="235" r="22" {...pathProps('Säte')} />
            <circle cx="125" cy="235" r="22" {...pathProps('Säte')} />
            <rect x="62" y="265" width="28" height="85" rx="6" {...pathProps('Baksida lår')} />
            <rect x="110" y="265" width="28" height="85" rx="6" {...pathProps('Baksida lår')} />
            <ellipse cx="75" cy="400" rx="14" ry="35" {...pathProps('Vader')} />
            <ellipse cx="125" cy="400" rx="14" ry="35" {...pathProps('Vader')} />
          </svg>
        </div>
      </div>
    </div>
  );
};