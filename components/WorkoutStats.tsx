
import React from 'react';
import { BarChart3, ChevronUp, ChevronDown } from 'lucide-react';
import { RecoveryMap } from './RecoveryMap';

interface WorkoutStatsProps {
  results: any[];
  loadMap: any;
  isLoadMapOpen: boolean;
  onToggleLoadMap: () => void;
}

export const WorkoutStats: React.FC<WorkoutStatsProps> = ({ 
  results, 
  loadMap, 
  isLoadMapOpen, 
  onToggleLoadMap 
}) => {
  return (
    <div className="bg-[#1a1721] rounded-[32px] p-6 border border-white/5 shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <BarChart3 className="text-accent-pink" size={20} />
          <h4 className="text-sm font-black uppercase italic tracking-widest">Målmuskler</h4>
        </div>
        <button 
          onClick={onToggleLoadMap}
          className="text-[10px] font-black uppercase tracking-widest text-text-dim flex items-center gap-1"
        >
          Muskelbelastning {isLoadMapOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      <div className="space-y-3">
        {results.slice(0, 3).map((m, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
              <span>{m.name}</span>
              <span className="text-accent-pink">{m.percentage}%</span>
            </div>
            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-accent-pink transition-all duration-1000" style={{ width: `${m.percentage}%` }} />
            </div>
          </div>
        ))}
        {results.length === 0 && (
          <p className="text-[10px] font-black text-text-dim uppercase tracking-widest text-center py-2 opacity-40">Lägg till övningar för att se fördelning</p>
        )}
      </div>

      {isLoadMapOpen && (
        <div className="mt-8 pt-8 border-t border-white/5 animate-in fade-in slide-in-from-top-2">
          <RecoveryMap loadMap={loadMap} size="md" />
        </div>
      )}
    </div>
  );
};
