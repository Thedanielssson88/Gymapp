import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { WorkoutSession, Zone, Exercise, MuscleGroup, WorkoutSet, Equipment, UserProfile, SetType, ScheduledActivity, PlannedActivityForLogDisplay, RecurringPlanForDisplay, PlannedExercise } from '../types';
import { findReplacement, adaptVolume, getLastPerformance, createSmartSets, generateWorkoutSession } from '../utils/fitness';
import { storage } from '../services/storage';
import { calculateExerciseImpact } from '../utils/recovery';
import { WorkoutSummaryModal } from './WorkoutSummaryModal';
import { WorkoutGenerator } from './WorkoutGenerator';
import { WorkoutHeader } from './WorkoutHeader';
import { WorkoutStats } from './WorkoutStats';
import { ExerciseCard } from './ExerciseCard';
import { useExerciseImage } from '../hooks/useExerciseImage';
import { ExerciseLibrary } from './ExerciseLibrary';
import { Search, X, Plus, RefreshCw, Info, Sparkles, History, BookOpen, ArrowDownToLine, MapPin, Check, ArrowRightLeft, Dumbbell, Play, Pause, Timer as TimerIcon, AlertCircle, Thermometer, Zap, Activity, Shuffle, Calendar, Trophy, ArrowRight, Repeat } from 'lucide-react';
import { Haptics, NotificationType } from '@capacitor/haptics';

interface WorkoutViewProps {
  session: WorkoutSession | null;
  allExercises: Exercise[];
  userProfile: UserProfile;
  allZones: Zone[];
  history: WorkoutSession[];
  activeZone: Zone;
  onZoneChange: (zone: Zone) => void;
  onComplete: (session: WorkoutSession, duration: number) => void;
  onCancel: () => void;
  plannedActivities: PlannedActivityForLogDisplay[];
  onStartActivity: (activity: ScheduledActivity) => void;
  onStartEmptyWorkout: () => void;
  onUpdate: () => void;
  isManualMode?: boolean; // NEW: Prop to disable timer
}

export const WorkoutView: React.FC<WorkoutViewProps> = ({ 
  session, allExercises, userProfile, allZones, history, activeZone, 
  onZoneChange, onComplete, onCancel, plannedActivities, onStartActivity, onStartEmptyWorkout, onUpdate,
  isManualMode = false
}) => {
  const [localSession, setLocalSession] = useState<WorkoutSession | null>(session);
  const [timer, setTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [restTimer, setRestTimer] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [isLoadMapOpen, setIsLoadMapOpen] = useState(false);
  const [openNotesIdx, setOpenNotesIdx] = useState<number | null>(null);
  const [infoModalData, setInfoModalData] = useState<{ exercise: Exercise; index: number } | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showZonePicker, setShowZonePicker] = useState(false);
  const [showNoSetsInfo, setShowNoSetsInfo] = useState(false);

  useEffect(() => {
    setLocalSession(session);
    if (session) {
      if (isManualMode) {
        setIsTimerActive(false);
        setTimer(0);
      } else {
        setIsTimerActive(true); 
      }
    }
  }, [session, isManualMode]);

  useEffect(() => {
    let interval: any;
    if (isTimerActive && !isManualMode) {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, isManualMode]);

  const triggerRestEndHaptics = async () => {
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (e) {
      console.warn('Haptics stöds inte på denna enhet', e);
    }
  };

  useEffect(() => {
    let interval: any;
    if (restTimer !== null && restTimer > 0) {
      interval = setInterval(() => setRestTimer(r => (r !== null ? r - 1 : 0)), 1000);
    } else if (restTimer === 0) {
      if (!isManualMode && (userProfile.settings?.vibrateOnRestEnd ?? true)) {
        triggerRestEndHaptics();
      }
      setRestTimer(null);
    }
    return () => clearInterval(interval);
  }, [restTimer, userProfile.settings?.vibrateOnRestEnd, isManualMode]);

  const canFinishWorkout = useMemo(() => {
    if (!localSession) return false;
    return (localSession.exercises || []).some(ex => 
      ex.sets.some(set => set.completed)
    );
  }, [localSession]);

  const handleSwitchZone = (targetZone: Zone) => {
    if (targetZone.id === activeZone.id) return;
    setLocalSession(prev => {
      if (!prev) return null;
      const newExercises = (prev.exercises || []).map(item => {
        const currentEx = (allExercises || []).find(e => e.id === item.exerciseId);
        if (!currentEx) return item;
        const replacement = findReplacement(currentEx, targetZone, allExercises || []);
        if (replacement.id === currentEx.id) return item;
        const newSets = adaptVolume(item.sets || [], currentEx, replacement, userProfile.goal);
        return { ...item, exerciseId: replacement.id, sets: newSets };
      });
      const updatedSession = { ...prev, zoneId: targetZone.id, exercises: newExercises };
      storage.setActiveSession(updatedSession);
      return updatedSession;
    });
    onZoneChange(targetZone);
  };

  const handleSwapExercise = (exIdx: number, newExerciseId: string) => {
    setLocalSession(prev => {
        if (!prev) return null;
        const updatedExercises = [...(prev.exercises || [])];
        const itemToSwap = updatedExercises[exIdx];
        const currentEx = (allExercises || []).find(e => e.id === itemToSwap.exerciseId);
        const newEx = (allExercises || []).find(e => e.id === newExerciseId);
        if (!currentEx || !newEx) return prev;
        const newSets = adaptVolume(itemToSwap.sets || [], currentEx, newEx, userProfile.goal);
        updatedExercises[exIdx] = { ...itemToSwap, exerciseId: newEx.id, sets: newSets };
        const updatedSession = { ...prev, exercises: updatedExercises };
        storage.setActiveSession(updatedSession);
        return updatedSession;
    });
    setInfoModalData(null);
  };

  const handleApplyHistory = (exIdx: number, setsToApply: WorkoutSet[]) => {
      setLocalSession(prev => {
          if (!prev) return null;
          const updatedExercises = [...(prev.exercises || [])];
          const newSets = (setsToApply || []).map(s => ({ ...s, completed: false, rpe: undefined }));
          updatedExercises[exIdx] = { ...updatedExercises[exIdx], sets: newSets };
          const updatedSession = { ...prev, exercises: updatedExercises };
          storage.setActiveSession(updatedSession);
          return updatedSession;
      });
      setInfoModalData(null);
  };

  const updateSet = useCallback((exIdx: number, setIdx: number, updates: Partial<WorkoutSet>) => {
    setLocalSession(prev => {
      if (!prev) return null;
      const updatedExercises = [...(prev.exercises || [])];
      const exercise = updatedExercises[exIdx];
      const updatedSets = [...(exercise.sets || [])];
      
      const oldSet = updatedSets[setIdx];
      updatedSets[setIdx] = { ...oldSet, ...updates };
  
      const hasValueChange = 'weight' in updates || 'reps' in updates || 'distance' in updates || 'duration' in updates;
      
      if (hasValueChange) {
        for (let i = setIdx + 1; i < updatedSets.length; i++) {
          const nextSet = updatedSets[i];
          const isNextSetEmpty = (nextSet.weight === 0 || nextSet.weight === undefined) && 
                               (nextSet.reps === 0 || nextSet.reps === undefined) &&
                               (nextSet.distance === 0 || nextSet.distance === undefined) &&
                               (nextSet.duration === 0 || nextSet.duration === undefined);
  
          if (isNextSetEmpty) {
            updatedSets[i] = {
              ...nextSet,
              weight: updatedSets[setIdx].weight ?? nextSet.weight,
              reps: updatedSets[setIdx].reps ?? nextSet.reps,
              distance: updatedSets[setIdx].distance ?? nextSet.distance,
              duration: updatedSets[setIdx].duration ?? nextSet.duration,
              type: updatedSets[setIdx].type === 'warmup' ? 'normal' : (updatedSets[setIdx].type ?? nextSet.type),
            };
          } else {
            break;
          }
        }
      }
  
      updatedExercises[exIdx] = { ...exercise, sets: updatedSets };
      const updatedSession = { ...prev, exercises: updatedExercises };
      storage.setActiveSession(updatedSession);
      return updatedSession;
    });
  
    if (updates.completed && !isManualMode) {
      setRestTimer(90);
    }
  }, [isManualMode]);

  const updateNotes = useCallback((exIdx: number, notes: string) => {
    setLocalSession(prev => {
      if (!prev) return null;
      const updatedExercises = [...(prev.exercises || [])];
      updatedExercises[exIdx] = { ...updatedExercises[exIdx], notes };
      const updatedSession = { ...prev, exercises: updatedExercises };
      storage.setActiveSession(updatedSession);
      return updatedSession;
    });
  }, []);

  const removeExercise = useCallback(async (exIdx: number) => {
    if (confirm("Ta bort övning?")) {
      const exerciseToRemove = localSession?.exercises[exIdx];

      setLocalSession(prevSession => {
        if (!prevSession) return null;
        const updatedExercises = (prevSession.exercises || []).filter((_, index) => index !== exIdx);
        const newSession = { ...prevSession, exercises: updatedExercises };
        storage.setActiveSession(newSession);
        return newSession;
      });
      setOpenNotesIdx(null);

      if (exerciseToRemove) {
        const exData = allExercises.find(e => e.id === exerciseToRemove.exerciseId);
        if (exData) {
            const newScore = Math.max(1, (exData.score || 5) - 1);
            await storage.saveExercise({ ...exData, score: newScore });
            onUpdate();
        }
      }
    }
  }, [localSession, allExercises, onUpdate]);

  const addSetToExercise = useCallback((exIdx: number) => {
    setLocalSession(prev => {
      if (!prev) return null;
      const updatedExercises = [...(prev.exercises || [])];
      const currentSets = updatedExercises[exIdx].sets || [];
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

  const addNewExercise = async (ex: Exercise) => {
    const lastSetData = getLastPerformance(ex.id, history || []);
    const newSets: WorkoutSet[] = lastSetData && lastSetData.length > 0
      ? createSmartSets(lastSetData, true)
      : [{ reps: 10, weight: 0, completed: false, type: 'normal' }, { reps: 10, weight: 0, completed: false, type: 'normal' }, { reps: 10, weight: 0, completed: false, type: 'normal' }];

    setLocalSession(prev => {
      if (!prev) return null;
      const updatedSession = { ...prev, exercises: [...(prev.exercises || []), { exerciseId: ex.id, sets: newSets, notes: lastSetData ? 'Smart laddat från historik' : '' }] };
      storage.setActiveSession(updatedSession);
      return updatedSession;
    });
    setShowAddModal(false);

    const newScore = Math.min(10, (ex.score || 5) + 1);
    await storage.saveExercise({ ...ex, score: newScore });
    onUpdate();
  };

  const handleGenerateResults = (generated: PlannedExercise[]) => {
     setLocalSession(prev => {
       if (!prev) return null;
       const updatedSession = { ...prev, exercises: [...(prev.exercises || []), ...generated] };
       storage.setActiveSession(updatedSession);
       return updatedSession;
     });
     setShowGenerator(false);
  };

  const muscleStats = useMemo(() => {
    const load: Record<string, number> = {};
    let totalLoadPoints = 0;
    (localSession?.exercises || []).forEach(item => {
      const ex = (allExercises || []).find(e => e.id === item.exerciseId);
      if (!ex) return;
      const impact = calculateExerciseImpact(ex, item.sets || [], userProfile?.weight || 80);
      const primaries = (ex.primaryMuscles && ex.primaryMuscles.length > 0) ? ex.primaryMuscles : (ex.muscleGroups || []);
      primaries.forEach(m => { load[m] = (load[m] || 0) + impact; totalLoadPoints += impact; });
      ex.secondaryMuscles?.forEach(m => { const secondaryImpact = impact * 0.5; load[m] = (load[m] || 0) + secondaryImpact; totalLoadPoints += secondaryImpact; });
    });
    const results = Object.entries(load).map(([name, score]) => ({ name, percentage: totalLoadPoints > 0 ? Math.round((score / totalLoadPoints) * 100) : 0, count: score })).sort((a, b) => b.count - a.count);
    return { results, loadMap: load };
  }, [localSession?.exercises, allExercises, userProfile?.weight]);

  const todaysPlans = useMemo(() => {
    const now = new Date();
    const dKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const dayOfWeekNum = now.getDay();
    const plansForToday: PlannedActivityForLogDisplay[] = [];
    const recurringPlanIdsAlreadyInstanced: Set<string> = new Set();
    const activePlans = plannedActivities || [];

    activePlans.filter(p => !('isTemplate' in p)).forEach(p => {
      if ((p as ScheduledActivity).date === dKey) {
        plansForToday.push(p);
        if ((p as ScheduledActivity).recurrenceId) {
          recurringPlanIdsAlreadyInstanced.add((p as ScheduledActivity).recurrenceId!);
        }
      }
    });

    activePlans.filter(p => 'isTemplate' in p).forEach(p => {
      const recurringPlan = p as RecurringPlanForDisplay;
      if (recurringPlan.daysOfWeek?.includes(dayOfWeekNum) && !recurringPlanIdsAlreadyInstanced.has(recurringPlan.id)) {
        const planStart = new Date(recurringPlan.startDate);
        planStart.setHours(0,0,0,0);
        const todayAtStart = new Date(now);
        todayAtStart.setHours(0,0,0,0);
        if (planStart <= todayAtStart) {
          plansForToday.push(recurringPlan);
        }
      }
    });
    return plansForToday;
  }, [plannedActivities]);

  const getExercisePreview = (plan: PlannedActivityForLogDisplay) => {
    return (plan.exercises || [])
      .map(pe => (allExercises || []).find(e => e.id === pe.exerciseId)?.name)
      .filter(Boolean)
      .slice(0, 3)
      .join(', ');
  };

  const handleUpdateSessionName = useCallback(async (name: string) => {
    if (localSession) {
      const updatedSession = { ...localSession, name };
      setLocalSession(updatedSession);
      await storage.setActiveSession(updatedSession);
    }
  }, [localSession]);

  if (!localSession) {
    return (
      <div className="pb-32 space-y-8 animate-in fade-in px-4 pt-8 min-h-screen">
        <section className="text-center py-6 space-y-4">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-accent-pink/20 blur-3xl rounded-full animate-pulse" />
            <Dumbbell size={48} className="text-accent-pink relative z-10 mx-auto animate-bounce" style={{ animationDuration: '3s' }} />
          </div>
          <div className="space-y-1">
            <h2 className="text-4xl font-black italic uppercase text-white tracking-tighter leading-none">Klar för <span className="text-accent-pink">Kamp</span></h2>
            <p className="text-[10px] text-text-dim font-bold uppercase tracking-[0.3em]">Ge allt eller gå hem</p>
          </div>
        </section>
        <section className="space-y-6">
          <button onClick={onStartEmptyWorkout} className="w-full bg-white text-black p-6 rounded-[32px] flex items-center justify-between group active:scale-[0.98] transition-all shadow-[0_20px_40px_rgba(0,0,0,0.3)]">
            <div className="flex items-center gap-4"><div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center text-white"><Play size={24} fill="currentColor" /></div><div className="text-left"><span className="text-[10px] font-black uppercase tracking-widest opacity-60">Snabbstart</span><h3 className="text-xl font-black italic uppercase leading-none">Starta Pass</h3></div></div>
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>
          {todaysPlans.length > 0 && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 px-2"><Calendar size={14} className="text-accent-pink" /><h3 className="text-[10px] font-black uppercase text-text-dim tracking-widest">Dagens Planering</h3></div>
              <div className="grid gap-4">
                {todaysPlans.map(plan => (
                  <button key={plan.id} onClick={() => onStartActivity(plan as ScheduledActivity)} className="bg-[#1a1721] border border-white/5 rounded-[32px] p-6 flex flex-col gap-4 group active:scale-[0.98] transition-all shadow-xl hover:border-accent-pink/20">
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-accent-blue/10 rounded-xl flex items-center justify-center text-accent-blue">{'isTemplate' in plan ? <Repeat size={24} /> : <Calendar size={24} />}</div>
                        <div className="text-left"><h4 className="text-lg font-black italic uppercase text-white leading-tight">{plan.title}</h4><p className="text-[9px] text-text-dim font-bold uppercase tracking-widest">{plan.exercises?.length || 0} övningar • {'isTemplate' in plan ? 'Återkommande' : 'Idag'}</p></div>
                      </div>
                      <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-text-dim group-hover:border-accent-blue group-hover:text-accent-blue transition-colors"><Play size={18} fill="currentColor" /></div>
                    </div>
                    <div className="flex items-center gap-2 px-1 py-3 bg-white/5 rounded-2xl border border-white/5">
                      <Dumbbell size={12} className="text-accent-pink ml-3 shrink-0" /><p className="text-[10px] text-text-dim font-medium uppercase tracking-tight truncate pr-3">{getExercisePreview(plan)}{(plan.exercises?.length || 0) > 3 && '...'}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
        {todaysPlans.length === 0 && (<div className="pt-4 text-center opacity-10"><p className="text-[8px] font-black uppercase tracking-[0.2em]">Ready for battle</p></div>)}
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-64 animate-in fade-in duration-500">
      <WorkoutHeader 
        timer={timer} 
        isTimerActive={isTimerActive} 
        onToggleTimer={() => !isManualMode && setIsTimerActive(!isTimerActive)} 
        onCancel={() => { if (window.confirm("Avbryt passet?")) { onCancel(); } }} 
        onSaveRoutine={async () => {
           const name = window.prompt("Vad ska rutinen heta?", localSession.name);
           if (!name) return;
           await storage.saveRoutine({ id: `routine-${Date.now()}`, name, exercises: (localSession.exercises || []).map(pe => ({ exerciseId: pe.exerciseId, notes: pe.notes, sets: (pe.sets || []).map(s => ({ reps: s.reps, weight: s.weight, type: s.type, completed: false })) })) });
           alert("Rutinen sparad!");
        }} 
        sessionName={localSession.name} 
        onUpdateSessionName={handleUpdateSessionName} 
        isManual={isManualMode}
      />

      <div className="px-4 space-y-4"><WorkoutStats results={muscleStats.results} loadMap={muscleStats.loadMap} isLoadMapOpen={isLoadMapOpen} onToggleLoadMap={() => setIsLoadMapOpen(!isLoadMapOpen)} /></div>
      <div className="px-4">
        <button onClick={() => setShowZonePicker(true)} className="w-full py-4 bg-[#1a1721] border border-white/5 rounded-2xl flex items-center justify-between px-6 shadow-sm active:scale-[0.98] transition-all">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-white/5 rounded-xl text-accent-blue border border-white/5"><MapPin size={20} /></div>
             <div className="text-left"><span className="text-[9px] font-black uppercase tracking-widest text-text-dim block mb-1">Träningsplats</span><span className="text-lg font-black italic uppercase text-white">{activeZone.name}</span></div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5"><span className="text-[10px] font-bold uppercase text-white/60">Byt</span><RefreshCw size={12} className="text-white/60" /></div>
        </button>
      </div>

      <div className="space-y-4 px-2">
        {(localSession.exercises || []).map((item, exIdx) => {
          const exData = (allExercises || []).find(e => e.id === item.exerciseId);
          return exData ? (
            <ExerciseCard key={`${item.exerciseId}-${exIdx}`} item={item} exIdx={exIdx} exData={exData} userProfile={userProfile} activeZone={activeZone} isNotesOpen={openNotesIdx === exIdx} onToggleNotes={() => setOpenNotesIdx(openNotesIdx === exIdx ? null : exIdx)} onUpdateNotes={(notes) => updateNotes(exIdx, notes)} onRemove={() => removeExercise(exIdx)} onAddSet={() => addSetToExercise(exIdx)} onUpdateSet={(setIdx, updates) => updateSet(exIdx, setIdx, updates)} onShowInfo={() => setInfoModalData({ exercise: exData, index: exIdx })} />
          ) : null;
        })}
      </div>

      <div className="flex gap-2 mx-2 mt-4 mb-12">
        <button onClick={() => setShowGenerator(true)} className="flex-1 py-10 bg-accent-blue/5 border-2 border-dashed border-accent-blue/10 rounded-[40px] flex flex-col items-center justify-center gap-3 text-accent-blue hover:bg-accent-blue/10 transition-all active:scale-95"><Sparkles size={28} /><span className="font-black uppercase tracking-widest text-[9px] italic">Smart PT Generator</span></button>
        <button onClick={() => setShowAddModal(true)} className="flex-1 py-10 border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center gap-3 text-text-dim hover:border-accent-pink/30 active:scale-95"><Plus size={28} /><span className="font-black uppercase tracking-widest text-[9px] italic">Lägg till övning</span></button>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-[150] pb-safe">
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#0f0d15] via-[#0f0d15]/95 to-transparent pointer-events-none" />
        <div className="relative px-6 pb-10 pt-4 max-w-md mx-auto">
          <div className="bg-[#1a1721]/95 backdrop-blur-3xl border border-white/10 rounded-[36px] p-4 flex items-center gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
             {isManualMode ? (
               <button 
                 onClick={() => {
                   if (canFinishWorkout) setShowSummary(true);
                   else setShowNoSetsInfo(true);
                 }}
                 className={`w-full h-16 rounded-[24px] font-black italic text-lg tracking-wider uppercase shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${
                   canFinishWorkout ? 'bg-[#2ed573] text-[#0f0d15]' : 'bg-white/5 text-white/20'
                 }`}
               >
                 Spara Logg <Check size={20} strokeWidth={4} />
               </button>
             ) : (
               <>
                 <div className="flex-1 h-16 relative">
                    {restTimer !== null ? (
                      <button onClick={() => setRestTimer(null)} className="w-full h-full bg-accent-pink rounded-[24px] flex items-center gap-4 px-4 shadow-[0_0_20px_rgba(255,45,85,0.4)] animate-in zoom-in duration-300 active:scale-95 transition-transform"><div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0"><RefreshCw size={20} className="animate-spin text-white" /></div><div className="text-left"><span className="text-[8px] font-black uppercase tracking-widest text-white block mb-0.5 opacity-80">VILA</span><span className="text-2xl font-black italic tabular-nums text-white leading-none">{restTimer}s</span></div></button>
                    ) : (
                      <button 
                        onClick={() => setIsTimerActive(!isTimerActive)} 
                        className={`w-full h-full rounded-[24px] flex items-center gap-4 px-4 transition-all active:scale-95 ${
                          timer === 0 && !isTimerActive 
                            ? 'bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.4)]' 
                            : 'bg-white/5 border border-white/5'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          timer === 0 && !isTimerActive ? 'bg-black text-white' : isTimerActive ? 'bg-white text-[#0f0d15]' : 'bg-accent-blue text-white'
                        }`}>
                          {isTimerActive ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                        </div>
                        <div className="text-left">
                          <span className="text-[8px] font-black uppercase block tracking-[0.2em] mb-0.5">
                            {timer === 0 && !isTimerActive ? 'REDO?' : 'TID'}
                          </span>
                          <span className="text-2xl font-black italic tabular-nums leading-none tracking-tighter">
                            {timer === 0 && !isTimerActive ? 'STARTA PASS' : `${Math.floor(timer/60)}:${String(timer%60).padStart(2,'0')}`}
                          </span>
                        </div>
                      </button>
                    )}
                 </div>
                 <button
                  onClick={() => {
                    if (canFinishWorkout) {
                      setShowSummary(true);
                    } else {
                      setShowNoSetsInfo(true);
                    }
                  }}
                  className={`flex-1 h-16 rounded-[24px] font-black italic text-lg tracking-wider uppercase shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${
                    canFinishWorkout
                      ? 'bg-[#2ed573] text-[#0f0d15] shadow-[0_0_25px_rgba(46,213,115,0.3)]'
                      : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
                  }`}
                >
                  Slutför <Check size={20} strokeWidth={4} />
                </button>
               </>
             )}
          </div>
        </div>
      </div>

      {showSummary && (
        <WorkoutSummaryModal 
          duration={timer} 
          onCancel={() => setShowSummary(false)} 
          onConfirm={(rpe, feeling, finalDuration) => { 
            onComplete({...localSession!, rpe, feeling}, finalDuration); 
            setShowSummary(false); 
          }} 
        />
      )}
      {showGenerator && <WorkoutGenerator activeZone={activeZone} allExercises={allExercises} userProfile={userProfile} history={history} onGenerate={handleGenerateResults} onClose={() => setShowGenerator(false)} />}
      {showAddModal && (<div className="fixed inset-0 bg-[#0f0d15] z-[200] animate-in slide-in-from-bottom-10 duration-500"><ExerciseLibrary allExercises={allExercises} history={history} onSelect={addNewExercise} onClose={() => setShowAddModal(false)} onUpdate={() => {}} activeZone={activeZone} /></div>)}
      {showZonePicker && (
        <div className="fixed inset-0 bg-[#0f0d15]/95 backdrop-blur-sm z-[200] flex flex-col p-6 animate-in fade-in duration-200">
           <header className="flex justify-between items-center mb-8"><h3 className="text-2xl font-black italic uppercase text-white">Välj Gym</h3><button onClick={() => setShowZonePicker(false)} className="p-3 bg-white/5 rounded-2xl"><X size={24} className="text-white"/></button></header>
           <div className="flex-1 overflow-y-auto space-y-3">{(allZones || []).map(z => {
                 const isActive = activeZone.id === z.id;
                 return (<button key={z.id} onClick={() => { handleSwitchZone(z); setShowZonePicker(false); }} className={`w-full p-5 rounded-3xl border text-left flex items-center justify-between transition-all group ${isActive ? 'bg-white text-black border-white' : 'bg-[#1a1721] border-white/5 text-text-dim'}`}><div className="flex items-center gap-4"><div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${isActive ? 'bg-black/10 border-transparent text-black' : 'bg-white/5 border-white/5 text-white'}`}><MapPin size={20} /></div><div><span className="text-lg font-black italic uppercase block leading-none mb-1.5">{z.name}</span><span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-black/60' : 'text-white/30'}`}>{z.inventory?.length || 0} Redskap</span></div></div>{isActive && <div className="bg-black text-white p-2 rounded-full"><Check size={16} strokeWidth={4} /></div>}</button>);
              })}</div>
        </div>
      )}
      {infoModalData && <InfoModal exercise={infoModalData.exercise} exIdx={infoModalData.index} onClose={() => setInfoModalData(null)} history={history} onApplyHistory={handleApplyHistory} onExerciseSwap={handleSwapExercise} allExercises={allExercises} activeZone={activeZone} />}
      
      {showNoSetsInfo && (
        <div className="fixed inset-0 bg-[#0f0d15]/95 backdrop-blur-md z-[300] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-[#1a1721] border border-white/10 rounded-[40px] p-8 max-w-xs w-full text-center space-y-6 shadow-2xl">
            <div className="w-20 h-20 bg-accent-pink/10 rounded-3xl flex items-center justify-center mx-auto text-accent-pink border border-accent-pink/20">
              <AlertCircle size={40} />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-black italic uppercase text-white">Passet är tomt</h3>
              <p className="text-sm text-text-dim leading-relaxed font-medium">
                Du måste markera minst ett set som klart för att kunna spara passet.
              </p>
            </div>
      
            <div className="bg-white/5 rounded-2xl p-4 text-left border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-6 h-6 bg-accent-blue rounded-lg flex items-center justify-center text-[#0f0d15]">
                  <Check size={14} strokeWidth={4} />
                </div>
                <span className="text-[10px] font-black uppercase text-white">Instruktion:</span>
              </div>
              <p className="text-[11px] text-text-dim font-bold uppercase leading-tight">
                Klicka på bock-knappen till höger om ett set för att markera det som slutfört. Raden blir då grön.
              </p>
            </div>
      
            <button 
              onClick={() => setShowNoSetsInfo(false)}
              className="w-full py-4 bg-white text-[#0f0d15] rounded-2xl font-black uppercase italic tracking-widest active:scale-95 transition-all"
            >
              Jag fattar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const InfoModal: React.FC<{ exercise: Exercise; exIdx: number; onClose: () => void; history: WorkoutSession[]; onApplyHistory: (exIdx: number, sets: WorkoutSet[]) => void; onExerciseSwap: (exIdx: number, newExId: string) => void; allExercises: Exercise[]; activeZone: Zone; }> = ({ exercise, exIdx, onClose, history, onApplyHistory, onExerciseSwap, allExercises, activeZone }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'alternatives'>('info');
  const imageSrc = useExerciseImage(exercise);
  const exerciseHistory = useMemo(() => {
    return (history || [])
      .map(session => {
        const exData = (session.exercises || []).find(e => e.exerciseId === exercise.id && e.sets && e.sets.some(s => s.completed));
        return { session, exData };
      })
      .filter(item => item.exData)
      .sort((a, b) => new Date(b.session.date).getTime() - new Date(a.session.date).getTime())
      .map(({ session, exData }) => {
        const bestSet = (exData!.sets || []).reduce((prev, current) => {
           if (!current.completed) return prev;
           const currentVolume = (current.weight || 0) * (current.reps || 0);
           const prevVolume = (prev.weight || 0) * (prev.reps || 0);
           return currentVolume > prevVolume ? current : prev;
        }, { weight: 0, reps: 0, completed: false } as WorkoutSet);
        return { date: session.date, sessionName: session.name, bestSet, fullSets: exData!.sets };
      })
      .slice(0, 10);
  }, [history, exercise.id]);

  const alternatives = useMemo(() => {
    const hasDefinedAlts = exercise.alternativeExIds && exercise.alternativeExIds.length > 0;
    const sourceList = hasDefinedAlts
      ? (allExercises || []).filter(ex => exercise.alternativeExIds!.includes(ex.id))
      : (allExercises || []).filter(ex => ex.pattern === exercise.pattern && ex.id !== exercise.id);
    return sourceList.filter(alt => alt.equipment && alt.equipment.every(eq => activeZone.inventory?.includes(eq)));
  }, [allExercises, exercise, activeZone]);

  return (
    <div className="fixed inset-0 bg-[#0f0d15]/95 backdrop-blur-md z-[250] flex flex-col animate-in fade-in duration-300">
      <div className="p-6 border-b border-white/5 bg-[#0f0d15] flex justify-between items-start shrink-0">
        <div className="flex items-center gap-4">
           <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 bg-white/5 flex-shrink-0">{imageSrc ? (<img src={imageSrc} alt={exercise.name} className="w-full h-full object-cover" />) : (<div className="w-full h-full flex items-center justify-center"><Dumbbell className="text-white/20" size={24} /></div>)}</div>
           <div><h2 className="text-2xl font-black italic uppercase leading-none mb-1 tracking-tighter text-white">{exercise.name}</h2>{exercise.englishName && (<p className="text-xs font-bold text-white/40 italic leading-none tracking-tight">{exercise.englishName}</p>)}</div>
        </div>
        <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl text-text-dim hover:bg-white/10 transition-colors"><X size={24} /></button>
      </div>
      <div className="flex p-4 gap-2 border-b border-white/5 shrink-0">
        {[{ id: 'info', label: 'Info', icon: Activity }, { id: 'history', label: 'Historik', icon: History }, { id: 'alternatives', label: 'Alternativ', icon: Shuffle }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === tab.id ? 'bg-white text-black shadow-lg scale-[1.02]' : 'bg-white/5 text-text-dim hover:bg-white/10'}`}><tab.icon size={16} /> {tab.label}</button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {activeTab === 'info' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2">
             <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-accent-blue/10 border border-accent-blue/20 rounded-lg text-[10px] font-black uppercase tracking-widest text-accent-blue">{exercise.pattern}</span>
                <span className="px-3 py-1.5 bg-accent-pink/10 border border-accent-pink/20 rounded-lg text-[10px] font-black uppercase tracking-widest text-accent-pink">{(exercise.tier || 'tier_3').replace('_', ' ')}</span>
                {(exercise.equipment || []).map(eq => (<span key={eq} className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest text-text-dim">{eq}</span>))}
             </div>
             <div className="bg-[#1a1721] p-5 rounded-3xl border border-white/5">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dim mb-3 flex items-center gap-2"><BookOpen size={12} /> Utförande</h4>
                <p className="text-sm leading-relaxed text-white/90 font-medium">{exercise.description || 'Ingen beskrivning tillgänglig.'}</p>
             </div>
             <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dim mb-3 ml-1">Muskler</h4>
                <div className="flex flex-wrap gap-2">
                   {(exercise.primaryMuscles || []).map(m => (<div key={m} className="px-4 py-2 bg-[#1a1721] border-l-2 border-accent-pink rounded-r-xl text-xs font-bold text-white shadow-sm">{m}</div>))}
                   {(exercise.secondaryMuscles || []).map(m => (<div key={m} className="px-4 py-2 bg-[#1a1721] border-l-2 border-white/20 rounded-r-xl text-xs font-bold text-text-dim shadow-sm">{m}</div>))}
                </div>
             </div>
          </div>
        )}
        {activeTab === 'history' && (
          <div className="space-y-3 animate-in slide-in-from-bottom-2">
             {exerciseHistory.length > 0 ? (
               exerciseHistory.map((item, idx) => (
                 <div key={idx} className="bg-[#1a1721] p-4 rounded-2xl border border-white/5 flex justify-between items-center group">
                    <div>
                       <div className="flex items-center gap-2 mb-1"><Calendar size={12} className="text-text-dim" /><span className="text-[10px] font-black uppercase text-text-dim tracking-widest">{new Date(item.date).toLocaleDateString('sv-SE')}</span></div>
                       <p className="text-xs font-bold text-white/60">{item.sessionName}</p>
                       <button onClick={() => onApplyHistory(exIdx, item.fullSets)} className="mt-2 bg-accent-blue/10 text-accent-blue text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">Använd detta</button>
                    </div>
                    {item.bestSet && (
                      <div className="text-right">
                         <span className="text-xl font-black italic text-white block leading-none">{item.bestSet.weight} <span className="text-[10px] text-text-dim not-italic font-bold">kg</span></span>
                         <span className="text-[10px] font-bold text-accent-blue uppercase tracking-wider">x {item.bestSet.reps} reps</span>
                      </div>
                    )}
                 </div>
               ))
             ) : ( <div className="py-12 text-center opacity-40"><History size={48} className="mx-auto mb-4" strokeWidth={1} /><p className="text-xs font-bold uppercase tracking-widest">Ingen historik än</p></div>)}
          </div>
        )}
        {activeTab === 'alternatives' && (
          <div className="space-y-3 animate-in slide-in-from-bottom-2">
             <p className="text-[10px] font-black uppercase text-text-dim tracking-widest mb-2 ml-1">Liknande övningar ({exercise.primaryMuscles?.[0] || 'Okänd'})</p>
             {alternatives.length > 0 ? (
               alternatives.map(alt => (
                 <div key={alt.id} className="bg-[#1a1721] p-4 rounded-2xl border border-white/5 items-center justify-between group flex">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center border border-white/5"><Shuffle size={16} className="text-white/40" /></div>
                       <div><p className="text-sm font-black italic uppercase text-white">{alt.name}</p><p className="text-[9px] font-bold text-text-dim uppercase tracking-widest">{alt.equipment?.join(', ')}</p></div>
                    </div>
                    <button onClick={() => onExerciseSwap(exIdx, alt.id)} className="bg-white/5 text-white px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 hover:bg-white/10">Byt</button>
                 </div>
               ))
             ) : (<div className="py-12 text-center opacity-40"><Shuffle size={48} className="mx-auto mb-4" strokeWidth={1} /><p className="text-xs font-bold uppercase tracking-widest">Inga alternativ hittades</p></div>)}
          </div>
        )}
      </div>
    </div>
  );
};