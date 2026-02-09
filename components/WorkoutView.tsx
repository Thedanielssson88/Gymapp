import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { WorkoutSession, Zone, Exercise, MuscleGroup, WorkoutSet, Equipment, UserProfile, SetType } from '../types';
// Fixed: Removed non-existent export getExerciseHistory
import { findReplacement, adaptVolume, getLastPerformance, createSmartSets, generateWorkoutSession } from '../utils/fitness';
import { storage } from '../services/storage';
import { calculateExerciseImpact } from '../utils/recovery';
import { WorkoutSummaryModal } from './WorkoutSummaryModal';
import { WorkoutGenerator } from './WorkoutGenerator';
import { WorkoutHeader } from './WorkoutHeader';
import { WorkoutStats } from './WorkoutStats';
import { ExerciseCard } from './ExerciseCard';
import { Search, X, Plus, RefreshCw, Info, Sparkles, History, BookOpen, ArrowDownToLine, MapPin, Check, ArrowRightLeft, Dumbbell, Play, Pause, Timer as TimerIcon, AlertCircle, Thermometer, Zap } from 'lucide-react';

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
  const [showZonePicker, setShowZonePicker] = useState(false);

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
    if (updates.completed) {
      setRestTimer(90);
    }
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
        type: lastSet?.type || 'normal',
        completed: false
      };
      updatedExercises[exIdx] = { ...updatedExercises[exIdx], sets: [...currentSets, newSet] };
      const updatedSession = { ...prev, exercises: updatedExercises };
      storage.setActiveSession(updatedSession);
      return updatedSession;
    });
  }, []);

  const addNewExercise = (ex: Exercise) => {
    const lastSetData = getLastPerformance(ex.id, history);
    const newSets: WorkoutSet[] = lastSetData && lastSetData.length > 0
      ? createSmartSets(lastSetData, true)
      : [{ reps: 10, weight: 0, completed: false, type: 'normal' }, { reps: 10, weight: 0, completed: false, type: 'normal' }, { reps: 10, weight: 0, completed: false, type: 'normal' }];

    setLocalSession(prev => {
      const updatedSession = { ...prev, exercises: [...prev.exercises, { exerciseId: ex.id, sets: newSets, notes: lastSetData ? 'Smart laddat från historik' : '' }] };
      storage.setActiveSession(updatedSession);
      return updatedSession;
    });
    setShowAddModal(false);
  };

  const handleGenerate = (muscles: MuscleGroup[]) => {
     // SMART GENERATOR CALL
     const generated = generateWorkoutSession(muscles, activeZone, allExercises, userProfile, history);
     if (generated.length === 0) { alert("Hittade inga övningar i denna zon för valda muskler."); return; }
     
     setLocalSession(prev => {
       const updatedSession = { ...prev, exercises: [...prev.exercises, ...generated] };
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
      const q = searchQuery.toLowerCase();
      const matchesSearch = ex.name.toLowerCase().includes(q) || ex.englishName?.toLowerCase().includes(q);
      let matchesCategory = true;
      if (activeLibraryTab === 'muscles' && selectedCategory) matchesCategory = ex.muscleGroups.includes(selectedCategory as MuscleGroup);
      else if (activeLibraryTab === 'equipment' && selectedCategory) matchesCategory = ex.equipment.includes(selectedCategory as Equipment);
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, allExercises, activeLibraryTab, selectedCategory]);

  return (
    <div className="space-y-4 pb-64 animate-in fade-in duration-500">
      <WorkoutHeader 
        timer={timer} 
        isTimerActive={isTimerActive} 
        onToggleTimer={() => setIsTimerActive(!isTimerActive)} 
        onCancel={() => { if (window.confirm("Avbryt passet?")) { onCancel(); } }} 
        onSaveRoutine={async () => {
           const name = window.prompt("Vad ska rutinen heta?", localSession.name);
           if (!name) return;
           await storage.saveRoutine({ id: `routine-${Date.now()}`, name, exercises: localSession.exercises.map(pe => ({ exerciseId: pe.exerciseId, notes: pe.notes, sets: pe.sets.map(s => ({ reps: s.reps, weight: s.weight, type: s.type, completed: false })) })) });
           alert("Rutinen sparad!");
        }} 
      />

      <div className="px-4 space-y-4">
        <WorkoutStats results={muscleStats.results} loadMap={muscleStats.loadMap} isLoadMapOpen={isLoadMapOpen} onToggleLoadMap={() => setIsLoadMapOpen(!isLoadMapOpen)} />
      </div>

      <div className="px-4">
        <button onClick={() => setShowZonePicker(true)} className="w-full py-4 bg-[#1a1721] border border-white/5 rounded-2xl flex items-center justify-between px-6 shadow-sm active:scale-[0.98] transition-all">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-white/5 rounded-xl text-accent-blue border border-white/5"><MapPin size={20} /></div>
             <div className="text-left">
               <span className="text-[9px] font-black uppercase tracking-widest text-text-dim block mb-1">Träningsplats</span>
               <span className="text-lg font-black italic uppercase text-white">{activeZone.name}</span>
             </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
             <span className="text-[10px] font-bold uppercase text-white/60">Byt</span>
             <RefreshCw size={12} className="text-white/60" />
          </div>
        </button>
      </div>

      <div className="space-y-4 px-2">
        {localSession.exercises.map((item, exIdx) => {
          const exData = allExercises.find(e => e.id === item.exerciseId)!;
          return exData ? (
            <ExerciseCard key={`${item.exerciseId}-${exIdx}`} item={item} exIdx={exIdx} exData={exData} userWeight={userProfile.weight} isNotesOpen={openNotesIdx === exIdx} onToggleNotes={() => setOpenNotesIdx(openNotesIdx === exIdx ? null : exIdx)} onUpdateNotes={(notes) => updateNotes(exIdx, notes)} onRemove={() => removeExercise(exIdx)} onAddSet={() => addSetToExercise(exIdx)} onUpdateSet={(setIdx, updates) => updateSet(exIdx, setIdx, updates)} onShowInfo={() => setInfoExercise(exData)} />
          ) : null;
        })}
      </div>

      <div className="flex gap-2 mx-2 mt-4 mb-12">
        <button onClick={() => setShowGenerator(true)} className="flex-1 py-10 bg-accent-blue/5 border-2 border-dashed border-accent-blue/10 rounded-[40px] flex flex-col items-center justify-center gap-3 text-accent-blue hover:bg-accent-blue/10 transition-all active:scale-95"><Sparkles size={28} /><span className="font-black uppercase tracking-widest text-[9px] italic">Smart PT Generator</span></button>
        <button onClick={() => setShowAddModal(true)} className="flex-1 py-10 border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center gap-3 text-text-dim hover:border-accent-pink/30 active:scale-95 transition-all"><Plus size={28} /><span className="font-black uppercase tracking-widest text-[9px] italic">Lägg till övning</span></button>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-[150] pb-safe">
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#0f0d15] via-[#0f0d15]/95 to-transparent pointer-events-none" />
        <div className="relative px-6 pb-10 pt-4 max-w-md mx-auto">
          <div className="bg-[#1a1721]/95 backdrop-blur-3xl border border-white/10 rounded-[36px] p-4 flex items-center gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
             <div className="flex-1 h-16 relative">
                {restTimer !== null ? (
                  <button onClick={() => setRestTimer(null)} className="w-full h-full bg-accent-pink rounded-[24px] flex items-center gap-4 px-4 shadow-[0_0_20px_rgba(255,45,85,0.4)] animate-in zoom-in duration-300 active:scale-95 transition-transform"><div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0"><RefreshCw size={20} className="animate-spin text-white" /></div><div className="text-left"><span className="text-[8px] font-black uppercase tracking-widest text-white block mb-0.5 opacity-80">VILA</span><span className="text-2xl font-black italic tabular-nums text-white leading-none">{restTimer}s</span></div></button>
                ) : (
                  <button onClick={() => setIsTimerActive(!isTimerActive)} className="w-full h-full bg-white/5 border border-white/5 rounded-[24px] flex items-center gap-4 px-4 hover:bg-white/10 transition-all active:scale-95"><div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isTimerActive ? 'bg-white text-[#0f0d15]' : 'bg-accent-blue text-white'}`}>{isTimerActive ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</div><div className="text-left"><span className="text-[8px] font-black uppercase text-text-dim block tracking-[0.2em] mb-0.5">TID</span><span className="text-2xl font-black italic tabular-nums leading-none tracking-tighter">{Math.floor(timer/60)}:{String(timer%60).padStart(2,'0')}</span></div></button>
                )}
             </div>
             <button onClick={() => setShowSummary(true)} className="flex-1 h-16 bg-[#2ed573] text-[#0f0d15] rounded-[24px] font-black italic text-lg tracking-wider uppercase shadow-[0_0_25px_rgba(46,213,115,0.3)] flex items-center justify-center gap-2 active:scale-[0.98] transition-all">Slutför <Check size={20} strokeWidth={4} /></button>
          </div>
        </div>
      </div>

      {showSummary && <WorkoutSummaryModal duration={timer} onCancel={() => setShowSummary(false)} onConfirm={(rpe, feeling) => { onComplete({...localSession, rpe, feeling}, timer); setShowSummary(false); }} />}
      {showGenerator && <WorkoutGenerator activeZone={activeZone} onGenerate={handleGenerate} onClose={() => setShowGenerator(false)} />}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#0f0d15] z-[200] p-6 flex flex-col animate-in slide-in-from-bottom-10 duration-500">
            <header className="flex justify-between items-center mb-6"><h3 className="text-2xl font-black italic uppercase text-white tracking-tighter">Lägg till övning</h3><button onClick={() => setShowAddModal(false)} className="p-3 bg-white/5 rounded-2xl"><X size={28} className="text-text-dim" /></button></header>
            <div className="relative group mb-4"><Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent-pink transition-colors" size={18} /><input type="text" placeholder="Sök (Svenska / Engelska)..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-[24px] p-5 pl-14 outline-none focus:border-accent-pink/50 font-bold transition-all text-sm placeholder:text-text-dim/40" /></div>
            <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2 pb-4">{filteredExercises.map(ex => (
                <button key={ex.id} onClick={() => addNewExercise(ex)} className="w-full flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-transparent hover:border-white/10 group"><div className="w-12 h-12 bg-black/30 rounded-lg overflow-hidden border border-white/5 flex-shrink-0 flex items-center justify-center"><Dumbbell className="text-white/10" size={16} /></div><div className="text-left min-w-0"><p className="font-black uppercase italic text-sm tracking-tight truncate">{ex.name}</p>{ex.englishName && <p className="text-[10px] text-white/30 italic truncate leading-none mb-1">{ex.englishName}</p>}<p className="text-[9px] font-black text-text-dim uppercase tracking-widest">{ex.pattern}</p></div></button>
            ))}</div>
        </div>
      )}
      {showZonePicker && (
        <div className="fixed inset-0 bg-[#0f0d15]/95 backdrop-blur-sm z-[200] flex flex-col p-6 animate-in fade-in duration-200">
           <header className="flex justify-between items-center mb-8"><h3 className="text-2xl font-black italic uppercase text-white">Välj Gym</h3><button onClick={() => setShowZonePicker(false)} className="p-3 bg-white/5 rounded-2xl"><X size={24} className="text-white"/></button></header>
           <div className="flex-1 overflow-y-auto space-y-3">{allZones.map(z => {
                 const isActive = activeZone.id === z.id;
                 return (
                   <button key={z.id} onClick={() => { handleSwitchZone(z); setShowZonePicker(false); }} className={`w-full p-5 rounded-3xl border text-left flex items-center justify-between transition-all group ${isActive ? 'bg-white text-black border-white' : 'bg-[#1a1721] border-white/5 text-text-dim'}`}><div className="flex items-center gap-4"><div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${isActive ? 'bg-black/10 border-transparent text-black' : 'bg-white/5 border-white/5 text-white'}`}><MapPin size={20} /></div><div><span className="text-lg font-black italic uppercase block leading-none mb-1.5">{z.name}</span><span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-black/60' : 'text-white/30'}`}>{z.inventory.length} Redskap</span></div></div>{isActive && <div className="bg-black text-white p-2 rounded-full"><Check size={16} strokeWidth={4} /></div>}</button>
                 );
              })}</div>
        </div>
      )}
      {infoExercise && <InfoModal exercise={infoExercise} onClose={() => setInfoExercise(null)} history={history} onApplyHistory={(sets) => {}} onSwap={(id) => {}} allExercises={allExercises} />}
    </div>
  );
};

const InfoModal: React.FC<{ exercise: Exercise, onClose: () => void, history: any[], onApplyHistory: (sets: WorkoutSet[]) => void, onSwap: (id: string) => void, allExercises: Exercise[] }> = ({ exercise, onClose, history, onSwap, allExercises }) => {
  return (
    <div className="fixed inset-0 bg-[#0f0d15]/90 backdrop-blur-sm z-[250] p-6 overflow-y-auto animate-in fade-in">
      <div className="max-w-md mx-auto bg-[#1a1721] rounded-[40px] border border-white/10 overflow-hidden shadow-2xl pb-12">
        <div className="p-8 space-y-8">
          <div><h2 className="text-3xl font-black italic uppercase leading-none mb-1 tracking-tighter">{exercise.name}</h2>{exercise.englishName && <p className="text-sm font-bold text-white/40 italic leading-none mb-3 tracking-tight">{exercise.englishName}</p>}<div className="flex gap-2"><span className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest text-accent-pink">{exercise.pattern}</span><span className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest text-accent-blue">{exercise.tier.replace('_', ' ')}</span></div></div>
          <div className="space-y-3"><h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-dim border-b border-white/5 pb-2">Beskrivning</h4><p className="text-sm leading-relaxed text-white/80 font-medium">{exercise.description || 'Ingen beskrivning.'}</p></div>
          <button onClick={onClose} className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-black uppercase italic tracking-widest">Stäng</button>
        </div>
      </div>
    </div>
  );
};