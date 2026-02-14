import React, { useMemo, useState, useEffect } from 'react';
import { UserMission, WorkoutSession, BiometricLog } from '../types';
import { calculateSmartProgression, getHistoryForGoal } from '../utils/progression';
import { storage } from '../services/storage';
import { X } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface Props {
  mission: UserMission;
  onClose: () => void;
}

export const MissionStatusModal: React.FC<Props> = ({ mission, onClose }) => {
  const [historyPoints, setHistoryPoints] = useState<any[]>([]);
  const [currentVal, setCurrentVal] = useState(0);

  // Hämta historikdata asynkront
  useEffect(() => {
    const loadData = async () => {
      if (!mission.smartConfig) return;
      
      let points = [];
      if (mission.smartConfig.targetType === 'exercise') {
        const hLogs = await storage.getHistory();
        points = getHistoryForGoal(mission.smartConfig, hLogs, []);
      } else {
        const bLogs = await storage.getBiometricLogs();
        points = getHistoryForGoal(mission.smartConfig, [], bLogs as BiometricLog[]);
      }
      
      setHistoryPoints(points);
      // Sätt nuvarande värde till sista punkten eller startvärdet
      const last = points.length > 0 ? points[points.length - 1].value : mission.smartConfig.startValue;
      setCurrentVal(last);
    };
    loadData();
  }, [mission]);

  // Räkna ut status
  const stats = useMemo(() => {
    return calculateSmartProgression(mission, currentVal);
  }, [mission, currentVal]);

  // Förbered grafdata
  const chartData = useMemo(() => {
    if (!mission.smartConfig) return [];
    
    const { startValue, targetValue, deadline } = mission.smartConfig;
    const startDate = new Date(mission.createdAt).getTime();
    const endDate = new Date(deadline).getTime();
    
    const data = [];
    const steps = 10; 
    
    // Skapa punkter för ideal-linjen
    for (let i = 0; i <= steps; i++) {
        const ratio = i / steps;
        const time = new Date(startDate + (endDate - startDate) * ratio);
        
        // Här kan du använda samma logik som i calculateSmartProgression för exakt kurva
        // Förenklad linjär:
        const ideal = startValue + (targetValue - startValue) * ratio;

        data.push({
            date: time.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' }),
            timestamp: time.getTime(),
            ideal: parseFloat(ideal.toFixed(1)),
            actual: null
        });
    }

    // Slå ihop med historik (förenklat: mappa historyPoints till närmsta grafpunkt)
    historyPoints.forEach(pt => {
        const ptTime = new Date(pt.date).getTime();
        // Hitta närmsta datapunkt i grafen (eller lägg till exakt punkt)
        const match = data.find(d => Math.abs(d.timestamp - ptTime) < 86400000 * 2); // Inom 2 dagar
        if (match) {
            match.actual = pt.value;
        }
    });

    return data;
  }, [mission, historyPoints]);

  if (!stats || !mission.smartConfig) return null;

  const isAhead = (mission.smartConfig.targetValue > mission.smartConfig.startValue) 
    ? stats.statusDiff <= 0 // Om vi ska öka: Negativ diff = Ligger före (Expected < Current)
    : stats.statusDiff >= 0; // Om vi ska minska: Positiv diff = Ligger före

  return (
    <div className="fixed inset-0 z-[60] bg-[#0f0d15] flex flex-col animate-in slide-in-from-bottom duration-300">
       <div className="p-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] flex justify-between items-center border-b border-white/5">
         <div>
            <p className="text-[10px] text-text-dim uppercase tracking-widest">Statusrapport</p>
            <h2 className="text-xl font-black italic text-white uppercase">{mission.title}</h2>
         </div>
         <button onClick={onClose} className="p-2 bg-white/5 rounded-full"><X/></button>
       </div>
       <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className={`p-4 rounded-2xl border ${isAhead ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <p className={`text-xs font-black uppercase tracking-widest ${isAhead ? 'text-green-400' : 'text-red-400'}`}>
                    {isAhead ? 'Du ligger före schemat' : 'Du ligger efter schemat'}
                </p>
                <p className="text-sm text-white font-bold">
                    Du borde vara på {stats.expectedValue}{stats.unit}, men du är på {currentVal}{stats.unit}. 
                    En skillnad på {Math.abs(stats.statusDiff).toFixed(1)}{stats.unit}.
                </p>
            </div>
            
            <div className="h-64 bg-black/20 rounded-2xl p-4 border border-white/5">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <XAxis dataKey="date" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
                        <Tooltip contentStyle={{backgroundColor: 'black', border: '1px solid #333'}}/>
                        <Line type="monotone" dataKey="ideal" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Plan" />
                        <Line type="monotone" dataKey="actual" stroke="#ff2d55" strokeWidth={3} name="Verklighet" connectNulls />
                        <ReferenceLine x={new Date().toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })} stroke="white" strokeDasharray="3 3" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
       </div>
    </div>
  );
};
