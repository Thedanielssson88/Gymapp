import React, { useMemo, useState } from 'react';
import { WorkoutRoutine, Zone, Exercise, PlannedExercise, MovementPattern, MuscleGroup, Equipment, UserProfile } from '../types';
import { storage } from '../services/storage';
import { findReplacement, adaptVolume } from '../utils/fitness';
import { ALL_MUSCLE_GROUPS } from '../utils/recovery';
import { Plus, Play, ChevronRight, Bookmark, Trash2, Dumbbell, Edit3, X, Check, Search, Filter } from 'lucide-react';

interface RoutinePickerProps {
  onStart: (exercises: PlannedExercise[], routineName: string) => void;
  activeZone: Zone;
  // FIX: Add missing props for data passed from App.tsx
  routines: WorkoutRoutine[];
  allExercises: Exercise[];
  userProfile: UserProfile;
  onUpdate: () => void;
}

type LibraryTab = 'all' | 'muscles' | 'equipment';

export const RoutinePicker: React.FC<RoutinePickerProps> = ({ onStart, activeZone, routines, allExercises, userProfile, onUpdate }) => {
  const [editingRoutine, setEditingRoutine] = useState<Partial<WorkoutRoutine> | null>(null);
  const [showExSelector, setShowExSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Library filtering state
  const [activeTab, setActiveTab] = useState<LibraryTab>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleSelectRoutine = (routine: WorkoutRoutine) => {
    const morphedExercises = routine.exercises.map(pe => {
      const originalEx = allExercises.find(ex => ex.id === pe.exerciseId);
      if (!originalEx) return pe;

      const isAvailable = originalEx.equipment.every(eq => activeZone.inventory.includes(eq));
      
      if (!isAvailable) {
        // FIX: Pass allExercises as the third argument to findReplacement
        const replacement = findReplacement(originalEx, activeZone, allExercises);
        // FIX: Access goal from userProfile prop correctly
        const newSets = adaptVolume(pe.sets, originalEx, replacement, userProfile.goal);
        return {
          ...pe,
          exerciseId: replacement.id,
          sets: newSets.map(s => ({ ...s, completed: false }))
        };
      }

      return {
        ...pe,
        sets: pe.sets.map(s => ({ ...s, completed: false }))
      };
    });

    onStart(morphedExercises, routine.name);
  };

  const saveRoutine = async () => {
    if (!editingRoutine?.name || !editingRoutine?.exercises?.length) return;
    
    const newRoutine: WorkoutRoutine = {
      id: editingRoutine.id || `routine-${Date.now()}`,
      name: editingRoutine.name,
      exercises: editingRoutine.exercises || []
    };

    await storage.saveRoutine(newRoutine);
    onUpdate();
    setEditingRoutine(null);
  };

  const deleteRoutine = async (id: string) => {
    if (confirm("Vill du ta bort denna rutin?")) {
      await storage.deleteRoutine(id);
      onUpdate();
    }
  };

  const addExerciseToRoutine = (ex: Exercise) => {
    const currentExs = editingRoutine?.exercises || [];
    const newPe: PlannedExercise = {
      exerciseId: ex.id,
      sets: [{ reps: 10, weight: 0, completed: false }, { reps: 10, weight: 0, completed: false }, { reps: 10, weight: 0, completed: false }]
    };
    setEditingRoutine({ ...editingRoutine, exercises: [...currentExs, newPe] });
    setShowExSelector(false);
    // Reset filters
    setSearchQuery('');
    setSelectedCategory(null);
    setActiveTab('all');
  };

  const removeExerciseFromRoutine = (idx: number) => {
    const currentExs = [...(editingRoutine?.exercises || [])];
    currentExs.splice(idx, 1);
    setEditingRoutine({ ...editingRoutine, exercises: currentExs });
  };

  const filteredExercises = useMemo(() => {
    // FIX: Use allExercises from props which is an array, not a promise
    return allExercises.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ex.pattern.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesCategory = true;
      if (activeTab === 'muscles' && selectedCategory) {
        matchesCategory = ex.muscleGroups.includes(selectedCategory as MuscleGroup);
      } else if (activeTab === 'equipment' && selectedCategory) {
        matchesCategory = ex.equipment.includes(selectedCategory as Equipment);
      }

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, allExercises, activeTab, selectedCategory]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-black uppercase italic tracking-tighter">Mina Rutiner</h3>
        <button 
          onClick={() => setEditingRoutine({ name: '', exercises: [] })}
          className="p-2 bg-white/5 rounded-xl border border-white/5 text-accent-pink active:scale-95 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="space-y-4">
        {/* FREE TRAINING OPTION */}
        <button 
          onClick={() => onStart([], "Fri Träning")}
          className="w-full bg-accent-pink/10 border border-accent-pink/20 p-6 rounded-[32px] flex items-center justify-between group active:scale-95 transition-all"
        >
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-accent-pink/20 rounded-2xl flex items-center justify-center">
              <Plus size={24} className="text-accent-pink" />
            </div>
            <div className="text-left">
              <h4 className="text-lg font-black uppercase italic leading-none text-accent-pink">Fri Träning</h4>
              <p className="text-[10px] font-black text-accent-pink/60 uppercase mt-1 tracking-widest">Bygg passet steg för steg</p>
            </div>
          </div>
          <ChevronRight size={24} className="text-accent-pink" />
        </button>

        {/* SAVED ROUTINES */}
        {routines.map(routine => (
          <div key={routine.id} className="relative group">
            <div className="flex gap-2">
              <button 
                onClick={() => handleSelectRoutine(routine)}
                className="flex-1 bg-white/5 border border-white/10 p-6 rounded-[32px] flex items-center justify-between active:scale-95 transition-all hover:border-white/20"
              >
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center">
                    <Bookmark size={24} className="text-white/40" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-lg font-black uppercase italic leading-none">{routine.name}</h4>
                    <p className="text-[10px] font-black text-text-dim uppercase mt-1 tracking-widest">{routine.exercises.length} övningar</p>
                  </div>
                </div>
                <div className="bg-white/5 p-2 rounded-full text-white/40 group-hover:bg-accent-pink/20 group-hover:text-accent-pink transition-all">
                  <Play size={20} />
                </div>
              </button>
              
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setEditingRoutine(routine)}
                  className="p-4 bg-white/5 border border-white/10 rounded-2xl text-text-dim hover:text-white transition-all"
                >
                  <Edit3 size={18} />
                </button>
                <button 
                  onClick={() => deleteRoutine(routine.id)}
                  className="p-4 bg-white/5 border border-white/10 rounded-2xl text-text-dim hover:text-red-500 transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {routines.length === 0 && (
          <div className="py-12 border border-dashed border-white/5 rounded-[40px] flex flex-col items-center justify-center opacity-30">
            <Dumbbell size={40} className="mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">Inga sparade rutiner ännu</p>
          </div>
        )}
      </div>

      {/* ROUTINE EDITOR MODAL */}
      {editingRoutine && (
        <div className="fixed inset-0 bg-[#0f0d15] z-[200] flex flex-col p-6 overflow-y-auto">
          <header className="flex justify-between items-center mb-8">
            <h3 className="text-3xl font-black uppercase italic tracking-tighter">
              {editingRoutine.id ? 'Redigera Rutin' : 'Ny Rutin'}
            </h3>
            <button onClick={() => setEditingRoutine(null)} className="p-2 bg-white/5 rounded-xl"><X size={32}/></button>
          </header>

          <div className="space-y-6 pb-24">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Rutinens namn</label>
              <input 
                type="text" 
                value={editingRoutine.name} 
                onChange={e => setEditingRoutine({...editingRoutine, name: e.target.value})}
                placeholder="Ex: Push Day - Kraft"
                className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 font-black text-xl outline-none focus:border-accent-pink"
              />
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Övningar</label>
                <button onClick={() => setShowExSelector(true)} className="text-accent-pink font-black uppercase text-[10px] tracking-widest flex items-center gap-1">
                  <Plus size={14} /> Lägg till
                </button>
              </div>

              <div className="space-y-3">
                {editingRoutine.exercises?.map((pe, idx) => {
                  // FIX: Use allExercises from props which is an array, not a promise
                  const ex = allExercises.find(e => e.id === pe.exerciseId);
                  return (
                    <div key={idx} className="bg-white/5 p-5 rounded-[24px] border border-white/5 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                          <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${ex?.name}`} className="w-6 h-6 opacity-40" />
                        </div>
                        <div>
                          <h5 className="font-black uppercase italic text-sm">{ex?.name}</h5>
                          <p className="text-[8px] font-black text-text-dim uppercase">{ex?.pattern}</p>
                        </div>
                      </div>
                      <button onClick={() => removeExerciseFromRoutine(idx)} className="text-red-500/40 hover:text-red-500"><Trash2 size={16}/></button>
                    </div>
                  );
                })}
                {(!editingRoutine.exercises || editingRoutine.exercises.length === 0) && (
                  <p className="text-center py-8 text-text-dim text-[10px] font-black uppercase tracking-widest opacity-30">Inga övningar valda</p>
                )}
              </div>
            </div>

            <button 
              onClick={saveRoutine}
              disabled={!editingRoutine.name || !editingRoutine.exercises?.length}
              className="w-full bg-white text-black py-6 rounded-3xl font-black uppercase italic tracking-widest shadow-2xl flex items-center justify-center gap-2 disabled:opacity-20 transition-all"
            >
              <Check size={20} /> Spara Rutin
            </button>
          </div>
        </div>
      )}

      {/* ENHANCED EXERCISE SELECTOR SUB-MODAL */}
      {showExSelector && (
        <div className="fixed inset-0 bg-[#0f0d15] z-[210] flex flex-col p-6 animate-in slide-in-from-bottom-4 duration-500">
          <header className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter">Välj Övning</h3>
            <button onClick={() => setShowExSelector(false)} className="p-2 bg-white/5 rounded-xl"><X size={32}/></button>
          </header>

          {/* Tabs Navigation */}
          <div className="mb-6">
            <nav className="flex items-center justify-between bg-white/5 p-1.5 rounded-[24px] border border-white/5">
              <button 
                onClick={() => { setActiveTab('all'); setSelectedCategory(null); }}
                className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'all' ? 'bg-white/10 text-white shadow-lg' : 'text-text-dim hover:text-white/60'}`}
              >
                Alla
              </button>
              <button 
                onClick={() => { setActiveTab('muscles'); setSelectedCategory(null); }}
                className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'muscles' ? 'bg-white/10 text-white shadow-lg' : 'text-text-dim hover:text-white/60'}`}
              >
                Muskler
              </button>
              <button 
                onClick={() => { setActiveTab('equipment'); setSelectedCategory(null); }}
                className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'equipment' ? 'bg-white/10 text-white shadow-lg' : 'text-text-dim hover:text-white/60'}`}
              >
                Utrustning
              </button>
            </nav>
          </div>

          {/* Category Filters (Horizontal Scroll) */}
          {(activeTab === 'muscles' || activeTab === 'equipment') && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1 mb-6">
              {(activeTab === 'muscles' ? ALL_MUSCLE_GROUPS : Object.values(Equipment)).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  className={`flex-none px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                    selectedCategory === cat 
                    ? 'bg-accent-pink border-accent-pink text-white shadow-[0_0_15px_rgba(255,45,85,0.3)]' 
                    : 'bg-white/5 border-white/10 text-text-dim hover:bg-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
            <input 
              type="text" 
              placeholder="Sök övning..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 p-5 pl-12 rounded-3xl outline-none focus:border-accent-pink transition-all font-bold text-sm"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pb-8 scrollbar-hide">
            {filteredExercises.length > 0 ? (
              filteredExercises.map(ex => (
                <button 
                  key={ex.id} 
                  onClick={() => addExerciseToRoutine(ex)}
                  className="w-full p-5 bg-[#1a1721] border border-white/5 rounded-[32px] flex justify-between items-center hover:border-white/20 transition-all group shadow-lg"
                >
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 bg-[#0f0d15] rounded-xl flex items-center justify-center border border-white/10">
                      <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${ex.name}`} className="w-full h-full p-2 opacity-30 group-hover:opacity-60 transition-opacity" />
                    </div>
                    <div className="text-left">
                      <span className="font-black italic uppercase text-base block leading-none">{ex.name}</span>
                      <span className="text-[10px] font-black text-text-dim uppercase tracking-widest mt-1">{ex.pattern}</span>
                    </div>
                  </div>
                  <Plus size={20} className="text-accent-pink" />
                </button>
              ))
            ) : (
              <div className="py-20 text-center opacity-30">
                <Search size={40} className="mx-auto mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest">Inga övningar matchar</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
