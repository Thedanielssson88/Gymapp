
import React, { useState, useMemo } from 'react';
import { Exercise, MovementPattern, Equipment, MuscleGroup } from '../types';
import { storage } from '../services/storage';
import { ALL_MUSCLE_GROUPS } from '../utils/recovery';
import { Plus, Search, Edit3, Trash2, X, Check, Dumbbell, Activity, ShieldCheck, Filter } from 'lucide-react';

type LibraryTab = 'all' | 'muscles' | 'equipment';

export const ExerciseLibrary: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>(storage.getAllExercises());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<LibraryTab>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingEx, setEditingEx] = useState<Partial<Exercise> | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  const filteredExercises = useMemo(() => {
    return exercises.filter(ex => {
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
  }, [searchQuery, exercises, activeTab, selectedCategory]);

  const customExerciseIds = useMemo(() => {
    return storage.getCustomExercises().map(ex => ex.id);
  }, [exercises]);

  const handleSave = () => {
    if (!editingEx?.name || !editingEx?.pattern) return;
    
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

  const handleTabChange = (tab: LibraryTab) => {
    setActiveTab(tab);
    setSelectedCategory(null);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 pb-32">
      <header className="flex justify-between items-center px-4 pt-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight uppercase italic">Bibliotek</h2>
          <p className="text-text-dim text-[10px] font-black uppercase tracking-[0.2em]">
            {filteredExercises.length} {filteredExercises.length === 1 ? 'Övning' : 'Övningar'} hittade
          </p>
        </div>
        <button 
          onClick={() => {
            setIsAdding(true);
            setEditingEx({ muscleGroups: [], equipment: [], difficultyMultiplier: 1.0, bodyweightCoefficient: 0 });
          }}
          className="bg-accent-pink text-white p-3 rounded-2xl shadow-[0_0_20px_rgba(255,45,85,0.3)] active:scale-95 transition-all"
        >
          <Plus size={24} strokeWidth={3} />
        </button>
      </header>

      {/* TABS NAVIGATION */}
      <div className="px-4">
        <nav className="flex items-center justify-between bg-white/5 p-1.5 rounded-[24px] border border-white/5">
          <button 
            onClick={() => handleTabChange('all')}
            className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'all' ? 'bg-white/10 text-white shadow-lg' : 'text-text-dim hover:text-white/60'}`}
          >
            Alla
          </button>
          <button 
            onClick={() => handleTabChange('muscles')}
            className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'muscles' ? 'bg-white/10 text-white shadow-lg' : 'text-text-dim hover:text-white/60'}`}
          >
            Muskler
          </button>
          <button 
            onClick={() => handleTabChange('equipment')}
            className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'equipment' ? 'bg-white/10 text-white shadow-lg' : 'text-text-dim hover:text-white/60'}`}
          >
            Utrustning
          </button>
        </nav>
      </div>

      {/* CATEGORY FILTERS (HORIZONTAL SCROLL) */}
      {(activeTab === 'muscles' || activeTab === 'equipment') && (
        <div className="px-4 flex gap-2 overflow-x-auto scrollbar-hide py-1">
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

      {/* SEARCH BAR */}
      <div className="px-4">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent-pink transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Sök övning..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-[24px] p-5 pl-14 outline-none focus:border-accent-pink/50 font-bold transition-all text-sm placeholder:text-text-dim/40"
          />
        </div>
      </div>

      {/* EXERCISE LIST */}
      <div className="space-y-3 px-4">
        {filteredExercises.length > 0 ? (
          filteredExercises.map(ex => {
            const isCustom = customExerciseIds.includes(ex.id);
            return (
              <div key={ex.id} className="bg-[#1a1721] border border-white/5 p-5 rounded-[32px] flex justify-between items-center group hover:border-white/20 transition-all shadow-xl">
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-[#0f0d15] rounded-2xl flex items-center justify-center border border-white/10">
                     <img src={`https://api.dicebear.com/7.x/identicon/svg?seed=${ex.name}`} className="w-full h-full p-2 opacity-40 group-hover:opacity-80 transition-opacity" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-[15px] uppercase italic tracking-tight">{ex.name}</h4>
                      {!isCustom && <ShieldCheck size={12} className="text-accent-blue opacity-60" />}
                    </div>
                    <span className="text-[9px] font-black text-text-dim uppercase tracking-[0.15em] mt-0.5">{ex.pattern}</span>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {ex.muscleGroups.slice(0, 2).map(m => (
                        <span key={m} className="text-[7px] font-black bg-white/5 px-2 py-0.5 rounded-full border border-white/10 uppercase tracking-tighter text-text-dim">{m}</span>
                      ))}
                      {ex.muscleGroups.length > 2 && <span className="text-[7px] font-black text-text-dim/40">+{ex.muscleGroups.length - 2}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {isCustom ? (
                    <>
                      <button 
                        onClick={() => setEditingEx(ex)}
                        className="p-2.5 text-text-dim hover:text-white bg-white/5 rounded-xl transition-all"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(ex.id)}
                        className="p-2.5 text-text-dim hover:text-red-500 bg-white/5 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  ) : (
                    <div className="p-2.5 bg-white/5 rounded-xl opacity-20">
                      <ShieldCheck size={16} className="text-text-dim" />
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-20 text-center space-y-4">
            <div className="inline-block p-6 bg-white/5 rounded-full text-text-dim/20">
              <Search size={48} />
            </div>
            <p className="font-black uppercase italic text-text-dim tracking-widest">Inga övningar matchar din sökning</p>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      {(editingEx || isAdding) && (
        <div className="fixed inset-0 bg-[#0f0d15] z-[120] p-6 overflow-y-auto scrollbar-hide animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-8">
            <div>
              <span className="text-[10px] font-black text-accent-pink uppercase tracking-[0.3em] block mb-1">MorphFit Creator</span>
              <h3 className="text-3xl font-black italic uppercase tracking-tighter">{editingEx?.id ? 'Redigera' : 'Ny övning'}</h3>
            </div>
            <button onClick={() => { setEditingEx(null); setIsAdding(false); }} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/10"><X size={28}/></button>
          </div>

          <div className="space-y-8 pb-32">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-dim uppercase tracking-widest ml-1">Övningens Namn</label>
              <input 
                type="text"
                value={editingEx?.name || ''}
                onChange={(e) => setEditingEx({ ...editingEx!, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-[24px] p-6 outline-none focus:border-accent-pink font-black text-xl placeholder:text-text-dim/20"
                placeholder="Ex: Diamond Pushups"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-text-dim uppercase tracking-widest ml-1">Rörelsemönster</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(MovementPattern).map(p => (
                  <button
                    key={p}
                    onClick={() => setEditingEx({ ...editingEx!, pattern: p })}
                    className={`p-4 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
                      editingEx?.pattern === p 
                      ? 'bg-white/10 border-white/20 text-white' 
                      : 'bg-white/5 border-white/5 text-text-dim'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-text-dim uppercase tracking-widest ml-1">Muskelgrupper</label>
              <div className="flex flex-wrap gap-2">
                {ALL_MUSCLE_GROUPS.map(m => (
                  <button
                    key={m}
                    onClick={() => toggleMuscle(m)}
                    className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                      editingEx?.muscleGroups?.includes(m)
                        ? 'bg-accent-pink border-accent-pink text-white shadow-[0_0_15px_rgba(255,45,85,0.2)]'
                        : 'bg-white/5 border-white/10 text-text-dim'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-text-dim uppercase tracking-widest ml-1">Nödvändig Utrustning</label>
              <div className="flex flex-wrap gap-2">
                {Object.values(Equipment).map(e => (
                  <button
                    key={e}
                    onClick={() => toggleEquipment(e)}
                    className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                      editingEx?.equipment?.includes(e)
                        ? 'bg-accent-blue border-accent-blue text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]'
                        : 'bg-white/5 border-white/10 text-text-dim'
                    }`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Intensitet Multiplier</label>
                  <span className="text-accent-pink font-black text-lg italic">{editingEx?.difficultyMultiplier?.toFixed(1)}x</span>
                </div>
                <input 
                  type="range"
                  min="0.1"
                  max="2.0"
                  step="0.1"
                  value={editingEx?.difficultyMultiplier || 1.0}
                  onChange={(e) => setEditingEx({ ...editingEx!, difficultyMultiplier: parseFloat(e.target.value) })}
                  className="w-full accent-accent-pink h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Bodyweight Coeff.</label>
                  <span className="text-accent-blue font-black text-lg italic">{editingEx?.bodyweightCoefficient?.toFixed(2)}x</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={editingEx?.bodyweightCoefficient || 0}
                  onChange={(e) => setEditingEx({ ...editingEx!, bodyweightCoefficient: parseFloat(e.target.value) })}
                  className="w-full accent-accent-blue h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                />
                <p className="text-[8px] text-text-dim uppercase font-bold italic leading-relaxed opacity-60">
                  Andel av kroppsvikt som räknas som belastning (t.ex. 0.65 för armhävningar).
                </p>
              </div>
            </div>

            <button 
              onClick={handleSave}
              disabled={!editingEx?.name || !editingEx?.pattern}
              className="w-full accent-gradient py-6 rounded-[24px] font-black italic tracking-[0.2em] uppercase shadow-[0_10px_40px_rgba(255,45,85,0.4)] disabled:opacity-20 flex items-center justify-center gap-3 text-lg"
            >
              <Check size={24} strokeWidth={3} /> Spara i Bibliotek
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
