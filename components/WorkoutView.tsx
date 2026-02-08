
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { WorkoutSession, Zone, Exercise, MuscleGroup, WorkoutSet, Equipment, WorkoutRoutine, UserProfile } from '../types';
import { findReplacement, adaptVolume, getLastPerformance, createSmartSets, generateWorkoutSession, getExerciseHistory } from '../utils/fitness';
import { storage } from '../services/storage';
import { calculateExerciseImpact } from '../utils/recovery';
import { WorkoutSummaryModal } from './WorkoutSummaryModal';
import { WorkoutGenerator } from './WorkoutGenerator';
import { WorkoutHeader } from './WorkoutHeader';
import { WorkoutStats } from './WorkoutStats';
import { ExerciseCard } from './ExerciseCard';
import { Search, X, Plus, RefreshCw, Info, Sparkles, History, BookOpen, ArrowDownToLine, Calendar, Dumbbell } from 'lucide-react';

interface WorkoutViewProps {
  session: WorkoutSession;
  allExercises: Exercise[];
  userProfile: UserProfile;
  allZones: Zone[];
  history: WorkoutSession[];
  activeZone: Zone;
  onZoneChange: (zone: Zone) => void;
  onComplete: (session: WorkoutSession, duration: number) => void;
  onCancel: () => void;
}

type LibraryTab = 'all' | 'muscles' | 'equipment';

export const WorkoutView: React.FC<WorkoutViewProps> = ({ 
  session,
  allExercises,
  userProfile,
  allZones,
  history,
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
  const [showGenerator, setShowGenerator] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLibraryTab, setActiveLibraryTab] = useState<LibraryTab>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoadMapOpen, setIsLoadMapOpen] = useState(false);
  const [openNotesIdx, setOpenNotesIdx] = useState<number | null>(null);
  const [infoExercise, setInfoExercise] = useState<Exercise | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [infoTab, setInfoTab] = useState<'instructions' | 'history'>('instructions');

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
    setLocalSession(prev => {
      const newExercises = prev.exercises.map(item => {
        const currentEx = allExercises.find(e => e.id === item.exerciseId)!;
        const replacement = findReplacement(currentEx, targetZone, allExercises);
        if (replacement.id === currentEx.id) return item;
        const newSets = adaptVolume(item.sets, currentEx, replacement, userProfile.goal);
        return { ...item, exerciseId: replacement.id, sets: newSets };
      });
      const updatedSession = { ...prev, zoneId: targetZone.id, exercises: newExercises };
      storage.setActiveSession(updatedSession);
      return updatedSession;
    });
    onZoneChange(targetZone);
  };

  const updateSet = useCallback((exIdx: number, setIdx: number, updates: Partial<WorkoutSet>) => {
    setLocalSession(prev => {
      const updatedExercises = [...prev.exercises];
      const updatedSets = [...updatedExercises[exIdx].sets];
      updatedSets[setIdx] = { ...updatedSets[setIdx], ...updates };
      updatedExercises[exIdx] = { ...updatedExercises[exIdx], sets: updatedSets };
      const updatedSession = { ...prev, exercises: updatedExercises };
      storage.setActiveSession(updatedSession);
      return updatedSession;
    });
    if (updates.completed) setRestTimer(90); 
  }, []);

  const updateNotes = useCallback((exIdx: number, notes: string) => {
    setLocalSession(prev => {
      const updatedExercises = [...prev.exercises];
      updatedExercises[exIdx] = { ...updatedExercises[exIdx], notes };
      const updatedSession = { ...prev, exercises: updatedExercises };
      storage.setActiveSession(updatedSession);
      return updatedSession;
    });
  }, []);

  const removeExercise = useCallback((exIdx: number) => {
    if (confirm("Ta bort övning?")) {
      setLocalSession(prevSession => {
        const updatedExercises = prevSession.exercises.filter((_, index) => index !== exIdx);
        const newSession = { ...prevSession, exercises: updatedExercises };
        storage.setActiveSession(newSession);
        return newSession;
      });
      setOpenNotesIdx(null);
    }
  }, []);

  const addSetToExercise = useCallback((exIdx: number) => {
    setLocalSession(prev => {
      const updatedExercises = [...prev.exercises];
      const currentSets = updatedExercises[exIdx].sets;
      const lastSet = currentSets[currentSets.length - 1];
      const newSet: WorkoutSet = {
        reps: lastSet?.reps || 10,
        weight: lastSet?.weight || 0,
        completed: false
      };
      updatedExercises[exIdx] = { ...updatedExercises[exIdx], sets: [...currentSets, newSet] };
      const updatedSession = { ...prev, exercises: updatedExercises };
      storage.setActiveSession(updatedSession);
      return updatedSession;
    });
  }, []);

  const addNewExercise = (ex: Exercise, autoGenerate = false) => {
    const lastSetData = getLastPerformance(ex.id, history);
    let newSets: WorkoutSet[] = lastSetData && lastSetData.length > 0
      ? createSmartSets(lastSetData, autoGenerate || window.confirm(`Hittade historik för ${ex.name}!\nVill du applicera progressiv överbelastning?`))
      : [{ reps: 10, weight: 0, completed: false }, { reps: 10, weight: 0, completed: false }, { reps: 10, weight: 0, completed: false }];

    setLocalSession(prev => {
      const updatedSession = { ...prev, exercises: [...prev.exercises, { exerciseId: ex.id, sets: newSets, notes: lastSetData ? 'Baserat på föregående pass' : '' }] };
      storage.setActiveSession(updatedSession);
      return updatedSession;
    });
    setShowAddModal(false);
  };

  const handleGenerate = (muscles: MuscleGroup[]) => {
     const generated = generateWorkoutSession(muscles, activeZone, allExercises);
     if (generated.length === 0) { alert("Hittade inga övningar i denna zon för valda muskler."); return; }
     setLocalSession(prev => {
       const newExercises = [...prev.exercises];
       generated.forEach(plan => {
          const ex = allExercises.find(e => e.id === plan.exerciseId);
          if (ex) {
             const lastSetData = getLastPerformance(ex.id, history);
             newExercises.push({ exerciseId: ex.id, sets: lastSetData ? createSmartSets(lastSetData, true) : plan.sets, notes: 'Auto-genererad' });
          }
       });
       const updatedSession = { ...prev, exercises: newExercises };
       storage.setActiveSession(updatedSession);
       return updatedSession;
     });
     setShowGenerator(false);
  };

  const muscleStats = useMemo(() => {
    const load: Record<string, number> = {};
    let totalLoadPoints = 0;
    localSession.exercises.forEach(item => {
      const ex = allExercises.find(e => e.id === item.exerciseId);
      if (!ex) return;
      const impact = calculateExerciseImpact(ex, item.sets, userProfile.weight);
      const primaries = (ex.primaryMuscles && ex.primaryMuscles.length > 0) ? ex.primaryMuscles : (ex.muscleGroups || []);
      primaries.forEach(m => { load[m] = (load[m] || 0) + impact; totalLoadPoints += impact; });
      ex.secondaryMuscles?.forEach(m => { const secondaryImpact = impact * 0.5; load[m] = (load[m] || 0) + secondaryImpact; totalLoadPoints += secondaryImpact; });
    });
    const results = Object.entries(load).map(([name, score]) => ({ name, percentage: totalLoadPoints > 0 ? Math.round((score / totalLoadPoints) * 100) : 0, count: score })).sort((a, b) => b.count - a.count);
    return { results, loadMap: load };
  }, [localSession.exercises, allExercises, userProfile.weight]);

  const filteredExercises = useMemo(() => {
    return allExercises.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
      let matchesCategory = true;
      if (activeLibraryTab === 'muscles' && selectedCategory) matchesCategory = ex.muscleGroups.includes(selectedCategory as MuscleGroup);
      else if (activeLibraryTab === 'equipment' && selectedCategory) matchesCategory = ex.equipment.includes(selectedCategory as Equipment);
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, allExercises, activeLibraryTab, selectedCategory]);

  const saveAsRoutine = async () => {
    const name = window.prompt("Vad ska rutinen heta?", localSession.name);
    if (!name) return;
    await storage.saveRoutine({ id: `routine-${Date.now()}`, name, exercises: localSession.exercises.map(pe => ({ exerciseId: pe.exerciseId, notes: pe.notes, sets: pe.sets.map(s => ({ reps: s.reps, weight: s.weight, completed: false })) })) });
    alert("Rutinen sparad!");
  };
  
  const applyHistoryToCurrent = (sets: WorkoutSet[]) => {
    if (!infoExercise) return;
    const exIndex = localSession.exercises.findIndex(e => e.exerciseId === infoExercise.id);
    if (exIndex === -1) {
       alert("Du måste lägga till övningen i passet först.");
       return;
    }
    if (confirm("Detta kommer ersätta dina nuvarande set med de från historiken. Vill du fortsätta?")) {
      const newSession = { ...localSession };
      newSession.exercises[exIndex].sets = sets.map(s => ({
        ...s,
        completed: false,
        rpe: undefined
      }));
      setLocalSession(newSession);
      storage.setActiveSession(newSession);
      setInfoExercise(null);
    }
  };

  return (
    <div className="space-y-4 pb-80 animate-in fade-in duration-500">
      <WorkoutHeader 
        timer={timer} 
        isTimerActive={isTimerActive} 
        onToggleTimer={() => setIsTimerActive(!isTimerActive)} 
        onCancel={() => { if (window.confirm("Är du säker på att du vill avbryta passet? All data går förlorad.")) { onCancel(); } }} 
        onSaveRoutine={saveAsRoutine} 
      />

      {restTimer !== null && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-accent-pink text-white px-8 py-3 rounded-full font-black italic shadow-2xl animate-in zoom-in slide-in-from-top-4 flex items-center gap-4">
          <RefreshCw size={18} className="animate-spin" />
          <span>VILA: {restTimer}s</span>
          <button onClick={() => setRestTimer(null)} className="ml-2 opacity-50"><X size={14}/></button>
        </div>
      )}

      <div className="px-4 space-y-4">
        <WorkoutStats 
          results={muscleStats.results} 
          loadMap={muscleStats.loadMap} 
          isLoadMapOpen={isLoadMapOpen} 
          onToggleLoadMap={() => setIsLoadMapOpen(!isLoadMapOpen)} 
        />
      </div>

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

      <div className="space-y-4 px-2">
        {localSession.exercises.map((item, exIdx) => {
          const exData = allExercises.find(e => e.id === item.exerciseId)!;
          return exData ? (
            <ExerciseCard 
              key={`${item.exerciseId}-${exIdx}`}
              item={item}
              exIdx={exIdx}
              exData={exData}
              userWeight={userProfile.weight}
              isNotesOpen={openNotesIdx === exIdx}
              onToggleNotes={() => setOpenNotesIdx(openNotesIdx === exIdx ? null : exIdx)}
              onUpdateNotes={(notes) => updateNotes(exIdx, notes)}
              onRemove={() => removeExercise(exIdx)}
              onAddSet={() => addSetToExercise(exIdx)}
              onUpdateSet={(setIdx, updates) => updateSet(exIdx, setIdx, updates)}
              onShowInfo={() => setInfoExercise(exData)}
            />
          ) : null;
        })}
      </div>

      <div className="fixed bottom-28 left-0 right-0 max-w-md mx-auto px-4 z-50 flex flex-col gap-3">
         <button 
           onClick={() => setShowAddModal(true)} 
           className="w-full py-5 bg-accent-blue/90 backdrop-blur-sm border border-white/5 text-white rounded-[24px] font-black italic text-xl uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
         >
           <Plus size={24} strokeWidth={3}/> Lägg till Övning
         </button>
         <button 
            onClick={() => setShowSummary(true)}
            className="w-full py-5 bg-accent-green text-[#0f0d15] rounded-[24px] font-black italic text-xl uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            <Dumbbell size={24} /> Avsluta Pass
          </button>
      </div>

      {showSummary && (
        <WorkoutSummaryModal 
          duration={timer}
          onCancel={() => setShowSummary(false)}
          onConfirm={(rpe, feeling) => {
            const finalSession = {...localSession, rpe, feeling};
            onComplete(finalSession, timer);
            setShowSummary(false);
          }}
        />
      )}

      {showGenerator && <WorkoutGenerator activeZone={activeZone} onGenerate={handleGenerate} onClose={() => setShowGenerator(false)} />}
      
      {showAddModal && (
        <div className="fixed inset-0 bg-[#0f0d15] z-[150] p-6 flex flex-col animate-in slide-in-from-bottom-10 duration-500">
            <header className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter">Lägg till övning</h3>
                <button onClick={() => setShowAddModal(false)} className="p-3 bg-white/5 rounded-2xl"><X size={28} className="text-text-dim" /></button>
            </header>
            <div className="relative group mb-4">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent-pink transition-colors" size={18} />
                <input type="text" placeholder="Sök övning..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-[24px] p-5 pl-14 outline-none focus:border-accent-pink/50 font-bold transition-all text-sm placeholder:text-text-dim/40" />
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2 pb-4">
                {filteredExercises.map(ex => (
                    <button key={ex.id} onClick={() => addNewExercise(ex)} className="w-full flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-transparent hover:border-white/10">
                        <div className="w-12 h-12 bg-black/30 rounded-lg overflow-hidden border border-white/5 flex-shrink-0">
                           <img src={ex.imageUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${ex.name}`} className="w-full h-full object-cover p-1 opacity-40" alt={ex.name}/>
                        </div>
                        <div className="text-left">
                           <p className="font-black uppercase italic text-sm tracking-tight">{ex.name}</p>
                           <p className="text-[9px] font-black text-text-dim uppercase tracking-widest">{ex.pattern}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
      )}

      {infoExercise && (
        <div className="fixed inset-0 bg-[#0f0d15]/90 backdrop-blur-sm z-[200] p-6 overflow-y-auto animate-in fade-in">
          <div className="max-w-md mx-auto bg-[#1a1721] rounded-[40px] border border-white/10 overflow-hidden shadow-2xl pb-12">
            <div className="w-full h-72 bg-black/50 relative">
              {infoExercise.imageUrl ? (
                  <img src={infoExercise.imageUrl} className="w-full h-full object-cover" alt={infoExercise.name}/>
              ) : (
                  <div className="w-full h-full flex items-center justify-center flex-col gap-4 opacity-30"><Dumbbell size={64} /><span className="font-black uppercase tracking-widest text-xs">Ingen bild tillgänglig</span></div>
              )}
              <button onClick={() => setInfoExercise(null)} className="absolute top-4 right-4 bg-black/50 p-3 rounded-full text-white backdrop-blur-md hover:scale-110 active:scale-95 transition-all"><X size={24} /></button>
            </div>
            <div className="p-8 space-y-8">
              <div>
                  <h2 className="text-3xl font-black italic uppercase leading-none mb-2 tracking-tighter">{infoExercise.name}</h2>
                  <div className="flex gap-2"><span className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest text-accent-pink">{infoExercise.pattern}</span></div>
              </div>

              <div className="flex gap-2 bg-white/5 p-1 rounded-2xl border border-white/5">
                <button onClick={() => setInfoTab('instructions')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${infoTab === 'instructions' ? 'bg-white/10 text-white shadow-lg' : 'text-text-dim'}`}><BookOpen size={14} /> Instruktioner</button>
                <button onClick={() => setInfoTab('history')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${infoTab === 'history' ? 'bg-white/10 text-white shadow-lg' : 'text-text-dim'}`}><History size={14} /> Historik</button>
              </div>

              {infoTab === 'instructions' && (
                <div className="space-y-8 animate-in fade-in">
                  <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-dim border-b border-white/5 pb-2">Instruktioner</h4>
                      {infoExercise.description ? (<p className="text-sm leading-relaxed text-white/80 font-medium whitespace-pre-wrap">{infoExercise.description}</p>) : (<p className="text-xs italic text-white/20 font-bold uppercase tracking-widest">Ingen beskrivning tillgänglig för denna övning.</p>)}
                  </div>
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
                      {infoExercise.equipment && infoExercise.equipment.length > 0 && (
                        <div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-dim mb-3">Utrustning</h4>
                            <div className="flex flex-wrap gap-2">
                                {infoExercise.equipment.map(eq => (
                                    <span key={eq} className="px-3 py-1.5 border border-white/10 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-tight text-white/80">{eq}</span>
                                ))}
                            </div>
                        </div>
                      )}
                  </div>
                </div>
              )}
              
              {infoTab === 'history' && (
                <div className="space-y-4 animate-in fade-in">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-dim border-b border-white/5 pb-2">Senaste prestationer</h4>
                    {getExerciseHistory(infoExercise.id, history).map((perf, idx) => (
                       <button key={idx} onClick={() => applyHistoryToCurrent(perf.sets)} className="w-full p-4 bg-white/5 rounded-2xl border border-white/5 text-left hover:border-white/10">
                          <div className="flex justify-between items-center mb-2">
                             <p className="text-[10px] font-black uppercase tracking-widest">{new Date(perf.date).toLocaleDateString()}</p>
                             <div className="flex items-center gap-1 text-accent-blue text-[10px] font-black uppercase"><ArrowDownToLine size={12}/> Använd</div>
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {perf.sets.map((s, sIdx) => (
                               <div key={sIdx} className="text-xs font-bold bg-black/20 px-2 py-1 rounded">
                                  {s.weight}kg <span className="text-[8px] opacity-40">x</span> {s.reps}
                               </div>
                            ))}
                          </div>
                       </button>
                    ))}
                    {getExerciseHistory(infoExercise.id, history).length === 0 && <p className="text-xs italic text-white/20 font-bold uppercase tracking-widest">Ingen historik för denna övning.</p>}
                </div>
              )}

              {infoExercise.alternativeExIds && infoExercise.alternativeExIds.length > 0 && (
                  <div className="pt-6 border-t border-white/5">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-dim mb-4">Bra Alternativ</h4>
                      <div className="space-y-2">
                          {infoExercise.alternativeExIds.map(altId => {
                              const altEx = allExercises.find(e => e.id === altId);
                              return altEx ? (
                                  <div key={altId} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center overflow-hidden"><img src={altEx.imageUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${altEx.name}`} className="w-full h-full object-cover opacity-50" alt={altEx.name}/></div>
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
