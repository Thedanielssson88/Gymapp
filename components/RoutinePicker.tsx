import React, { useMemo, useState } from 'react';
import { WorkoutRoutine, Zone, Exercise, PlannedExercise, MovementPattern, MuscleGroup, Equipment, UserProfile } from '../types';
import { storage } from '../services/storage';
import { findReplacement, adaptVolume } from '../utils/fitness';
import { RoutineCreator } from './RoutineCreator';
import { Plus, Play, ChevronRight, Bookmark, Trash2, Dumbbell, Edit3, X, Check, Search, Filter } from 'lucide-react';

interface RoutinePickerProps {
  onStart: (exercises: PlannedExercise[], routineName: string) => void;
  activeZone: Zone;
  routines: WorkoutRoutine[];
  allExercises: Exercise[];
  userProfile: UserProfile;
  onUpdate: () => void;
}

export const RoutinePicker: React.FC<RoutinePickerProps> = ({ onStart, activeZone, routines, allExercises, userProfile, onUpdate }) => {
  const [editingRoutine, setEditingRoutine] = useState<Partial<WorkoutRoutine> | null>(null);

  const handleSelectRoutine = (routine: WorkoutRoutine) => {
    const morphedExercises = routine.exercises.map(pe => {
      const originalEx = allExercises.find(ex => ex.id === pe.exerciseId);
      if (!originalEx) return { ...pe, sets: pe.sets.map(s => ({ ...s, completed: false })) };
      
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

  const saveRoutine = async (routineToSave: WorkoutRoutine) => {
    await storage.saveRoutine(routineToSave);
    onUpdate();
    setEditingRoutine(null);
  };

  const deleteRoutine = async (id: string) => {
    if (confirm("Ta bort rutin?")) { 
      await storage.deleteRoutine(id); 
      onUpdate(); 
    }
  };

  if (editingRoutine) {
    return (
      <RoutineCreator 
        allExercises={allExercises}
        initialRoutine={editingRoutine}
        onSave={saveRoutine}
        onCancel={() => setEditingRoutine(null)}
      />
    );
  }

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
    </div>
  );
};