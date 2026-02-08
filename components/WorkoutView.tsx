
import React, { useState, useEffect, useMemo } from 'react';
import { WorkoutSession, Zone, Exercise, MuscleGroup, WorkoutSet, Equipment } from '../types';
import { findReplacement, adaptVolume } from '../utils/fitness';
import { storage } from '../services/storage';
import { RecoveryMap } from './RecoveryMap';
import { ChevronDown, ChevronUp, Plus, Search, X, Trash2, ChevronRight, Check, MapPin, RefreshCw, Zap, Activity } from 'lucide-react';

interface WorkoutViewProps {
  session: WorkoutSession;
  activeZone: Zone;
  onZoneChange: (zone: Zone) => void;
  onComplete: (session: WorkoutSession, duration: number) => void;
}

export const WorkoutView: React.FC<WorkoutViewProps> = ({ 
  session, 
  activeZone, 
  onZoneChange,
  onComplete 
}) => {
  const [localSession, setLocalSession] = useState(session);
  const [timer, setTimer] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMusclePanelOpen, setIsMusclePanelOpen] = useState(false);

  const allExercises = storage.getAllExercises();
  const userProfile = useMemo(() => storage.getUserProfile(), []);
  const allZones = storage.getZones();

  useEffect(() => {
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSwitchZone = (targetZone: Zone) => {
    if (targetZone.id === activeZone.id) return;

    const newExercises = localSession.exercises.map(item => {
      const currentEx = allExercises.find(e => e.id === item.exerciseId)!;
      const replacement = findReplacement(currentEx, targetZone);
      
      if (replacement.id === currentEx.id) return item;

      // Adapt sets based on new difficulty
      const newSets = adaptVolume(item.sets, currentEx, replacement, userProfile.goal);
      return {
        ...item,
        exerciseId: replacement.id,
        sets: newSets
      };
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
    setLocalSession(newSession);
    storage.setActiveSession(newSession);
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

  const muscleLoadMap = useMemo(() => {
    const map: Record<string, number> = {};
    localSession.exercises.forEach(item => {
      const ex = allExercises.find(e => e.id === item.exerciseId);
      ex?.muscleGroups.forEach(m => {
        map[m] = (map[m] || 0) + 1;
      });
    });
    return map;
  }, [localSession.exercises, allExercises]);

  const activeMuscleSummaries = Object.entries(muscleLoadMap)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 3);

  return (
    <div className="space-y-4 pb-40 animate-in fade-in duration-500">
      {/* MUSCLE STATUS PANEL */}
      <div className="bg-[#1a1721] rounded-[32px] p-6 border border-white/5 shadow-2xl mx-2 mt-4 transition-all">
        <button 
          onClick={() => setIsMusclePanelOpen(!isMusclePanelOpen)}
          className="w-full flex items-center justify-between mb-2"
        >
          <div className="flex items-center gap-2">
             <Activity size={14} className="text-white" />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Muskelbelastning</span>
          </div>
          {isMusclePanelOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>

        <div className={`overflow-hidden transition-all duration-500 ${isMusclePanelOpen ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
          <RecoveryMap loadMap={muscleLoadMap} size="md" />
        </div>

        <div className="flex justify-center gap-2 mt-4">
          {activeMuscleSummaries.map(([muscle, count]) => (
            <div key={muscle} className="bg-white/5 border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-white">{muscle}</span>
              <span className="text-[9px] font-black text-white/40">x{count}</span>
            </div>
          ))}
          {activeMuscleSummaries.length === 0 && (
            <span className="text-[9px] font-black uppercase text-text-dim">Ingen belastning ännu</span>
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
          const bodyweightLoad = userProfile.weight * (exData.bodyweightCoefficient || 0);
          const totalWeight = item.sets.reduce((sum, s) => sum + s.weight, 0);
          const totalReps = item.sets.reduce((sum, s) => sum + s.reps, 0);
          const avgEffectiveWeight = Math.round((totalWeight + (bodyweightLoad * item.sets.length)) / item.sets.length || 0);

          return (
            <div key={`${item.exerciseId}-${exIdx}`} className="bg-[#1a1721] rounded-[32px] p-6 border border-white/5 shadow-xl relative overflow-hidden group">
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-4 items-center">
                  <div className="w-14 h-14 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center p-2">
                    <div className="w-8 h-8 rounded-lg bg-accent-pink/20 flex items-center justify-center">
                       <Plus size={20} className="text-accent-pink" />
                    </div>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-text-dim uppercase tracking-[0.2em] block mb-0.5">Fokusövning</span>
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">{exData.name}</h3>
                    <p className="text-[10px] font-black text-text-dim uppercase mt-2 tracking-widest">
                      {item.sets.length} SET • {Math.round(totalReps / item.sets.length || 0)} REPS • {totalWeight} KG • {avgEffectiveWeight} EFF. KG
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => {if(confirm("Ta bort?")){const n={...localSession}; n.exercises.splice(exIdx,1); setLocalSession(n); storage.setActiveSession(n);}}} 
                  className="p-2 text-text-dim/20 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18}/>
                </button>
              </div>

              <div className="space-y-3">
                {item.sets.map((set, setIdx) => {
                  const setEffectiveWeight = Math.round(set.weight + bodyweightLoad);
                  return (
                    <div 
                      key={setIdx} 
                      className={`bg-[#0f0d15] rounded-2xl p-4 flex items-center gap-4 border transition-all ${set.completed ? 'border-green-500/30 opacity-40 grayscale' : 'border-white/5'}`}
                    >
                      <span className="text-lg font-black italic text-text-dim w-6 text-center">{setIdx + 1}</span>
                      
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-text-dim uppercase mb-1">Vikt (+{Math.round(bodyweightLoad)} Eff)</span>
                          <div className="flex items-baseline gap-1">
                            <input 
                              type="number" 
                              value={set.weight || ''} 
                              onChange={(e) => updateSet(exIdx, setIdx, { weight: Number(e.target.value) })}
                              className="bg-transparent font-black text-2xl outline-none w-full"
                              placeholder="0"
                            />
                            <span className="text-[10px] font-black text-accent-pink opacity-60">={setEffectiveWeight}</span>
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-text-dim uppercase mb-1">Reps</span>
                          <input 
                            type="number" 
                            value={set.reps || ''} 
                            onChange={(e) => updateSet(exIdx, setIdx, { reps: Number(e.target.value) })}
                            className="bg-transparent font-black text-2xl outline-none w-full"
                            placeholder="0"
                          />
                        </div>
                      </div>

                      <button 
                        onClick={() => updateSet(exIdx, setIdx, { completed: !set.completed })}
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${set.completed ? 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'bg-white/5 border border-white/10 text-text-dim hover:bg-white/10'}`}
                      >
                        {set.completed ? <Check size={28} strokeWidth={3} /> : <Plus size={28} />}
                      </button>
                    </div>
                  );
                })}

                <button 
                  onClick={() => {
                    const n = {...localSession};
                    const currentEx = n.exercises[exIdx];
                    const lastSet = currentEx.sets[currentEx.sets.length - 1];
                    currentEx.sets.push({...lastSet, completed: false});
                    setLocalSession(n);
                    storage.setActiveSession(n);
                  }}
                  className="w-full py-4 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-text-dim border border-white/5 mt-2 hover:bg-white/10 transition-all"
                >
                  + Lägg till set
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD EXERCISE ACTION */}
      <button onClick={() => setShowAddModal(true)} className="mx-2 w-[calc(100%-16px)] py-12 border-2 border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center gap-4 text-text-dim hover:border-accent-pink/50 hover:bg-accent-pink/5 transition-all group">
        <div className="bg-white/5 p-4 rounded-full group-hover:bg-accent-pink/10 group-hover:text-accent-pink transition-all">
          <Plus size={32} />
        </div>
        <span className="font-black uppercase tracking-[0.3em] text-[10px] italic">Lägg till övning</span>
      </button>

      {/* FINISH PASS */}
      <div className="fixed bottom-32 left-0 right-0 px-4 z-[70] max-w-md mx-auto">
        <button 
          onClick={() => onComplete(localSession, timer)} 
          className="w-full bg-accent-pink py-6 rounded-[24px] font-black italic text-xl tracking-widest uppercase shadow-[0_10px_40px_rgba(255,45,85,0.4)] active:scale-95 transition-all flex items-center justify-center gap-4"
        >
          <span>Slutför träningspass</span>
          <div className="bg-white/20 p-1 rounded-full"><Check size={20} /></div>
        </button>
      </div>

      {/* ADD MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#0f0d15] z-[120] flex flex-col animate-in slide-in-from-bottom-4">
          <div className="flex items-center p-6">
            <button onClick={() => setShowAddModal(false)} className="p-2 text-accent-pink"><X size={32}/></button>
            <h3 className="flex-1 text-center text-xl font-black uppercase italic tracking-widest">Bibliotek</h3>
            <div className="w-12"></div>
          </div>
          <div className="p-6">
            <div className="relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-text-dim" size={20} />
              <input 
                type="text" 
                placeholder="Sök övning..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 pl-16 outline-none focus:border-accent-pink font-bold"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {allExercises
              .filter(ex => ex.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(ex => (
                <button 
                  key={ex.id} 
                  onClick={() => addNewExercise(ex)}
                  className="w-full p-6 bg-white/5 rounded-[32px] border border-white/5 flex justify-between items-center group active:scale-95 transition-all"
                >
                  <div className="text-left">
                    <span className="font-black italic uppercase text-lg block group-hover:text-accent-pink transition-colors">{ex.name}</span>
                    <span className="text-[10px] font-black text-text-dim uppercase tracking-widest">{ex.pattern}</span>
                  </div>
                  <Plus size={24} className="text-text-dim group-hover:text-white" />
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
