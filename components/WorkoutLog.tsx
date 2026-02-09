import React, { useState, useMemo } from 'react';
import { WorkoutSession, ScheduledActivity, ActivityType, WorkoutRoutine, Exercise, SetType } from '../types';
import { 
  Calendar as CalIcon, ChevronLeft, ChevronRight, CheckCircle2, 
  Circle, Plus, Dumbbell, History, Repeat, Trash2, X, Play, Clock, TrendingUp,
  MessageSquare, Flame, AlertTriangle
} from 'lucide-react';

interface WorkoutLogProps {
  history: WorkoutSession[];
  plannedActivities: ScheduledActivity[];
  routines: WorkoutRoutine[];
  onAddPlan: (activity: ScheduledActivity, isRecurring: boolean, days?: number[]) => void;
  onTogglePlan: (id: string) => void;
  onDeletePlan: (id: string) => void;
  onStartActivity: (activity: ScheduledActivity) => void;
  allExercises: Exercise[];
}

export const WorkoutLog: React.FC<WorkoutLogProps> = ({ 
  history, plannedActivities, routines, onAddPlan, onTogglePlan, onDeletePlan, onStartActivity, allExercises 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  
  // State för modalen
  const [planTitle, setPlanTitle] = useState('');
  const [planDate, setPlanDate] = useState('');
  const [planType, setPlanType] = useState<ActivityType>('gym');
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  // --- KALENDER LOGIK (Veckovy) ---
  const startOfWeek = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      days.push(new Date(d));
    }
    return days;
  }, [startOfWeek]);

  const dateKey = (d: Date) => d.toISOString().split('T')[0];

  const handleSave = () => {
    if (!planTitle && !selectedRoutineId) return;

    const routine = routines.find(r => r.id === selectedRoutineId);
    const exercises = routine ? routine.exercises : [];
    const finalTitle = planTitle || routine?.name || 'Träning';

    const activity: ScheduledActivity = {
      id: `manual-${Date.now()}`,
      date: planDate || dateKey(new Date()),
      type: planType,
      title: finalTitle,
      isCompleted: false,
      exercises: exercises
    };

    onAddPlan(activity, isRecurring, selectedDays);
    
    setShowPlanModal(false);
    setPlanTitle('');
    setSelectedRoutineId('');
    setIsRecurring(false);
    setSelectedDays([]);
  };

  const toggleDay = (d: number) => {
    if(selectedDays.includes(d)) setSelectedDays(selectedDays.filter(x => x !== d));
    else setSelectedDays([...selectedDays, d]);
  };

  const getTypeColor = (type?: SetType) => {
    switch (type) {
      case 'warmup': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'drop': return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'failure': return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      default: return 'text-white bg-white/5 border-white/5';
    }
  };

  return (
    <div className="pb-32 space-y-4 animate-in fade-in">
      <div className="px-4 flex justify-between items-end pt-8">
         <h2 className="text-3xl font-black italic uppercase text-white">Kalender</h2>
         <button 
           onClick={() => { setPlanDate(dateKey(new Date())); setShowPlanModal(true); }}
           className="bg-white text-black p-3 rounded-xl shadow-lg active:scale-95 transition-all"
         >
           <Plus size={24} />
         </button>
      </div>

      {/* NAVIGERING */}
      <div className="flex items-center justify-between px-6 bg-[#1a1721] py-3 mx-4 rounded-2xl border border-white/5">
         <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)))}><ChevronLeft className="text-text-dim"/></button>
         <span className="text-xs font-black uppercase tracking-widest text-white">Vecka {getWeekNumber(currentDate)}</span>
         <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)))}><ChevronRight className="text-text-dim"/></button>
      </div>

      {/* DAGAR */}
      <div className="px-4 space-y-3">
        {weekDays.map(day => {
           const dKey = dateKey(day);
           const isToday = dKey === dateKey(new Date());
           
           const dayHistory = history.filter(h => dateKey(new Date(h.date)) === dKey);
           const dayPlans = plannedActivities.filter(p => p.date === dKey);

           return (
             <div key={dKey} className={`min-h-[80px] rounded-2xl border p-3 flex gap-4 ${isToday ? 'bg-white/10 border-white/20' : 'bg-[#1a1721] border-white/5'}`}>
                {/* Datum */}
                <div className="flex flex-col items-center w-10 pt-1 flex-shrink-0">
                   <span className="text-[9px] font-bold uppercase text-text-dim">{day.toLocaleDateString('sv-SE', {weekday:'short'}).replace('.','')}</span>
                   <span className={`text-lg font-black ${isToday ? 'text-accent-pink' : 'text-white'}`}>{day.getDate()}</span>
                </div>

                {/* Innehåll */}
                <div className="flex-1 space-y-2 min-w-0">
                   {/* 1. Historik (Utförda pass) */}
                   {dayHistory.map(h => (
                      <div key={h.id} className="bg-[#0f0d15] border border-white/10 rounded-xl overflow-hidden">
                         <div 
                           onClick={() => setExpandedSessionId(expandedSessionId === h.id ? null : h.id)}
                           className="p-3 flex items-center justify-between cursor-pointer active:bg-white/5 transition-colors"
                         >
                            <div className="flex items-center gap-3">
                               <CheckCircle2 size={16} className="text-green-500" />
                               <div className="min-w-0">
                                  <p className="text-xs font-bold text-white line-through opacity-60 truncate">{h.name}</p>
                                  <div className="flex items-center gap-x-2 gap-y-1 mt-0.5 flex-wrap">
                                    <span className="text-[9px] text-green-400 font-bold uppercase">Slutfört</span>
                                    <span className="text-[9px] text-text-dim flex items-center gap-1"><Clock size={10}/> {Math.round((h.duration || 0) / 60)} min</span>
                                    {h.rpe && (
                                        <span className="text-[9px] text-text-dim flex items-center gap-1">
                                            <TrendingUp size={10}/> RPE {h.rpe}
                                        </span>
                                    )}
                                    {h.feeling && (
                                        <span className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded capitalize text-white/70">
                                            {h.feeling}
                                        </span>
                                    )}
                                  </div>
                               </div>
                            </div>
                            <History size={14} className="text-white/20" />
                         </div>

                         {/* EXPANDERAD VY FÖR HISTORIK */}
                         {expandedSessionId === h.id && (
                           <div className="bg-black/20 p-3 border-t border-white/5 space-y-3 animate-in slide-in-from-top-2">
                              {h.exercises.map((ex, i) => {
                                 const exDef = allExercises.find(e => e.id === ex.exerciseId);
                                 return (
                                   <div key={i} className="space-y-1">
                                      <div className="flex justify-between items-baseline">
                                        <p className="text-[10px] font-black uppercase text-accent-blue">{exDef?.name || 'Övning'}</p>
                                        {ex.notes && <MessageSquare size={10} className="text-white/40" />}
                                      </div>
                                      
                                      {/* Set Lista */}
                                      <div className="space-y-1">
                                        {ex.sets.filter(s => s.completed).map((s, si) => (
                                          <div key={si} className="flex items-center gap-2 text-[10px] text-text-dim">
                                             <span className={`w-4 text-center font-mono opacity-50`}>{si + 1}</span>
                                             <span className="text-white font-bold">{s.weight}kg x {s.reps}</span>
                                             
                                             {/* Taggar */}
                                             {s.type === 'warmup' && <span className="px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[8px] uppercase font-bold flex items-center gap-1"><Flame size={8}/> Uppv.</span>}
                                             {s.type === 'failure' && <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-500 border border-purple-500/20 text-[8px] uppercase font-bold flex items-center gap-1"><AlertTriangle size={8}/> Fail</span>}
                                             {s.type === 'drop' && <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20 text-[8px] uppercase font-bold">DROP</span>}
                                          </div>
                                        ))}
                                      </div>
                                      
                                      {/* Anteckningar */}
                                      {ex.notes && (
                                        <p className="text-[9px] italic text-white/40 bg-white/5 p-2 rounded-lg mt-1">
                                          "{ex.notes}"
                                        </p>
                                      )}
                                   </div>
                                 );
                              })}
                           </div>
                         )}
                      </div>
                   ))}

                   {/* 2. Planerade pass */}
                   {dayPlans.map(p => {
                      const isDone = p.isCompleted; 
                      return (
                        <div key={p.id} className="relative group">
                           <div className={`p-3 rounded-xl border flex flex-col gap-2 transition-all ${isDone ? 'bg-white/5 border-white/5 opacity-50' : 'bg-accent-blue/10 border-accent-blue/30'}`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                   {isDone ? <CheckCircle2 size={16} className="text-text-dim"/> : <Circle size={16} className="text-accent-blue"/>}
                                   <div>
                                      <p className={`text-xs font-bold ${isDone ? 'text-text-dim line-through' : 'text-white'}`}>{p.title}</p>
                                      <p className="text-[9px] text-text-dim font-bold uppercase flex items-center gap-1">
                                         {p.type} 
                                         {p.recurrenceId && <Repeat size={8} />}
                                      </p>
                                   </div>
                                </div>
                                {!isDone && (
                                  <button onClick={() => onStartActivity(p)} className="bg-accent-blue text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 active:scale-95 transition-all shadow-lg shadow-accent-blue/20">
                                    <Play size={10} fill="currentColor" /> Starta
                                  </button>
                                )}
                              </div>
                              
                              {/* Visa övningar i planeringen om de finns */}
                              {p.exercises && p.exercises.length > 0 && (
                                <div className="pl-7 pt-1 border-t border-white/5 mt-1">
                                  <p className="text-[9px] font-bold text-white/40 uppercase mb-1">{p.exercises.length} övningar:</p>
                                  <div className="flex flex-wrap gap-1">
                                    {p.exercises.slice(0, 3).map((pe, i) => {
                                      const exName = allExercises.find(e => e.id === pe.exerciseId)?.name;
                                      return exName ? <span key={i} className="text-[9px] bg-black/20 px-1.5 py-0.5 rounded text-white/60">{exName}</span> : null;
                                    })}
                                    {p.exercises.length > 3 && <span className="text-[9px] text-white/40">...</span>}
                                  </div>
                                </div>
                              )}
                           </div>
                           <button onClick={(e) => {e.stopPropagation(); onDeletePlan(p.id)}} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                        </div>
                      );
                   })}

                   {/* Tom dag? */}
                   {dayHistory.length === 0 && dayPlans.length === 0 && (
                      <button 
                        onClick={() => { setPlanDate(dKey); setShowPlanModal(true); }}
                        className="w-full h-full flex items-center justify-center gap-2 px-3 py-4 border-2 border-dashed border-white/5 rounded-xl text-text-dim/30 hover:text-text-dim hover:border-white/10 text-[10px] font-bold uppercase tracking-widest transition-all"
                      >
                         <Plus size={14}/> Planera
                      </button>
                   )}
                </div>
             </div>
           );
        })}
      </div>

      {/* --- MODAL --- */}
      {showPlanModal && (
         <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
            <div className="bg-[#1a1721] w-full max-w-sm rounded-[32px] border border-white/10 p-6 animate-in slide-in-from-bottom-10">
               <h3 className="text-xl font-black italic uppercase text-white mb-6">Planera Pass</h3>
               
               <div className="space-y-4">
                  {/* Val av datum */}
                  <div>
                     <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-bold uppercase text-text-dim">Datum / Rutin</label>
                        <button onClick={() => setIsRecurring(!isRecurring)} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase ${isRecurring ? 'bg-accent-blue text-white' : 'bg-white/5 text-text-dim'}`}>
                           <Repeat size={10} /> {isRecurring ? 'Återkommande' : 'Enstaka'}
                        </button>
                     </div>
                     
                     {isRecurring ? (
                        <div className="flex justify-between gap-1">
                           {['S','M','T','O','T','F','L'].map((d, i) => (
                              <button key={i} onClick={() => toggleDay(i)} className={`w-8 h-8 rounded-full text-[10px] font-black ${selectedDays.includes(i) ? 'bg-white text-black' : 'bg-white/5 text-text-dim'}`}>{d}</button>
                           ))}
                        </div>
                     ) : (
                        <input type="date" value={planDate} onChange={e => setPlanDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-bold outline-none" />
                     )}
                  </div>

                  {/* Val av innehåll */}
                  <div>
                     <label className="text-[10px] font-bold uppercase text-text-dim mb-2 block">Vad ska du köra?</label>
                     
                     {/* Alternativ 1: Välj Rutin */}
                     {routines.length > 0 && (
                        <div className="mb-3">
                           <select 
                             value={selectedRoutineId} 
                             onChange={(e) => setSelectedRoutineId(e.target.value)}
                             className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm font-bold outline-none mb-2"
                           >
                              <option value="">-- Välj en sparad rutin --</option>
                              {routines.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                           </select>
                        </div>
                     )}

                     {/* Alternativ 2: Fritext (om ingen rutin vald) */}
                     {!selectedRoutineId && (
                        <input 
                          type="text" 
                          placeholder="Eller skriv titel (t.ex. Rehab Axel)" 
                          value={planTitle} 
                          onChange={e => setPlanTitle(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white font-bold outline-none placeholder:text-white/20"
                        />
                     )}
                  </div>
                  
                  {/* Typ */}
                  <div className="flex gap-2">
                     {(['gym', 'rehab', 'cardio'] as ActivityType[]).map(t => (
                        <button key={t} onClick={() => setPlanType(t)} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase border ${planType === t ? 'bg-white text-black border-white' : 'bg-transparent border-white/10 text-text-dim'}`}>{t}</button>
                     ))}
                  </div>

                  <button onClick={handleSave} className="w-full py-4 bg-accent-blue text-white rounded-2xl font-black italic uppercase tracking-widest shadow-lg mt-2">Spara Planering</button>
                  <button onClick={() => setShowPlanModal(false)} className="w-full py-2 text-xs font-bold text-text-dim uppercase">Avbryt</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

function getWeekNumber(d: Date) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    var weekNo = Math.ceil(( ( (d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
    return weekNo;
}
