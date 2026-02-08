
import React, { useState, useMemo } from 'react';
import { Exercise, MovementPattern, Equipment, MuscleGroup } from '../types';
import { storage } from '../services/storage';
import { ALL_MUSCLE_GROUPS } from '../utils/recovery';
import { ExerciseImporter } from './ExerciseImporter';
import { Plus, Search, Edit3, Trash2, X, Check, Dumbbell, Activity, ShieldCheck, Filter, Link, Image, AlignLeft, Globe, Info } from 'lucide-react';

interface ExerciseLibraryProps {
  allExercises: Exercise[];
  onUpdate: () => void;
}

type LibraryTab = 'all' | 'muscles' | 'equipment';
type ModalTab = 'info' | 'anatomy' | 'media';

export const ExerciseLibrary: React.FC<ExerciseLibraryProps> = ({ allExercises, onUpdate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<LibraryTab>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [editingEx, setEditingEx] = useState<Partial<Exercise> | null>(null);
  const [infoExercise, setInfoExercise] = useState<Exercise | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [modalTab, setModalTab] = useState<ModalTab>('info');
  const [showImporter, setShowImporter] = useState(false);

  const filteredExercises = useMemo(() => {
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

  const handleSave = async () => {
    if (!editingEx?.name || !editingEx?.pattern) return;
    
    const allMuscles = Array.from(new Set([
      ...(editingEx.primaryMuscles || []),
      ...(editingEx.secondaryMuscles || [])
    ]));

    const newEx: Exercise = {
      id: editingEx.id || `custom-${Date.now()}`,
      name: editingEx.name,
      pattern: editingEx.pattern as MovementPattern,
      primaryMuscles: editingEx.primaryMuscles || [],
      secondaryMuscles: editingEx.secondaryMuscles || [],
      muscleGroups: allMuscles,
      equipment: editingEx.equipment || [],
      difficultyMultiplier: editingEx.difficultyMultiplier || 1.0,
      bodyweightCoefficient: editingEx.bodyweightCoefficient || 0,
      imageUrl: editingEx.imageUrl || '',
      description: editingEx.description || '',
      alternativeExIds: editingEx.alternativeExIds || []
    };

    await storage.saveExercise(newEx);
    onUpdate();
    setEditingEx(null);
    setIsAdding(false);
    setModalTab('info');
  };

  const handleDelete = async (id: string) => {
    if (confirm("Är du säker på att du vill ta bort denna övning?")) {
      await storage.deleteExercise(id);
      onUpdate();
    }
  };

  const togglePrimaryMuscle = (m: MuscleGroup) => {
    if (!editingEx) return;
    const current = editingEx.primaryMuscles || [];
    const next = current.includes(m) ? current.filter(x => x !== m) : [...current, m];
    setEditingEx({ ...editingEx, primaryMuscles: next });
  };

  const toggleSecondaryMuscle = (m: MuscleGroup) => {
    if (!editingEx) return;
    const current = editingEx.secondaryMuscles || [];
    const next = current.includes(m) ? current.filter(x => x !== m) : [...current, m];
    setEditingEx({ ...editingEx, secondaryMuscles: next });
  };

  const toggleEquipment = (e: Equipment) => {
    if (!editingEx) return;
    const current = editingEx.equipment || [];
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
        <div className="flex gap-2">
          <button 
            onClick={() => setShowImporter(true)}
            className="bg-white/5 text-white p-3 rounded-2xl border border-white/10 active:scale-95 transition-all flex items-center justify-center"
          >
            <Globe size={24} />
          </button>
          <button 
            onClick={() => {
              setIsAdding(true);
              setEditingEx({ 
                primaryMuscles: [], 
                secondaryMuscles: [], 
                muscleGroups: [],
                equipment: [], 
                difficultyMultiplier: 1.0, 
                bodyweightCoefficient: 0,
                description: '',
                imageUrl: '',
                alternativeExIds: []
              });
              setModalTab('info');
            }}
            className="bg-accent-pink text-white p-3 rounded-2xl shadow-[0_0_20px_rgba(255,45,85,0.3)] active:scale-95 transition-all"
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>
      </header>

      <div className="px-4">
        <nav className="flex items-center justify-between bg-white/5 p-1.5 rounded-[24px] border border-white/5">
          <button onClick={() => handleTabChange('all')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'all' ? 'bg-white/10 text-white shadow-lg' : 'text-text-dim hover:text-white/60'}`}>Alla</button>
          <button onClick={() => handleTabChange('muscles')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'muscles' ? 'bg-white/10 text-white shadow-lg' : 'text-text-dim hover:text-white/60'}`}>Muskler</button>
          <button onClick={() => handleTabChange('equipment')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'equipment' ? 'bg-white/10 text-white shadow-lg' : 'text-text-dim hover:text-white/60'}`}>Utrustning</button>
        </nav>
      </div>

      {(activeTab === 'muscles' || activeTab === 'equipment') && (
        <div className="px-4 flex gap-2 overflow-x-auto scrollbar-hide py-1">
          {(activeTab === 'muscles' ? ALL_MUSCLE_GROUPS : Object.values(Equipment)).map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)} className={`flex-none px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${selectedCategory === cat ? 'bg-accent-pink border-accent-pink text-white shadow-[0_0_15px_rgba(255,45,85,0.3)]' : 'bg-white/5 border-white/10 text-text-dim hover:bg-white/10'}`}>
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="px-4">
        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-accent-pink transition-colors" size={18} />
          <input type="text" placeholder="Sök övning..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-[24px] p-5 pl-14 outline-none focus:border-accent-pink/50 font-bold transition-all text-sm placeholder:text-text-dim/40" />
        </div>
      </div>

      <div className="space-y-3 px-4">
        {filteredExercises.length > 0 ? (
          filteredExercises.map(ex => {
            const isOfficial = !ex.id.startsWith('custom-');
            return (
              <div key={ex.id} className="bg-[#1a1721] border border-white/5 p-5 rounded-[32px] flex justify-between items-center group hover:border-white/20 transition-all shadow-xl">
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-[#0f0d15] rounded-2xl flex items-center justify-center border border-white/10 overflow-hidden">
                     <img src={ex.imageUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${ex.name}`} className="w-full h-full object-cover p-1 opacity-40 group-hover:opacity-80 transition-opacity" alt={ex.name} />
                  </div>
                  <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-[15px] uppercase italic tracking-tight">{ex.name}</h4>
                      {isOfficial && <ShieldCheck size={12} className="text-accent-blue opacity-60" />}
                    </div>
                    <span className="text-[9px] font-black text-text-dim uppercase tracking-[0.15em] mt-0.5">{ex.pattern}</span>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(ex.primaryMuscles?.length ? ex.primaryMuscles : ex.muscleGroups).slice(0, 2).map(m => (
                        <span key={m} className="text-[7px] font-black bg-white/5 px-2 py-0.5 rounded-full border border-white/10 uppercase tracking-tighter text-text-dim">{m}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setInfoExercise(ex)} className="p-2.5 text-text-dim hover:text-accent-blue bg-white/5 rounded-xl transition-all">
                    <Info size={16} />
                  </button>
                  <button 
                    onClick={() => {
                      setEditingEx({
                        ...ex,
                        primaryMuscles: ex.primaryMuscles || [],
                        secondaryMuscles: ex.secondaryMuscles || [],
                        alternativeExIds: ex.alternativeExIds || [],
                        description: ex.description || '',
                        imageUrl: ex.imageUrl || ''
                      });
                      setModalTab('info');
                    }}
                    className="p-2.5 text-text-dim hover:text-white bg-white/5 rounded-xl transition-all"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button onClick={() => handleDelete(ex.id)} className="p-2.5 text-text-dim hover:text-red-500 bg-white/5 rounded-xl transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-20 text-center space-y-4">
            <div className="inline-block p-6 bg-white/5 rounded-full text-text-dim/20"><Search size={48} /></div>
            <p className="font-black uppercase italic text-text-dim tracking-widest">Inga övningar matchar din sökning</p>
          </div>
        )}
      </div>

      {showImporter && (
        <div className="fixed inset-0 bg-[#0f0d15] z-[130]">
          <ExerciseImporter 
            onClose={() => setShowImporter(false)}
            onImport={(importedData) => {
              setShowImporter(false);
              setIsAdding(true);
              setEditingEx({
                primaryMuscles: [],
                secondaryMuscles: [],
                muscleGroups: [],
                equipment: [],
                difficultyMultiplier: 1.0,
                bodyweightCoefficient: 0,
                alternativeExIds: [],
                imageUrl: '',
                ...importedData
              });
              setModalTab('info');
            }}
          />
        </div>
      )}

      {(editingEx || isAdding) && (
        <div className="fixed inset-0 bg-[#0f0d15] z-[120] p-6 overflow-y-auto scrollbar-hide animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-6">
            <div>
              <span className="text-[10px] font-black text-accent-pink uppercase tracking-[0.3em] block mb-1">MorphFit Creator</span>
              <h3 className="text-3xl font-black italic uppercase tracking-tighter">{editingEx?.id && !isAdding ? 'Redigera' : 'Ny övning'}</h3>
            </div>
            <button onClick={() => { setEditingEx(null); setIsAdding(false); }} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/10"><X size={28}/></button>
          </div>

          <div className="flex gap-2 mb-8 bg-white/5 p-1 rounded-2xl border border-white/5">
            <button onClick={() => setModalTab('info')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${modalTab === 'info' ? 'bg-white/10 text-white shadow-lg' : 'text-text-dim'}`}><AlignLeft size={14} /> Grundinfo</button>
            <button onClick={() => setModalTab('anatomy')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${modalTab === 'anatomy' ? 'bg-white/10 text-white shadow-lg' : 'text-text-dim'}`}><Activity size={14} /> Anatomi</button>
            <button onClick={() => setModalTab('media')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${modalTab === 'media' ? 'bg-white/10 text-white shadow-lg' : 'text-text-dim'}`}><Image size={14} /> Media & Alt</button>
          </div>

          <div className="space-y-8 pb-32">
            {modalTab === 'info' && editingEx && (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-dim uppercase tracking-widest ml-1">Övningens Namn</label>
                  <input type="text" value={editingEx.name || ''} onChange={(e) => setEditingEx({ ...editingEx, name: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-[24px] p-6 outline-none focus:border-accent-pink font-black text-xl placeholder:text-text-dim/20" placeholder="Ex: Diamond Pushups" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-dim uppercase tracking-widest ml-1">Rörelsemönster</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.values(MovementPattern).map(p => (
                      <button key={p} onClick={() => setEditingEx({ ...editingEx, pattern: p })} className={`p-4 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${editingEx.pattern === p ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/5 text-text-dim'}`}>{p}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-dim uppercase tracking-widest ml-1">Beskrivning</label>
                  <textarea value={editingEx.description || ''} onChange={(e) => setEditingEx({ ...editingEx, description: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-[24px] p-4 text-sm font-medium outline-none focus:border-accent-pink min-h-[150px] placeholder:text-text-dim/20" placeholder="Beskriv hur övningen utförs..." />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-text-dim uppercase tracking-widest ml-1">Nödvändig Utrustning</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.values(Equipment).map(e => (
                      <button key={e} onClick={() => toggleEquipment(e)} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${editingEx.equipment?.includes(e) ? 'bg-accent-blue border-accent-blue text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-white/5 border-white/10 text-text-dim'}`}>{e}</button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {modalTab === 'anatomy' && editingEx && (
              <>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-accent-pink uppercase tracking-widest ml-1">Primära Muskler (Drivande)</label>
                  <div className="flex flex-wrap gap-2 bg-accent-pink/5 p-4 rounded-[24px] border border-accent-pink/10">
                    {ALL_MUSCLE_GROUPS.map(m => (
                      <button key={m} onClick={() => togglePrimaryMuscle(m)} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${editingEx.primaryMuscles?.includes(m) ? 'bg-accent-pink border-accent-pink text-white shadow-[0_0_15px_rgba(255,45,85,0.2)]' : 'bg-white/5 border-white/10 text-text-dim'}`}>{m}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-accent-blue uppercase tracking-widest ml-1">Sekundära Muskler (Hjälpande)</label>
                  <div className="flex flex-wrap gap-2 bg-accent-blue/5 p-4 rounded-[24px] border border-accent-blue/10">
                    {ALL_MUSCLE_GROUPS.map(m => (
                      <button key={m} onClick={() => toggleSecondaryMuscle(m)} className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${editingEx.secondaryMuscles?.includes(m) ? 'bg-accent-blue border-accent-blue text-white shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'bg-white/5 border-white/10 text-text-dim'}`}>{m}</button>
                    ))}
                  </div>
                </div>
                <div className="bg-white/5 p-6 rounded-[32px] border border-white/5 space-y-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center"><label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Intensitet Multiplier</label><span className="text-accent-pink font-black text-lg italic">{editingEx.difficultyMultiplier?.toFixed(1)}x</span></div>
                    <input type="range" min="0.1" max="2.0" step="0.1" value={editingEx.difficultyMultiplier || 1.0} onChange={(e) => setEditingEx({ ...editingEx, difficultyMultiplier: parseFloat(e.target.value) })} className="w-full accent-accent-pink h-1 bg-white/10 rounded-full appearance-none cursor-pointer" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center"><label className="text-[10px] font-black text-text-dim uppercase tracking-widest">Bodyweight Coeff.</label><span className="text-accent-blue font-black text-lg italic">{editingEx.bodyweightCoefficient?.toFixed(2)}x</span></div>
                    <input type="range" min="0" max="1" step="0.05" value={editingEx.bodyweightCoefficient || 0} onChange={(e) => setEditingEx({ ...editingEx, bodyweightCoefficient: parseFloat(e.target.value) })} className="w-full accent-accent-blue h-1 bg-white/10 rounded-full appearance-none cursor-pointer" />
                  </div>
                </div>
              </>
            )}

            {modalTab === 'media' && editingEx && (
              <>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-dim uppercase tracking-widest ml-1">Bild / GIF URL</label>
                  <div className="flex gap-4 items-center">
                    <div className="flex-1 relative"><Link size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" /><input type="text" value={editingEx.imageUrl || ''} onChange={(e) => setEditingEx({ ...editingEx, imageUrl: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-[24px] p-4 pl-12 font-bold text-xs outline-none focus:border-accent-pink" placeholder="https://..." /></div>
                    {editingEx.imageUrl && <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/20 bg-black/50"><img src={editingEx.imageUrl} className="w-full h-full object-cover" alt="Preview"/></div>}
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-text-dim uppercase tracking-widest ml-1">Alternativa Övningar</label>
                  <div className="space-y-2">
                    {editingEx.alternativeExIds?.map(altId => {
                      const altEx = allExercises.find(e => e.id === altId);
                      return altEx ? (
                        <div key={altId} className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5 group"><span className="text-xs font-bold uppercase tracking-tight">{altEx.name}</span><button onClick={() => { const next = editingEx.alternativeExIds?.filter(id => id !== altId); setEditingEx({ ...editingEx, alternativeExIds: next }); }} className="text-red-500/40 hover:text-red-500 transition-colors"><Trash2 size={16} /></button></div>
                      ) : null;
                    })}
                  </div>
                  <select className="w-full bg-white/5 border border-white/10 rounded-[24px] p-4 text-xs font-bold outline-none appearance-none" onChange={(e) => { if(!e.target.value) return; const current = editingEx.alternativeExIds || []; if(!current.includes(e.target.value)) { setEditingEx({ ...editingEx, alternativeExIds: [...current, e.target.value] }); } e.target.value = ''; }}>
                    <option value="">+ Lägg till alternativ...</option>
                    {allExercises.filter(e => e.id !== editingEx.id && e.pattern === editingEx.pattern).map(e => (<option key={e.id} value={e.id}>{e.name}</option>))}
                  </select>
                </div>
              </>
            )}
            <button onClick={handleSave} disabled={!editingEx?.name || !editingEx?.pattern} className="w-full accent-gradient py-6 rounded-[24px] font-black italic tracking-[0.2em] uppercase shadow-[0_10px_40px_rgba(255,45,85,0.4)] disabled:opacity-20 flex items-center justify-center gap-3 text-lg"><Check size={24} strokeWidth={3} /> Spara i Bibliotek</button>
          </div>
        </div>
      )}

      {infoExercise && (
        <div className="fixed inset-0 bg-[#0f0d15]/90 backdrop-blur-sm z-[200] p-6 overflow-y-auto animate-in fade-in">
          <div className="max-w-md mx-auto bg-[#1a1721] rounded-[40px] border border-white/10 overflow-hidden shadow-2xl pb-12">
            <div className="w-full h-72 bg-black/50 relative">
              {infoExercise.imageUrl ? (
                  <img src={infoExercise.imageUrl} className="w-full h-full object-cover" alt={infoExercise.name}/>
              ) : (
                  <div className="w-full h-full flex items-center justify-center flex-col gap-4 opacity-30"><Dumbbell size={64} /><span className="font-black uppercase tracking-widest text-xs">Ingen bild tillgänglig</span></div>
              )}
              <button onClick={() => setInfoExercise(null)} className="absolute top-4 right-4 bg-black/50 p-3 rounded-full text-white backdrop-blur-md hover:scale-110 active:scale-95 transition-all"><X size={24} /></button>
            </div>
            <div className="p-8 space-y-8">
              <div>
                  <h2 className="text-3xl font-black italic uppercase leading-none mb-2 tracking-tighter">{infoExercise.name}</h2>
                  <div className="flex gap-2"><span className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest text-accent-pink">{infoExercise.pattern}</span></div>
              </div>
              <div className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-dim border-b border-white/5 pb-2">Instruktioner</h4>
                  {infoExercise.description ? (<p className="text-sm leading-relaxed text-white/80 font-medium whitespace-pre-wrap">{infoExercise.description}</p>) : (<p className="text-xs italic text-white/20 font-bold uppercase tracking-widest">Ingen beskrivning tillgänglig för denna övning.</p>)}
              </div>
              <div className="space-y-6">
                  <div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-pink mb-3">Primära Muskler</h4>
                      <div className="flex flex-wrap gap-2">
                          {(infoExercise.primaryMuscles?.length ? infoExercise.primaryMuscles : infoExercise.muscleGroups).map(m => (
                              <span key={m} className="px-3 py-1.5 border border-accent-pink/30 bg-accent-pink/5 rounded-xl text-[10px] font-black uppercase tracking-tight">{m}</span>
                          ))}
                      </div>
                  </div>
                  {infoExercise.secondaryMuscles && infoExercise.secondaryMuscles.length > 0 && (
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-accent-blue mb-3">Sekundära Muskler</h4>
                        <div className="flex flex-wrap gap-2">
                            {infoExercise.secondaryMuscles.map(m => (
                                <span key={m} className="px-3 py-1.5 border border-accent-blue/30 bg-accent-blue/5 rounded-xl text-[10px] font-black uppercase tracking-tight">{m}</span>
                            ))}
                        </div>
                    </div>
                  )}
                  {infoExercise.equipment && infoExercise.equipment.length > 0 && (
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-dim mb-3">Utrustning</h4>
                        <div className="flex flex-wrap gap-2">
                            {infoExercise.equipment.map(eq => (
                                <span key={eq} className="px-3 py-1.5 border border-white/10 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-tight text-white/80">{eq}</span>
                            ))}
                        </div>
                    </div>
                  )}
              </div>
              {infoExercise.alternativeExIds && infoExercise.alternativeExIds.length > 0 && (
                  <div className="pt-6 border-t border-white/5">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-text-dim mb-4">Bra Alternativ</h4>
                      <div className="space-y-2">
                          {infoExercise.alternativeExIds.map(altId => {
                              const altEx = allExercises.find(e => e.id === altId);
                              return altEx ? (
                                  <div key={altId} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center overflow-hidden"><img src={altEx.imageUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${altEx.name}`} className="w-full h-full object-cover opacity-50" alt={altEx.name}/></div>
                                      <span className="text-xs font-black uppercase italic tracking-tight">{altEx.name}</span>
                                  </div>
                              ) : null;
                          })}
                      </div>
                  </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
