import React, { useState, useMemo } from 'react';
import { Exercise, MovementPattern, Equipment, MuscleGroup } from '../types';
import { storage } from '../services/storage';
import { ALL_MUSCLE_GROUPS } from '../utils/recovery';
import { Plus, Search, Edit3, Trash2, X, Check, Dumbbell, Activity, ShieldCheck } from 'lucide-react';

export const ExerciseLibrary: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>(storage.getAllExercises());
  const [searchQuery, setSearchQuery] = useState('');
  const [editingEx, setEditingEx] = useState<Partial<Exercise> | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => 
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.pattern.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, exercises]);

  const customExerciseIds = useMemo(() => {
    return storage.getCustomExercises().map(ex => ex.id);
  }, [exercises]);

  const handleSave = () => {
    if (!editingEx?.name || !editingEx?.pattern) return;
    
    // Fix: Added missing bodyweightCoefficient property to satisfy Exercise interface
    const newEx: Exercise = {
      id: editingEx.id || `custom-${Date.now()}`,
      name: editingEx.name,
      pattern: editingEx.pattern as MovementPattern,
      muscleGroups: editingEx.muscleGroups || [],
      equipment: editingEx.equipment || [],
      difficultyMultiplier: editingEx.difficultyMultiplier || 1.0,
      bodyweightCoefficient: editingEx.bodyweightCoefficient || 0
    };

    storage.saveExercise(newEx);
    setExercises(storage.getAllExercises());
    setEditingEx(null);
    setIsAdding(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Är du säker på att du vill ta bort denna övning?")) {
      storage.deleteExercise(id);
      setExercises(storage.getAllExercises());
    }
  };

  const toggleMuscle = (m: MuscleGroup) => {
    const current = editingEx?.muscleGroups || [];
    const next = current.includes(m) ? current.filter(x => x !== m) : [...current, m];
    setEditingEx({ ...editingEx, muscleGroups: next });
  };

  const toggleEquipment = (e: Equipment) => {
    const current = editingEx?.equipment || [];
    const next = current.includes(e) ? current.filter(x => x !== e) : [...current, e];
    setEditingEx({ ...editingEx, equipment: next });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <header className="flex justify-between items-center px-2 pt-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight uppercase italic">Bibliotek</h2>
          <p className="text-text-dim text-xs font-black uppercase tracking-widest">{exercises.length} Övningar totalt</p>
        </div>
        <button 
          onClick={() => {
            setIsAdding(true);
            setEditingEx({ muscleGroups: [], equipment: [], difficultyMultiplier: 1.0, bodyweightCoefficient: 0 });
          }}
          className="bg-accent-pink/10 text-accent-pink p-3 rounded-2xl border border-accent-pink/20 hover:bg-accent-pink/20 transition-all"
        >
          <Plus size={24} />
        </button>
      </header>

      <div className="px-2">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" size={18} />
          <input 
            type="text" 
            placeholder="Sök övning eller mönster..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 pl-14 outline-none focus:border-accent-pink font-bold transition-all"
          />
        </div>
      </div>

      <div className="space-y-3 px-2">
        {filteredExercises.map(ex => {
          const isCustom = customExerciseIds.includes(ex.id);
          return (
            <div key={ex.id} className="bg-white/5 border border-white/5 p-5 rounded-3xl flex justify-between items-center group">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10">
                   <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${ex.name}`} className="w-full h-full p-2 opacity-60" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-sm uppercase">{ex.name}</h4>
                    {!isCustom && <ShieldCheck size={12} className="text-blue-500 opacity-50" />}
                  </div>
                  <p className="text-[10px] font-black text-text-dim uppercase tracking-widest">{ex.pattern}</p>
                  <div className="flex gap-1 mt-2">
                    {ex.muscleGroups.slice(0, 3).map(m => (
                      <span key={m} className="text-[7px] font-black bg-white/5 px-1.5 py-0.5 rounded border border-white/5 uppercase">{m}</span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {isCustom && (
                  <>
                    <button 
                      onClick={() => setEditingEx(ex)}
                      className="p-2 text-text-dim hover:text-white transition-all"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(ex.id)}
                      className="p-2 text-text-dim hover:text-red-500 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
                {!isCustom && <Info size={16} className="text-text-dim opacity-20" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Editor Modal */}
      {(editingEx || isAdding) && (
        <div className="fixed inset-0 bg-[#0f0d15] z-[110] p-6 overflow-y-auto scrollbar-hide animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-black italic uppercase">{editingEx?.id ? 'Redigera Övning' : 'Ny Övning'}</h3>
            <button onClick={() => { setEditingEx(null); setIsAdding(false); }} className="p-2 bg-white/5 rounded-full"><X size={24}/></button>
          </div>

          <div className="space-y-6 pb-20">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Övningsnamn</label>
              <input 
                type="text"
                value={editingEx?.name || ''}
                onChange={(e) => setEditingEx({ ...editingEx!, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none focus:border-accent-pink font-bold text-lg"
                placeholder="Ex: Hantelpress"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Rörelsemönster</label>
              <select 
                value={editingEx?.pattern || ''}
                onChange={(e) => setEditingEx({ ...editingEx!, pattern: e.target.value as MovementPattern })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 outline-none font-black uppercase text-xs"
              >
                <option value="">Välj mönster...</option>
                {Object.values(MovementPattern).map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Målmuskler (Primär/Sekundär)</label>
              <div className="flex flex-wrap gap-2">
                {ALL_MUSCLE_GROUPS.map(m => (
                  <button
                    key={m}
                    onClick={() => toggleMuscle(m)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      editingEx?.muscleGroups?.includes(m)
                        ? 'bg-accent-pink border-accent-pink text-white'
                        : 'bg-white/5 border-white/10 text-text-dim'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Nödvändig Utrustning</label>
              <div className="flex flex-wrap gap-2">
                {Object.values(Equipment).map(e => (
                  <button
                    key={e}
                    onClick={() => toggleEquipment(e)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                      editingEx?.equipment?.includes(e)
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-white/5 border-white/10 text-text-dim'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Svårighetsgrad (Multiplier)</label>
                <span className="text-accent-pink font-black">{editingEx?.difficultyMultiplier?.toFixed(1)}x</span>
              </div>
              <input 
                type="range"
                min="0.1"
                max="2.0"
                step="0.1"
                value={editingEx?.difficultyMultiplier || 1.0}
                onChange={(e) => setEditingEx({ ...editingEx!, difficultyMultiplier: parseFloat(e.target.value) })}
                className="w-full accent-accent-pink"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Kroppsviktscoefficient (0.0 - 1.0)</label>
                <span className="text-accent-pink font-black">{editingEx?.bodyweightCoefficient?.toFixed(2)}x</span>
              </div>
              <input 
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={editingEx?.bodyweightCoefficient || 0}
                onChange={(e) => setEditingEx({ ...editingEx!, bodyweightCoefficient: parseFloat(e.target.value) })}
                className="w-full accent-accent-pink"
              />
              <p className="text-[8px] text-text-dim uppercase font-bold italic">Hur stor del av din kroppsvikt som räknas som belastning (t.ex. 0.65 för armhävningar).</p>
            </div>

            <button 
              onClick={handleSave}
              disabled={!editingEx?.name || !editingEx?.pattern}
              className="w-full accent-gradient py-5 rounded-2xl font-black italic tracking-widest uppercase shadow-2xl shadow-accent-pink/20 disabled:opacity-30 flex items-center justify-center gap-2"
            >
              <Check size={20} /> Spara i Bibliotek
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Info = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />
  </svg>
);