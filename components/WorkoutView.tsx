
import React, { useState, useEffect, useMemo } from 'react';
import { WorkoutSession, Zone, Exercise, MuscleGroup, WorkoutSet, Equipment, MovementPattern, PlannedExercise, WorkoutRoutine } from '../types';
import { findReplacement, adaptVolume } from '../utils/fitness';
import { storage } from '../services/storage';
import { RecoveryMap } from './RecoveryMap';
import { ALL_MUSCLE_GROUPS } from '../utils/recovery';
import { ChevronDown, ChevronUp, Plus, Search, X, Trash2, Check, RefreshCw, Activity, ShieldCheck, Save, Timer, Play, Pause, RotateCcw, BarChart3, Info, FileText, Dumbbell } from 'lucide-react';

interface WorkoutViewProps {
  session: WorkoutSession;
  activeZone: Zone;
  onZoneChange: (zone: Zone) => void;
  onComplete: (session: WorkoutSession, duration: number) => void;
  onCancel: () => void;
}

type LibraryTab = 'all' | 'muscles' | 'equipment';

export const WorkoutView: React.FC<WorkoutViewProps> = ({ 
  session, 
  activeZone, 
  onZoneChange,
  onComplete,
  onCancel
}) => {
  const [localSession, setLocalSession] = useState(session);
  const [timer, setTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLibraryTab, setActiveLibraryTab] = useState<LibraryTab>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoadMapOpen, setIsLoadMapOpen] = useState(false);
  const [openNotesIdx, setOpenNotesIdx] = useState<number | null>(null);
  const [infoExercise, setInfoExercise] = useState<Exercise | null>(null);

  const allExercises = storage.getAllExercises();
  const userProfile = useMemo(() => storage.getUserProfile(), []);
  const allZones = storage.getZones();

  useEffect(() => {
    let interval: any;
    if (isTimerActive) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive]);

  useEffect(() => {
    let interval: any;
    if (restTimer !== null && restTimer > 0) {
      interval = setInterval(() => setRestTimer(r => (r !== null ? r - 1 : 0)), 1000);
    } else if (restTimer === 0) {
      setRestTimer(null);
    }
    return () => clearInterval(interval);
  }, [restTimer]);

  const handleSwitchZone = (targetZone: Zone) => {
    if (targetZone.id === activeZone.id) return;
    const newExercises = localSession.exercises.map(item => {
      const currentEx = allExercises.find(e => e.id === item.exerciseId)!;
      const replacement = findReplacement(currentEx, targetZone);
      if (replacement.id === currentEx.id) return item;
      const newSets = adaptVolume(item.sets, currentEx, replacement, userProfile.goal);
      return { ...item, exerciseId: replacement.id, sets: newSets };
    });
    const updatedSession = { ...localSession, zoneId: targetZone.id, exercises: newExercises };
    setLocalSession(updatedSession);
    storage.setActiveSession(updatedSession);
    onZoneChange(targetZone);
  };

  const updateSet = (exIdx: number, setIdx: number, updates: Partial<WorkoutSet>) => {
    const newSession = { ...localSession };
    newSession.exercises[exIdx].sets[setIdx] = {
      ...newSession.exercises[exIdx].sets[setIdx],
      ...updates
    };
    if (updates.completed) setRestTimer(90); // Default rest timer 90s
    setLocalSession(newSession);
    storage.setActiveSession(newSession);
  };

  const updateNotes = (exIdx: number, notes: string) => {
    const newSession = { ...localSession };
    newSession.exercises[exIdx].notes = notes;
    setLocalSession(newSession);
    storage.setActiveSession(newSession);
  };

  const saveAsRoutine = () => {
    const name = prompt("Vad ska rutinen heta?", localSession.name);
    if (!name) return;
    
    const routine: WorkoutRoutine = {
      id: `routine-${Date.now()}`,
      name,
      exercises: localSession.exercises.map(pe => ({
        exerciseId: pe.exerciseId,
        notes: pe.notes,
        sets: pe.sets.map(s => ({ 
          reps: s.reps, 
          weight: s.weight, 
          completed: false 
        }))
      }))
    };
    
    storage.saveRoutine(routine);
    alert("Rutinen sparad i 'Mina Rutiner'!");
  };

  const addNewExercise = (ex: Exercise) => {
    const newSession = { ...localSession };
    newSession.exercises.push({
      exerciseId: ex.id,
      sets: [{ reps: 10, weight: 0, completed: false }, { reps: 10, weight: 0, completed: false }, { reps: 10, weight: 0, completed: false }]
    });
    setLocalSession(newSession);
    storage.setActiveSession(newSession);
    setShowAddModal(false);
  };

  const muscleStats = useMemo(() => {
    const counts: Record<string, number> = {};
    let totalOccurrences = 0;
    
    localSession.exercises.forEach(item => {
      const ex = allExercises.find(e => e.id === item.exerciseId);
      ex?.muscleGroups.forEach(m => {
        counts[m] = (counts[m] || 0) + 1;
        totalOccurrences++;
      });
    });

    const results = Object.entries(counts)
      .map(([name, count]) => ({
        name,
        percentage: totalOccurrences > 0 ? Math.round((count / totalOccurrences) * 100) : 0,
        count
      }))
      .sort((a, b) => b.count - a.count);

    return { results, loadMap: counts };
  }, [localSession.exercises, allExercises]);

  const filteredExercises = useMemo(() => {
    return allExercises.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
      let matchesCategory = true;
      if (activeLibraryTab === 'muscles' && selectedCategory) matchesCategory = ex.muscleGroups.includes(selectedCategory as MuscleGroup);
      else if (activeLibraryTab === 'equipment' && selectedCategory) matchesCategory = ex.equipment.includes(selectedCategory as Equipment);
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, allExercises, activeLibraryTab, selectedCategory]);

  return (
    <div className="space-y-4 pb-80 animate-in fade-in duration-500">
      {/* HEADER WITH ACTIONS */}
      <header className="px-4 pt-8 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsTimerActive(!isTimerActive)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isTimerActive ? 'bg-accent-pink/20 text-accent-pink shadow-[0_0_15px_rgba(255,45,85,0.2)]' : 'bg-white/5 text-white/40'}`}
          >
             {isTimerActive ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <div>
            <span className="text-[10px] font-black uppercase text-white/30 tracking-[0.2em] block">Workout Timer</span>
            <span className="text-xl font-black italic">{Math.floor(timer/60)}:{String(timer%60).padStart(2,'0')}</span>
          </div>
        </div>
        <div className="flex gap-2">
          {/* AVBRYT-KNAPP (Papperskorg) */}
          <button 
            onClick={() => {
              if (window.confirm("Är du säker på att du vill avbryta passet? All data går förlorad.")) {
                onCancel();
              }
            }}
            className="p-3 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 active:scale-95 transition-all"
          >
            <Trash2 size={24} />
          </button>
          <button onClick={saveAsRoutine} className="p-3 bg-white/5 rounded-xl border border-white/5 text-white/60 hover:text-white transition-all flex items-center gap-2 active:scale-95">
             <Save size={18} />
             <span className="text-[10px] font-black uppercase">Spara Mall</span>
          </button>
        </div>
      </header>

      {/* REST TIMER OVERLAY */}
      {restTimer !== null && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-accent-pink text-white px-8 py-3 rounded-full font-black italic shadow-2xl animate-in zoom-in slide-in-from-top-4 flex items-center gap-4">
          <RotateCcw size={18} className="animate-spin" />
          <span>VILA: {restTimer}s</span>
          <button onClick={() => setRestTimer(null)} className="ml-2 opacity-50"><X size={14}/></button>
        </div>
      )}

      {/* WORKOUT INSIGHTS (MÅLMUSKLER & BELASTNING) */}
      <div className="px-4 space-y-4">
        <div className="bg-[#1a1721] rounded-[32px] p-6 border border-white/5 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <BarChart3 className="text-accent-pink" size={20} />
              <h4 className="text-sm font-black uppercase italic tracking-widest">Målmuskler</h4>
            </div>
            <button 
              onClick={() => setIsLoadMapOpen(!isLoadMapOpen)}
              className="text-[10px] font-black uppercase tracking-widest text-text-dim flex items-center gap-1"
            >
              Muskelbelastning {isLoadMapOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          <div className="space-y-3">
            {muscleStats.results.slice(0, 3).map((m, idx) => (
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
            {muscleStats.results.length === 0 && (
              <p className="text-[10px] font-black text-text-dim uppercase tracking-widest text-center py-2 opacity-40">Lägg till övningar för att se fördelning</p>
            )}
          </div>

          {isLoadMapOpen && (
            <div className="mt-8 pt-8 border-t border-white/5 animate-in fade-in slide-in-from-top-2">
              <RecoveryMap status={storage.getHistory().length > 0 ? undefined : {}} loadMap={muscleStats.loadMap} size="md" />
            </div>
          )}
        </div>
      </div>

      {/* ZONE SWITCHER */}
      <div className="flex justify-center gap-2 px-2 overflow-x-auto scrollbar-hide py-2">
        {allZones.map(z => (
          <button 
            key={z.id}
            onClick={() => handleSwitchZone(z)}
            className={`flex flex-col items-center justify-center min-w-[100px] py-4 rounded-2xl border transition-all ${activeZone.id === z.id ? 'bg-white/10 border-white/20 scale-105' : 'bg-white/5 border-white/5 opacity-40'}`}
          >
            <RefreshCw size={14} className={`mb-1 ${activeZone.id === z.id ? 'text-accent-pink' : 'text-text-dim'}`} />
            <span className="text-[8px] font-black uppercase tracking-tighter italic">Byt till</span>
            <span className="text-[10px] font-black uppercase italic">{z.name}</span>
          </button>
        ))}
      </div>

      {/* EXERCISE LIST */}
      <div className="space-y-4 px-2">
        {localSession.exercises.map((item, exIdx) => {
          const exData = allExercises.find(e => e.id === item.exerciseId)!;
          
          const calculateEffectiveWeight = (w: number) => {
             const bwContr = userProfile.weight * (exData.bodyweightCoefficient || 0);
             return Math.round(w + bwContr);
          };

          const totalSets = item.sets.length;
          const avgReps = Math.round(item.sets.reduce((sum, s) => sum + s.reps, 0) / (totalSets || 1));
          const currentWeight = item.sets[0]?.weight || 0;
          const estLoad = calculateEffectiveWeight(currentWeight);

          return (
            <div key={`${item.exerciseId}-${exIdx}`} className="bg-[#1a1721] rounded-[32px] p-6 border border-white/5 shadow-xl relative group">
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4 items-center flex-1">
                  <div className="w-14 h-14 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center p-2 overflow-hidden">
                    <img src={exData.imageUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${exData.name}`} className="w-full h-full object-cover opacity-30" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-black uppercase italic tracking-tighter leading-none mb-1">{exData.name}</h3>
                    <p className="text-[10px] font-black text-text-dim uppercase tracking-widest">{exData.pattern}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-black text-white/60 uppercase">
                        {totalSets} Set, {avgReps} Reps, {currentWeight}Kg 
                      </span>
                      <span className="text-[10px] font-black text-accent-pink uppercase italic">
                        (Beräknad {estLoad}Kg)
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => setInfoExercise(exData)}
                    className="p-2 text-text-dim/40 hover:text-accent-blue transition-colors"
                  >
                    <Info size={18} />
                  </button>
                  <button 
                    onClick={() => setOpenNotesIdx(openNotesIdx === exIdx ? null : exIdx)}
                    className={`p-2 transition-colors ${openNotesIdx === exIdx ? 'text-accent-pink' : 'text-text-dim/40 hover:text-white'}`}
                  >
                    <FileText size={18} />
                  </button>
                  <button onClick={() => {if(confirm("Ta bort?")){const n={...localSession}; n.exercises.splice(exIdx,1); setLocalSession(n); storage.setActiveSession(n);}}} className="p-2 text-text-dim/20 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                </div>
              </div>

              {/* EXPANDABLE NOTES FIELD */}
              {openNotesIdx === exIdx && (
                <div className="mb-6 animate-in slide-in-from-top-2 fade-in duration-300">
                  <textarea 
                    placeholder="Anteckningar för övningen (t.ex. inställningar)..."
                    value={item.notes || ''}
                    onChange={(e) => updateNotes(exIdx, e.target.value)}
                    className="w-full bg-[#0f0d15] border border-accent-pink/20 rounded-2xl p-4 text-[11px] font-bold text-white placeholder:text-white/20 outline-none focus:border-accent-pink/50 transition-all shadow-inner"
                    rows={3}
                    autoFocus
                  />
                </div>
              )}

              {/* SETS */}
              <div className="space-y-3">
                {item.sets.map((set, setIdx) => (
                  <div key={setIdx} className={`bg-[#0f0d15] rounded-2xl p-4 flex items-center gap-4 border transition-all ${set.completed ? 'border-green-500/30 opacity-40 grayscale' : 'border-white/5'}`}>
                    <span className="text-lg font-black italic text-text-dim w-6 text-center">{setIdx + 1}</span>
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-text-dim uppercase mb-1">KG</span>
                        <input type="number" value={set.weight || ''} onChange={(e) => updateSet(exIdx, setIdx, { weight: Number(e.target.value) })} className="bg-transparent font-black text-2xl outline-none w-full" placeholder="0" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-text-dim uppercase mb-1">Reps</span>
                        <input type="number" value={set.reps || ''} onChange={(e) => updateSet(exIdx, setIdx, { reps: Number(e.target.value) })} className="bg-transparent font-black text-2xl outline-none w-full" placeholder="0" />
                      </div>
                    </div>
                    <button onClick={() => updateSet(exIdx, setIdx, { completed: !set.completed })} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${set.completed ? 'bg-green-500 text-white' : 'bg-white/5 text-text-dim'}`}>
                      {set.completed ? <Check size={28} /> : <Plus size={28} />}
                    </button>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => { const n = {...localSession}; n.exercises[exIdx].sets.push({...n.exercises[exIdx].sets[n.exercises[exIdx].sets.length-1], completed: false}); setLocalSession(n); }}
                className="w-full py-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-text-dim mt-4"
              >
                + Lägg till set
              </button>
            </div>
          );
        })}
      </div>

      <button onClick={() => setShowAddModal(true)} className="mx-2 w-[calc(100%-16px)] py-12 border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center gap-4 text-text-dim hover:border-accent-pink/50">
        <Plus size={32} />
        <span className="font-black uppercase tracking-widest text-[10px] italic">Lägg till övning</span>
      </button>

      {/* FOOTER ACTIONS */}
      <div className="fixed bottom-32 left-0 right-0 px-4 z-[70] max-w-md mx-auto space-y-3">
        {!isTimerActive && timer === 0 ? (
          <button 
            onClick={() => setIsTimerActive(true)} 
            className="w-full bg-white text-black py-6 rounded-[24px] font-black italic text-xl tracking-widest uppercase shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all"
          >
            Starta Pass <Play size={20} fill="currentColor" />
          </button>
        ) : (
          <button 
            onClick={() => setIsTimerActive(!isTimerActive)} 
            className={`w-full py-6 rounded-[24px] font-black italic text-xl tracking-widest uppercase shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all ${isTimerActive ? 'bg-white/10 text-white' : 'bg-white text-black'}`}
          >
            {isTimerActive ? 'Pausa Pass' : 'Återuppta Pass'} {isTimerActive ? <Pause size={20} /> : <Play size={20} fill="currentColor" />}
          </button>
        )}
        
        <button 
          onClick={() => onComplete(localSession, timer)} 
          className="w-full bg-accent-pink py-6 rounded-[24px] font-black italic text-xl tracking-widest uppercase shadow-2xl flex items-center justify-center gap-4 active:opacity-90"
        >
          Slutför Pass <Check size={20} strokeWidth={3} />
        </button>

        <button 
          onClick={() => { if(window.confirm("Är du säker på att du vill avbryta passet? All data går förlorad.")) onCancel(); }}
          className="w-full py-4 bg-white/5 border border-white/10 rounded-[24px] font-black italic text-[10px] tracking-widest uppercase text-white/40 hover:text-red-400 hover:border-red-400/20 transition-all flex items-center justify-center gap-2"
        >
          <Trash2 size={16} /> Avbryt Pass
        </button>
      </div>

      {/* MODAL FOR ADDING EXERCISES */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#0f0d15] z-[120] flex flex-col p-6 animate-in slide-in-from-bottom-4">
           <header className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black italic uppercase">Övningar</h3>
              <button onClick={() => setShowAddModal(false)}><X size={32}/></button>
           </header>
           <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
              <input type="text" placeholder="Sök..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 pl-12 rounded-3xl outline-none" />
           </div>
           <div className="flex-1 overflow-y-auto space-y-3">
              {filteredExercises.map(ex => (
                <div key={ex.id} className="w-full p-5 bg-[#1a1721] border border-white/5 rounded-[32px] flex justify-between items-center group shadow-lg">
                   <div className="text-left flex-1" onClick={() => addNewExercise(ex)}>
                      <span className="font-black italic uppercase text-lg block">{ex.name}</span>
                      <span className="text-[10px] font-black text-text-dim uppercase">{ex.pattern}</span>
                   </div>
                   <div className="flex gap-2">
                     <button onClick={() => setInfoExercise(ex)} className="p-3 bg-white/5 rounded-2xl text-text-dim hover:text-accent-blue transition-all">
                        <Info size={18} />
                     </button>
                     <button onClick={() => addNewExercise(ex)} className="p-3 bg-accent-pink/10 rounded-2xl text-accent-pink hover:bg-accent-pink hover:text-white transition-all">
                        <Plus size={20} />
                     </button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* EXERCISE INFO MODAL */}
      {infoExercise && (
        <div className="fixed inset-0 bg-[#0f0d15]/90 backdrop-blur-sm z-[200] p-6 overflow-y-auto animate-in fade-in">
          <div className="max-w-md mx-auto bg-[#1a1721] rounded-[40px] border border-white/10 overflow-hidden shadow-2xl pb-12">
            
            {/* IMAGE HEADER */}
            <div className="w-full h-72 bg-black/50 relative">
              {infoExercise.imageUrl ? (
                  <img src={infoExercise.imageUrl} className="w-full h-full object-cover" />
              ) : (
                  <div className="w-full h-full flex items-center justify-center flex-col gap-4 opacity-30">
                      <Dumbbell size={64} />
                      <span className="font-black uppercase tracking-widest text-xs">Ingen bild tillgänglig</span>
                  </div>
              )}
              <button 
                  onClick={() => setInfoExercise(null)}
                  className="absolute top-4 right-4 bg-black/50 p-3 rounded-full text-white backdrop-blur-md hover:scale-110 active:scale-95 transition-all"
              >
                  <X size={24} />
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div>
                  <h2 className="text-3xl font-black italic uppercase leading-none mb-2 tracking-tighter">{infoExercise.name}</h2>
                  <div className="flex gap-2">
                      <span className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest text-accent-pink">
                          {infoExercise.pattern}
                      </span>
                  </div>
              </div>

              {/* DESCRIPTION */}
              <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-dim border-b border-white/5 pb-2">Instruktioner</h4>
                  {infoExercise.description ? (
                      <p className="text-sm leading-relaxed text-white/80 font-medium whitespace-pre-wrap">
                          {infoExercise.description}
                      </p>
                  ) : (
                      <p className="text-xs italic text-white/20 font-bold uppercase tracking-widest">Ingen beskrivning tillgänglig för denna övning.</p>
                  )}
              </div>

              {/* ANATOMY badges */}
              <div className="space-y-6">
                  <div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-pink mb-3">Primära Muskler</h4>
                      <div className="flex flex-wrap gap-2">
                          {(infoExercise.primaryMuscles?.length ? infoExercise.primaryMuscles : infoExercise.muscleGroups).map(m => (
                              <span key={m} className="px-3 py-1.5 border border-accent-pink/30 bg-accent-pink/5 rounded-xl text-[10px] font-black uppercase tracking-tight">{m}</span>
                          ))}
                      </div>
                  </div>
                  {infoExercise.secondaryMuscles && infoExercise.secondaryMuscles.length > 0 && (
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-blue mb-3">Sekundära Muskler</h4>
                        <div className="flex flex-wrap gap-2">
                            {infoExercise.secondaryMuscles.map(m => (
                                <span key={m} className="px-3 py-1.5 border border-accent-blue/30 bg-accent-blue/5 rounded-xl text-[10px] font-black uppercase tracking-tight">{m}</span>
                            ))}
                        </div>
                    </div>
                  )}
              </div>

              {/* ALTERNATIVES */}
              {infoExercise.alternativeExIds && infoExercise.alternativeExIds.length > 0 && (
                  <div className="pt-6 border-t border-white/5">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-dim mb-4">Bra Alternativ</h4>
                      <div className="space-y-2">
                          {infoExercise.alternativeExIds.map(altId => {
                              const altEx = allExercises.find(e => e.id === altId);
                              return altEx ? (
                                  <div key={altId} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center overflow-hidden">
                                          <img src={altEx.imageUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${altEx.name}`} className="w-full h-full object-cover opacity-50"/>
                                      </div>
                                      <span className="text-xs font-black uppercase italic tracking-tight">{altEx.name}</span>
                                  </div>
                              ) : null;
                          })}
                      </div>
                  </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
