import React, { useState, useMemo, useEffect } from 'react';
import { Exercise, MovementPattern, Equipment, MuscleGroup, ExerciseTier } from '../types';
import { storage } from '../services/storage';
import { ALL_MUSCLE_GROUPS } from '../utils/recovery';
import { ExerciseImporter } from './ExerciseImporter';
import { ImageUpload } from './ImageUpload';
import { Plus, Search, Edit3, Trash2, X, Dumbbell, Activity, Save, Link, Check, Weight, Clock } from 'lucide-react';

interface ExerciseLibraryProps {
  allExercises: Exercise[];
  onUpdate: () => void;
}

export const ExerciseLibrary: React.FC<ExerciseLibraryProps> = ({ allExercises, onUpdate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [showImporter, setShowImporter] = useState(false);

  const filteredExercises = useMemo(() => {
    return allExercises.filter(ex => {
      const q = searchQuery.toLowerCase();
      return ex.name.toLowerCase().includes(q) || ex.englishName?.toLowerCase().includes(q);
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [allExercises, searchQuery]);

  const handleSave = async (exercise: Exercise) => {
    await storage.saveExercise(exercise);
    setEditingExercise(null);
    onUpdate();
  };

  return (
    <div className="pb-32 animate-in fade-in space-y-6 px-4 pt-8">
      <header className="flex justify-between items-center mb-6">
        <div><h2 className="text-3xl font-black uppercase italic tracking-tighter">Bibliotek</h2></div>
        <div className="flex gap-2">
          <button onClick={() => setShowImporter(true)} className="p-4 bg-white/5 border border-white/5 text-accent-blue rounded-2xl"><Plus size={24} /></button>
          <button onClick={() => setEditingExercise({ id: `custom-${Date.now()}`, name: '', pattern: MovementPattern.ISOLATION, tier: 'tier_3', muscleGroups: [], primaryMuscles: [], equipment: [], difficultyMultiplier: 1.0, bodyweightCoefficient: 0, trackingType: 'reps_weight', userModified: true, alternativeExIds: [] })} className="p-4 bg-accent-pink text-white rounded-2xl"><Plus size={24} strokeWidth={3} /></button>
        </div>
      </header>

      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-dim" size={18} />
        <input type="text" placeholder="Sök övning..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-[24px] p-5 pl-14 outline-none focus:border-accent-pink/50 font-bold" />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredExercises.map(ex => (
          <div key={ex.id} className="bg-[#1a1721] p-5 rounded-[32px] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/5"><Dumbbell className="text-white/20" size={20} /></div>
              <div className="min-w-0"><h3 className="text-base font-black italic uppercase truncate">{ex.name}</h3><p className="text-[10px] text-text-dim uppercase tracking-widest">{ex.tier.replace('_', ' ')} • {ex.pattern}</p></div>
            </div>
            <button onClick={() => setEditingExercise(ex)} className="p-3 bg-white/5 rounded-xl text-text-dim"><Edit3 size={18} /></button>
          </div>
        ))}
      </div>

      {editingExercise && <ExerciseEditor exercise={editingExercise} onClose={() => setEditingExercise(null)} onSave={handleSave} allExercises={allExercises} />}
      {showImporter && <div className="fixed inset-0 z-[200] bg-[#0f0d15] animate-in slide-in-from-bottom-10"><ExerciseImporter onClose={() => setShowImporter(false)} onImport={(data) => { setEditingExercise({ ...editingExercise, ...data } as any); setShowImporter(false); }} /></div>}
    </div>
  );
};

const ExerciseEditor: React.FC<{ exercise: Exercise, onClose: () => void, onSave: (ex: Exercise) => void, allExercises: Exercise[] }> = ({ exercise, onClose, onSave, allExercises }) => {
  const [formData, setFormData] = useState<Exercise>({ ...exercise });

  return (
    <div className="fixed inset-0 bg-[#0f0d15] z-[250] flex flex-col p-6 overflow-y-auto">
      <header className="flex justify-between items-center mb-8"><h3 className="text-2xl font-black italic uppercase">Redigera</h3><button onClick={onClose} className="p-2 bg-white/5 rounded-xl"><X size={28}/></button></header>
      <div className="space-y-6 pb-20">
        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-text-dim tracking-widest">Namn</label><input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-xl font-black outline-none focus:border-accent-pink" /></div>
        
        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-text-dim tracking-widest">Prioritet (Tier)</label>
          <div className="flex gap-2">
            {(['tier_1', 'tier_2', 'tier_3'] as ExerciseTier[]).map(t => (
              <button key={t} onClick={() => setFormData({ ...formData, tier: t })} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase border ${formData.tier === t ? 'bg-white text-black' : 'bg-white/5 border-white/10 text-text-dim'}`}>{t.replace('_', ' ')}</button>
            ))}
          </div>
        </div>

        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-text-dim tracking-widest">Rörelsemönster</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(MovementPattern).map(p => (
              <button key={p} onClick={() => setFormData({ ...formData, pattern: p })} className={`py-3 rounded-xl text-[10px] font-black uppercase border ${formData.pattern === p ? 'bg-white text-black' : 'bg-white/5 border-white/10 text-text-dim'}`}>{p}</button>
            ))}
          </div>
        </div>
        <button onClick={() => onSave(formData)} className="w-full py-5 bg-accent-pink text-white rounded-3xl font-black italic uppercase tracking-widest shadow-2xl flex items-center justify-center gap-2"><Save size={24} /> Spara</button>
      </div>
    </div>
  );
};