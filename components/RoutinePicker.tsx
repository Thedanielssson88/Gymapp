import React, { useMemo, useState } from 'react';
import { WorkoutRoutine, Zone, Exercise, PlannedExercise, MovementPattern, MuscleGroup, Equipment, UserProfile } from '../types';
import { storage } from '../services/storage';
import { findReplacement, adaptVolume } from '../utils/fitness';
import { ALL_MUSCLE_GROUPS } from '../utils/recovery';
import { Plus, Play, ChevronRight, Bookmark, Trash2, Dumbbell, Edit3, X, Check, Search, Filter } from 'lucide-react';

interface RoutinePickerProps {
  onStart: (exercises: PlannedExercise[], routineName: string) => void;
  activeZone: Zone;
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
  const [activeTab, setActiveTab] = useState<LibraryTab>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleSelectRoutine = (routine: WorkoutRoutine) => {
    const morphedExercises = routine.exercises.map(pe => {
      const originalEx = allExercises.find(ex => ex.id === pe.exerciseId);
      if (!originalEx) return pe;
      const isAvailable = originalEx.equipment.every(eq => activeZone.inventory.includes(eq));
      if (!isAvailable) {
        const replacement = findReplacement(originalEx, activeZone, allExercises);
        const newSets = adaptVolume(pe.sets, originalEx, replacement, userProfile.goal);
        return { ...pe, exerciseId: replacement.id, sets: newSets.map(s => ({ ...s, completed: false })) };
      }
      return { ...pe, sets: pe.sets.map(s => ({ ...s, completed: false })) };
    });
    onStart(morphedExercises, routine.name);
  };

  const saveRoutine = async () => {
    if (!editingRoutine?.name || !editingRoutine?.exercises?.length) return;
    const newRoutine: WorkoutRoutine = { id: editingRoutine.id || `routine-${Date.now()}`, name: editingRoutine.name, exercises: editingRoutine.exercises || [] };
    await storage.saveRoutine(newRoutine);
    onUpdate();
    setEditingRoutine(null);
  };

  const deleteRoutine = async (id: string) => {
    if (confirm("Ta bort rutin?")) { await storage.deleteRoutine(id); onUpdate(); }
  };

  const addExerciseToRoutine = (ex: Exercise) => {
    const currentExs = editingRoutine?.exercises || [];
    const newPe: PlannedExercise = { exerciseId: ex.id, sets: [{ reps: 10, weight: 0, completed: false }, { reps: 10, weight: 0, completed: false }, { reps: 10, weight: 0, completed: false }] };
    setEditingRoutine({ ...editingRoutine, exercises: [...currentExs, newPe] });
    setShowExSelector(false);
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
    return allExercises.filter(ex => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = ex.name.toLowerCase().includes(q) || ex.englishName?.toLowerCase().includes(q) || ex.pattern.toLowerCase().includes(q);
      let matchesCategory = true;
      if (activeTab === 'muscles' && selectedCategory) matchesCategory = ex.muscleGroups.includes(selectedCategory as MuscleGroup);
      else if (activeTab === 'equipment' && selectedCategory) matchesCategory = ex.equipment.includes(selectedCategory as Equipment);
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, allExercises, activeTab, selectedCategory]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-black uppercase italic tracking-tighter">Mina Rutiner</h3>
        <button onClick={() => setEditingRoutine({ name: '', exercises: [] })} className="p-2 bg-white/5 rounded-xl text-accent-pink"><Plus size={24} /></button>
      </div>

      <div className="space-y-4">
        <button onClick={() => onStart([], "Fri Träning")} className="w-full bg-accent-pink/10 border border-accent-pink/20 p-6 rounded-[32px] flex items-center justify-between group active:scale-95 transition-all">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-accent-pink/20 rounded-2xl flex items-center justify-center"><Plus size={24} className="text-accent-pink" /></div>
            <div className="text-left"><h4 className="text-lg font-black uppercase italic leading-none text-accent-pink">Fri Träning</h4><p className="text-[10px] font-black text-accent-pink/60 uppercase mt-1 tracking-widest">Bygg passet steg för steg</p></div>
          </div>
          <ChevronRight size={24} className="text-accent-pink" />
        </button>

        {routines.map(routine => (
          <div key={routine.id} className="relative group flex gap-2">
            <button onClick={() => handleSelectRoutine(routine)} className="flex-1 bg-white/5 border border-white/10 p-6 rounded-[32px] flex items-center justify-between active:scale-95 transition-all">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center"><Bookmark size={24} className="text-white/40" /></div>
                <div className="text-left"><h4 className="text-lg font-black uppercase italic leading-none">{routine.name}</h4><p className="text-[10px] font-black text-text-dim uppercase mt-1 tracking-widest">{routine.exercises.length} övningar</p></div>
              </div>
              <Play size={20} className="text-white/40 group-hover:text-accent-pink" />
            </button>
            <div className="flex flex-col gap-2">
              <button onClick={() => setEditingRoutine(routine)} className="p-4 bg-white/5 rounded-2xl text-text-dim"><Edit3 size={18} /></button>
              <button onClick={() => deleteRoutine(routine.id)} className="p-4 bg-white/5 rounded-2xl text-text-dim"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>

      {editingRoutine && (
        <div className="fixed inset-0 bg-[#0f0d15] z-[200] flex flex-col p-6 overflow-y-auto">
          <header className="flex justify-between items-center mb-8">
            <h3 className="text-3xl font-black uppercase italic tracking-tighter">{editingRoutine.id ? 'Redigera Rutin' : 'Ny Rutin'}</h3>
            <button onClick={() => setEditingRoutine(null)} className="p-2 bg-white/5 rounded-xl"><X size={32}/></button>
          </header>
          <div className="space-y-6 pb-24">
            <input type="text" value={editingRoutine.name} onChange={e => setEditingRoutine({...editingRoutine, name: e.target.value})} placeholder="Rutinens namn..." className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 font-black text-xl outline-none focus:border-accent-pink" />
            <div className="flex justify-between items-center"><label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Övningar</label><button onClick={() => setShowExSelector(true)} className="text-accent-pink font-black uppercase text-[10px] tracking-widest flex items-center gap-1"><Plus size={14} /> Lägg till</button></div>
            <div className="space-y-3">
                {editingRoutine.exercises?.map((pe, idx) => {
                  const ex = allExercises.find(e => e.id === pe.exerciseId);
                  return (
                    <div key={idx} className="bg-white/5 p-5 rounded-[24px] border border-white/5 flex justify-between items-center">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shrink-0"><Dumbbell size={16} className="text-white/20"/></div>
                        <div className="min-w-0">
                          <h5 className="font-black uppercase italic text-sm truncate">{ex?.name}</h5>
                          {ex?.englishName && <p className="text-[9px] font-medium text-white/30 italic truncate">{ex.englishName}</p>}
                        </div>
                      </div>
                      <button onClick={() => removeExerciseFromRoutine(idx)} className="text-red-500/40 ml-2"><Trash2 size={16}/></button>
                    </div>
                  );
                })}
            </div>
            <button onClick={saveRoutine} disabled={!editingRoutine.name || !editingRoutine.exercises?.length} className="w-full bg-white text-black py-6 rounded-3xl font-black uppercase italic tracking-widest flex items-center justify-center gap-2 disabled:opacity-20 shadow-2xl"><Check size={20} /> Spara Rutin</button>
          </div>
        </div>
      )}

      {showExSelector && (
        <div className="fixed inset-0 bg-[#0f0d15] z-[210] flex flex-col p-6 animate-in slide-in-from-bottom-4 duration-500">
          <header className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter">Välj Övning</h3>
            <button onClick={() => setShowExSelector(false)} className="p-2 bg-white/5 rounded-xl"><X size={32}/></button>
          </header>
          <div className="mb-6"><nav className="flex items-center justify-between bg-white/5 p-1.5 rounded-[24px] border border-white/5"><button onClick={() => { setActiveTab('all'); setSelectedCategory(null); }} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'all' ? 'bg-white/10 text-white' : 'text-text-dim'}`}>Alla</button><button onClick={() => { setActiveTab('muscles'); setSelectedCategory(null); }} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'muscles' ? 'bg-white/10 text-white' : 'text-text-dim'}`}>Muskler</button><button onClick={() => { setActiveTab('equipment'); setSelectedCategory(null); }} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'equipment' ? 'bg-white/10 text-white' : 'text-text-dim'}`}>Utrustning</button></nav></div>
          <div className="relative mb-6"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} /><input type="text" placeholder="Sök övning (SV/EN)..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/10 p-5 pl-12 rounded-3xl outline-none focus:border-accent-pink font-bold text-sm" /></div>
          <div className="flex-1 overflow-y-auto space-y-3 pb-8 scrollbar-hide">
            {filteredExercises.map(ex => (
              <button key={ex.id} onClick={() => addExerciseToRoutine(ex)} className="w-full p-5 bg-[#1a1721] border border-white/5 rounded-[32px] flex justify-between items-center group shadow-lg">
                <div className="flex gap-4 items-center min-w-0">
                  <div className="w-12 h-12 bg-[#0f0d15] rounded-xl flex items-center justify-center border border-white/10 shrink-0"><Dumbbell size={18} className="text-white/20"/></div>
                  <div className="text-left min-w-0">
                    <span className="font-black italic uppercase text-base block leading-none truncate">{ex.name}</span>
                    {ex.englishName && <span className="text-[10px] font-bold text-white/30 italic truncate block mt-1">{ex.englishName}</span>}
                  </div>
                </div>
                <Plus size={20} className="text-accent-pink shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};