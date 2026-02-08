
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { WorkoutSession, Zone, Exercise, MuscleGroup, WorkoutSet, Equipment, WorkoutRoutine } from '../types';
import { findReplacement, adaptVolume, getLastPerformance, createSmartSets, generateWorkoutSession } from '../utils/fitness';
import { storage } from '../services/storage';
import { calculateExerciseImpact } from '../utils/recovery';
import { WorkoutSummaryModal } from './WorkoutSummaryModal';
import { WorkoutGenerator } from './WorkoutGenerator';
import { WorkoutHeader } from './WorkoutHeader';
import { WorkoutStats } from './WorkoutStats';
import { ExerciseCard } from './ExerciseCard';
import { Search, X, Plus, RefreshCw, Info, Sparkles } from 'lucide-react';

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
  const [showGenerator, setShowGenerator] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLibraryTab, setActiveLibraryTab] = useState<LibraryTab>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoadMapOpen, setIsLoadMapOpen] = useState(false);
  const [openNotesIdx, setOpenNotesIdx] = useState<number | null>(null);
  const [infoExercise, setInfoExercise] = useState<Exercise | null>(null);
  const [showSummary, setShowSummary] = useState(false);

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
    setLocalSession(prev => {
      const newExercises = prev.exercises.map(item => {
        const currentEx = allExercises.find(e => e.id === item.exerciseId)!;
        const replacement = findReplacement(currentEx, targetZone);
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
    if (window.confirm("Vill du ta bort denna övning från passet?")) {
      setLocalSession(prev => {
        const n = { ...prev };
        n.exercises = [...prev.exercises]; 
        n.exercises.splice(exIdx, 1);
        storage.setActiveSession(n);
        return n;
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
    const history = storage.getHistory();
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
     const history = storage.getHistory();
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

  const saveAsRoutine = () => {
    const name = window.prompt("Vad ska rutinen heta?", localSession.name);
    if (!name) return;
    storage.saveRoutine({ id: `routine-${Date.now()}`, name, exercises: localSession.exercises.map(pe => ({ exerciseId: pe.exerciseId, notes: pe.notes, sets: pe.sets.map(s => ({ reps: s.reps, weight: s.weight, completed: false })) })) });
    alert("Rutinen sparad!");
  };

  return (
    <div className="space-y-4 pb-80 animate-in fade-in duration-500">
      <WorkoutHeader 
        timer={timer} 
        isTimerActive={isTimerActive} 
        onToggleTimer={() => setIsTimerActive(!isTimerActive)} 
        onCancel={onCancel} 
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
          return (
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
          );
        })}
      </div>

      <div className="flex gap-2 mx-2">
        <button onClick={() => setShowGenerator(true)} className="flex-1 py-12 bg-accent-blue/10 border-2 border-dashed border-accent-blue/30 rounded-[40px] flex flex-col items-center justify-center gap-4 text-accent-blue active:scale-95 transition-all"><Sparkles size={32} /><span className="font-black uppercase tracking-widest text-[10px] italic">Föreslå Pass</span></button>
        <button onClick={() => setShowAddModal(true)} className="flex-1 py-12 border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center gap-4 text-text-dim active:scale-95 transition-all"><Plus size={32} /><span className="font-black uppercase tracking-widest text-[10px] italic">Lägg till övning</span></button>
      </div>

      <div className="fixed bottom-32 left-0 right-0 px-4 z-[70] max-w-md mx-auto space-y-3">
        <button 
          onClick={() => { setIsTimerActive(!isTimerActive); if(!isTimerActive && timer === 0) setIsTimerActive(true); }} 
          className={`w-full py-6 rounded-[24px] font-black italic text-xl tracking-widest uppercase shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all ${isTimerActive ? 'bg-white/10 text-white' : 'bg-white text-black'}`}
        >
          {isTimerActive ? 'Pausa Pass' : (timer === 0 ? 'Starta Pass' : 'Återuppta Pass')}
        </button>
        <button onClick={() => setShowSummary(true)} className="w-full bg-accent-pink py-6 rounded-[24px] font-black italic text-xl tracking-widest uppercase shadow-2xl flex items-center justify-center gap-4 active:opacity-90">Slutför Pass</button>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-[#0f0d15] z-[120] flex flex-col p-6 animate-in slide-in-from-bottom-4 duration-500">
           <header className="flex justify-between items-center mb-6"><h3 className="text-2xl font-black italic uppercase">Övningar</h3><button onClick={() => setShowAddModal(false)} className="p-3 bg-white/5 rounded-2xl"><X size={32}/></button></header>
           <div className="relative mb-6"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} /><input type="text" placeholder="Sök..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 pl-12 rounded-3xl outline-none focus:border-accent-pink transition-all" /></div>
           <div className="flex-1 overflow-y-auto space-y-3 scrollbar-hide">
              {filteredExercises.map(ex => (
                <div key={ex.id} className="w-full p-5 bg-[#1a1721] border border-white/5 rounded-[32px] flex justify-between items-center group shadow-lg">
                   <div className="text-left flex-1" onClick={() => addNewExercise(ex)}><span className="font-black italic uppercase text-lg block leading-none">{ex.name}</span><span className="text-[10px] font-black text-text-dim uppercase tracking-widest mt-1">{ex.pattern}</span></div>
                   <div className="flex gap-2"><button onClick={() => setInfoExercise(ex)} className="p-3 bg-white/5 rounded-2xl text-text-dim hover:text-accent-blue transition-all"><Info size={18} /></button><button onClick={() => addNewExercise(ex)} className="p-3 bg-accent-pink/10 rounded-2xl text-accent-pink hover:bg-accent-pink hover:text-white transition-all"><Plus size={20} /></button></div>
                </div>
              ))}
           </div>
        </div>
      )}

      {showGenerator && <WorkoutGenerator activeZone={activeZone} onClose={() => setShowGenerator(false)} onGenerate={handleGenerate} />}
      {showSummary && <WorkoutSummaryModal duration={timer} onCancel={() => setShowSummary(false)} onConfirm={(rpe, feeling) => onComplete({ ...localSession, rpe, feeling }, timer)} />}
      
      {infoExercise && (
        <div className="fixed inset-0 bg-[#0f0d15]/90 backdrop-blur-sm z-[200] p-6 overflow-y-auto animate-in fade-in">
          <div className="max-w-md mx-auto bg-[#1a1721] rounded-[40px] border border-white/10 overflow-hidden shadow-2xl pb-12">
            <div className="w-full h-72 bg-black/50 relative">
              {infoExercise.imageUrl && <img src={infoExercise.imageUrl} className="w-full h-full object-cover" />}
              <button onClick={() => setInfoExercise(null)} className="absolute top-4 right-4 bg-black/50 p-3 rounded-full text-white backdrop-blur-md"><X size={24} /></button>
            </div>
            <div className="p-8 space-y-8">
              <h2 className="text-3xl font-black italic uppercase leading-none tracking-tighter">{infoExercise.name}</h2>
              <div className="space-y-3"><h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-dim border-b border-white/5 pb-2">Instruktioner</h4><p className="text-sm leading-relaxed text-white/80 font-medium whitespace-pre-wrap">{infoExercise.description || 'Ingen beskrivning tillgänglig.'}</p></div>
              <div><h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-pink mb-3">Muskler</h4><div className="flex flex-wrap gap-2">{(infoExercise.primaryMuscles || infoExercise.muscleGroups).map(m => (<span key={m} className="px-3 py-1.5 border border-accent-pink/30 bg-accent-pink/5 rounded-xl text-[10px] font-black uppercase">{m}</span>))}</div></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
