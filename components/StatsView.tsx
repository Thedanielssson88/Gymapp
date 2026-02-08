import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { BiometricLog, WorkoutSession, MovementPattern, Exercise } from '../types';
import { calculate1RM } from '../utils/fitness';
import { storage } from '../services/storage';
import { TrendingUp, Activity, Target } from 'lucide-react';

interface StatsViewProps {
  logs: BiometricLog[];
  history: WorkoutSession[];
  // FIX: Add allExercises to props to receive data from the parent component
  allExercises: Exercise[];
}

export const StatsView: React.FC<StatsViewProps> = ({ logs, history, allExercises }) => {
  const [metric, setMetric] = useState<'weight' | 'biceps' | 'waist'>('weight');
  const [pattern, setPattern] = useState<MovementPattern>(MovementPattern.HORIZONTAL_PUSH);

  // 1. Data för Kroppsmått
  const bodyData = useMemo(() => {
    return logs.map(log => ({
      date: new Date(log.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      weight: log.weight,
      biceps: ((log.measurements?.bicepsL || 0) + (log.measurements?.bicepsR || 0)) / 2, // Snitt
      waist: log.measurements?.waist || 0
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-15);
  }, [logs]);

  // 2. Data för Styrka (Aggregerat per Rörelsemönster)
  const strengthData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    
    history.forEach(session => {
        let dailyMax = 0;
        session.exercises.forEach(ex => {
            // FIX: Use allExercises from props which is an array, not a promise
            const exDef = allExercises.find(e => e.id === ex.exerciseId);
            if (exDef && exDef.pattern === pattern) {
                ex.sets.forEach(set => {
                    if (set.completed) {
                        const estimated1RM = calculate1RM(set.weight, set.reps);
                        if (estimated1RM > dailyMax) dailyMax = estimated1RM;
                    }
                });
            }
        });
        if (dailyMax > 0) {
            const dateStr = new Date(session.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            dataMap[dateStr] = Math.max(dataMap[dateStr] || 0, Math.round(dailyMax));
        }
    });

    return Object.entries(dataMap).map(([date, max]) => ({ date, max }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-10);
  }, [history, pattern, allExercises]);

  // PR List
  const personalRecords = useMemo(() => {
    const prs: Record<string, number> = {};
    
    history.forEach(session => {
      session.exercises.forEach(ex => {
        // FIX: Use allExercises from props which is an array, not a promise
        const exDef = allExercises.find(e => e.id === ex.exerciseId);
        if (!exDef) return;
        ex.sets.forEach(set => {
          if (set.completed) {
            const oneRM = calculate1RM(set.weight, set.reps);
            if (!prs[exDef.name] || oneRM > prs[exDef.name]) {
              prs[exDef.name] = Math.round(oneRM);
            }
          }
        });
      });
    });

    return Object.entries(prs).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [history, allExercises]);

  return (
    <div className="space-y-8 pb-32 animate-in fade-in duration-700">
      {/* SEKTION 1: KROPP */}
      <div className="bg-[#1a1721] p-8 rounded-[32px] border border-white/5 shadow-xl">
        <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <Activity className="text-accent-pink" size={20} />
              <h3 className="text-xl font-black italic uppercase">Kroppsutveckling</h3>
            </div>
            <select 
                value={metric} 
                onChange={(e) => setMetric(e.target.value as any)}
                className="bg-white/5 border border-white/10 text-[10px] font-black uppercase p-2 px-4 rounded-xl outline-none text-accent-pink tracking-widest"
            >
                <option value="weight">Kroppsvikt</option>
                <option value="biceps">Biceps (Snitt)</option>
                <option value="waist">Midjemått</option>
            </select>
        </div>
        
        <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bodyData}>
                    <defs>
                        <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ff2d55" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#ff2d55" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#1a1721', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', fontSize: '12px', fontWeight: 'bold' }}
                        itemStyle={{ color: '#fff' }}
                        cursor={{ stroke: '#ff2d55', strokeWidth: 1 }}
                    />
                    <XAxis dataKey="date" hide />
                    <Area 
                        type="monotone" 
                        dataKey={metric} 
                        stroke="#ff2d55" 
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorMetric)" 
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* SEKTION 2: STYRKA (MORPH-LOGIK) */}
      <div className="bg-[#1a1721] p-8 rounded-[32px] border border-white/5 shadow-xl">
        <div className="flex justify-between items-start mb-8">
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                   <TrendingUp className="text-accent-blue" size={20} />
                   <h3 className="text-xl font-black italic uppercase">Styrkekurva (1RM)</h3>
                </div>
                <p className="text-[9px] text-text-dim uppercase font-black tracking-widest leading-none">Aggregerat per mönster</p>
            </div>
            <select 
                value={pattern} 
                onChange={(e) => setPattern(e.target.value as MovementPattern)}
                className="bg-white/5 border border-white/10 text-[10px] font-black uppercase p-2 px-4 rounded-xl outline-none text-accent-blue max-w-[140px] tracking-widest"
            >
                {Object.values(MovementPattern).map(p => (
                    <option key={p} value={p}>{p}</option>
                ))}
            </select>
        </div>

        <div className="h-[220px] w-full">
             {strengthData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={strengthData}>
                        <CartesianGrid stroke="#ffffff05" vertical={false} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#1a1721', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', fontSize: '12px' }}
                            itemStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
                            formatter={(value) => [`${value} kg`, 'Est. 1RM']}
                        />
                        <XAxis dataKey="date" stroke="#ffffff20" fontSize={9} tickLine={false} axisLine={false} fontWeight="900" dy={10} />
                        <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                        <Line 
                            type="monotone" 
                            dataKey="max" 
                            stroke="#3b82f6" 
                            strokeWidth={5}
                            dot={{ r: 5, fill: '#3b82f6', strokeWidth: 0 }}
                            activeDot={{ r: 8, stroke: '#fff', strokeWidth: 2 }} 
                            animationDuration={1500}
                        />
                    </LineChart>
                </ResponsiveContainer>
             ) : (
                 <div className="h-full flex flex-col items-center justify-center text-text-dim text-[10px] uppercase font-black tracking-widest opacity-30 gap-4">
                     <Target size={32} />
                     Ingen data för detta mönster än
                 </div>
             )}
        </div>
      </div>

      {/* PERSONAL RECORDS LIST */}
      <div className="px-4">
         <h3 className="text-sm font-black italic uppercase tracking-[0.3em] text-white/40 mb-6 ml-2">Personal Records (1RM)</h3>
         <div className="space-y-3">
            {personalRecords.map(([name, val], idx) => (
              <div key={idx} className="bg-[#1a1721] p-5 rounded-2xl border border-white/5 flex justify-between items-center group active:scale-95 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center font-black italic text-accent-pink">{idx+1}</div>
                  <span className="font-black uppercase italic text-[15px]">{name}</span>
                </div>
                <div className="text-right">
                  <span className="text-xl font-black italic text-white">{val}</span>
                  <span className="text-[10px] font-black text-text-dim uppercase ml-1">kg</span>
                </div>
              </div>
            ))}
            {personalRecords.length === 0 && (
              <p className="text-center py-10 text-text-dim text-[10px] font-black uppercase tracking-widest opacity-20">Fullfölj pass för att logga PRs</p>
            )}
         </div>
      </div>
    </div>
  );
};
