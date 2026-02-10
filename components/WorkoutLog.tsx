import React, { useState, useMemo } from 'react';
import { 
  WorkoutSession, ScheduledActivity, ActivityType, 
  WorkoutRoutine, Exercise, TrackingType 
} from '../types';
import { 
  Calendar as CalIcon, ChevronLeft, ChevronRight, CheckCircle2, 
  Circle, Plus, Dumbbell, History, Repeat, Trash2, X, 
  Clock, ChevronDown, ChevronUp, MapPin, TrendingUp, Timer
} from 'lucide-react';

// --- HJÄLPFUNKTIONER FÖR ANALYS ---
const formatSeconds = (totalSeconds: number) => {
  if (isNaN(totalSeconds) || totalSeconds < 0) return '0:00';
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const calculatePace = (timeInSeconds: number, distanceInMeters: number) => {
  if (!distanceInMeters || !timeInSeconds) return null;
  const paceInSecondsPerKm = (timeInSeconds / distanceInMeters) * 1000;
  const mins = Math.floor(paceInSecondsPerKm / 60);
  const secs = Math.round(paceInSecondsPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, '0')} min/km`;
};

const calculateSetVolume = (set: any) => (set.weight || 0) * (set.reps || 0);

function getWeekNumber(d: Date) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay()||7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
    return Math.ceil(( ( (date.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
}

// --- DELKOMPONENT: SET-RADER ---
const SetValueDisplay = ({ set, type }: { set: any, type: TrackingType | undefined }) => {
  switch (type) {
    case 'time_distance':
      const pace = calculatePace(set.duration || 0, set.distance || 0);
      return (
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2 text-white">
            <span>{(set.distance || 0)}m</span>
            <span className="text-text-dim">@</span>
            <span>{formatSeconds(set.duration || 0)}</span>
          </div>
          {pace && <span className="text-[9px] text-accent-blue font-black uppercase">{pace}</span>}
        </div>
      );
    case 'time_only':
      return <span className="text-white">{formatSeconds(set.duration || 0)}</span>;
    case 'reps_only':
      return <span className="text-white">{set.reps || 0} reps</span>;
    default:
      const vol = calculateSetVolume(set);
      return (
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-2 text-white">
            <span>{set.reps || 0}</span><span className="text-text-dim">×</span><span>{set.weight || 0}kg</span>
          </div>
          {vol > 0 && <span className="text-[9px] text-text-dim uppercase tracking-tighter">Volym: {vol}kg</span>}
        </div>
      );
  }
};

// --- HUVUDKOMPONENT ---
interface WorkoutLogProps {
  history: WorkoutSession[];
  plannedActivities: ScheduledActivity[];
  routines: WorkoutRoutine[];
  allExercises: Exercise[];
  onAddPlan: (activity: ScheduledActivity, isRecurring: boolean, days?: number[]) => void;
  onTogglePlan: (id: string) => void;
  onDeletePlan: (id: string) => void;
  onDeleteHistory: (id: string) => void;
  onStartActivity: (activity: ScheduledActivity) => void;
}

export const WorkoutLog: React.FC<WorkoutLogProps> = ({ 
  history, plannedActivities, routines, allExercises,
  onAddPlan, onTogglePlan, onDeletePlan, onDeleteHistory, onStartActivity
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  
  const [planTitle, setPlanTitle] = useState('');
  const [planDate, setPlanDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedRoutineId, setSelectedRoutineId] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  // Generera alla 7 dagar för den valda veckan
  const weekDays = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Måndag som start
    const start = new Date(d.setDate(diff));
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(day.getDate() + i);
      return day;
    });
  }, [currentDate]);

  const handleSavePlan = () => {
    const routine = routines.find(r => r.id === selectedRoutineId);
    const finalTitle = planTitle || routine?.name || 'Ny Plan';
    
    const activity: ScheduledActivity = {
      id: `plan-${Date.now()}`,
      date: planDate,
      type: 'gym',
      title: finalTitle,
      isCompleted: false,
      exercises: routine?.exercises || []
    };
    onAddPlan(activity, isRecurring, selectedDays);
    setShowPlanModal(false);
    setPlanTitle('');
    setSelectedRoutineId('');
  };

  return (
    <div className="pb-32 space-y-6 animate-in fade-in">
      
      {/* HEADER */}
      <div className="px-4 pt-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black italic uppercase text-white tracking-tighter">Logg & Plan</h2>
          <p className="text-[10px] text-text-dim font-bold uppercase tracking-[0.2em]">Vecka {getWeekNumber(currentDate)}</p>
        </div>
        <button onClick={() => { setPlanDate(new Date().toISOString().split('T')[0]); setShowPlanModal(true); }} className="bg-white text-black p-3 rounded-2xl shadow-xl active:scale-90 transition-transform">
          <Plus size={24} strokeWidth={3} />
        </button>
      </div>

      {/* KALENDER NAVIGERING */}
      <div className="flex items-center justify-between mx-4 bg-[#1a1721] p-2 rounded-2xl border border-white/5 shadow-lg">
        {/* Vänsterpil */}
        <button 
          onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)))} 
          className="p-3 text-text-dim hover:text-white transition-colors shrink-0"
        >
          <ChevronLeft size={20} />
        </button>

        {/* Dagar - Här är fixen: flex-1, min-w-0 och justify-between/around */}
        <div className="flex flex-1 justify-around items-center px-1 min-w-0 overflow-hidden">
          {weekDays.map(d => {
            const isToday = d.toDateString() === new Date().toDateString();
            return (
              <div 
                key={d.toString()} 
                className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${
                  isToday 
                    ? 'bg-accent-pink text-white shadow-md shadow-accent-pink/20 scale-110' 
                    : 'text-text-dim'
                }`}
                style={{ width: 'calc(100% / 7)', maxWidth: '45px' }} // Tvingar dagarna att dela på utrymmet
              >
                <span className="text-[7px] font-black uppercase opacity-60 leading-none mb-1">
                  {d.toLocaleDateString('sv-SE', { weekday: 'short' }).replace('.', '').slice(0, 3)}
                </span>
                <span className="text-xs font-black leading-none">
                  {d.getDate()}
                </span>
              </div>
            );
          })}
        </div>

        {/* Högerpil - shrink-0 ser till att den inte trycks ihop eller utanför */}
        <button 
          onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)))} 
          className="p-3 text-text-dim hover:text-white transition-colors shrink-0"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* LISTA MED ALLA DAGAR I VECKAN */}
      <div className="px-4 space-y-6">
        {weekDays.map(day => {
          const dKey = day.toISOString().split('T')[0];
          const isToday = dKey === new Date().toISOString().split('T')[0];
          const dayPlans = plannedActivities.filter(p => p.date === dKey);
          const dayHistory = history.filter(h => h.date.startsWith(dKey));

          return (
            <div key={dKey} className="space-y-3">
              <div className="flex items-center gap-3 px-2">
                <div className={`h-[1px] flex-1 ${isToday ? 'bg-accent-pink/30' : 'bg-white/5'}`} />
                <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] ${isToday ? 'text-accent-pink' : 'text-text-dim'}`}>
                  {day.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'short' })}
                </h4>
                <div className={`h-[1px] flex-1 ${isToday ? 'bg-accent-pink/30' : 'bg-white/5'}`} />
              </div>

              {/* PLANERADE PASS */}
              {dayPlans.map(p => (
                <div key={p.id} className="bg-accent-blue/5 border border-accent-blue/20 rounded-[28px] p-4 flex justify-between items-center group animate-in zoom-in-95">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent-blue/10 rounded-xl flex items-center justify-center text-accent-blue">
                      <Repeat size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-white uppercase italic leading-none mb-1">{p.title}</p>
                      <p className="text-[9px] font-bold text-accent-blue/60 uppercase tracking-widest">Planerat • {p.exercises?.length || 0} övningar</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => onStartActivity(p)} className="bg-accent-blue text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-accent-blue/20 active:scale-95 transition-transform">Starta</button>
                    <button onClick={() => onDeletePlan(p.id)} className="p-2 text-text-dim hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  </div>
                </div>
              ))}

              {/* HISTORIK (UTFÖRDA PASS) */}
              {dayHistory.map(session => (
                <div key={session.id} className="bg-[#1a1721] rounded-[32px] border border-white/5 overflow-hidden transition-all shadow-xl">
                  <div 
                    onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
                    className="p-5 flex justify-between items-center cursor-pointer active:bg-white/5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black italic uppercase text-white leading-tight mb-1">{session.name}</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] text-green-500/70 font-black uppercase tracking-widest">Slutfört</span>
                            <span className="text-[9px] text-text-dim font-bold uppercase tracking-widest">• {Math.round((session.duration || 0)/60)} min</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-text-dim">{expandedId === session.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
                  </div>

                  {expandedId === session.id && (
                    <div className="px-5 pb-5 border-t border-white/5 animate-in slide-in-from-top-2 duration-300">
                      <div className="py-4 space-y-5">
                        {session.exercises.map((ex, idx) => {
                          const exData = allExercises.find(e => e.id === ex.exerciseId);
                          return (
                            <div key={idx} className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase italic text-accent-pink tracking-tight">{exData?.name || 'Övning'}</span>
                                <span className="text-[9px] text-text-dim font-bold uppercase">{ex.sets.filter(s=>s.completed).length} set</span>
                              </div>
                              <div className="space-y-1">
                                {ex.sets.filter(s=>s.completed).map((set, sIdx) => (
                                  <div key={sIdx} className="bg-black/20 p-2.5 rounded-xl flex justify-between items-center text-[10px] font-bold">
                                    <span className="text-text-dim opacity-50 font-mono">SET {sIdx + 1}</span>
                                    <SetValueDisplay set={set} type={exData?.trackingType} />
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="pt-2 border-t border-white/5">
                        <button 
                          onClick={(e) => { e.stopPropagation(); if(confirm("Radera från historik?")) onDeleteHistory(session.id); }}
                          className="w-full py-3 text-red-500/50 hover:text-red-500 text-[9px] font-black uppercase tracking-[0.2em] transition-colors"
                        >
                          Radera Pass Permanent
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* SNABBKNAPP OM DAGEN ÄR TOM */}
              {dayPlans.length === 0 && dayHistory.length === 0 && (
                <button 
                  onClick={() => { setPlanDate(dKey); setShowPlanModal(true); }}
                  className="w-full py-4 border-2 border-dashed border-white/5 rounded-[28px] flex items-center justify-center gap-2 text-text-dim/20 hover:text-text-dim/50 hover:border-white/10 transition-all group"
                >
                  <Plus size={16} className="group-hover:scale-125 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Planera pass</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* MODAL: PLANERING */}
      {showPlanModal && (
        <div className="fixed inset-0 z-[100] bg-[#0f0d15]/95 backdrop-blur-md flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#1a1721] w-full max-w-sm rounded-[40px] border border-white/10 p-8 animate-in slide-in-from-bottom-10 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter">Planera</h3>
                <button onClick={() => setShowPlanModal(false)} className="p-2 text-text-dim"><X /></button>
            </div>
            
            <div className="space-y-5">
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-text-dim ml-2 tracking-widest">Välj Rutin</label>
                  <select 
                    value={selectedRoutineId} 
                    onChange={e => setSelectedRoutineId(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-accent-blue/50"
                  >
                    <option value="">-- Eget pass --</option>
                    {routines.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
               </div>
               
               {!selectedRoutineId && (
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-text-dim ml-2 tracking-widest">Namn på passet</label>
                    <input 
                      placeholder="t.ex. Morgonlöpning..." 
                      value={planTitle} 
                      onChange={e => setPlanTitle(e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none focus:border-accent-blue/50"
                    />
                 </div>
               )}
               
               <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-text-dim ml-2 tracking-widest">Datum</label>
                  <input type="date" value={planDate} onChange={e => setPlanDate(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none" />
               </div>

               <button onClick={handleSavePlan} className="w-full py-5 bg-white text-black rounded-3xl font-black italic uppercase tracking-widest shadow-xl active:scale-95 transition-transform mt-2">
                 Lägg till i kalender
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
