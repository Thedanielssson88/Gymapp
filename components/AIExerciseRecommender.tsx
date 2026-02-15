import React, { useState, useEffect } from 'react';
import { Search, Loader2, Plus, ArrowRight, Trash2, History, Dumbbell, Save, AlertCircle, Sparkles } from 'lucide-react';
import { recommendExercises, ExerciseRecommendation } from '../services/geminiService';
import { storage } from '../services/storage';
import { Exercise } from '../types';

interface AIExerciseRecommenderProps {
  onEditExercise: (exerciseId: string) => void;
}

const HISTORY_KEY = 'gym_ai_scout_history_v2';
const MAX_HISTORY = 50;

export const AIExerciseRecommender: React.FC<AIExerciseRecommenderProps> = ({ onEditExercise }) => {
  const [request, setRequest] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<ExerciseRecommendation[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [history, setHistory] = useState<ExerciseRecommendation[]>([]);
  
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    loadLibrary();
    loadHistory();
  }, [refreshTrigger]);

  const loadLibrary = async () => {
    const exercises = await storage.getAllExercises();
    setAllExercises(exercises);
  };

  const loadHistory = () => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) {
        setHistory(JSON.parse(raw));
      }
    } catch (e) {
      console.error("Kunde inte ladda historik");
    }
  };

  const saveToHistory = (newRecs: ExerciseRecommendation[]) => {
    const updatedHistory = [...newRecs, ...history]
        .filter((v, i, a) => a.findIndex(t => t.data.name.toLowerCase() === v.data.name.toLowerCase()) === i)
        .slice(0, MAX_HISTORY);
    
    setHistory(updatedHistory);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory));
  };

  const clearHistory = () => {
    if(confirm("Vill du rensa all sökhistorik?")) {
        setHistory([]);
        localStorage.removeItem(HISTORY_KEY);
    }
  };

  const handleSearch = async () => {
    if (!request.trim()) return;
    setLoading(true);
    setRecommendations([]); 
    try {
      const result = await recommendExercises(request, allExercises);
      setRecommendations(result);
      saveToHistory(result);
    } catch (e) {
      alert("Kunde inte hämta förslag. Kontrollera din anslutning.");
    } finally {
      setLoading(false);
    }
  };

  const sanitizeId = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[åä]/g, 'a').replace(/ö/g, 'o')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleAddExercise = async (rec: ExerciseRecommendation) => {
    try {
        let cleanId = sanitizeId(rec.data.id || rec.data.name);
        
        if (!cleanId || cleanId.length < 2) {
            cleanId = `ex-${Date.now()}`;
        }

        const exercises = await storage.getAllExercises();
        const existsId = exercises.find(e => e.id === cleanId);
        const existsName = exercises.find(e => e.name.toLowerCase() === rec.data.name.toLowerCase());

        if (existsId || existsName) {
            alert(`Övningen "${rec.data.name}" finns redan i ditt bibliotek.`);
            setRefreshTrigger(prev => prev + 1);
            return;
        }

        const exerciseToSave: Exercise = {
            ...rec.data,
            id: cleanId, 
            userModified: true
        };

        await storage.saveExercise(exerciseToSave);
        setRefreshTrigger(prev => prev + 1);
        
    } catch (error) {
        console.error("Fel vid sparande av övning:", error);
        alert("Kunde inte spara övningen. Försök igen.");
    }
  };

  const getExistingExerciseId = (rec: ExerciseRecommendation): string | null => {
    const exactMatch = allExercises.find(e => e.id === rec.data.id);
    if (exactMatch) return exactMatch.id;

    const cleanId = sanitizeId(rec.data.id || rec.data.name);
    const slugMatch = allExercises.find(e => e.id === cleanId);
    if (slugMatch) return slugMatch.id;

    const nameMatch = allExercises.find(e => e.name.toLowerCase() === rec.data.name.toLowerCase());
    if (nameMatch) return nameMatch.id;

    return null;
  };

  const listToShow = recommendations.length > 0 ? recommendations : history;
  const isShowingHistory = recommendations.length === 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
        <div className="bg-gradient-to-br from-[#1a1721] to-[#2a2435] p-6 rounded-[32px] border border-accent-blue/20 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-accent-blue/10 rounded-full">
                    <Dumbbell className="text-accent-blue" size={24} />
                </div>
                <h2 className="text-xl font-black uppercase italic text-white">Övnings-scout</h2>
            </div>
            
            <p className="text-xs text-text-dim mb-4 leading-relaxed">
                Söker du övningar för Hyrox, bättre hållning eller explosivitet? Jag scannar ditt bibliotek och hittar det som saknas.
            </p>

            <div className="relative">
                <textarea 
                    value={request}
                    onChange={(e) => setRequest(e.target.value)}
                    placeholder="T.ex. 'Jag vill träna inför Hyrox'..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white text-base min-h-[100px] focus:border-accent-blue outline-none transition-all resize-none mb-4 shadow-inner"
                />
                {request && (
                    <button 
                        onClick={() => { setRequest(''); setRecommendations([]); }}
                        className="absolute top-2 right-2 text-text-dim hover:text-white p-2"
                    >
                        <Trash2 size={16} />
                    </button>
                )}
            </div>

            <button 
                onClick={handleSearch}
                disabled={loading || !request}
                className="w-full bg-accent-blue text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-white transition-all disabled:opacity-50 active:scale-95 shadow-lg shadow-accent-blue/20"
            >
                {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} strokeWidth={3} />}
                {loading ? 'SCANNAR BIBLIOTEKET...' : 'HITTA ÖVNINGAR'}
            </button>
        </div>

        <div className="flex items-center justify-between px-2 pt-2">
            <h3 className="text-white font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                {isShowingHistory ? <History size={14} className="text-text-dim"/> : <Sparkles size={14} className="text-accent-blue"/>}
                {isShowingHistory ? `Historik (${history.length})` : 'Resultat'}
            </h3>
            {isShowingHistory && history.length > 0 && (
                <button onClick={clearHistory} className="text-[10px] text-red-400 font-black uppercase hover:text-red-300 flex items-center gap-1 transition-colors">
                    <Trash2 size={12}/> Rensa
                </button>
            )}
        </div>

        <div className="space-y-3 pb-24">
            {listToShow.length === 0 && isShowingHistory && (
                <div className="text-center py-12 border-2 border-dashed border-white/5 rounded-[28px] opacity-30">
                    <History size={32} className="mx-auto mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Ingen historik än</p>
                </div>
            )}

            {listToShow.map((rec, idx) => {
                const existingId = getExistingExerciseId(rec);
                const exists = !!existingId;

                return (
                    <div key={idx} className={`p-5 rounded-[28px] border flex flex-col gap-4 animate-in slide-in-from-bottom-2 shadow-lg transition-all ${exists ? 'bg-[#1a1721] border-white/5' : 'bg-gradient-to-br from-[#1a1721] to-[#2a2435] border-accent-blue/20'}`} style={{animationDelay: `${idx * 60}ms`}}>
                        <div className="flex justify-between items-start">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                    <h3 className="text-white font-black italic uppercase text-lg truncate leading-none">{rec.data.name}</h3>
                                    {!exists ? (
                                        <span className="bg-purple-500/20 text-purple-400 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-purple-500/30 shadow-sm shadow-purple-500/10">Ny</span>
                                    ) : (
                                        <span className="bg-green-500/20 text-green-500 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                                            <Save size={8}/> Bibliotek
                                        </span>
                                    )}
                                </div>
                                <p className="text-[11px] text-accent-blue italic leading-snug line-clamp-2">"{rec.reason}"</p>
                            </div>
                        </div>

                        <div className="flex gap-1.5 flex-wrap">
                            {rec.data.primaryMuscles?.slice(0, 2).map(m => (
                                <span key={m} className="text-[8px] font-black uppercase bg-white/5 text-text-dim px-2 py-1 rounded-lg border border-white/5">{m}</span>
                            ))}
                            {rec.data.equipment?.[0] && (
                                <span className="text-[8px] font-black uppercase bg-accent-blue/10 text-accent-blue px-2 py-1 rounded-lg border border-accent-blue/20">{rec.data.equipment[0]}</span>
                            )}
                        </div>

                        <div className="pt-2 border-t border-white/5 mt-1">
                            {exists ? (
                                <button 
                                    onClick={() => existingId && onEditExercise(existingId)}
                                    className="w-full py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 border border-white/5"
                                >
                                    Visa detaljer <ArrowRight size={14} />
                                </button>
                            ) : (
                                <button 
                                    onClick={() => handleAddExercise(rec)}
                                    className="w-full py-3.5 rounded-2xl bg-[#2ed573] hover:bg-[#26b963] text-black text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-green-500/10"
                                >
                                    <Plus size={16} strokeWidth={3} /> Lägg till i bibliotek
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
  );
};