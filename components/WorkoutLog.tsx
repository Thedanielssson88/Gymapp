
import React, { useState, useMemo } from 'react';
import { 
  WorkoutSession, ScheduledActivity, ActivityType, 
  WorkoutRoutine, Exercise, TrackingType, RecurringPlanForDisplay, PlannedActivityForLogDisplay 
} from '../types';
import { 
  Calendar as CalIcon, ChevronLeft, ChevronRight, CheckCircle2, 
  Circle, Plus, Dumbbell, History, Repeat, Trash2, X, 
  Clock, ChevronDown, ChevronUp, MapPin, TrendingUp, Timer,
  MessageSquare, Activity, Zap
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
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2 text-white">
        {type === 'time_distance' ? (
          <>
            <span>{(set.distance || 0)}m</span>
            <span className="text-text-dim text-[8px]">@</span>
            <span>{formatSeconds(set.duration || 0)}</span>
          </>
        ) : type === 'time_only' ? (
          <span>{formatSeconds(set.duration || 0)}</span>
        ) : type === 'reps_only' ? (
          <span>{set.reps || 0} reps</span>
        ) : ( // Default to reps_weight or if type is undefined
          <>
            <span>{set.reps || 0}</span>
            <span className="text-text-dim text-[8px]">×</span>
            <span>{set.weight || 0}kg</span>
          </>
        )}
      </div>

      {/* Sekundär info (Tempo/Volym/RPE/Trötthet) */}
      <div className="flex flex-wrap justify-end gap-1.5 mt-0.5">
        {type === 'time_distance' && calculatePace(set.duration || 0, set.distance || 0) && (
          <span className="text-[8px] text-accent-blue font-black uppercase tracking-tighter">
            {calculatePace(set.duration || 0, set.distance || 0)}
          </span>
        )}
        {(type === 'reps_weight' || !type) && calculateSetVolume(set) > 0 && (
          <span className="text-[8px] text-text-dim font-bold uppercase tracking-tighter">
            Volym: {calculateSetVolume(set)}kg
          </span>
        )}
        {set.rpe && (
          <span className="text-[8px] px-1.5 bg-accent-pink/20 text-accent-pink rounded-full font-black">
            RPE {set.rpe}
          </span>
        )}
        {set.fatigue && (
          <span className="text-[8px] px-1.5 bg-orange-500/20 text-orange-400 rounded-full font-black">
            Trötthet: {set.fatigue}
          </span>
        )}
      </div>
    </div>
  );
};

// --- HUVUDKOMPONENT ---
interface WorkoutLogProps {
  history: WorkoutSession[];
  plannedActivities: PlannedActivityForLogDisplay[]; // Updated type to include templates
  routines: WorkoutRoutine[];
  allExercises: Exercise[];
  onAddPlan: (activity: ScheduledActivity, isRecurring: boolean, days?: number[]) => void;
  onTogglePlan: (id: string) => void; // Keeping for now, but not used in new model
  onDeletePlan: (id: string, isTemplate: boolean) => void; // Updated signature
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

  const weekdays = [
    { id: 1, label: 'Mån' },
    { id: 2, label: 'Tis' },
    { id: 3, label: 'Ons' },
    { id: 4, label: 'Tor' },
    { id: 5, label: 'Fre' },
    { id: 6, label: 'Lör' },
    { id: 0, label: 'Sön' }
  ];

  const weekDays = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay(); // 0 for Sunday, 1 for Monday
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Monday start of week
    const start = new Date(d.setDate(diff));
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(day.getDate() + i);
      return day;
    });
  }, [currentDate]);

  const toggleDay = (dayId: number) => {
    setSelectedDays(prev => 
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]
    );
  };

  const handleSavePlan = () => {
    const routine = routines.find(r => r.id === selectedRoutineId);
    const finalTitle = planTitle || routine?.name || 'Ny Plan';
    
    // Create a ScheduledActivity object that App.tsx can then convert to RecurringPlan if needed
    const activity: ScheduledActivity = {
      id: `plan-${Date.now()}`,
      date: planDate, // This date will be startDate for RecurringPlan
      type: 'gym', // Default to gym, can be expanded later
      title: finalTitle,
      isCompleted: false, // Initial state, will be linked to a session
      exercises: routine?.exercises || []
    };

    onAddPlan(activity, isRecurring, selectedDays); // Pass isRecurring and selectedDays to App.tsx
    setShowPlanModal(false);
    resetForm();
  };

  const resetForm = () => {
    setPlanTitle('');
    setSelectedRoutineId('');
    setIsRecurring(false);
    setSelectedDays([]);
  };

  return (
    <div className="pb-32 space-y-6 animate-in fade-in">
      {/* HEADER & KALENDER NAVIGATION */}
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
        <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)))} className="p-3 text-text-dim hover:text-white transition-colors shrink-0">
          <ChevronLeft size={20} />
        </button>
        <div className="flex flex-1 justify-around items-center px-1 min-w-0 overflow-hidden">
          {weekDays.map(d => {
            const isToday = d.toDateString() === new Date().toDateString(); // Added isToday variable
            return (
              <div key={d.toString()} className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-all ${isToday ? 'bg-accent-pink text-white shadow-md shadow-accent-pink/20 scale-110' : 'text-text-dim'}`} style={{ width: 'calc(100% / 7)', maxWidth: '45px' }}>
                <span className="text-[7px] font-black uppercase opacity-60 leading-none mb-1">{d.toLocaleDateString('sv-SE', { weekday: 'short' }).replace('.', '').slice(0, 3)}</span>
                <span className="text-xs font-black leading-none">{d.getDate()}</span>
              </div>
            );
          })}
        </div>
        <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)))} className="p-3 text-text-dim hover:text-white transition-colors shrink-0">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="px-4 space-y-6">
        {weekDays.map(day => {
          const dKey = day.toISOString().split('T')[0];
          const isToday = dKey === new Date().toISOString().split('T')[0];
          const dayOfWeekNum = day.getDay(); // 0 for Sunday, 1 for Monday

          // Filter planned activities:
          // 1. Direct ScheduledActivity for this date.
          // 2. RecurringPlan template if it matches dayOfWeek AND no concrete ScheduledActivity instance exists for this day.
          const dayPlans = plannedActivities.filter(p => {
            if (!('isTemplate' in p)) { // It's a ScheduledActivity instance
              return p.date === dKey;
            } else { // It's a RecurringPlanForDisplay template
              // Only show template if it's for this day of week and no specific instance has been generated/logged for this day.
              // Fix: Access 'daysOfWeek' property directly from 'p' as 'RecurringPlanForDisplay' extends 'RecurringPlan'
              const isScheduledForDay = (p as RecurringPlanForDisplay).daysOfWeek?.includes(dayOfWeekNum);
              if (!isScheduledForDay) return false;

              // Check if a concrete ScheduledActivity instance from this template already exists for today
              const hasConcreteInstance = plannedActivities.some(
                (otherP) => !('isTemplate' in otherP) && (otherP as ScheduledActivity).recurrenceId === p.id && otherP.date === dKey
              );
              return isScheduledForDay && !hasConcreteInstance;
            }
          });
          
          const dayHistory = history.filter(h => h.date.startsWith(dKey));

          return (
            <div key={dKey} className="space-y-3">
              {/* DAG-RUBRIK */}
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
                      {'isTemplate' in p ? <Repeat size={18} /> : <CalIcon size={18} />}
                    </div>
                    <div>
                      <p className="text-xs font-black text-white uppercase italic leading-none mb-1">{p.title}</p>
                      <p className="text-[9px] font-bold text-accent-blue/60 uppercase tracking-widest">
                        {'isTemplate' in p ? 'Återkommande' : 'Planerat'} • {p.exercises?.length || 0} övningar
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Only allow starting actual ScheduledActivity instances, not templates */}
                    {!('isTemplate' in p) && (
                      <button onClick={() => onStartActivity(p as ScheduledActivity)} className="bg-accent-blue text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-accent-blue/20 active:scale-95 transition-transform">Starta</button>
                    )}
                    <button 
                      onClick={() => {
                        const msg = 'isTemplate' in p ? "Vill du ta bort denna återkommande passmall och alla framtida instanser?" : "Ta bort planerat pass?";
                        if(confirm(msg)) onDeletePlan(p.id, 'isTemplate' in p);
                      }} 
                      className="p-2 text-text-dim hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}

              {/* HISTORIK - UTFÖRDA PASS */}
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
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <span className="text-[9px] text-green-500/70 font-black uppercase tracking-widest">Slutfört</span>
                            <span className="text-[9px] text-text-dim font-bold uppercase tracking-widest">• {Math.round((session.duration || 0)/60)} min</span>
                            
                            {/* VISNING AV GYM/PLATS */}
                            {session.locationName && (
                              <span className="text-[9px] text-accent-blue font-black uppercase tracking-widest flex items-center gap-1 bg-accent-blue/5 px-2 py-0.5 rounded-full border border-accent-blue/10">
                                <MapPin size={8} /> {session.locationName}
                              </span>
                            )}
                        </div>
                      </div>
                    </div>
                    <div className="text-text-dim">{expandedId === session.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</div>
                  </div>

                  {/* EXPANDERAD VY FÖR HISTORIK */}
                  {expandedId === session.id && (
                    <div className="px-5 pb-5 border-t border-white/5 animate-in slide-in-from-top-2 duration-300">
                      <div className="py-4 space-y-6">
                        {/* Om hela passet har en anteckning */}
                        {session.notes && (
                          <div className="bg-white/5 p-3 rounded-2xl border border-white/5 mb-2">
                            <p className="text-[10px] text-text-dim italic leading-relaxed">"{session.notes}"</p>
                          </div>
                        )}

                        {session.exercises.map((ex, idx) => {
                          const exData = allExercises.find(e => e.id === ex.exerciseId);
                          return (
                            <div key={idx} className="space-y-3">
                              <div className="flex justify-between items-start">
                                <div className="flex flex-col">
                                  <span className="text-[11px] font-black uppercase italic text-accent-pink tracking-tight">{exData?.name || 'Övning'}</span>
                                  {ex.notes && (
                                    <div className="flex items-start gap-1.5 mt-1 text-[9px] text-text-dim bg-white/5 p-2 rounded-lg border border-white/5">
                                      <MessageSquare size={10} className="mt-0.5 shrink-0" />
                                      <p className="italic leading-relaxed">{ex.notes}</p>
                                    </div>
                                  )}
                                </div>
                                <span className="text-[9px] text-text-dim font-bold uppercase">{ex.sets.filter(s=>s.completed).length} set</span>
                              </div>

                              <div className="space-y-1.5">
                                {ex.sets.filter(s=>s.completed).map((set, sIdx) => (
                                  <div key={sIdx} className="bg-black/20 p-3 rounded-2xl flex justify-between items-center text-[11px] font-bold border border-white/5">
                                    <div className="flex flex-col">
                                      <span className="text-text-dim opacity-50 font-mono text-[9px]">SET {sIdx + 1}</span>
                                      {set.duration > 0 && exData?.trackingType !== 'time_distance' && exData?.trackingType !== 'time_only' && (
                                        <span className="text-[8px] text-text-dim flex items-center gap-1">
                                          <Timer size={8} /> {formatSeconds(set.duration)}
                                        </span>
                                      )}
                                    </div>
                                    <SetValueDisplay set={set} type={exData?.trackingType} />
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {/* RADERA PASS */}
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

              {/* SNABBKNAPP PLANERA */}
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
        <div className="fixed inset-0 z-[105] bg-[#0f0d15]/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-[#0f0d15]/90 backdrop-blur-sm" onClick={() => setShowPlanModal(false)} />
          <div 
            className="relative bg-[#1a1721] w-full max-w-sm rounded-[40px] border border-white/10 p-8 shadow-2xl animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter">Planera</h3>
                <button 
                  onClick={() => setShowPlanModal(false)} 
                  className="p-2 bg-white/5 rounded-full text-text-dim hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
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
               
               {/* ÅTERKOMMANDE SWITCH */}
               <div className="flex items-center justify-between bg-black/20 p-4 rounded-2xl border border-white/5">
                 <div className="flex items-center gap-3">
                   <Repeat size={18} className={isRecurring ? "text-accent-blue" : "text-text-dim"} />
                   <span className="text-xs font-black uppercase text-white tracking-widest">Återkommande</span>
                 </div>
                 <button 
                  onClick={() => setIsRecurring(!isRecurring)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${isRecurring ? 'bg-accent-blue' : 'bg-white/10'}`}
                 >
                   <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isRecurring ? 'right-1' : 'left-1'}`} />
                 </button>
               </div>

               {/* DAGVAL (Visas endast om återkommande är på) */}
               {isRecurring ? (
                 <div className="flex justify-between gap-1">
                   {weekdays.map(day => (
                     <button
                       key={day.id}
                       onClick={() => toggleDay(day.id)}
                       className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all border ${
                         selectedDays.includes(day.id) 
                         ? 'bg-accent-blue border-accent-blue text-white' 
                         : 'bg-black/40 border-white/5 text-text-dim'
                       }`}
                     >
                       {day.label}
                     </button>
                   ))}
                 </div>
               ) : (
                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-text-dim ml-2 tracking-widest">Datum</label>
                    <input type="date" value={planDate} onChange={e => setPlanDate(e.target.value)} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-bold outline-none" />
                 </div>
               )}

               <button onClick={handleSavePlan} className="w-full py-5 bg-white text-black rounded-3xl font-black italic uppercase tracking-widest shadow-xl active:scale-95 transition-transform mt-2">
                 Spara Plan
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
