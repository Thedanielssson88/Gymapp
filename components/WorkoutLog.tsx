import React, { useState, useMemo } from 'react';
import { WorkoutSession, ScheduledActivity, ActivityType, WorkoutRoutine, Exercise, MovementPattern } from '../types';
import { 
  Calendar as CalIcon, ChevronLeft, ChevronRight, CheckCircle2, 
  Circle, Plus, Dumbbell, History, Repeat, Trash2, X, Share2, Settings, ChevronDown 
} from 'lucide-react';

interface WorkoutLogProps {
  history: WorkoutSession[];
  plannedActivities: ScheduledActivity[];
  routines: WorkoutRoutine[];
  allExercises: Exercise[];
  onAddPlan: (activity: ScheduledActivity, isRecurring: boolean, days?: number[]) => void;
  onTogglePlan: (id: string) => void;
  onDeletePlan: (id: string) => void;
}

export const WorkoutLog: React.FC<WorkoutLogProps> = ({ 
  history, plannedActivities, routines, allExercises, onAddPlan, onTogglePlan, onDeletePlan 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  
  // State for the modal
  const [planTitle, setPlanTitle] = useState('');
  const [planDate, setPlanDate] = useState('');
  const [planType, setPlanType] = useState<ActivityType>('gym');
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  // --- CALENDAR LOGIC (Weekly View) ---
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

  const handleSavePlan = () => {
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

  const getWeekNumber = (d: Date) => {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay()||7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
    return Math.ceil(( ( (date.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
  };

  const selectedSession = useMemo(() => 
    history.find(s => s.id === selectedSessionId), 
    [selectedSessionId, history]
  );

  const calculateTotalVolume = (session: WorkoutSession) => {
    return session.exercises.reduce((total, pe) => {
      const exData = allExercises.find(e => e.id === pe.exerciseId);
      if (exData?.trackingType === 'time_only' || exData?.pattern === MovementPattern.MOBILITY) return total;
      return total + pe.sets.reduce((sum, s) => s.completed ? sum + (s.weight * s.reps) : sum, 0);
    }, 0);
  };

  return (
    <div className="min-h-screen pb-40 animate-in fade-in duration-700 bg-[#0f0d15] text-white">
      <header className="px-6 pt-12 pb-6 flex justify-between items-center">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter">Planering</h1>
        <button 
          onClick={() => { setPlanDate(dateKey(new Date())); setShowPlanModal(true); }}
          className="bg-accent-pink text-white p-3 rounded-2xl shadow-[0_0_20px_rgba(255,45,85,0.3)] active:scale-95 transition-all"
        >
          <Plus size={28} strokeWidth={3} />
        </button>
      </header>

      {/* WEEK NAVIGATOR */}
      <section className="px-4 mb-6">
        <div className="flex items-center justify-between bg-[#1a1721] p-2 rounded-[24px] border border-white/5">
          <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)))} className="p-3 text-text-dim hover:text-white"><ChevronLeft size={20}/></button>
          <div className="text-center">
            <span className="text-[9px] font-black uppercase text-text-dim tracking-widest block mb-0.5">Vecka {getWeekNumber(currentDate)}</span>
            <span className="text-xs font-bold text-white uppercase tracking-tight">{currentDate.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })}</span>
          </div>
          <button onClick={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)))} className="p-3 text-text-dim hover:text-white"><ChevronRight size={20}/></button>
        </div>
      </section>

      {/* CALENDAR DAYS */}
      <section className="px-4 space-y-4">
        {weekDays.map(day => {
          const dKey = dateKey(day);
          const isToday = dKey === dateKey(new Date());
          const dayHistory = history.filter(h => h.date.startsWith(dKey));
          const dayPlans = plannedActivities.filter(p => p.date === dKey);

          return (
            <div key={dKey} className={`min-h-[100px] rounded-[32px] border p-4 flex gap-4 transition-all ${isToday ? 'bg-white/5 border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.02)]' : 'bg-[#1a1721] border-white/5'}`}>
              <div className="flex flex-col items-center w-12 pt-1 border-r border-white/5 pr-4">
                <span className="text-[10px] font-black uppercase text-text-dim tracking-widest">{day.toLocaleDateString('sv-SE', {weekday:'short'}).toUpperCase()}</span>
                <span className={`text-xl font-black italic ${isToday ? 'text-accent-pink' : 'text-white'}`}>{day.getDate()}</span>
              </div>

              <div className="flex-1 space-y-3 pt-1">
                {dayHistory.map(h => (
                  <button 
                    key={h.id} 
                    onClick={() => setSelectedSessionId(h.id)}
                    className="w-full bg-green-500/10 border border-green-500/20 p-4 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={18} className="text-green-500" />
                      <div className="text-left">
                        <p className="text-sm font-black italic uppercase text-green-500/70 truncate">{h.name}</p>
                        <p className="text-[9px] text-green-500/40 font-black uppercase tracking-widest">Slutfört • {h.duration ? Math.floor(h.duration / 60) : 0} MIN</p>
                      </div>
                    </div>
                    <History size={16} className="text-green-500/20" />
                  </button>
                ))}

                {dayPlans.map(p => {
                  const isDone = p.isCompleted;
                  if (isDone && dayHistory.some(h => h.id === p.linkedSessionId)) return null;
                  
                  return (
                    <div key={p.id} className="relative group">
                      <div 
                        onClick={() => onTogglePlan(p.id)}
                        className={`p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                          isDone ? 'bg-white/5 border-white/5 opacity-50' : 'bg-accent-blue/10 border-accent-blue/30'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {isDone ? <CheckCircle2 size={18} className="text-text-dim"/> : <Circle size={18} className="text-accent-blue"/>}
                          <div>
                            <p className={`text-sm font-black italic uppercase ${isDone ? 'text-text-dim line-through' : 'text-white'}`}>{p.title}</p>
                            <p className="text-[9px] text-text-dim font-black uppercase tracking-widest flex items-center gap-2">
                              {p.type} 
                              {p.exercises && p.exercises.length > 0 && `• ${p.exercises.length} Övningar`}
                              {p.recurrenceId && <Repeat size={10} className="text-accent-blue" />}
                            </p>
                          </div>
                        </div>
                      </div>
                      <button onClick={(e) => {e.stopPropagation(); onDeletePlan(p.id)}} className="absolute -top-3 -right-3 bg-red-500/20 text-red-500 p-2 rounded-full border border-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={14}/></button>
                    </div>
                  );
                })}

                {dayHistory.length === 0 && dayPlans.length === 0 && (
                  <button 
                    onClick={() => { setPlanDate(dKey); setShowPlanModal(true); }}
                    className="w-full h-full flex items-center gap-3 px-4 py-3 border-2 border-dashed border-white/5 rounded-2xl text-text-dim/20 hover:text-text-dim hover:border-white/10 text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    <Plus size={16}/> Planera Pass
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </section>

      {/* PLAN MODAL */}
      {showPlanModal && (
        <div className="fixed inset-0 z-[200] bg-[#0f0d15]/95 backdrop-blur-xl flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-[#1a1721] w-full max-w-sm rounded-[40px] border border-white/10 p-8 shadow-2xl animate-in slide-in-from-bottom-10">
            <header className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter">Planera</h3>
              <button onClick={() => setShowPlanModal(false)} className="p-2 text-text-dim hover:text-white"><X size={24}/></button>
            </header>
            
            <div className="space-y-6">
              <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                <button onClick={() => setIsRecurring(false)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isRecurring ? 'bg-white text-black' : 'text-text-dim'}`}>Enstaka</button>
                <button onClick={() => setIsRecurring(true)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isRecurring ? 'bg-white text-black' : 'text-text-dim'}`}>Återkommande</button>
              </div>

              {isRecurring ? (
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-dim block text-center">Välj dagar</label>
                  <div className="flex justify-between gap-1">
                    {['S','M','T','O','T','F','L'].map((d, i) => (
                      <button key={i} onClick={() => toggleDay(i)} className={`w-9 h-9 rounded-full text-[10px] font-black transition-all border ${selectedDays.includes(i) ? 'bg-accent-pink text-white border-accent-pink shadow-[0_0_10px_rgba(255,45,85,0.3)]' : 'bg-white/5 border-white/5 text-text-dim'}`}>{d}</button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-dim block mb-2">Datum</label>
                  <input type="date" value={planDate} onChange={e => setPlanDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none focus:border-accent-pink" />
                </div>
              )}

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-text-dim block mb-2">Vad ska köras?</label>
                {routines.length > 0 && (
                  <select 
                    value={selectedRoutineId} 
                    onChange={(e) => setSelectedRoutineId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-sm font-bold outline-none mb-3"
                  >
                    <option value="">-- Välj Rutin --</option>
                    {routines.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                )}
                {!selectedRoutineId && (
                  <input 
                    type="text" 
                    placeholder="Egen titel (t.ex. Rehab Axel)..." 
                    value={planTitle} 
                    onChange={e => setPlanTitle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold outline-none placeholder:text-white/20"
                  />
                )}
              </div>
              
              <div className="flex gap-2">
                {(['gym', 'rehab', 'cardio'] as ActivityType[]).map(t => (
                  <button key={t} onClick={() => setPlanType(t)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${planType === t ? 'bg-white text-black border-white' : 'bg-transparent border-white/10 text-text-dim'}`}>{t}</button>
                ))}
              </div>

              <button onClick={handleSavePlan} className="w-full py-6 bg-accent-pink text-white rounded-[24px] font-black italic uppercase tracking-widest shadow-2xl mt-4 active:scale-95 transition-all">Spara Planering</button>
            </div>
          </div>
        </div>
      )}

      {/* SESSION DETAIL MODAL (REUSED FROM PREVIOUS LOG) */}
      {selectedSession && (
        <div className="fixed inset-0 bg-[#0f0d15] z-[250] p-0 flex flex-col animate-in slide-in-from-bottom-6 duration-500 overflow-y-auto scrollbar-hide">
          <header className="px-6 pt-12 pb-8 flex justify-between items-start sticky top-0 bg-[#0f0d15]/80 backdrop-blur-xl z-10 border-b border-white/5">
            <div>
              <span className="text-[10px] font-black text-accent-pink uppercase tracking-[0.4em] block mb-2">
                {selectedSession.date.split('T')[0]} • {selectedSession.duration ? Math.floor(selectedSession.duration / 60) : 0} MIN
              </span>
              <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none">{selectedSession.name}</h2>
            </div>
            <button onClick={() => setSelectedSessionId(null)} className="p-3 bg-white/5 rounded-2xl border border-white/10 text-white/40"><X size={28}/></button>
          </header>

          <div className="p-6 space-y-8 pb-32">
            <div className="bg-[#1a1721] p-6 rounded-[32px] border border-white/5">
              <div className="flex justify-between items-center mb-6">
                 <div className="flex items-center gap-3"><Dumbbell size={18} className="text-accent-pink" /><h4 className="text-xs font-black uppercase tracking-[0.2em]">Genomförda övningar</h4></div>
                 <span className="text-[10px] font-black text-white/40 uppercase">Totalt {calculateTotalVolume(selectedSession).toLocaleString()} kg</span>
              </div>
              <div className="space-y-6">
                {selectedSession.exercises.map((pe, idx) => {
                  const ex = allExercises.find(e => e.id === pe.exerciseId);
                  return (
                    <div key={idx} className="space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center"><Dumbbell size={14} className="text-white/20" /></div>
                           <div><h5 className="font-black uppercase italic text-sm tracking-tight leading-none">{ex?.name || 'Okänd'}</h5><span className="text-[8px] font-black text-text-dim uppercase tracking-widest">{ex?.pattern}</span></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5 pl-11">
                        {pe.sets.filter(s => s.completed).map((set, sIdx) => (
                          <div key={sIdx} className="flex items-center justify-between text-[11px] py-1 px-3 rounded-lg border border-white/5 bg-white/5">
                             <div className="flex items-center gap-4">
                               <span className="font-black text-text-dim/60 w-3">{sIdx + 1}</span>
                               <span className="font-bold text-white/80">{set.weight} kg x {set.reps} reps</span>
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <button onClick={() => setSelectedSessionId(null)} className="w-full py-6 bg-white/5 border border-white/10 rounded-3xl text-white/60 font-black uppercase tracking-widest italic">Stäng</button>
          </div>
        </div>
      )}
    </div>
  );
};