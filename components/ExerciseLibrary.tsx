
import React, { useState, useMemo, useEffect } from 'react';
import { Exercise, MovementPattern, Equipment, MuscleGroup, ExerciseTier, TrackingType } from '../types';
import { storage } from '../services/storage';
import { ALL_MUSCLE_GROUPS } from '../utils/recovery';
import { ExerciseImporter } from './ExerciseImporter';
import { ImageUpload } from './ImageUpload';
import { useExerciseImage } from '../hooks/useExerciseImage';
import { Plus, Search, Edit3, Trash2, X, Dumbbell, Save, Activity, Layers, Scale, Link as LinkIcon, Check, ArrowRightLeft } from 'lucide-react';

interface ExerciseLibraryProps {
  allExercises: Exercise[];
  onUpdate?: () => void;
  onSelect?: (exercise: Exercise) => void;
  onClose?: () => void;
}

const ExerciseImage = ({ exercise }: { exercise: Exercise }) => {
    const imageSrc = useExerciseImage(exercise);
    return (
        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/5 shrink-0">
            {imageSrc ? (
                <img src={imageSrc} alt={exercise.name} className="w-full h-full rounded-xl object-cover" />
            ) : (
                <Dumbbell className="text-white/20" size={20} />
            )}
        </div>
    );
};

export const ExerciseLibrary: React.FC<ExerciseLibraryProps> = ({ allExercises, onUpdate, onSelect, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [showImporter, setShowImporter] = useState(false);
  const isSelectorMode = !!onSelect;

  const filteredExercises = useMemo(() => {
    return allExercises.filter(ex => {
      const q = searchQuery.toLowerCase();
      return ex.name.toLowerCase().includes(q) || ex.englishName?.toLowerCase().includes(q);
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [allExercises, searchQuery]);

  const handleSave = async (exercise: Exercise) => {
    const updatedExercise = {
        ...exercise,
        muscleGroups: Array.from(new Set([...exercise.primaryMuscles, ...(exercise.secondaryMuscles || [])]))
    };
    await storage.saveExercise(updatedExercise);
    setEditingExercise(null);
    onUpdate?.();
  };

  const handleDelete = async (id: string) => {
      if(confirm("Är du säker på att du vill ta bort denna övning?")) {
          await storage.deleteExercise(id);
          setEditingExercise(null);
          onUpdate?.();
      }
  }

  return (
    <div className="pb-32 animate-in fade-in space-y-6 px-4 pt-8 h-full flex flex-col">
      <header className="flex justify-between items-center mb-6">
        <div><h2 className="text-3xl font-black uppercase italic tracking-tighter">{isSelectorMode ? 'Välj Övning' : 'Bibliotek'}</h2></div>
        
        {isSelectorMode ? (
          <button onClick={onClose} className="p-4 bg-white/5 border border-white/5 text-white rounded-2xl"><X size={24} /></button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setShowImporter(true)} className="p-4 bg-white/5 border border-white/5 text-accent-blue rounded-2xl"><Plus size={24} /></button>
            <button onClick={() => setEditingExercise({ 
              id: `custom-${Date.now()}`, 
              name: '', 
              englishName: '',
              pattern: MovementPattern.ISOLATION, 
              tier: 'tier_3', 
              muscleGroups: [], 
              primaryMuscles: [], 
              secondaryMuscles: [],
              equipment: [], 
              difficultyMultiplier: 1.0, 
              bodyweightCoefficient: 0, 
              trackingType: 'reps_weight', 
              userModified: true, 
              alternativeExIds: [] 
            })} className="p-4 bg-accent-pink text-white rounded-2xl"><Plus size={24} strokeWidth={3} /></button>
          </div>
        )}
      </header>

      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-dim" size={18} />
        <input type="text" placeholder="Sök (Svenska / Engelska)..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-[24px] p-5 pl-14 outline-none focus:border-accent-pink/50 font-bold" />
      </div>

      <div className="grid grid-cols-1 gap-4 flex-1 overflow-y-auto scrollbar-hide">
        {filteredExercises.map(ex => (
          <div key={ex.id} className="bg-[#1a1721] p-5 rounded-[32px] border border-white/5 flex items-center justify-between group">
            <div className="flex items-center gap-4 overflow-hidden">
              <ExerciseImage exercise={ex} />
              <div className="min-w-0">
                  <h3 className="text-base font-black italic uppercase truncate">{ex.name}</h3>
                  {ex.englishName && <p className="text-[10px] text-white/30 italic truncate leading-none mb-1">{ex.englishName}</p>}
                  <p className="text-[10px] text-text-dim uppercase tracking-widest truncate">
                      {ex.tier?.replace('_', ' ') || 'TIER 3'} • {ex.primaryMuscles.join(', ')}
                  </p>
              </div>
            </div>

            {isSelectorMode && onSelect ? (
              <button onClick={() => onSelect(ex)} className="p-3 bg-accent-pink rounded-xl text-white"><Plus size={18} /></button>
            ) : (
              <button onClick={() => setEditingExercise(ex)} className="p-3 bg-white/5 rounded-xl text-text-dim hover:text-white transition-colors"><Edit3 size={18} /></button>
            )}
          </div>
        ))}
      </div>

      {editingExercise && !isSelectorMode && <ExerciseEditor exercise={editingExercise} allExercises={allExercises} onClose={() => setEditingExercise(null)} onSave={handleSave} onDelete={handleDelete} />}
      {showImporter && !isSelectorMode && <div className="fixed inset-0 z-[200] bg-[#0f0d15] animate-in slide-in-from-bottom-10"><ExerciseImporter onClose={() => setShowImporter(false)} onImport={(data) => { setEditingExercise({ ...editingExercise, ...data } as any); setShowImporter(false); }} /></div>}
    </div>
  );
};

const ExerciseEditor: React.FC<{ exercise: Exercise, allExercises: Exercise[], onClose: () => void, onSave: (ex: Exercise) => void, onDelete?: (id: string) => void }> = ({ exercise, allExercises, onClose, onSave, onDelete }) => {
  const [formData, setFormData] = useState<Exercise>({ 
      ...exercise,
      primaryMuscles: exercise.primaryMuscles || [],
      secondaryMuscles: exercise.secondaryMuscles || [],
      equipment: exercise.equipment || [],
      difficultyMultiplier: exercise.difficultyMultiplier ?? 1,
      bodyweightCoefficient: exercise.bodyweightCoefficient ?? 0,
      trackingType: exercise.trackingType || 'reps_weight',
      tier: exercise.tier || 'tier_3',
      alternativeExIds: exercise.alternativeExIds || []
  });

  const [activeTab, setActiveTab] = useState<'info' | 'muscles' | 'settings'>('muscles');

  const toggleList = (list: string[], item: string) => list.includes(item) ? list.filter(i => i !== item) : [...list, item];

  return (
    <div className="fixed inset-0 bg-[#0f0d15] z-[250] flex flex-col animate-in slide-in-from-bottom-10">
      <header className="flex justify-between items-center p-6 border-b border-white/5 bg-[#0f0d15]"><h3 className="text-2xl font-black italic uppercase">Redigera Övning</h3><button onClick={onClose} className="p-2 bg-white/5 rounded-xl"><X size={24}/></button></header>
      <div className="flex p-4 gap-2 border-b border-white/5">{[{ id: 'info', label: 'Info & Bild', icon: Activity }, { id: 'muscles', label: 'Muskler & Utr.', icon: Layers }, { id: 'settings', label: 'Data & Nivå', icon: Scale }].map(tab => (<button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase flex flex-col items-center gap-1 transition-all ${activeTab === tab.id ? 'bg-white text-black' : 'bg-white/5 text-text-dim'}`}><tab.icon size={16} /> {tab.label}</button>))}</div>
      <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
        {activeTab === 'info' && <InfoTab formData={formData} setFormData={setFormData} />}
        {activeTab === 'muscles' && <MusclesTab formData={formData} setFormData={setFormData} toggleList={toggleList} />}
        {activeTab === 'settings' && <SettingsTab formData={formData} setFormData={setFormData} onDelete={onDelete} allExercises={allExercises} />}
      </div>
      <div className="p-6 bg-[#0f0d15] border-t border-white/5 absolute bottom-0 left-0 right-0"><button onClick={() => onSave(formData)} className="w-full py-4 bg-white text-black rounded-2xl font-black italic uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"><Save size={20} /> Spara Ändringar</button></div>
    </div>
  );
};

// --- SUB-COMPONENTS FOR EDITOR TABS ---
const InfoTab = ({ formData, setFormData }: { formData: Exercise, setFormData: (d: Exercise) => void }) => {
  const [imageUrlInput, setImageUrlInput] = useState(formData.imageUrl || '');
  useEffect(() => { setImageUrlInput(formData.imageUrl || '') }, [formData.imageUrl]);
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => { setImageUrlInput(e.target.value); setFormData({ ...formData, imageUrl: e.target.value, imageId: undefined }); };
  const handleImageUpload = (id: string) => { setFormData({...formData, imageId: id, imageUrl: ''}); setImageUrlInput(''); };
  return (<div className="space-y-6"><div className="space-y-2"><label className="text-[10px] font-black uppercase text-text-dim tracking-widest">Namn (Svenska)</label><input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-xl font-black outline-none focus:border-accent-pink" placeholder="T.ex. Bänkpress" /></div><div className="space-y-2"><label className="text-[10px] font-black uppercase text-text-dim tracking-widest">Namn (Engelska)</label><input type="text" value={formData.englishName || ''} onChange={e => setFormData({ ...formData, englishName: e.target.value })} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-lg font-bold italic outline-none focus:border-accent-pink" placeholder="T.ex. Bench Press" /></div><div className="space-y-2"><label className="text-[10px] font-black uppercase text-text-dim tracking-widest">Beskrivning</label><textarea value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-sm font-medium outline-none min-h-[100px]" placeholder="Hur utförs övningen?" /></div><div className="space-y-4"><label className="text-[10px] font-black uppercase text-text-dim tracking-widest">Bild</label><div className="bg-white/5 rounded-2xl p-4 border border-white/10"><ImageUpload currentImageId={formData.imageId} onImageSaved={handleImageUpload}/></div><div className="relative group"><LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-dim" size={16} /><input type="text" value={imageUrlInput} onChange={handleUrlChange} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pl-12 text-sm font-medium outline-none focus:border-accent-blue placeholder:text-text-dim/50" placeholder="Eller klistra in bild-URL..." /></div></div></div>);
};

const MusclesTab = ({ formData, setFormData, toggleList }: any) => (
  <div className="space-y-8">
    <div className="space-y-3"><label className="text-[10px] font-black uppercase text-text-dim tracking-widest">Rörelsemönster</label><div className="grid grid-cols-2 gap-2">{Object.values(MovementPattern).map(p => (<button key={p} onClick={() => setFormData({ ...formData, pattern: p })} className={`py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${formData.pattern === p ? 'bg-accent-blue text-white border-accent-blue' : 'bg-white/5 border-white/10 text-text-dim'}`}>{p}</button>))}</div></div>
    <div className="space-y-3"><label className="text-[10px] font-black uppercase text-text-dim tracking-widest flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-accent-pink"/> Primära Muskler</label><div className="flex flex-wrap gap-2">{ALL_MUSCLE_GROUPS.map(m => (<button key={m} onClick={() => setFormData({...formData, primaryMuscles: toggleList(formData.primaryMuscles, m)})} className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase border transition-all ${formData.primaryMuscles.includes(m) ? 'bg-accent-pink text-white border-accent-pink' : 'bg-white/5 border-white/10 text-text-dim'}`}>{m}</button>))}</div></div>
    <div className="space-y-3"><label className="text-[10px] font-black uppercase text-text-dim tracking-widest flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-500"/> Sekundära Muskler</label><div className="flex flex-wrap gap-2">{ALL_MUSCLE_GROUPS.map(m => (<button key={m} onClick={() => setFormData({...formData, secondaryMuscles: toggleList(formData.secondaryMuscles || [], m)})} className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase border transition-all ${formData.secondaryMuscles?.includes(m) ? 'bg-blue-500/20 text-blue-400 border-blue-500/50' : 'bg-white/5 border-white/10 text-text-dim'}`}>{m}</button>))}</div></div>
    <div className="space-y-3"><label className="text-[10px] font-black uppercase text-text-dim tracking-widest">Utrustning</label><div className="flex flex-wrap gap-2">{Object.values(Equipment).map(eq => (<button key={eq} onClick={() => setFormData({...formData, equipment: toggleList(formData.equipment, eq)})} className={`px-3 py-2 rounded-lg text-[10px] font-bold uppercase border transition-all ${formData.equipment.includes(eq) ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-text-dim'}`}>{eq}</button>))}</div></div>
  </div>
);

const AlternativeSelectorModal: React.FC<{
  allExercises: Exercise[];
  selectedIds: string[];
  onClose: () => void;
  onSave: (newSelection: string[]) => void;
  currentExerciseId: string;
}> = ({ allExercises, selectedIds, onClose, onSave, currentExerciseId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSelection, setCurrentSelection] = useState<string[]>(selectedIds);

  const filteredExercises = useMemo(() => {
    return allExercises
      .filter(ex => ex.id !== currentExerciseId)
      .filter(ex => ex.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allExercises, searchQuery, currentExerciseId]);

  const toggleSelection = (id: string) => {
    setCurrentSelection(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    onSave(currentSelection);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#0f0d15] z-[300] flex flex-col p-6 animate-in slide-in-from-bottom-10">
      <header className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-black italic uppercase">Välj Alternativ</h3>
        <button onClick={onClose} className="p-2 bg-white/5 rounded-xl"><X size={24}/></button>
      </header>
      <div className="relative group mb-4">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-dim" size={18} />
        <input type="text" placeholder="Sök övning..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 pl-14 outline-none focus:border-accent-blue" />
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2 pb-24">
        {filteredExercises.map(ex => {
          const isSelected = currentSelection.includes(ex.id);
          return (
            <button key={ex.id} onClick={() => toggleSelection(ex.id)} className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all border ${isSelected ? 'bg-accent-blue/10 border-accent-blue' : 'bg-white/5 border-transparent'}`}>
              <span className={`font-bold text-sm ${isSelected ? 'text-accent-blue' : 'text-white'}`}>{ex.name}</span>
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${isSelected ? 'bg-accent-blue border-accent-blue' : 'border-white/20'}`}>
                {isSelected && <Check size={14} className="text-black" />}
              </div>
            </button>
          )
        })}
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-[#0f0d15]/80 backdrop-blur-xl border-t border-white/5">
        <button onClick={handleSave} className="w-full py-4 bg-white text-black rounded-2xl font-black italic uppercase tracking-widest flex items-center justify-center gap-2">
          <Check size={20} /> Spara Val ({currentSelection.length})
        </button>
      </div>
    </div>
  );
};

const SettingsTab = ({ formData, setFormData, onDelete, allExercises }: { formData: Exercise, setFormData: (d: Exercise) => void, onDelete?: (id: string) => void, allExercises: Exercise[] }) => {
  const [showAltSelector, setShowAltSelector] = useState(false);

  const removeAlternative = (altId: string) => {
    const newAlts = (formData.alternativeExIds || []).filter(id => id !== altId);
    setFormData({ ...formData, alternativeExIds: newAlts });
  };
  
  const handleSaveAlternatives = (newSelection: string[]) => {
    setFormData({ ...formData, alternativeExIds: newSelection });
  };

  return (
    <>
      <div className="space-y-6">
        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-text-dim tracking-widest">Nivå / Prioritet</label><div className="flex gap-2">{([ 'tier_1', 'tier_2', 'tier_3' ] as ExerciseTier[]).map(t => (<button key={t} onClick={() => setFormData({ ...formData, tier: t })} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase border transition-all ${formData.tier === t ? 'bg-white text-black' : 'bg-white/5 border-white/10 text-text-dim'}`}>{t.replace('_', ' ')}</button>))}</div></div>
        <div className="space-y-2"><label className="text-[10px] font-black uppercase text-text-dim tracking-widest">Mättyp</label><div className="grid grid-cols-2 gap-2">{([ 'reps_weight', 'time_distance', 'reps_only', 'time_only' ] as TrackingType[]).map(tt => (<button key={tt} onClick={() => setFormData({...formData, trackingType: tt})} className={`p-3 rounded-xl border text-xs font-bold uppercase ${formData.trackingType === tt ? 'bg-accent-blue text-white border-accent-blue' : 'bg-white/5 border-white/10'}`}>{tt.replace('_', ' & ')}</button>))}</div></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-text-dim tracking-widest">Svårighetsgrad</label><input type="number" step="0.1" value={formData.difficultyMultiplier} onChange={e => setFormData({...formData, difficultyMultiplier: parseFloat(e.target.value)})} className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white font-bold" /></div>
          <div className="space-y-2"><label className="text-[10px] font-black uppercase text-text-dim tracking-widest">Kroppsviktsfaktor</label><input type="number" step="0.1" max="1" min="0" value={formData.bodyweightCoefficient} onChange={e => setFormData({...formData, bodyweightCoefficient: parseFloat(e.target.value)})} className="w-full bg-white/5 border border-white/10 p-3 rounded-xl text-white font-bold" /></div>
        </div>
        
        <div className="space-y-3 pt-4 border-t border-white/5">
          <label className="text-[10px] font-black uppercase text-text-dim tracking-widest flex items-center gap-2">
            <ArrowRightLeft size={12}/> Likvärdiga Alternativ
          </label>
          <div className="flex flex-wrap gap-2 min-h-[40px] bg-white/5 p-3 rounded-xl border border-white/5">
            {(formData.alternativeExIds || []).length === 0 ? (
                <span className="text-text-dim text-xs italic opacity-50">Inga alternativ valda...</span>
            ) : (formData.alternativeExIds || []).map(altId => {
              const altEx = allExercises.find(e => e.id === altId);
              if (!altEx) return null;
              return (
                <div key={altId} className="bg-accent-blue/20 text-accent-blue border border-accent-blue/30 rounded-lg px-3 py-2 text-[10px] font-bold uppercase flex items-center gap-2 animate-in fade-in zoom-in-95">
                  <span>{altEx.name}</span>
                  <button onClick={() => removeAlternative(altId)} className="text-accent-blue/50 hover:text-accent-blue"><X size={12}/></button>
                </div>
              );
            })}
          </div>
          <button 
            onClick={() => setShowAltSelector(true)}
            className="w-full mt-2 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-text-dim uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
            <Plus size={14} /> Välj alternativ...
          </button>
        </div>

        {onDelete && formData.userModified && (<div className="pt-8 border-t border-white/5"><button onClick={() => onDelete(formData.id)} className="w-full py-4 border border-red-500/30 text-red-500 rounded-2xl font-bold uppercase text-xs hover:bg-red-500/10 flex items-center justify-center gap-2"><Trash2 size={16}/> Ta bort övning</button></div>)}
      </div>

      {showAltSelector && (
        <AlternativeSelectorModal
          allExercises={allExercises}
          selectedIds={formData.alternativeExIds || []}
          onClose={() => setShowAltSelector(false)}
          onSave={handleSaveAlternatives}
          currentExerciseId={formData.id}
        />
      )}
    </>
  );
};
