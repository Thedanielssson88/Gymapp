import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { WorkoutSession, Zone, Exercise, MuscleGroup, WorkoutSet, Equipment, UserProfile, SetType, ScheduledActivity, PlannedActivityForLogDisplay, RecurringPlanForDisplay, PlannedExercise } from '../types';
import { findReplacement, adaptVolume, getLastPerformance, createSmartSets, generateWorkoutSession, calculate1RM } from '../utils/fitness';
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

// FIX: Replaced deprecated `substr` with `substring` to resolve potential callable expression errors.
const generateId = () => Math.random().toString(36).substring(2, 11);

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

// +++ START OF InfoModal IMPLEMENTATION +++
// This modal was missing from the file, causing errors. I have created a functional implementation for it.
interface InfoModalProps {
  exercise: Exercise;
  index: number;
  history: WorkoutSession[];
  allExercises: Exercise[];
  onClose: () => void;
  onSwapExercise: (exIdx: number, newExerciseId: string) => void;
  onApplyHistory: (exIdx: number, setsToApply: WorkoutSet[]) => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ exercise, index, history, allExercises, onClose, onSwapExercise, onApplyHistory }) => {
  const [showLibrary, setShowLibrary] = useState(false);
  const imageSrc = useExerciseImage(exercise);
  const lastPerformance = useMemo(() => getLastPerformance(exercise.id, history), [exercise.id, history]);
  const allTimeBest1RM = useMemo(() => {
    const exerciseHistory = history
      .flatMap(session => session.exercises)
      .filter(ex => ex.exerciseId === exercise.id)
      .flatMap(ex => ex.sets);
    return Math.max(0, ...exerciseHistory.map(s => calculate1RM(s.weight || 0, s.reps || 0)));
  }, [exercise.id, history]);

  if (showLibrary) {
    return (
      <div className="fixed inset-0 z-[300] bg-[#0f0d15] animate-in slide-in-from-bottom-5">
        <ExerciseLibrary 
          allExercises={allExercises} 
          history={history}
          onSelect={(ex) => onSwapExercise(index, ex.id)} 
          onClose={() => setShowLibrary(false)}
          onUpdate={() => {}}
          isSelectorMode={true}
        />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] p-4 flex items-end animate-in fade-in" onClick={onClose}>
      <div className="w-full bg-[#1a1721] rounded-[32px] p-6 border border-white/10 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <header className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-2xl font-black italic uppercase text-white">{exercise.name}</h3>
            <p className="text-xs text-text-dim font-bold uppercase tracking-widest">{exercise.pattern}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full"><X size={20}/></button>
        </header>

        <div className="flex-1 overflow-y-auto space-y-4 scrollbar-hide">
          {imageSrc && <img src={imageSrc} alt={exercise.name} className="w-full h-48 object-cover rounded-2xl mb-4" />}
          {exercise.description && <p className="text-sm text-text-dim">{exercise.description}</p>}
          
          <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-text-dim mb-2">Senaste Prestation</h4>
            {lastPerformance ? (
              <div className="space-y-1">
                {lastPerformance.map((s, i) => (
                  <div key={i} className="flex justify-between items-center bg-white/5 px-3 py-2 rounded-lg text-xs">
                    <span className="font-bold text-white/50">Set {i+1}</span>
                    <span className="font-black text-white">{s.reps} reps @ {s.weight} kg</span>
                  </div>
                ))}
              </div>
            ): <p className="text-xs text-text-dim italic">Ingen historik hittades.</p>}
          </div>
          {allTimeBest1RM > 0 && 
            <div className="bg-accent-blue/10 rounded-2xl p-4 border border-accent-blue/20 flex justify-between items-center">
               <span className="text-xs font-black uppercase text-accent-blue tracking-widest">Bästa 1RM</span>
               <span className="text-xl font-black italic text-white">{allTimeBest1RM} kg</span>
            </div>
          }
        </div>

        <footer className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-3">
          <button onClick={() => onApplyHistory(index, lastPerformance || [])} disabled={!lastPerformance} className="py-4 bg-white/10 rounded-2xl text-xs font-black uppercase tracking-widest disabled:opacity-30">Använd senaste</button>
          <button onClick={() => setShowLibrary(true)} className="py-4 bg-white/10 rounded-2xl text-xs font-black uppercase tracking-widest">Byt övning</button>
        </footer>
      </div>
    </div>
  );
};
// +++ END OF InfoModal IMPLEMENTATION +++

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

  const moveExercise = (index: number, direction: 'up' | 'down') => {
      setLocalSession(prev => {
        if (!prev) return prev;
        const newExercises = [...prev.exercises];
        
        if (direction === 'up' && index === 0) return prev;
        if (direction === 'down' && index === newExercises.length - 1) return prev;
    
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        [newExercises[index], newExercises[targetIndex]] = [newExercises[targetIndex], newExercises[index]];
    
        const updated = { ...prev, exercises: newExercises };
        storage.setActiveSession(updated);
        return updated;
      });
  };

  const toggleSupersetWithPrevious = (index: number) => {
    if (index === 0) return;
  
    setLocalSession(prev => {
      if (!prev) return prev;
      const newExercises = [...prev.exercises];
      const current = newExercises[index];
      const previous = newExercises[index - 1];
  
      if (current.supersetId && current.supersetId === previous.supersetId) {
         newExercises[index] = { ...current, supersetId: undefined };
      } 
      else if (previous.supersetId) {
         newExercises[index] = { ...current, supersetId: previous.supersetId };
      }
      else {
         const newId = generateId();
         newExercises[index - 1] = { ...previous, supersetId: newId };
         newExercises[index] = { ...current, supersetId: newId };
      }
  
      const updated = { ...prev, exercises: newExercises };
      storage.setActiveSession(updated);
      return updated;
    });
  };

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

      if (updates.completed) {
        const currentSupersetId = exercise.supersetId;
        if (currentSupersetId) {
          const supersetIndices = updatedExercises
            .map((ex, idx) => ({ ...ex, originalIdx: idx }))
            .filter(ex => ex.supersetId === currentSupersetId)
            .map(ex => ex.originalIdx);
      
          if (supersetIndices.length > 1) {
            const currentPos = supersetIndices.indexOf(exIdx);
            let nextTargetIdx = -1;
            
            for (let i = 1; i <= supersetIndices.length; i++) {
              const checkIndex = supersetIndices[(currentPos + i) % supersetIndices.length];
              const targetEx = updatedExercises[checkIndex];
              const hasIncompleteSets = targetEx.sets.some(s => !s.completed);
              
              if (hasIncompleteSets) {
                nextTargetIdx = checkIndex;
                break;
              }
            }
      
            if (nextTargetIdx !== -1 && nextTargetIdx !== exIdx) {
              setTimeout(() => {
                const element = document.getElementById(`exercise-card-${nextTargetIdx}`);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }, 300);
            }
          }
        }
      }

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

      <div className="flex flex-col px-2 pb-32">
        {(localSession.exercises || []).map((item, exIdx) => {
          const exData = (allExercises || []).find(e => e.id === item.exerciseId);
          if (!exData) return null;

          // Logik för superset-gruppering
          const currentId = item.supersetId;
          const prevId = localSession.exercises[exIdx - 1]?.supersetId;
          const nextId = localSession.exercises[exIdx + 1]?.supersetId;

          const isInSuperset = !!currentId;
          const isSupersetStart = isInSuperset && currentId !== prevId;
          const isSupersetEnd = isInSuperset && currentId !== nextId;

          return (
            <div key={`${item.exerciseId}-${exIdx}`} id={`exercise-card-${exIdx}`}>
              <ExerciseCard 
                item={item} 
                exIdx={exIdx} 
                exData={exData} 
                userProfile={userProfile} 
                activeZone={activeZone}
                
                // Superset Props
                isFirst={exIdx === 0}
                isLast={exIdx === (localSession.exercises.length - 1)}
                isInSuperset={isInSuperset}
                isSupersetStart={isSupersetStart}
                isSupersetEnd={isSupersetEnd}

                // Actions
                onMoveUp={() => moveExercise(exIdx, 'up')}
                onMoveDown={() => moveExercise(exIdx, 'down')}
                onToggleSuperset={() => toggleSupersetWithPrevious(exIdx)}
                
                // Övriga props
                isNotesOpen={openNotesIdx === exIdx} 
                onToggleNotes={() => setOpenNotesIdx(openNotesIdx === exIdx ? null : exIdx)} 
                onUpdateNotes={(notes) => updateNotes(exIdx, notes)} 
                onRemove={() => removeExercise(exIdx)} 
                onAddSet={() => addSetToExercise(exIdx)} 
                onUpdateSet={(setIdx, updates) => updateSet(exIdx, setIdx, updates)} 
                onShowInfo={() => setInfoModalData({ exercise: exData, index: exIdx })} 
              />
            </div>
          );
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
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center`}>
                          {isTimerActive ? <Pause size={24} /> : <Play size={24} fill="currentColor" />}
                        </div>
                        <div className="text-left">
                           <span className={`text-[9px] font-black uppercase tracking-widest ${timer === 0 && !isTimerActive ? 'opacity-80' : 'text-text-dim'}`}>
                                {timer === 0 && !isTimerActive ? "Starta Pass" : "Tid"}
                           </span>
                           <span className="text-2xl font-black italic tabular-nums leading-none">
                              {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
                           </span>
                        </div>
                      </button>
                    )}
                 </div>
                 <button 
                   onClick={() => {
                     if (canFinishWorkout) setShowSummary(true);
                     else setShowNoSetsInfo(true);
                   }}
                   className={`h-16 rounded-[24px] font-black italic text-base tracking-wider uppercase shadow-lg flex items-center justify-center gap-2 px-6 active:scale-[0.98] transition-all ${
                     canFinishWorkout ? 'bg-[#2ed573] text-[#0f0d15]' : 'bg-white/5 text-white/20'
                   }`}
                 >
                   Avsluta <Check size={18} strokeWidth={4} />
                 </button>
               </>
             )}
          </div>
        </div>
      </div>
      
      {showAddModal && <ExerciseLibrary allExercises={allExercises} history={history} onUpdate={onUpdate} userProfile={userProfile} onSelect={addNewExercise} onClose={() => setShowAddModal(false)} activeZone={activeZone} isSelectorMode={true} />}
      {showGenerator && <WorkoutGenerator activeZone={activeZone} allExercises={allExercises} userProfile={userProfile} history={history} onGenerate={handleGenerateResults} onClose={() => setShowGenerator(false)} />}
      {showSummary && localSession && <WorkoutSummaryModal duration={timer} onCancel={() => setShowSummary(false)} onConfirm={(rpe, feeling, finalDuration) => onComplete({ ...localSession, rpe, feeling }, finalDuration)} />}
      
      {infoModalData && <InfoModal exercise={infoModalData.exercise} index={infoModalData.index} history={history} allExercises={allExercises} onClose={() => setInfoModalData(null)} onSwapExercise={handleSwapExercise} onApplyHistory={handleApplyHistory} />}
      
      {showZonePicker && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm p-8 flex items-center justify-center animate-in fade-in" onClick={() => setShowZonePicker(false)}>
          <div className="bg-[#1a1721] rounded-[32px] p-6 border border-white/10 w-full max-w-sm space-y-3" onClick={e => e.stopPropagation()}>
            <h3 className="text-center font-bold text-lg mb-3">Byt Träningsplats</h3>
            {allZones.map(zone => (
              <button key={zone.id} onClick={() => { handleSwitchZone(zone); setShowZonePicker(false); }} className={`w-full p-4 rounded-2xl text-left flex justify-between items-center transition-all ${zone.id === activeZone.id ? 'bg-accent-blue text-white' : 'bg-white/5 text-text-dim hover:bg-white/10'}`}>
                <span className="font-bold">{zone.name}</span>
                {zone.id === activeZone.id && <Check size={20} />}
              </button>
            ))}
          </div>
        </div>
      )}

      {showNoSetsInfo && (
          <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm p-8 flex items-center justify-center animate-in fade-in" onClick={() => setShowNoSetsInfo(false)}>
            <div className="bg-[#1a1721] rounded-[32px] p-8 border border-white/10 w-full max-w-sm text-center" onClick={e => e.stopPropagation()}>
              <AlertCircle size={40} className="mx-auto text-yellow-500 mb-4" />
              <h3 className="font-black text-lg mb-2">Tomt Pass</h3>
              <p className="text-text-dim text-sm">Du måste logga minst ett set för att kunna spara passet.</p>
            </div>
          </div>
      )}
    </div>
  );
};