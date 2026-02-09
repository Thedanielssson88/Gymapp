import React, { useState, useMemo, useEffect } from 'react';
import { Exercise, MovementPattern, Equipment, MuscleGroup, TrackingType } from '../types';
import { storage } from '../services/storage';
import { EXERCISE_DATABASE } from '../constants';
import { ALL_MUSCLE_GROUPS } from '../utils/recovery';
import { ExerciseImporter } from './ExerciseImporter';
import { ImageUpload } from './ImageUpload';
import { Plus, Search, Edit3, Trash2, X, Dumbbell, Activity, RotateCcw, Image as ImageIcon, Link, Save, Clock, Weight } from 'lucide-react';

interface ExerciseLibraryProps {
  allExercises: Exercise[];
  onUpdate: () => void;
}

type LibraryTab = 'all' | 'muscles' | 'equipment';

export const ExerciseLibrary: React.FC<ExerciseLibraryProps> = ({ allExercises, onUpdate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<LibraryTab>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [showImporter, setShowImporter] = useState(false);

  const filteredExercises = useMemo(() => {
    return allExercises.filter(ex => {
      const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
      let matchesCategory = true;
      if (activeTab === 'muscles' && selectedCategory) {
        matchesCategory = (ex.primaryMuscles || ex.muscleGroups).includes(selectedCategory as MuscleGroup);
      } else if (activeTab === 'equipment' && selectedCategory) {
        matchesCategory = ex.equipment.includes(selectedCategory as Equipment);
      }
      return matchesSearch && matchesCategory;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [allExercises, searchQuery, activeTab, selectedCategory]);

  const handleSave = async (exercise: Exercise) => {
    await storage.saveExercise(exercise);
    setEditingExercise(null);
    onUpdate();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Vill du radera denna övning permanent?")) {
      await storage.deleteExercise(id);
      onUpdate();
    }
  };

  const createNew = () => {
    const newEx: Exercise = {
      id: `custom-${Date.now()}`,
      name: '',
      pattern: MovementPattern.SQUAT,
      muscleGroups: [],
      primaryMuscles: [],
      secondaryMuscles: [],
      equipment: [],
      difficultyMultiplier: 1.0,
      bodyweightCoefficient: 0,
      trackingType: 'reps_weight',
      userModified: true
    };
    setEditingExercise(newEx);
  };

  return (
    <div className="pb-32 animate-in fade-in space-y-6 px-4 pt-8">
      <header className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-black uppercase italic tracking-tighter">Bibliotek</h2>
          <p className="text-text-dim text-xs font-bold uppercase tracking-widest">{allExercises.length} övningar totalt</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowImporter(true)}
            className="p-4 bg-white/5 border border-white/5 text-accent-blue rounded-2xl active:scale-95 transition-all"
          >
            <Plus size={24} />
          </button>
          <button 
            onClick={createNew}
            className="p-4 bg-accent-pink text-white rounded-2xl shadow-lg active:scale-95 transition-all"
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>
      </header>

      <div className="space-y-4">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent-pink transition-colors" size={18} />
          <input 
            type="text" 
            placeholder="Sök övning..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-[24px] p-5 pl-14 outline-none focus:border-accent-pink/50 font-bold transition-all"
          />
        </div>

        <nav className="flex items-center justify-between bg-white/5 p-1.5 rounded-[24px] border border-white/5">
          <button onClick={() => { setActiveTab('all'); setSelectedCategory(null); }} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'all' ? 'bg-white/10 text-white shadow-lg' : 'text-text-dim'}`}>Alla</button>
          <button onClick={() => { setActiveTab('muscles'); setSelectedCategory(null); }} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'muscles' ? 'bg-white/10 text-white shadow-lg' : 'text-text-dim'}`}>Muskler</button>
          <button onClick={() => { setActiveTab('equipment'); setSelectedCategory(null); }} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'equipment' ? 'bg-white/10 text-white shadow-lg' : 'text-text-dim'}`}>Utrustning</button>
        </nav>

        {(activeTab === 'muscles' || activeTab === 'equipment') && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
            {(activeTab === 'muscles' ? ALL_MUSCLE_GROUPS : Object.values(Equipment)).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                className={`flex-none px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${selectedCategory === cat ? 'bg-accent-pink border-accent-pink text-white' : 'bg-white/5 border-white/5 text-text-dim'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredExercises.map(ex => (
          <ExerciseListItem key={ex.id} ex={ex} onEdit={() => setEditingExercise(ex)} onDelete={() => handleDelete(ex.id)} />
        ))}
      </div>

      {editingExercise && (
        <ExerciseEditor 
          exercise={editingExercise} 
          onClose={() => setEditingExercise(null)} 
          onSave={handleSave} 
        />
      )}

      {showImporter && (
        <div className="fixed inset-0 z-[200] bg-[#0f0d15] animate-in slide-in-from-bottom-10">
          <ExerciseImporter 
            onClose={() => setShowImporter(false)}
            onImport={(data) => {
              const newEx: Exercise = {
                id: `custom-${Date.now()}`,
                name: data.name || 'Importerad övning',
                pattern: MovementPattern.SQUAT,
                muscleGroups: data.muscleGroups || [],
                primaryMuscles: data.primaryMuscles || [],
                equipment: data.equipment || [],
                difficultyMultiplier: 1.0,
                bodyweightCoefficient: data.bodyweightCoefficient || 0,
                imageUrl: data.imageUrl,
                description: data.description,
                trackingType: data.trackingType || 'reps_weight',
                userModified: true
              };
              setEditingExercise(newEx);
              setShowImporter(false);
            }}
          />
        </div>
      )}
    </div>
  );
};

const ExerciseListItem: React.FC<{ ex: Exercise, onEdit: () => void, onDelete: () => void }> = ({ ex, onEdit, onDelete }) => {
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (ex.imageId) {
      storage.getImage(ex.imageId).then(url => {
        if (active && url) setImgSrc(url);
      });
    } else if (ex.imageUrl) {
      setImgSrc(ex.imageUrl);
    } else {
      setImgSrc(null);
    }
    return () => { active = false; };
  }, [ex.imageId, ex.imageUrl]);

  return (
    <div className="bg-[#1a1721] p-5 rounded-[32px] border border-white/5 flex items-center justify-between group">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center p-2 border border-white/5 overflow-hidden">
          {imgSrc ? (
            <img src={imgSrc} className="w-full h-full object-cover opacity-40 group-hover:opacity-80 transition-opacity" alt={ex.name} />
          ) : (
            <Dumbbell className="text-white/20" size={24} />
          )}
        </div>
        <div>
          <div className="flex items-center gap-2">
             <h3 className="text-base font-black italic uppercase tracking-tight">{ex.name}</h3>
             {ex.userModified && <Activity size={12} className="text-accent-pink" />}
          </div>
          <div className="flex items-center gap-2">
             <p className="text-[10px] text-text-dim uppercase tracking-widest font-black">{ex.pattern}</p>
             {ex.trackingType === 'time_only' && <Clock size={10} className="text-accent-blue" />}
          </div>
        </div>
      </div>
      <div className="flex gap-1">
        <button onClick={onEdit} className="p-3 bg-white/5 rounded-xl text-text-dim hover:text-white transition-colors"><Edit3 size={18} /></button>
        {ex.id.startsWith('custom-') && (
          <button onClick={onDelete} className="p-3 bg-white/5 rounded-xl text-text-dim hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
        )}
      </div>
    </div>
  );
};

interface ExerciseEditorProps {
  exercise: Exercise;
  onClose: () => void;
  onSave: (ex: Exercise) => void;
}

const ExerciseEditor: React.FC<ExerciseEditorProps> = ({ exercise, onClose, onSave }) => {
  const [formData, setFormData] = useState<Exercise>({ ...exercise });
  const isOfficial = EXERCISE_DATABASE.some(e => e.id === exercise.id);

  const handleFieldChange = (updates: Partial<Exercise>) => {
    setFormData(prev => ({ 
      ...prev, 
      ...updates, 
      userModified: isOfficial ? true : prev.userModified 
    }));
  };

  const toggleMuscle = (m: MuscleGroup) => {
    const list = formData.muscleGroups.includes(m) 
      ? formData.muscleGroups.filter(i => i !== m) 
      : [...formData.muscleGroups, m];
    handleFieldChange({ muscleGroups: list, primaryMuscles: list });
  };

  const toggleEq = (eq: Equipment) => {
    const list = formData.equipment.includes(eq) 
      ? formData.equipment.filter(i => i !== eq) 
      : [...formData.equipment, eq];
    handleFieldChange({ equipment: list });
  };

  const resetToOriginal = () => {
    const original = EXERCISE_DATABASE.find(e => e.id === exercise.id);
    if (original && confirm("Vill du återställa övningen till originalutförande? Dina anpassningar tas bort.")) {
      setFormData({ ...original, userModified: false });
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0f0d15] z-[250] flex flex-col animate-in slide-in-from-bottom-10">
      <header className="p-6 border-b border-white/10 flex justify-between items-center bg-[#0f0d15]/80 backdrop-blur-xl">
        <div>
           <h3 className="text-2xl font-black italic uppercase text-white tracking-tighter">
             {exercise.id.startsWith('custom-') ? 'Ny Övning' : 'Redigera'}
           </h3>
           <p className="text-[10px] text-text-dim font-black uppercase tracking-widest">
             {isOfficial ? 'Officiell databas' : 'Egen övning'}
           </p>
        </div>
        <div className="flex gap-2">
           {isOfficial && formData.userModified && (
              <button 
                type="button"
                onClick={resetToOriginal}
                className="p-3 bg-white/5 rounded-2xl text-accent-blue border border-white/10 active:scale-95 transition-all"
                title="Återställ till original"
              >
                <RotateCcw size={24} />
              </button>
           )}
           <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl"><X size={24}/></button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-40">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-text-dim tracking-widest">Namn</label>
            <input 
              type="text" 
              value={formData.name} 
              onChange={e => handleFieldChange({ name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-xl font-black outline-none focus:border-accent-pink"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-text-dim tracking-widest">Mätmetod</label>
            <div className="flex gap-2">
               <button 
                 onClick={() => handleFieldChange({ trackingType: 'reps_weight' })}
                 className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase border flex flex-col items-center gap-2 transition-all ${formData.trackingType !== 'time_only' ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-text-dim'}`}
               >
                 <Weight size={18} /> Kilo & Reps
               </button>
               <button 
                 onClick={() => handleFieldChange({ trackingType: 'time_only' })}
                 className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase border flex flex-col items-center gap-2 transition-all ${formData.trackingType === 'time_only' ? 'bg-accent-blue text-white border-accent-blue' : 'bg-white/5 border-white/10 text-text-dim'}`}
               >
                 <Clock size={18} /> Endast Tid
               </button>
            </div>
          </div>

          <div className="space-y-4">
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-text-dim tracking-widest">Lokal Bild</label>
                <ImageUpload 
                  currentImageId={formData.imageId} 
                  onImageSaved={(id) => handleFieldChange({ imageId: id })} 
                />
             </div>

             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-text-dim tracking-widest flex items-center gap-2">
                   <ImageIcon size={12} /> Extern Bild / GIF URL
                </label>
                <div className="relative group">
                  <Link className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" size={16} />
                  <input 
                    type="text" 
                    value={formData.imageUrl || ''} 
                    onChange={e => handleFieldChange({ imageUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-white/5 border border-white/10 p-5 pl-12 rounded-2xl font-bold outline-none focus:border-accent-pink text-sm"
                  />
                </div>
                {formData.imageUrl && !formData.imageId && (
                   <div className="mt-2 w-full h-40 rounded-2xl overflow-hidden border border-white/5 bg-black/20">
                      <img src={formData.imageUrl} className="w-full h-full object-contain" alt="Preview" />
                   </div>
                )}
             </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-text-dim tracking-widest">Rörelsemönster</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(MovementPattern).map(p => (
              <button 
                key={p} 
                onClick={() => handleFieldChange({ pattern: p })}
                className={`py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${formData.pattern === p ? 'bg-white text-black border-white' : 'bg-white/5 border-white/5 text-text-dim'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-text-dim tracking-widest">Muskelgrupper</label>
          <div className="flex flex-wrap gap-2">
            {ALL_MUSCLE_GROUPS.map(m => (
              <button 
                key={m} 
                onClick={() => toggleMuscle(m)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${formData.muscleGroups.includes(m) ? 'bg-accent-pink border-accent-pink text-white' : 'bg-white/5 border-white/5 text-text-dim'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-text-dim tracking-widest">Utrustning</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(Equipment).map(eq => (
              <button 
                key={eq} 
                onClick={() => toggleEq(eq)}
                className={`py-3 px-3 rounded-xl text-[10px] font-black uppercase border transition-all text-left flex items-center gap-2 ${formData.equipment.includes(eq) ? 'bg-accent-blue border-accent-blue text-white' : 'bg-white/5 border-white/5 text-text-dim'}`}
              >
                <div className={`w-3 h-3 rounded-full border ${formData.equipment.includes(eq) ? 'bg-white border-white' : 'border-white/20'}`} />
                {eq}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-text-dim tracking-widest">Beskrivning</label>
          <textarea 
            value={formData.description || ''} 
            onChange={e => handleFieldChange({ description: e.target.value })}
            className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl font-bold outline-none focus:border-accent-pink text-sm min-h-[120px]"
            placeholder="Instruktioner..."
          />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-[#0f0d15]/80 backdrop-blur-xl border-t border-white/5 flex gap-4">
        <button 
          onClick={() => onSave(formData)}
          className="flex-1 py-5 bg-white text-black rounded-[24px] font-black italic text-xl uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
        >
          <Save size={24} strokeWidth={3} /> Spara
        </button>
      </div>
    </div>
  );
};