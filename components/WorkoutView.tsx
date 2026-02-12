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
import { Search, X, Plus, RefreshCw, Info, Sparkles, History, BookOpen, ArrowDownToLine, MapPin, Check, ArrowRightLeft, Dumbbell, Play, Pause, Timer as TimerIcon, AlertCircle, Thermometer, Zap, Activity, Shuffle, Calendar, Trophy, ArrowRight, Repeat, MessageSquare } from 'lucide-react';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { triggerHaptic } from '../utils/haptics';
import { ConfirmModal } from './ConfirmModal';

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
  isManualMode?: boolean; 
}

const InfoModal = ({ 
  exercise, 
  exIdx, 
  onClose, 
  history, 
  onApplyHistory, 
  onExerciseSwap, 
  allExercises, 
  activeZone 
}: { 
  exercise: Exercise, 
  exIdx: number, 
  onClose: () => void, 
  history: WorkoutSession[], 
  onApplyHistory: (idx: number, sets: WorkoutSet[]) => void, 
  onExerciseSwap: (idx: number, newId: string) => void, 
  allExercises: Exercise[], 
  activeZone: Zone 
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'alternatives'>('info');
  const imageSrc = useExerciseImage(exercise); // Hämta bilden

  // Beräkna statistik för Progression
  const stats = useMemo(() => {
    const exerciseHistory = history
      .filter(s => s.exercises && s.exercises.some(e => e.exerciseId === exercise.id))
      .map(s => {
        const ex = s.exercises.find(e => e.exerciseId === exercise.id);
        const bestSet = ex?.sets.filter(set => set.completed).sort((a,b) => (calculate1RM(b.weight, b.reps)) - (calculate1RM(a.weight, a.reps)))[0];
        return {
          date: s.date,
          max1RM: bestSet ? calculate1RM(bestSet.weight || 0, bestSet.reps || 0) : 0,
          bestSet
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const allTimeBest = exerciseHistory.length > 0 
      ? exerciseHistory.reduce((prev, current) => (prev.max1RM > current.max1RM) ? prev : current)
      : null;

    return { history: exerciseHistory, best: allTimeBest };
  }, [history, exercise.id]);
  
  const historyItems = useMemo(() => {
    return history
      .filter(s => s.exercises.some(e => e.exerciseId === exercise.id))
      .map(s => {
        const ex = s.exercises.find(e => e.exerciseId === exercise.id);
        return {
          date: s.date,
          sessionName: s.name,
          sets: ex?.sets || [],
          notes: ex?.notes
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5); // Visar de 5 senaste gångerna
  }, [history, exercise.id]);

  const alternatives = useMemo(() => {
    if (exercise.alternativeExIds && exercise.alternativeExIds.length > 0) {
        return allExercises.filter(e => exercise.alternativeExIds?.includes(e.id));
    }
    return allExercises.filter(e => 
      e.id !== exercise.id && 
      e.primaryMuscles.some(pm => exercise.primaryMuscles.includes(pm)) &&
      e.equipment.some(eq => exercise.equipment.includes(eq))
    ).slice(0, 5);
  }, [allExercises, exercise]);

  return (
    <div className="fixed inset-0 bg-[#0f0d15] z-[9999] flex flex-col animate-in fade-in duration-200">
      <header className="flex justify-between items-center p-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] border-b border-white/5 bg-[#0f0d15]">
        <h3 className="text-2xl font-black italic uppercase text-white truncate pr-4">{exercise.name}</h3>
        <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl active:scale-95 transition-transform"><X size={24} className="text-white"/></button>
      </header>
      
      <div className="flex p-4 gap-2 border-b border-white/5 bg-[#0f0d15]">
        <button onClick={() => setActiveTab('info')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'info' ? 'bg-white text-black shadow-lg' : 'bg-white/5 text-text-dim'}`}>Info</button>
        <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white text-black shadow-lg' : 'bg-white/5 text-text-dim'}`}>Historik</button>
        <button onClick={() => setActiveTab('alternatives')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'alternatives' ? 'bg-white text-black shadow-lg' : 'bg-white/5 text-text-dim'}`}>Alternativ</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-32">
        {/* --- FLIK 1: INFORMATION --- */}
        {activeTab === 'info' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2">
            
            {/* STOR BILD */}
            <div className="aspect-video w-full bg-white/5 rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative group">
                {imageSrc ? (
                    <img src={imageSrc} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={exercise.name} />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-white/10">
                        <Dumbbell size={64} />
                        <span className="text-xs font-black uppercase tracking-widest mt-4">Ingen bild</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0d15] via-transparent to-transparent opacity-60" />
                <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex flex-wrap gap-2">
                        <span className="px-3 py-1 bg-accent-blue/20 border border-accent-blue/30 rounded-lg text-[9px] font-black uppercase text-accent-blue backdrop-blur-sm">
                            {exercise.pattern}
                        </span>
                        <span className="px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-[9px] font-black uppercase text-white backdrop-blur-sm">
                            {exercise.tier === 'tier_1' ? 'Basövning' : exercise.tier === 'tier_2' ? 'Komplement' : 'Isolering'}
                        </span>
                    </div>
                </div>
            </div>

            {/* BESKRIVNING */}
            {exercise.description && (
                <div className="bg-[#1a1721] p-5 rounded-3xl border border-white/5">
                    <h4 className="text-[10px] font-black uppercase text-text-dim tracking-widest mb-2 flex items-center gap-2">
                        <Info size={12} /> Beskrivning
                    </h4>
                    <p className="text-sm font-medium text-white/80 leading-relaxed">
                        {exercise.description}
                    </p>
                </div>
            )}

            {/* MUSKLER & UTRUSTNING */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1a1721] p-5 rounded-3xl border border-white/5">
                    <h4 className="text-[10px] font-black uppercase text-text-dim tracking-widest mb-3 flex items-center gap-2">
                        <Activity size={12} /> Muskler
                    </h4>
                    <div className="space-y-3">
                        <div>
                            <span className="text-[9px] font-bold text-accent-pink uppercase block mb-1">Primära</span>
                            <div className="flex flex-wrap gap-1.5">
                                {exercise.primaryMuscles.map(m => (
                                    <span key={m} className="text-xs font-bold text-white bg-white/5 px-2 py-1 rounded-md">{m}</span>
                                ))}
                            </div>
                        </div>
                        {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
                            <div>
                                <span className="text-[9px] font-bold text-white/40 uppercase block mb-1">Sekundära</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {exercise.secondaryMuscles.map(m => (
                                        <span key={m} className="text-xs font-medium text-white/60 bg-white/5 px-2 py-1 rounded-md">{m}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-[#1a1721] p-5 rounded-3xl border border-white/5">
                    <h4 className="text-[10px] font-black uppercase text-text-dim tracking-widest mb-3 flex items-center gap-2">
                        <Dumbbell size={12} /> Utrustning
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {exercise.equipment.map(e => (
                            <span key={e} className="text-xs font-bold text-white bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5 w-full text-center">
                                {e}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* STATISTIK / PROGRESSION */}
            <div className="bg-gradient-to-br from-[#1a1721] to-[#13111a] p-6 rounded-3xl border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Trophy size={64} /></div>
                <h4 className="text-[10px] font-black uppercase text-text-dim tracking-widest mb-4 flex items-center gap-2 relative z-10">
                    <Trophy size={12} className="text-yellow-500" /> Personbästa (Est. 1RM)
                </h4>
                
                {stats.best ? (
                    <div className="relative z-10">
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black italic text-white tracking-tighter">{Math.round(stats.best.max1RM)}</span>
                            <span className="text-sm font-bold text-text-dim uppercase">kg</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-wide bg-white/5 w-fit px-2 py-1 rounded-lg">
                            <Calendar size={10} /> {new Date(stats.best.date).toLocaleDateString('sv-SE')}
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/5">
                            <p className="text-[10px] text-text-dim uppercase tracking-widest mb-1">Bästa setet:</p>
                            <p className="text-sm font-bold text-white">{stats.best.bestSet?.weight}kg x {stats.best.bestSet?.reps} reps</p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-4 relative z-10">
                        <p className="text-xs font-bold text-white/30 uppercase">Ingen data registrerad än</p>
                    </div>
                )}
            </div>

          </div>
        )}

        {/* --- FLIK 2: HISTORIK --- */}
        {activeTab === 'history' && (
          <div className="space-y-4 animate-in slide-in-from-bottom-2">
            {historyItems.length > 0 ? (
              historyItems.map((item, i) => (
                <div key={i} className="bg-[#1a1721] rounded-3xl border border-white/5 overflow-hidden">
                  {/* Header för passet */}
                  <div className="p-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <Calendar size={12} className="text-accent-blue" />
                        <span className="text-[10px] font-black uppercase text-white/90 tracking-widest">
                          {new Date(item.date).toLocaleDateString('sv-SE')}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-text-dim uppercase tracking-wide">{item.sessionName}</p>
                    </div>
                    <button 
                      onClick={() => onApplyHistory(exIdx, item.sets)} 
                      className="bg-accent-blue/10 text-accent-blue text-[9px] font-black uppercase tracking-widest px-3 py-2 rounded-xl active:scale-95 transition-all flex items-center gap-1.5"
                    >
                      <RefreshCw size={10}/> Använd
                    </button>
                  </div>

                  {/* Set-detaljer (Samma som i loggen) */}
                  <div className="p-4 space-y-2">
                    {item.sets.map((set, sIdx) => (
                      <div key={sIdx} className="flex items-center justify-between py-1 border-b border-white/[0.02] last:border-0">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-black text-text-dim w-4">{sIdx + 1}</span>
                          <div className="flex gap-1">
                            {set.type === 'warmup' && (
                              <span className="px-1.5 py-0.5 bg-orange-500/20 text-orange-500 text-[8px] font-black uppercase rounded">W</span>
                            )}
                            {set.type === 'failure' && (
                              <span className="px-1.5 py-0.5 bg-red-500/20 text-red-500 text-[8px] font-black uppercase rounded">F</span>
                            )}
                            {set.type === 'drop' && (
                              <span className="px-1.5 py-0.5 bg-purple-500/20 text-purple-500 text-[8px] font-black uppercase rounded">D</span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <div className="text-right">
                            <span className="text-sm font-black italic text-white">{set.weight}</span>
                            <span className="text-[9px] font-bold text-text-dim uppercase ml-1">kg</span>
                          </div>
                          <div className="text-right min-w-[40px]">
                            <span className="text-sm font-black italic text-white">{set.reps}</span>
                            <span className="text-[9px] font-bold text-text-dim uppercase ml-1">reps</span>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Anteckningar om de finns */}
                    {item.notes && (
                      <div className="mt-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare size={10} className="text-accent-blue" />
                          <span className="text-[8px] font-black uppercase text-accent-blue tracking-widest">Anteckning</span>
                        </div>
                        <p className="text-[10px] font-medium text-white/70 italic leading-relaxed">{item.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center opacity-40">
                <History size={48} className="mx-auto mb-4" strokeWidth={1} />
                <p className="text-xs font-bold uppercase tracking-widest">Ingen historik hittades</p>
              </div>
            )}
          </div>
        )}

        {/* --- FLIK 3: ALTERNATIV --- */}
        {activeTab === 'alternatives' && (
          <div className="space-y-3 animate-in slide-in-from-bottom-2">
             <p className="text-[10px] font-black uppercase text-text-dim tracking-widest mb-2 ml-1">Liknande övningar ({exercise.primaryMuscles?.[0] || 'Okänd'})</p>
             {alternatives.length > 0 ? (
               alternatives.map(alt => (
                 <div key={alt.id} className="bg-[#1a1721] p-4 rounded-2xl border border-white/5 items-center justify-between group flex hover:border-white/10 transition-colors">
                    <div className="flex items-center gap-4 overflow-hidden">
                       <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/5 shrink-0">
                           <Shuffle size={20} className="text-white/40" />
                       </div>
                       <div className="min-w-0">
                           <p className="text-sm font-black italic uppercase text-white truncate">{alt.name}</p>
                           <p className="text-[9px] font-bold text-text-dim uppercase tracking-widest truncate">{alt.equipment?.join(', ')}</p>
                       </div>
                    </div>
                    <button onClick={() => onExerciseSwap(exIdx, alt.id)} className="bg-white/5 text-white px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 hover:bg-white/10 shrink-0 ml-2">Byt</button>
                 </div>
               ))
             ) : (<div className="py-12 text-center opacity-40"><Shuffle size={48} className="mx-auto mb-4" strokeWidth={1} /><p className="text-xs font-bold uppercase tracking-widest">Inga alternativ hittades</p></div>)}
          </div>
        )}
      </div>
    </div>
  );
};

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
  const [highlightedExIdx, setHighlightedExIdx] = useState<number | null>(null);
  const [exerciseToDelete, setExerciseToDelete] = useState<number | null>(null);

  useEffect(() => {
    setLocalSession(session);
    if (session) {
      // ÄNDRING: Vi startar alltid med timern pausad så användaren får trycka "Starta"
      setIsTimerActive(false);
      
      if (isManualMode) {
        setTimer(0);
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
    if (updates.completed) {
        triggerHaptic.success(userProfile);
    }
    
    setLocalSession(prev => {
        if (!prev) return null;
        
        const updatedExercises = [...(prev.exercises || [])];
        const exercise = { ...updatedExercises[exIdx] };
        const updatedSets = [...(exercise.sets || [])];
        updatedSets[setIdx] = { ...updatedSets[setIdx], ...updates };
        exercise.sets = updatedSets;
        updatedExercises[exIdx] = exercise;

        if (updates.completed && exercise.supersetId) {
            const wasOldSetIncomplete = !prev.exercises[exIdx].sets[setIdx].completed;

            if (wasOldSetIncomplete) {
                const allExercisesInSuperset = updatedExercises.filter(ex => ex.supersetId === exercise.supersetId);
                const isSupersetNowFinished = allExercisesInSuperset.every(ex => ex.sets.every(s => s.completed));
                
                if (isSupersetNowFinished) {
                    triggerHaptic.double(userProfile);
                }
            }
        }
        
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
    
        if (updates.completed && exercise.supersetId) {
            const allExercises = updatedExercises;
            const supersetGroup = allExercises
              .map((ex, idx) => ({ ...ex, originalIdx: idx }))
              .filter(ex => ex.supersetId === exercise.supersetId);
        
            if (supersetGroup.length > 1) {
              const currentInGroupIdx = supersetGroup.findIndex(g => g.originalIdx === exIdx);
              let nextTargetIdx = -1;
        
              for (let i = 1; i <= supersetGroup.length; i++) {
                const checkIdx = (currentInGroupIdx + i) % supersetGroup.length;
                const candidate = supersetGroup[checkIdx];
                
                if (candidate.sets.some(s => !s.completed)) {
                  nextTargetIdx = candidate.originalIdx;
                  break;
                }
              }
        
              if (nextTargetIdx !== -1 && nextTargetIdx !== exIdx) {
                setTimeout(() => {
                  const element = document.getElementById(`exercise-row-${nextTargetIdx}`);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    setHighlightedExIdx(nextTargetIdx);
                    setTimeout(() => setHighlightedExIdx(null), 1200);
                  }
                }, 150);
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
  }, [isManualMode, userProfile]);

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

  const confirmDeleteExercise = useCallback(async () => {
    if (exerciseToDelete === null) return;
    
    const exIdx = exerciseToDelete;
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
    setExerciseToDelete(null);
  }, [exerciseToDelete, localSession, allExercises, onUpdate]);

  const addSetToExercise = useCallback((exIdx: number) => {
    setLocalSession(prev => {
      if (!prev) return null;
      const updatedExercises = [...(prev.exercises || [])];
      const currentSets = updatedExercises[exIdx].sets || [];
      const lastSet = currentSets[currentSets.length - 1];
      const newSet: WorkoutSet = { reps: lastSet?.reps || 10, weight: lastSet?.weight || 0, type: lastSet?.type || 'normal', completed: false };
      updatedExercises[exIdx] = { ...updatedExercises[exIdx], sets: [...currentSets, newSet] };
      const updatedSession = { ...prev, exercises: updatedExercises };
      storage.setActiveSession(updatedSession);
      return updatedSession;
    });
  }, []);

  const addNewExercise = async (ex: Exercise) => {
    const lastSetData = getLastPerformance(ex.id, history || []);
    const newSets: WorkoutSet[] = lastSetData && lastSetData.length > 0 ? createSmartSets(lastSetData, true) : [{ reps: 10, weight: 0, completed: false, type: 'normal' }, { reps: 10, weight: 0, completed: false, type: 'normal' }, { reps: 10, weight: 0, completed: false, type: 'normal' }];
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

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    setLocalSession(prev => {
      if (!prev) return null;
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
      if (!prev) return null;
      const newExercises = [...prev.exercises];
      const current = newExercises[index];
      const previous = newExercises[index - 1];
      if (current.supersetId && current.supersetId === previous.supersetId) {
         newExercises[index] = { ...current, supersetId: undefined };
      } else if (previous.supersetId) {
         newExercises[index] = { ...current, supersetId: previous.supersetId };
      } else {
         const newId = generateId();
         newExercises[index - 1] = { ...previous, supersetId: newId };
         newExercises[index] = { ...current, supersetId: newId };
      }
      const updated = { ...prev, exercises: newExercises };
      storage.setActiveSession(updated);
      return updated;
    });
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
      storage.setActiveSession(updatedSession);
    }
  }, [localSession]);

  const hasExercises = localSession?.exercises && localSession.exercises.length > 0;
  
  const ActionButtons = (
    <div className="flex gap-2 mx-2 mt-4 mb-4">
      <button onClick={() => setShowGenerator(true)} className="flex-1 py-10 bg-accent-blue/5 border-2 border-dashed border-accent-blue/10 rounded-[40px] flex flex-col items-center justify-center gap-3 text-accent-blue hover:bg-accent-blue/10 transition-all active:scale-95"><Sparkles size={28} /><span className="font-black uppercase tracking-widest text-[9px] italic">Smart PT Generator</span></button>
      <button onClick={() => setShowAddModal(true)} className="flex-1 py-10 border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center gap-3 text-text-dim hover:border-accent-pink/30 active:scale-95"><Plus size={28} /><span className="font-black uppercase tracking-widest text-[9px] italic">Lägg till övning</span></button>
    </div>
  );

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
    <>
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

        {!hasExercises && ActionButtons}

        <div className="flex flex-col px-2">
          {(localSession.exercises || []).map((item, exIdx) => {
            const exData = (allExercises || []).find(e => e.id === item.exerciseId);
            if (!exData) return null;
            const currentId = item.supersetId;
            const prevId = localSession.exercises[exIdx - 1]?.supersetId;
            const nextId = localSession.exercises[exIdx + 1]?.supersetId;
            const isInSuperset = !!currentId && (currentId === prevId || currentId === nextId);
            const isSupersetStart = isInSuperset && currentId !== prevId;
            const isSupersetEnd = isInSuperset && currentId !== nextId;
            return (
              <div id={`exercise-row-${exIdx}`} key={`${item.exerciseId}-${exIdx}`} className="block mb-2 scroll-mt-24">
                <ExerciseCard 
                  item={item} 
                  exIdx={exIdx} 
                  exData={exData} 
                  userProfile={userProfile} 
                  activeZone={activeZone}
                  isFirst={exIdx === 0}
                  isLast={exIdx === (localSession.exercises.length - 1)}
                  isInSuperset={isInSuperset}
                  isSupersetStart={isSupersetStart}
                  isSupersetEnd={isSupersetEnd}
                  onMoveUp={() => moveExercise(exIdx, 'up')}
                  onMoveDown={() => moveExercise(exIdx, 'down')}
                  onToggleSuperset={() => toggleSupersetWithPrevious(exIdx)}
                  isNotesOpen={openNotesIdx === exIdx} 
                  onToggleNotes={() => setOpenNotesIdx(openNotesIdx === exIdx ? null : exIdx)} 
                  onUpdateNotes={(notes) => updateNotes(exIdx, notes)} 
                  onRemove={() => setExerciseToDelete(exIdx)} 
                  onAddSet={() => addSetToExercise(exIdx)} 
                  onUpdateSet={(setIdx, updates) => updateSet(exIdx, setIdx, updates)} 
                  onShowInfo={() => setInfoModalData({ exercise: exData, index: exIdx })} 
                  isHighlighted={highlightedExIdx === exIdx}
                />
              </div>
            );
          })}
        </div>
        
        {hasExercises && ActionButtons}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-[150] pb-safe">
        <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-[#0f0d15] via-[#0f0d15]/95 to-transparent pointer-events-none" />
        <div className="relative px-6 pb-10 pt-4 max-w-md mx-auto">
          <div className="bg-[#1a1721]/95 backdrop-blur-3xl border border-white/10 rounded-[36px] p-4 flex items-center gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
             {isManualMode ? (
               <button 
                 onClick={() => { if (canFinishWorkout) setShowSummary(true); else setShowNoSetsInfo(true); }}
                 className={`w-full h-16 rounded-[24px] font-black italic text-lg tracking-wider uppercase shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${canFinishWorkout ? 'bg-[#2ed573] text-[#0f0d15]' : 'bg-white/5 text-white/20'}`}
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
                        className={`w-full h-full rounded-[24px] flex items-center gap-4 px-4 transition-all active:scale-95 ${timer === 0 && !isTimerActive ? 'bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'bg-white/5 border border-white/5'}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center`}>
                          {isTimerActive ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                        </div>
                        <div className="text-left">
                          <span className="text-[8px] font-black uppercase block tracking-[0.2em] mb-0.5">{timer === 0 && !isTimerActive ? 'REDO?' : 'TID'}</span>
                          <span className="text-2xl font-black italic tabular-nums leading-none tracking-tighter">{timer === 0 && !isTimerActive ? 'STARTA PASS' : `${Math.floor(timer/60)}:${String(timer%60).padStart(2,'0')}`}</span>
                        </div>
                      </button>
                    )}
                 </div>
                 <button
                  onClick={() => { if (canFinishWorkout) { setShowSummary(true); } else { setShowNoSetsInfo(true); }}}
                  className={`flex-1 h-16 rounded-[24px] font-black italic text-lg tracking-wider uppercase shadow-lg flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${canFinishWorkout ? 'bg-[#2ed573] text-[#0f0d15] shadow-[0_0_25px_rgba(46,213,115,0.3)]' : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'}`}
                >
                  Slutför <Check size={20} strokeWidth={4} />
                </button>
               </>
             )}
          </div>
        </div>
      </div>

      {exerciseToDelete !== null && (
        <ConfirmModal
          title="Ta bort övning?"
          message={`Är du säker på att du vill ta bort "${localSession?.exercises[exerciseToDelete] ? allExercises.find(e => e.id === localSession.exercises[exerciseToDelete].exerciseId)?.name : 'övningen'}" från passet?`}
          confirmLabel="Ja, ta bort"
          isDestructive={true}
          onConfirm={confirmDeleteExercise}
          onCancel={() => setExerciseToDelete(null)}
        />
      )}

      {showSummary && <WorkoutSummaryModal duration={timer} onCancel={() => setShowSummary(false)} onConfirm={(rpe, feeling, finalDuration) => { onComplete({...localSession!, rpe, feeling}, finalDuration); setShowSummary(false); }} />}
      {showGenerator && <WorkoutGenerator activeZone={activeZone} allExercises={allExercises} userProfile={userProfile} history={history} onGenerate={handleGenerateResults} onClose={() => setShowGenerator(false)} />}
      
      {showAddModal && (
        <div className="fixed inset-0 bg-[#0f0d15] z-[9999] flex flex-col animate-in slide-in-from-bottom-10 duration-500">
          <ExerciseLibrary allExercises={allExercises} history={history} onSelect={addNewExercise} onClose={() => setShowAddModal(false)} onUpdate={onUpdate} activeZone={activeZone} userProfile={userProfile} />
        </div>
      )}

      {showZonePicker && (
        <div className="fixed inset-0 bg-[#0f0d15]/95 backdrop-blur-sm z-[9999] flex flex-col p-6 pt-[calc(env(safe-area-inset-top)+1.5rem)] animate-in fade-in duration-200">
           <header className="flex justify-between items-center mb-8"><h3 className="text-2xl font-black italic uppercase text-white">Välj Gym</h3><button onClick={() => setShowZonePicker(false)} className="p-3 bg-white/5 rounded-2xl"><X size={24} className="text-white"/></button></header>
           <div className="flex-1 overflow-y-auto space-y-3">{(allZones || []).map(z => {
                 const isActive = activeZone.id === z.id;
                 return (<button key={z.id} onClick={() => { handleSwitchZone(z); setShowZonePicker(false); }} className={`w-full p-5 rounded-3xl border text-left flex items-center justify-between transition-all group ${isActive ? 'bg-white text-black border-white' : 'bg-[#1a1721] border-white/5 text-text-dim'}`}><div className="flex items-center gap-4"><div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${isActive ? 'bg-black/10 border-transparent text-black' : 'bg-white/5 border-white/5 text-white'}`}><MapPin size={20} /></div><div><span className="text-lg font-black italic uppercase block leading-none mb-1.5">{z.name}</span><span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-black/60' : 'text-white/30'}`}>{z.inventory?.length || 0} Redskap</span></div></div>{isActive && <div className="bg-black text-white p-2 rounded-full"><Check size={16} strokeWidth={4} /></div>}</button>);
              })}</div>
        </div>
      )}
      {infoModalData && <InfoModal exercise={infoModalData.exercise} exIdx={infoModalData.index} onClose={() => setInfoModalData(null)} history={history} onApplyHistory={handleApplyHistory} onExerciseSwap={handleSwapExercise} allExercises={allExercises} activeZone={activeZone} />}

      {showNoSetsInfo && (
        <div className="fixed inset-0 bg-[#0f0d15]/95 backdrop-blur-md z-[9999] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-[#1a1721] border border-white/10 rounded-[40px] p-8 max-w-xs w-full text-center space-y-6 shadow-2xl">
            <div className="w-20 h-20 bg-accent-pink/10 rounded-3xl flex items-center justify-center mx-auto text-accent-pink border border-accent-pink/20">
              <AlertCircle size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black italic uppercase text-white">Inga set klara</h3>
              <p className="text-xs text-text-dim font-medium leading-relaxed">Du måste klarmarkera minst ett set innan du kan slutföra passet. Kämpa på!</p>
            </div>
            <button onClick={() => setShowNoSetsInfo(false)} className="w-full py-4 bg-white text-black rounded-2xl font-black italic uppercase tracking-widest hover:bg-gray-200 transition-all active:scale-95">Tillbaka</button>
          </div>
        </div>
      )}
    </>
  );
};