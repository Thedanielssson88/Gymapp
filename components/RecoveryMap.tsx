
import React, { useMemo } from 'react';
import { MuscleGroup } from '../types';
import { MuscleStatus, getRecoveryColor, getRecoveryStatus, ALL_MUSCLE_GROUPS } from '../utils/recovery';
import { Activity, Info } from 'lucide-react';

interface RecoveryMapProps {
  status?: MuscleStatus;            // Används på startsidan (Recovery)
  loadMap?: Record<string, number>; // Används i passet (Belastning)
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
  
  const muscleScores = useMemo(() => {
    const list = ALL_MUSCLE_GROUPS.map(muscle => {
      let score = 0;
      let loadCount = 0;
      
      if (loadMap) {
        // LÄGE: BELASTNING (I PASSET)
        // 0 = Ingen last, 100 = Max last.
        // Vi antar att ca 3 poäng (t.ex. 3 primära set) är "Full träff" för visualisering
        loadCount = loadMap[muscle] || 0;
        score = Math.min(100, Math.round((loadCount / 3) * 100));
      } else {
        // LÄGE: ÅTERHÄMTNING (STARTSIDAN)
        // 100 = Pigg, 0 = Död.
        score = Math.round(status?.[muscle] ?? 100);
      }

      return { muscle, score, loadCount };
    });

    // SORTERING
    if (loadMap) {
        // I passet: Visa de vi tränar MEST (högst score) överst
        return list.sort((a, b) => b.score - a.score);
    } else {
        // I recovery: Visa de som är TRÖTTAST (lägst score) överst
        return list.sort((a, b) => a.score - b.score);
    }
  }, [status, loadMap]);

  const handleClick = (muscle: MuscleGroup) => {
    if (interactive && onToggleMuscle) {
      onToggleMuscle(muscle);
    }
  };

  // Hjälpfunktion för färg vid belastning (Grön -> Röd när man bygger upp)
  const getLoadColor = (percentage: number) => {
      if (percentage <= 5) return 'rgba(255,255,255,0.1)';
      if (percentage < 40) return '#2ed573'; // Grön (Startar lätt)
      if (percentage < 75) return '#ffa502'; // Orange (Börjar kännas)
      return '#ff2d55'; // Röd (Hög volym)
  };

  return (
    <div className="w-full space-y-6">
      {/* Header Info */}
      <div className="flex justify-between items-end px-2">
        <div>
          <h3 className="text-[10px] font-black uppercase text-accent-pink tracking-[0.3em] mb-1">
            {loadMap ? 'Passets Fokus' : 'Aktiv Återhämtning'}
          </h3>
          <p className="text-xl font-black italic uppercase tracking-tighter">
            {loadMap ? 'Muskelbelastning' : 'Status per zon'}
          </p>
        </div>
        {!loadMap && (
           <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
              <Activity size={12} className="text-accent-pink" />
              <span className="text-[8px] font-black uppercase tracking-widest text-text-dim">Live status</span>
           </div>
        )}
      </div>

      {/* Heatmap List */}
      <div className={`grid gap-2 ${size === 'lg' ? 'max-h-[60vh]' : 'max-h-[40vh]'} overflow-y-auto scrollbar-hide pr-1`}>
        {muscleScores.map(({ muscle, score, loadCount }) => {
          const isSelected = selectedMuscles.includes(muscle);
          
          // Välj färglogik
          const color = loadMap 
            ? getLoadColor(score) 
            : getRecoveryColor(score, isSelected);

          // Texten till höger
          const statusText = loadMap 
            ? (loadCount > 0 ? `${loadCount.toFixed(1)}p` : '-')
            : getRecoveryStatus(score);

          // Tona ner muskler som inte används i passet
          const opacity = loadMap && score === 0 ? 0.3 : 1;

          return (
            <div 
              key={muscle}
              onClick={() => handleClick(muscle)}
              className={`p-4 rounded-2xl transition-all border flex flex-col gap-2 ${
                isSelected 
                  ? 'bg-accent-pink/10 border-accent-pink' 
                  : 'bg-white/5 border-white/5 hover:border-white/10'
              } ${interactive ? 'cursor-pointer active:scale-[0.98]' : ''}`}
              style={{ opacity }}
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
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      
      {loadMap && (
          <p className="text-[9px] text-center text-text-dim uppercase tracking-widest pt-2">
              Muskler högst upp får mest träning detta pass.
          </p>
      )}
    </div>
  );
};
