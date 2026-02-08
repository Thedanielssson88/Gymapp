
import React, { useMemo } from 'react';
import { MuscleGroup } from '../types';
import { MuscleStatus, getRecoveryColor, getRecoveryStatus, ALL_MUSCLE_GROUPS } from '../utils/recovery';
import { Activity, Zap, Info } from 'lucide-react';

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
  
  // Prepare the list of muscle scores, sorted by most fatigued (lowest score)
  const muscleScores = useMemo(() => {
    const list = ALL_MUSCLE_GROUPS.map(muscle => {
      let score = 100;
      let loadCount = 0;
      
      if (status) {
        score = Math.round(status[muscle] ?? 100);
      } else if (loadMap) {
        loadCount = loadMap[muscle] || 0;
        // Map load (0-3+) to a "reverse" score for visualization 
        score = Math.max(0, 100 - (loadCount * 33));
      }

      return { muscle, score, loadCount };
    });

    // If we are showing recovery, sort by lowest score (most sliten first)
    // If we are showing load (in workout), sort by highest load (lowest score)
    return list.sort((a, b) => a.score - b.score);
  }, [status, loadMap]);

  const handleClick = (muscle: MuscleGroup) => {
    if (interactive && onToggleMuscle) {
      onToggleMuscle(muscle);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Info */}
      <div className="flex justify-between items-end px-2">
        <div>
          <h3 className="text-[10px] font-black uppercase text-accent-pink tracking-[0.3em] mb-1">
            {loadMap ? 'Passets Belastning' : 'Aktiv Återhämtning'}
          </h3>
          <p className="text-xl font-black italic uppercase tracking-tighter">
            {loadMap ? 'Muskelengagemang' : 'Status per zon'}
          </p>
        </div>
        {!loadMap && (
           <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <Activity size={12} className="text-accent-pink" />
              <span className="text-[8px] font-black uppercase tracking-widest text-text-dim">Real-time update</span>
           </div>
        )}
      </div>

      {/* Heatmap List */}
      <div className={`grid gap-2 ${size === 'lg' ? 'max-h-[60vh]' : 'max-h-[40vh]'} overflow-y-auto scrollbar-hide pr-1`}>
        {muscleScores.map(({ muscle, score, loadCount }) => {
          const isSelected = selectedMuscles.includes(muscle);
          const color = getRecoveryColor(score, isSelected);
          const statusText = loadMap 
            ? (loadCount > 0 ? `${loadCount} Set` : 'Ingen belastning')
            : getRecoveryStatus(score);

          return (
            <div 
              key={muscle}
              onClick={() => handleClick(muscle)}
              className={`p-4 rounded-2xl transition-all border flex flex-col gap-2 ${
                isSelected 
                  ? 'bg-accent-pink/10 border-accent-pink shadow-[0_0_20px_rgba(255,45,85,0.1)]' 
                  : 'bg-white/5 border-white/5 hover:border-white/10'
              } ${interactive ? 'cursor-pointer active:scale-[0.98]' : ''}`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full`} style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
                  <span className="font-black uppercase italic text-xs tracking-tight">{muscle}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-text-dim">{statusText}</span>
                  {!loadMap && <span className="text-[11px] font-black italic text-white/80">{score}%</span>}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden relative">
                <div 
                  className="h-full transition-all duration-1000 ease-out rounded-full"
                  style={{ 
                    width: `${score}%`, 
                    backgroundColor: color,
                    opacity: score < 20 ? 0.3 : 1
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend / Tips */}
      {!loadMap && (
        <div className="bg-white/5 rounded-[24px] p-4 border border-white/5 flex items-start gap-4 mx-2">
          <div className="bg-accent-pink/20 p-2 rounded-xl text-accent-pink">
            <Info size={18} />
          </div>
          <div className="flex-1">
             <p className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-1">Coach-tips</p>
             <p className="text-[11px] font-bold text-white/70 leading-relaxed italic">
               Dina mest "slitna" muskler visas överst. Överväg att byta fokusområde idag för att undvika överträning.
             </p>
          </div>
        </div>
      )}
    </div>
  );
};
